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
async fn records_connect_without_decrypting_tunnel() {
    let proxy = start_proxy(ProxyConfig::default()).await.unwrap();

    let response = send_raw_request(
        proxy.addr().port(),
        "CONNECT example.test:443 HTTP/1.1\r\nHost: example.test:443\r\n\r\n",
    )
    .await;

    assert!(response.starts_with("HTTP/1.1 501 Not Implemented"));
    let entries = proxy.store().list().await;
    assert_eq!(entries.len(), 1);
    assert_eq!(entries[0].method, "CONNECT");
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
            let mut buffer = [0_u8; 4096];
            let read = stream.read(&mut buffer).await.unwrap();
            *response_headers.lock().await = String::from_utf8_lossy(&buffer[..read]).to_string();
            stream
                .write_all(b"HTTP/1.1 204 No Content\r\nContent-Length: 0\r\n\r\n")
                .await
                .unwrap();
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
