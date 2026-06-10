use std::sync::Arc;

use proxy_core::{
    proxy::{start_proxy, ProxyConfig},
    rules::{HeaderMutation, HeaderRule, MatchOperator, RuleMatcher, RuleSet},
    traffic::TrafficStatus,
};
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{TcpListener, TcpStream},
    sync::Mutex,
};

#[tokio::test]
async fn forwards_http_requests_and_records_traffic() {
    let seen_headers = Arc::new(Mutex::new(String::new()));
    let upstream_port = start_upstream(Arc::clone(&seen_headers)).await;
    let proxy = start_proxy(ProxyConfig::default()).await.unwrap();

    let response = send_raw_request(
        proxy.addr().port(),
        &format!(
            "GET http://127.0.0.1:{}/hello HTTP/1.1\r\nHost: 127.0.0.1:{}\r\n\r\n",
            upstream_port, upstream_port,
        ),
    )
    .await;

    assert!(response.starts_with("HTTP/1.1 204 No Content"));
    let entries = proxy.store().list().await;
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].method, "GET");
    assert_eq!(entries[0].path, "/hello");
    assert_eq!(entries[0].status, TrafficStatus::Complete(204));
    assert_eq!(
        entries[0].response_headers.get("content-type"),
        Some(&"application/json".to_string()),
    );
    assert_eq!(entries[0].response_body.as_deref(), Some("{\"ok\":true}"));

    proxy.stop().await;
}

#[tokio::test]
async fn rewrites_headers_before_forwarding_to_upstream() {
    let seen_headers = Arc::new(Mutex::new(String::new()));
    let upstream_port = start_upstream(Arc::clone(&seen_headers)).await;
    let proxy = start_proxy(ProxyConfig {
        rules: RuleSet::new(vec![HeaderRule {
            id: "debug".to_string(),
            name: "Debug".to_string(),
            enabled: true,
            matchers: vec![RuleMatcher::host(MatchOperator::Exact, "127.0.0.1")],
            mutations: vec![HeaderMutation::replace("x-mode", "debug")],
        }]),
        ..ProxyConfig::default()
    })
    .await
    .unwrap();

    let _ = send_raw_request(
        proxy.addr().port(),
        &format!(
            "GET http://127.0.0.1:{upstream_port}/hello HTTP/1.1\r\nHost: 127.0.0.1:{upstream_port}\r\nX-Mode: prod\r\n\r\n",
        ),
    )
    .await;

    let headers = seen_headers.lock().await.clone();
    assert!(headers.contains("x-mode: debug"));
    assert!(!headers.contains("X-Mode: prod"));
    let entries = proxy.store().list().await;
    assert_eq!(entries[0].matched_rule_ids, vec!["debug".to_string()]);

    proxy.stop().await;
}

#[tokio::test]
async fn records_response_body_without_waiting_for_upstream_close() {
    let upstream_port = start_keep_alive_upstream().await;
    let proxy = start_proxy(ProxyConfig::default()).await.unwrap();

    let response = send_raw_request(
        proxy.addr().port(),
        &format!(
            "GET http://127.0.0.1:{upstream_port}/keep-alive HTTP/1.1\r\nHost: 127.0.0.1:{upstream_port}\r\n\r\n",
        ),
    )
    .await;

    assert!(response.starts_with("HTTP/1.1 200 OK"));
    assert!(response.ends_with("{\"keepAlive\":true}"));

    let entries = proxy.store().list().await;
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].status, TrafficStatus::Complete(200));
    assert_eq!(
        entries[0].response_headers.get("connection"),
        Some(&"keep-alive".to_string()),
    );
    assert_eq!(entries[0].response_body.as_deref(), Some("{\"keepAlive\":true}"));

    proxy.stop().await;
}

