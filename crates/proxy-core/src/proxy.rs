use std::{
    collections::VecDeque,
    net::{IpAddr, Ipv4Addr, SocketAddr},
    sync::{
        atomic::{AtomicU64, Ordering},
        Arc,
    },
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use tokio::{
    io::{copy_bidirectional, AsyncReadExt, AsyncWriteExt},
    net::{TcpListener, TcpStream},
    sync::{oneshot, Mutex},
    task::JoinHandle,
};

use crate::{
    rules::{HeaderMap, RuleSet},
    traffic::{TrafficEntry, TrafficStatus},
};

static NEXT_ID: AtomicU64 = AtomicU64::new(1);

#[derive(Debug, Clone)]
pub struct ProxyConfig {
    pub bind_port: u16,
    pub max_entries: usize,
    pub rules: RuleSet,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            bind_port: 0,
            max_entries: 500,
            rules: RuleSet::default(),
        }
    }
}

#[derive(Debug, Clone)]
pub struct TrafficStore {
    max_entries: usize,
    entries: Arc<Mutex<VecDeque<TrafficEntry>>>,
}

impl TrafficStore {
    pub fn new(max_entries: usize) -> Self {
        Self {
            max_entries,
            entries: Arc::new(Mutex::new(VecDeque::new())),
        }
    }

    pub async fn push(&self, entry: TrafficEntry) {
        let mut entries = self.entries.lock().await;
        entries.push_back(entry);
        while entries.len() > self.max_entries {
            entries.pop_front();
        }
    }

    pub async fn list(&self) -> Vec<TrafficEntry> {
        self.entries.lock().await.iter().cloned().collect()
    }

    pub async fn clear(&self) {
        self.entries.lock().await.clear();
    }
}

pub struct ProxyHandle {
    addr: SocketAddr,
    shutdown: Option<oneshot::Sender<()>>,
    task: JoinHandle<()>,
    store: TrafficStore,
}

impl ProxyHandle {
    pub fn addr(&self) -> SocketAddr {
        self.addr
    }

    pub fn store(&self) -> TrafficStore {
        self.store.clone()
    }

    pub async fn stop(mut self) {
        if let Some(shutdown) = self.shutdown.take() {
            let _ = shutdown.send(());
        }
        let _ = self.task.await;
    }
}

pub async fn start_proxy(config: ProxyConfig) -> std::io::Result<ProxyHandle> {
    let addr = SocketAddr::new(IpAddr::V4(Ipv4Addr::LOCALHOST), config.bind_port);
    let listener = TcpListener::bind(addr).await?;
    let addr = listener.local_addr()?;
    let store = TrafficStore::new(config.max_entries);
    let task_store = store.clone();
    let rules = Arc::new(config.rules);
    let (shutdown_tx, mut shutdown_rx) = oneshot::channel();

    let task = tokio::spawn(async move {
        loop {
            tokio::select! {
                biased;
                _ = &mut shutdown_rx => break,
                accepted = listener.accept() => {
                    let Ok((stream, _)) = accepted else {
                        continue;
                    };
                    let store = task_store.clone();
                    let rules = Arc::clone(&rules);
                    tokio::spawn(async move {
                        let _ = handle_connection(stream, store, rules).await;
                    });
                }
            }
        }
    });

    Ok(ProxyHandle {
        addr,
        shutdown: Some(shutdown_tx),
        task,
        store,
    })
}

async fn handle_connection(
    mut client: TcpStream,
    store: TrafficStore,
    rules: Arc<RuleSet>,
) -> std::io::Result<()> {
    let started = std::time::Instant::now();
    let request = read_http_head(&mut client).await?;
    let Some(parsed) = ParsedRequest::parse(&request) else {
        client
            .write_all(b"HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n")
            .await?;
        return Ok(());
    };

    if parsed.method.eq_ignore_ascii_case("CONNECT") {
        return tunnel_connect(client, parsed, store, started).await;
    }

    let mut headers = parsed.headers.clone();
    let matched_rule_ids = rules.apply(&parsed.host, &parsed.path, &mut headers);
    let upstream_result = forward_http_request(&parsed, &headers).await;
    let elapsed = started.elapsed();

    match upstream_result {
        Ok(response) => {
            let status = parse_response_status(&response).unwrap_or(0);
            let entry = parsed.to_entry(TrafficStatus::Complete(status), matched_rule_ids, elapsed);
            store.push(entry).await;
            client.write_all(&response).await?;
        }
        Err(error) => {
            let entry = parsed.to_entry(
                TrafficStatus::Failed(error.to_string()),
                matched_rule_ids,
                elapsed,
            );
            store.push(entry).await;
            client
                .write_all(b"HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\n\r\n")
                .await?;
        }
    }

    Ok(())
}

