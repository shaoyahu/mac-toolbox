#[tauri::command]
fn app_version() -> &'static str {
    env!("CARGO_PKG_VERSION")
}

#[tauri::command]
fn system_snapshot() -> system_info::SystemSnapshot {
    system_info::collect_system_snapshot()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![app_version, system_snapshot])
        .run(tauri::generate_context!())
        .expect("failed to run macOS Toolbox");
}