#[tokio::test]
async fn skips_compressed_and_binary_response_body_display() {
    let upstream_port = start_custom_response_upstream(
        b"HTTP/1.1 200 OK\r\nContent-Type: application/json\r\nContent-Encoding: gzip\r\nContent-Length: 4\r\n\r\n\x1f\x8b\x08\x00",
    )
    .await;
    let proxy = start_proxy(ProxyConfig::default()).await.unwrap();

    let _ = send_raw_request(
        proxy.addr().port(),
        &format!(
            "GET http://127.0.0.1:{upstream_port}/gzip HTTP/1.1\r\nHost: 127.0.0.1:{upstream_port}\r\n\r\n",
        ),
    )
    .await;

    let entries = proxy.store().list().await;
    assert_eq!(entries[0].response_body, None);
    proxy.stop().await;

    let upstream_port = start_custom_response_upstream(
        b"HTTP/1.1 200 OK\r\nContent-Type: image/png\r\nContent-Length: 4\r\n\r\n\x89PNG",
    )
    .await;
    let proxy = start_proxy(ProxyConfig::default()).await.unwrap();

    let _ = send_raw_request(
        proxy.addr().port(),
        &format!(
            "GET http://127.0.0.1:{upstream_port}/image.png HTTP/1.1\r\nHost: 127.0.0.1:{upstream_port}\r\n\r\n",
        ),
    )
    .await;

    let entries = proxy.store().list().await;
    assert_eq!(entries[0].response_body, None);
    proxy.stop().await;
}

#[tokio::test]
async fn forwards_post_body_and_records_request_body() {
    let seen_headers = Arc::new(Mutex::new(String::new()));
    let upstream_port = start_upstream(Arc::clone(&seen_headers)).await;
    let proxy = start_proxy(ProxyConfig::default()).await.unwrap();
    let body = "{\"name\":\"codex\"}";

    let response = send_raw_request(
        proxy.addr().port(),
        &format!(
            "POST http://127.0.0.1:{upstream_port}/users HTTP/1.1\r\nHost: 127.0.0.1:{upstream_port}\r\nContent-Type: application/json\r\nContent-Length: {}\r\n\r\n{body}",
            body.len(),
        ),
    )
    .await;

    assert!(response.starts_with("HTTP/1.1 204 No Content"));
    let upstream_request = seen_headers.lock().await.clone();
    assert!(upstream_request.contains("POST /users HTTP/1.1"));
    assert!(upstream_request.ends_with(body));

    let entries = proxy.store().list().await;
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].method, "POST");
    assert_eq!(entries[0].request_body.as_deref(), Some(body));

    proxy.stop().await;
}

#[tokio::test]
async fn tunnels_connect_without_decrypting_payload() {
    let upstream_port = start_tunnel_upstream().await;
    let proxy = start_proxy(ProxyConfig::default()).await.unwrap();

    let mut stream = TcpStream::connect(("127.0.0.1", proxy.addr().port()))
        .await
        .unwrap();
    stream
        .write_all(
            format!(
                "CONNECT 127.0.0.1:{upstream_port} HTTP/1.1\r\nHost: 127.0.0.1:{upstream_port}\r\n\r\n",
            )
            .as_bytes(),
        )
        .await
        .unwrap();

    let mut response = [0_u8; 128];
    let read = stream.read(&mut response).await.unwrap();
    assert!(String::from_utf8_lossy(&response[..read])
        .starts_with("HTTP/1.1 200 Connection Established"));

    stream.write_all(b"tunnel payload").await.unwrap();

    let mut echoed = [0_u8; 14];
    stream.read_exact(&mut echoed).await.unwrap();
    assert_eq!(&echoed, b"tunnel payload");

    let entries = proxy.store().list().await;
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].method, "CONNECT");
    assert_eq!(entries[0].host, "127.0.0.1");
    assert_eq!(entries[0].status, TrafficStatus::Tunnel);

    proxy.stop().await;
}

#[tokio::test]
async fn traffic_store_enforces_capacity() {
    let proxy = start_proxy(ProxyConfig {
        max_entries: 1,
        ..ProxyConfig::default()
    })
    .await
    .unwrap();

    let _ = send_raw_request(
        proxy.addr().port(),
        "CONNECT first.test:443 HTTP/1.1\r\nHost: first.test:443\r\n\r\n",
    )
    .await;
    let _ = send_raw_request(
        proxy.addr().port(),
        "CONNECT second.test:443 HTTP/1.1\r\nHost: second.test:443\r\n\r\n",
    )
    .await;

    let entries = proxy.store().list().await;
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].host, "second.test");

    proxy.stop().await;
}

