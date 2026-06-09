use std::{fs, net::SocketAddr, path::Path, process::Command, time::Duration};

use proxy_core::{
    proxy::{start_proxy as start_proxy_server, ProxyConfig, ProxyHandle, TrafficStore},
    rules::{HeaderRule, RuleSet},
    traffic::TrafficEntry,
};
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Emitter, LogicalSize, Manager, State};
use tokio::{sync::Mutex, task::JoinHandle};

#[derive(Default)]
struct BackendState {
    proxy: Mutex<Option<RunningProxy>>,
    config: Mutex<AppConfig>,
    config_path: Mutex<Option<std::path::PathBuf>>,
}

struct RunningProxy {
    handle: ProxyHandle,
    event_task: JoinHandle<()>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct AppConfig {
    proxy_port: u16,
    traffic_limit: usize,
    window_preset: WindowPreset,
    rules: Vec<HeaderRule>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            proxy_port: 9090,
            traffic_limit: 500,
            window_preset: WindowPreset::Comfortable,
            rules: Vec::new(),
        }
    }
}

#[derive(Debug, Clone, Copy, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
enum WindowPreset {
    Compact,
    Comfortable,
    Wide,
    Large,
}

impl WindowPreset {
    fn size(self) -> (f64, f64) {
        match self {
            Self::Compact => (960.0, 640.0),
            Self::Comfortable => (1120.0, 760.0),
            Self::Wide => (1280.0, 800.0),
            Self::Large => (1440.0, 900.0),
        }
    }
}

#[derive(Debug, Clone, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct ProxyStatus {
    running: bool,
    bind_addr: Option<String>,
    port: Option<u16>,
}

#[derive(Debug, Clone, Deserialize, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
struct SettingsSnapshot {
    proxy_port: u16,
    traffic_limit: usize,
    window_preset: WindowPreset,
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

    let config = state.config.lock().await.clone();
    let handle = start_proxy_server(ProxyConfig {
        bind_port: port,
        max_entries: config.traffic_limit,
        rules: RuleSet::new(config.rules),
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
    Ok(state.config.lock().await.rules.clone())
}

#[tauri::command]
async fn save_rule(
    state: State<'_, BackendState>,
    rule: HeaderRule,
) -> Result<Vec<HeaderRule>, String> {
    let mut config = state.config.lock().await;
    if let Some(existing) = config.rules.iter_mut().find(|item| item.id == rule.id) {
        *existing = rule;
    } else {
        config.rules.push(rule);
    }
    persist_config_state(&state, &config)?;
    Ok(config.rules.clone())
}

#[tauri::command]
async fn delete_rule(
    state: State<'_, BackendState>,
    rule_id: String,
) -> Result<Vec<HeaderRule>, String> {
    let mut config = state.config.lock().await;
    config.rules.retain(|rule| rule.id != rule_id);
    persist_config_state(&state, &config)?;
    Ok(config.rules.clone())
}

#[tauri::command]
async fn toggle_rule(
    state: State<'_, BackendState>,
    rule_id: String,
    enabled: bool,
) -> Result<Vec<HeaderRule>, String> {
    let mut config = state.config.lock().await;
    if let Some(rule) = config.rules.iter_mut().find(|rule| rule.id == rule_id) {
        rule.enabled = enabled;
    }
    persist_config_state(&state, &config)?;
    Ok(config.rules.clone())
}

#[tauri::command]
async fn get_settings(state: State<'_, BackendState>) -> Result<SettingsSnapshot, String> {
    let config = state.config.lock().await;
    Ok(SettingsSnapshot {
        proxy_port: config.proxy_port,
        traffic_limit: config.traffic_limit,
        window_preset: config.window_preset,
    })
}

#[tauri::command]
async fn save_settings(
    app: AppHandle,
    state: State<'_, BackendState>,
    settings: SettingsSnapshot,
) -> Result<SettingsSnapshot, String> {
    validate_settings(settings.proxy_port, settings.traffic_limit)?;
    let mut config = state.config.lock().await;
    config.proxy_port = settings.proxy_port;
    config.traffic_limit = settings.traffic_limit;
    config.window_preset = settings.window_preset;
    persist_config_state(&state, &config)?;
    apply_window_preset(&app, settings.window_preset)?;
    Ok(settings)
}

#[tauri::command]
fn open_proxy_settings() -> Result<(), String> {
    open_macos_url("x-apple.systempreferences:com.apple.Network-Settings.extension")
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

fn validate_settings(proxy_port: u16, traffic_limit: usize) -> Result<(), String> {
    if proxy_port == 0 {
        return Err("Proxy port must be between 1 and 65535.".to_string());
    }
    if !(10..=10_000).contains(&traffic_limit) {
        return Err("Traffic retention must be between 10 and 10000.".to_string());
    }
    Ok(())
}

fn open_macos_url(url: &str) -> Result<(), String> {
    Command::new("open")
        .arg(url)
        .status()
        .map_err(|error| error.to_string())
        .and_then(|status| {
            if status.success() {
                Ok(())
            } else {
                Err(format!("open command exited with status {status}"))
            }
        })
}

fn apply_window_preset(app: &AppHandle, preset: WindowPreset) -> Result<(), String> {
    let Some(window) = app.get_webview_window("main") else {
        return Ok(());
    };
    let (width, height) = preset.size();
    window
        .set_size(LogicalSize::new(width, height))
        .map_err(|error| error.to_string())?;
    window.center().map_err(|error| error.to_string())
}

fn load_config_from_path(path: &Path) -> AppConfig {
    fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str(&content).ok())
        .unwrap_or_default()
}

fn save_config_to_path(path: &Path, config: &AppConfig) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|error| error.to_string())?;
    }
    let content = serde_json::to_string_pretty(config).map_err(|error| error.to_string())?;
    fs::write(path, content).map_err(|error| error.to_string())
}

