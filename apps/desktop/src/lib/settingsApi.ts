import { invoke } from "@tauri-apps/api/core";

export type SettingsSnapshot = {
  proxyPort: number;
  trafficLimit: number;
  windowPreset: WindowPreset;
};

export type WindowPreset = "compact" | "comfortable" | "wide" | "large";

export type WindowSizeSnapshot = {
  width: number;
  height: number;
};

const defaultSettings: SettingsSnapshot = {
  proxyPort: 9090,
  trafficLimit: 500,
  windowPreset: "comfortable",
};

function hasTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export function getSettings() {
  if (!hasTauriRuntime()) {
    return Promise.resolve(defaultSettings);
  }
  return invoke<SettingsSnapshot>("get_settings");
}

export function saveSettings(settings: SettingsSnapshot) {
  if (!hasTauriRuntime()) {
    return Promise.reject(
      new Error("当前是在浏览器预览中，无法修改桌面应用主窗口大小。请在 Tauri 桌面窗口中使用此设置。"),
    );
  }
  return invoke<SettingsSnapshot>("save_settings", { settings });
}

export function getCurrentWindowSize() {
  if (!hasTauriRuntime()) {
    return Promise.resolve<WindowSizeSnapshot | null>(null);
  }
  return invoke<WindowSizeSnapshot>("current_window_size");
}