async fn tunnel_connect(
    mut client: TcpStream,
    parsed: ParsedRequest,
    store: TrafficStore,
    started: std::time::Instant,
) -> std::io::Result<()> {
    let addr = format!("{}:{}", parsed.host, parsed.port);

    match TcpStream::connect(addr).await {
        Ok(mut upstream) => {
            client
                .write_all(b"HTTP/1.1 200 Connection Established\r\n\r\n")
                .await?;
            let entry = parsed.to_entry(TrafficStatus::Tunnel, Vec::new(), started.elapsed());
            store.push(entry).await;
            let _ = copy_bidirectional(&mut client, &mut upstream).await;
        }
        Err(error) => {
            let entry = parsed.to_entry(
                TrafficStatus::Failed(error.to_string()),
                Vec::new(),
                started.elapsed(),
            );
            store.push(entry).await;
            client
                .write_all(b"HTTP/1.1 502 Bad Gateway\r\nContent-Length: 0\r\n\r\n")
                .await?;
        }
    }

    Ok(())
}

async fn read_http_head(stream: &mut TcpStream) -> std::io::Result<Vec<u8>> {
    let mut buffer = Vec::with_capacity(4096);
    let mut chunk = [0_u8; 1024];

    loop {
        let read = stream.read(&mut chunk).await?;
        if read == 0 {
            break;
        }
        buffer.extend_from_slice(&chunk[..read]);
        if buffer.windows(4).any(|window| window == b"\r\n\r\n") || buffer.len() > 64 * 1024 {
            break;
        }
    }

    Ok(buffer)
}

async fn forward_http_request(
    parsed: &ParsedRequest,
    headers: &HeaderMap,
) -> std::io::Result<Vec<u8>> {
    let addr = format!("{}:{}", parsed.host, parsed.port);
    let mut upstream = TcpStream::connect(addr).await?;
    let mut request = format!("{} {} HTTP/1.1\r\n", parsed.method, parsed.path);

    for (name, value) in headers {
        if name.eq_ignore_ascii_case("proxy-connection") {
            continue;
        }
        request.push_str(name);
        request.push_str(": ");
        request.push_str(value);
        request.push_str("\r\n");
    }
    request.push_str("\r\n");

    upstream.write_all(request.as_bytes()).await?;
    upstream.shutdown().await?;

    let mut response = Vec::new();
    upstream.read_to_end(&mut response).await?;
    Ok(response)
}

fn parse_response_status(response: &[u8]) -> Option<u16> {
    let text = std::str::from_utf8(response).ok()?;
    let status = text.lines().next()?.split_whitespace().nth(1)?;
    status.parse().ok()
}

#[derive(Debug, Clone)]
struct ParsedRequest {
    method: String,
    url: String,
    host: String,
    port: u16,
    path: String,
    headers: HeaderMap,
}

impl ParsedRequest {
    fn parse(bytes: &[u8]) -> Option<Self> {
        let request = std::str::from_utf8(bytes).ok()?;
        let mut lines = request.split("\r\n");
        let request_line = lines.next()?;
        let mut request_parts = request_line.split_whitespace();
        let method = request_parts.next()?.to_string();
        let target = request_parts.next()?.to_string();
        let mut headers = HeaderMap::new();

        for line in lines {
            if line.is_empty() {
                break;
            }
            let Some((name, value)) = line.split_once(':') else {
                continue;
            };
            headers.insert(name.trim().to_ascii_lowercase(), value.trim().to_string());
        }

        if method.eq_ignore_ascii_case("CONNECT") {
            let (host, port) = parse_host_port(&target, 443);
            return Some(Self {
                method,
                url: target,
                host,
                port,
                path: String::new(),
                headers,
            });
        }

        let (host, port, path, url) = parse_http_target(&target, &headers)?;
        Some(Self {
            method,
            url,
            host,
            port,
            path,
            headers,
        })
    }

    fn to_entry(
        &self,
        status: TrafficStatus,
        matched_rule_ids: Vec<String>,
        duration: Duration,
    ) -> TrafficEntry {
        TrafficEntry {
            id: NEXT_ID.fetch_add(1, Ordering::Relaxed).to_string(),
            method: self.method.clone(),
            url: self.url.clone(),
            host: self.host.clone(),
            path: self.path.clone(),
            request_headers: self.headers.clone(),
            status,
            started_at_epoch_ms: now_epoch_ms(),
            duration_ms: Some(duration.as_millis()),
            matched_rule_ids,
        }
    }
}

fn parse_http_target(target: &str, headers: &HeaderMap) -> Option<(String, u16, String, String)> {
    if let Some(rest) = target.strip_prefix("http://") {
        let (authority, path) = rest
            .split_once('/')
            .map(|(authority, path)| (authority, format!("/{path}")))
            .unwrap_or((rest, "/".to_string()));
        let (host, port) = parse_host_port(authority, 80);
        return Some((host, port, path, target.to_string()));
    }

    let host_header = headers.get("host")?;
    let (host, port) = parse_host_port(host_header, 80);
    Some((
        host,
        port,
        target.to_string(),
        format!("http://{host_header}{target}"),
    ))
}

fn parse_host_port(authority: &str, default_port: u16) -> (String, u16) {
    let Some((host, port)) = authority.rsplit_once(':') else {
        return (authority.to_string(), default_port);
    };

    match port.parse::<u16>() {
        Ok(port) => (host.to_string(), port),
        Err(_) => (authority.to_string(), default_port),
    }
}

fn now_epoch_ms() -> u128 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis()
}