fn persist_config_state(state: &State<'_, BackendState>, config: &AppConfig) -> Result<(), String> {
    let Some(path) = state.config_path.blocking_lock().clone() else {
        return Ok(());
    };
    save_config_to_path(&path, config)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let config_path = app
                .path()
                .app_data_dir()
                .map_err(|error| Box::<dyn std::error::Error>::from(error))?
                .join("config.json");
            let config = load_config_from_path(&config_path);
            apply_window_preset(app.handle(), config.window_preset)
                .map_err(Box::<dyn std::error::Error>::from)?;
            app.manage(BackendState {
                proxy: Mutex::new(None),
                config: Mutex::new(config),
                config_path: Mutex::new(Some(config_path)),
            });
            Ok(())
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
            toggle_rule,
            get_settings,
            save_settings,
            open_proxy_settings
        ])
        .run(tauri::generate_context!())
        .expect("failed to run macOS Toolbox");
}

#[cfg(test)]
mod tests {
    use super::{
        load_config_from_path, proxy_status_from_addr, proxy_status_from_guard,
        save_config_to_path, validate_settings, AppConfig,
    };

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

    #[test]
    fn validates_settings_bounds() {
        assert!(validate_settings(9090, 500).is_ok());
        assert!(validate_settings(0, 500).is_err());
        assert!(validate_settings(9090, 5).is_err());
    }

    #[test]
    fn saves_and_loads_config() {
        let path = std::env::temp_dir().join(format!(
            "macos-toolbox-config-{}.json",
            std::process::id()
        ));
        let config = AppConfig {
            proxy_port: 8080,
            traffic_limit: 250,
            window_preset: WindowPreset::Wide,
            rules: Vec::new(),
        };

        save_config_to_path(&path, &config).unwrap();
        assert_eq!(load_config_from_path(&path), config);
        let _ = std::fs::remove_file(path);
    }
}