async fn start_upstream(seen_headers: Arc<Mutex<String>>) -> u16 {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();
    let response_headers = Arc::clone(&seen_headers);

    tokio::spawn(async move {
        if let Ok((mut stream, _)) = listener.accept().await {
            let request = read_full_http_message(&mut stream).await;
            *response_headers.lock().await = request;
            stream
                .write_all(
                    b"HTTP/1.1 204 No Content\r\nContent-Type: application/json\r\nContent-Length: 11\r\n\r\n{\"ok\":true}",
                )
                .await
                .unwrap();
        }
    });

    port
}

async fn read_full_http_message(stream: &mut TcpStream) -> String {
    let mut buffer = Vec::with_capacity(4096);
    let mut chunk = [0_u8; 1024];

    loop {
        let read = stream.read(&mut chunk).await.unwrap();
        if read == 0 {
            break;
        }
        buffer.extend_from_slice(&chunk[..read]);
        if buffer.windows(4).any(|window| window == b"\r\n\r\n") {
            break;
        }
    }

    let header_end = buffer
        .windows(4)
        .position(|window| window == b"\r\n\r\n")
        .map(|index| index + 4)
        .unwrap_or(buffer.len());
    let expected_body_len = String::from_utf8_lossy(&buffer[..header_end])
        .lines()
        .skip(1)
        .find_map(|line| {
            let (name, value) = line.split_once(':')?;
            if name.trim().eq_ignore_ascii_case("content-length") {
                value.trim().parse::<usize>().ok()
            } else {
                None
            }
        })
        .unwrap_or(0);
    let current_body_len = buffer.len().saturating_sub(header_end);
    let remaining = expected_body_len.saturating_sub(current_body_len);
    if remaining > 0 {
        let mut body = vec![0_u8; remaining];
        stream.read_exact(&mut body).await.unwrap();
        buffer.extend_from_slice(&body);
    }

    String::from_utf8_lossy(&buffer).to_string()
}

async fn start_tunnel_upstream() -> u16 {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();

    tokio::spawn(async move {
        if let Ok((mut stream, _)) = listener.accept().await {
            let mut buffer = [0_u8; 1024];
            let read = stream.read(&mut buffer).await.unwrap();
            stream.write_all(&buffer[..read]).await.unwrap();
        }
    });

    port
}

async fn start_keep_alive_upstream() -> u16 {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();

    tokio::spawn(async move {
        if let Ok((mut stream, _)) = listener.accept().await {
            let mut buffer = [0_u8; 1024];
            let _ = stream.read(&mut buffer).await.unwrap();
            stream
                .write_all(
                    b"HTTP/1.1 200 OK\r\nConnection: keep-alive\r\nContent-Type: application/json\r\nContent-Length: 18\r\n\r\n{\"keepAlive\":true}",
                )
                .await
                .unwrap();
            tokio::time::sleep(std::time::Duration::from_millis(250)).await;
        }
    });

    port
}

async fn start_custom_response_upstream(response: &'static [u8]) -> u16 {
    let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
    let port = listener.local_addr().unwrap().port();

    tokio::spawn(async move {
        if let Ok((mut stream, _)) = listener.accept().await {
            let mut buffer = [0_u8; 1024];
            let _ = stream.read(&mut buffer).await.unwrap();
            stream.write_all(response).await.unwrap();
        }
    });

    port
}

async fn send_raw_request(proxy_port: u16, request: &str) -> String {
    let mut stream = TcpStream::connect(("127.0.0.1", proxy_port)).await.unwrap();
    stream.write_all(request.as_bytes()).await.unwrap();
    stream.shutdown().await.unwrap();

    let mut response = Vec::new();
    stream.read_to_end(&mut response).await.unwrap();
    String::from_utf8_lossy(&response).to_string()
}
