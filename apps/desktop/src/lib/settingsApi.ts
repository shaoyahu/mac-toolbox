import { invoke } from "@tauri-apps/api/core";

export type SettingsSnapshot = {
  proxyPort: number;
  trafficLimit: number;
  windowPreset: WindowPreset;
};

export type WindowPreset = "compact" | "comfortable" | "wide" | "large";

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
    return Promise.resolve(settings);
  }
  return invoke<SettingsSnapshot>("save_settings", { settings });
}
