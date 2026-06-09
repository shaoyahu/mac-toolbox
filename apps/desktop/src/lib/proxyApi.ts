import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

function hasTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export type ProxyStatus = {
  running: boolean;
  bindAddr: string | null;
  port: number | null;
};

export type TrafficStatus =
  | { kind: "pending" }
  | { kind: "complete"; value: number }
  | { kind: "tunnel" }
  | { kind: "failed"; value: string };

export type TrafficEntry = {
  id: string;
  method: string;
  url: string;
  host: string;
  path: string;
  requestHeaders: Record<string, string>;
  status: TrafficStatus;
  startedAtEpochMs: number;
  durationMs: number | null;
  matchedRuleIds: string[];
};

export function proxyStatus() {
  if (!hasTauriRuntime()) {
    return Promise.resolve({ running: false, bindAddr: null, port: null });
  }
  return invoke<ProxyStatus>("proxy_status");
}

export function startProxy(port: number) {
  return invoke<ProxyStatus>("start_proxy", { port });
}

export function stopProxy() {
  return invoke<ProxyStatus>("stop_proxy");
}

export function listTraffic() {
  if (!hasTauriRuntime()) {
    return Promise.resolve([]);
  }
  return invoke<TrafficEntry[]>("list_traffic");
}

export function clearTraffic() {
  return invoke<void>("clear_traffic");
}

export function onTrafficEntry(callback: (entry: TrafficEntry) => void) {
  if (!hasTauriRuntime()) {
    void callback;
    return Promise.resolve(() => undefined);
  }
  return listen<TrafficEntry>("traffic://entry", (event) => callback(event.payload));
}
