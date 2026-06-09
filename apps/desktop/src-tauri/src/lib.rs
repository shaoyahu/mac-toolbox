use std::{net::SocketAddr, time::Duration};

use proxy_core::{
    proxy::{start_proxy as start_proxy_server, ProxyConfig, ProxyHandle, TrafficStore},
    rules::{HeaderRule, RuleSet},
    traffic::TrafficEntry,
};
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};
use tokio::{sync::Mutex, task::JoinHandle};

#[derive(Default)]
struct BackendState {
    proxy: Mutex<Option<RunningProxy>>,
    rules: Mutex<Vec<HeaderRule>>,
    traffic_limit: Mutex<usize>,
}

struct RunningProxy {
    handle: ProxyHandle,
    event_task: JoinHandle<()>,
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct ProxyStatus {
    running: bool,
    bind_addr: Option<String>,
    port: Option<u16>,
}

#[tauri::command]
fn app_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[tauri::command]
fn system_snapshot() -> system_info::SystemSnapshot {
    system_info::collect_system_snapshot()
}

#[tauri::command]
async fn proxy_status(state: State<'_, BackendState>) -> Result<ProxyStatus, String> {
    let proxy = state.proxy.lock().await;
    Ok(proxy_status_from_guard(&proxy))
}

#[tauri::command]
async fn start_proxy(
    app: AppHandle,
    state: State<'_, BackendState>,
    port: u16,
) -> Result<ProxyStatus, String> {
    let mut proxy = state.proxy.lock().await;
    if proxy.is_some() {
        return Ok(proxy_status_from_guard(&proxy));
    }

    let rules = state.rules.lock().await.clone();
    let max_entries = *state.traffic_limit.lock().await;
    let handle = start_proxy_server(ProxyConfig {
        bind_port: port,
        max_entries,
        rules: RuleSet::new(rules),
    })
    .await
    .map_err(|error| error.to_string())?;
    let store = handle.store();
    let event_task = spawn_traffic_event_task(app, store);
    *proxy = Some(RunningProxy { handle, event_task });

    Ok(proxy_status_from_guard(&proxy))
}

#[tauri::command]
async fn stop_proxy(state: State<'_, BackendState>) -> Result<ProxyStatus, String> {
    let mut proxy = state.proxy.lock().await;
    if let Some(running) = proxy.take() {
        running.event_task.abort();
        running.handle.stop().await;
    }
    Ok(proxy_status_from_guard(&proxy))
}

#[tauri::command]
async fn list_traffic(state: State<'_, BackendState>) -> Result<Vec<TrafficEntry>, String> {
    let proxy = state.proxy.lock().await;
    Ok(match proxy.as_ref() {
        Some(running) => running.handle.store().list().await,
        None => Vec::new(),
    })
}

#[tauri::command]
async fn clear_traffic(state: State<'_, BackendState>) -> Result<(), String> {
    let proxy = state.proxy.lock().await;
    if let Some(running) = proxy.as_ref() {
        running.handle.store().clear().await;
    }
    Ok(())
}

#[tauri::command]
async fn list_rules(state: State<'_, BackendState>) -> Result<Vec<HeaderRule>, String> {
    Ok(state.rules.lock().await.clone())
}

#[tauri::command]
async fn save_rule(
    state: State<'_, BackendState>,
    rule: HeaderRule,
) -> Result<Vec<HeaderRule>, String> {
    let mut rules = state.rules.lock().await;
    if let Some(existing) = rules.iter_mut().find(|item| item.id == rule.id) {
        *existing = rule;
    } else {
        rules.push(rule);
    }
    Ok(rules.clone())
}

#[tauri::command]
async fn delete_rule(
    state: State<'_, BackendState>,
    rule_id: String,
) -> Result<Vec<HeaderRule>, String> {
    let mut rules = state.rules.lock().await;
    rules.retain(|rule| rule.id != rule_id);
    Ok(rules.clone())
}

#[tauri::command]
async fn toggle_rule(
    state: State<'_, BackendState>,
    rule_id: String,
    enabled: bool,
) -> Result<Vec<HeaderRule>, String> {
    let mut rules = state.rules.lock().await;
    if let Some(rule) = rules.iter_mut().find(|rule| rule.id == rule_id) {
        rule.enabled = enabled;
    }
    Ok(rules.clone())
}

fn proxy_status_from_guard(proxy: &Option<RunningProxy>) -> ProxyStatus {
    match proxy {
        Some(running) => proxy_status_from_addr(running.handle.addr()),
        None => ProxyStatus {
            running: false,
            bind_addr: None,
            port: None,
        },
    }
}

fn proxy_status_from_addr(addr: SocketAddr) -> ProxyStatus {
    ProxyStatus {
        running: true,
        bind_addr: Some(addr.to_string()),
        port: Some(addr.port()),
    }
}

fn spawn_traffic_event_task(app: AppHandle, store: TrafficStore) -> JoinHandle<()> {
    tokio::spawn(async move {
        let mut emitted_count = 0_usize;
        loop {
            tokio::time::sleep(Duration::from_millis(250)).await;
            let entries = store.list().await;
            for entry in entries.iter().skip(emitted_count) {
                let _ = app.emit("traffic://entry", entry);
            }
            emitted_count = entries.len();
        }
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(BackendState {
            proxy: Mutex::new(None),
            rules: Mutex::new(Vec::new()),
            traffic_limit: Mutex::new(500),
        })
        .invoke_handler(tauri::generate_handler![
            app_version,
            system_snapshot,
            proxy_status,
            start_proxy,
            stop_proxy,
            list_traffic,
            clear_traffic,
            list_rules,
            save_rule,
            delete_rule,
            toggle_rule
        ])
        .run(tauri::generate_context!())
        .expect("failed to run macOS Toolbox");
}

#[cfg(test)]
mod tests {
    use super::{proxy_status_from_addr, proxy_status_from_guard};

    #[test]
    fn proxy_status_reports_stopped_without_address() {
        let status = proxy_status_from_guard(&None);

        assert!(!status.running);
        assert_eq!(status.bind_addr, None);
        assert_eq!(status.port, None);
    }

    #[test]
    fn proxy_status_reports_running_address() {
        let addr = "127.0.0.1:1421".parse().unwrap();
        let status = proxy_status_from_addr(addr);

        assert!(status.running);
        assert_eq!(status.bind_addr, Some("127.0.0.1:1421".to_string()));
        assert_eq!(status.port, Some(1421));
    }
}
