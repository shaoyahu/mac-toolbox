import { invoke } from "@tauri-apps/api/core";

function hasTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export function getAppVersion() {
  if (!hasTauriRuntime()) {
    return Promise.resolve("0.1.0");
  }
  return invoke<string>("app_version");
}
