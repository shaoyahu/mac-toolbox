import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { TrafficEntry } from "./lib/proxyApi";

vi.mock("./lib/appInfo", () => ({
  getAppVersion: vi.fn().mockResolvedValue("0.1.0"),
}));

vi.mock("./lib/systemInfo", () => ({
  loadSystemSnapshot: vi.fn().mockRejectedValue(new Error("not available in tests")),
}));

vi.mock("./lib/rulesApi", () => ({
  listRules: vi.fn().mockResolvedValue([]),
  saveRule: vi.fn(),
  deleteRule: vi.fn(),
  toggleRule: vi.fn(),
}));

vi.mock("./lib/settingsApi", () => ({
  getSettings: vi.fn().mockResolvedValue({
    proxyPort: 9090,
    trafficLimit: 500,
    windowPreset: "comfortable",
  }),
  saveSettings: vi.fn(),
  getCurrentWindowSize: vi.fn(),
}));

vi.mock("./lib/proxyApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./lib/proxyApi")>();
  return {
    ...actual,
    proxyStatus: vi.fn().mockResolvedValue({
      running: false,
      bindAddr: null,
      port: null,
    }),
    startProxy: vi.fn().mockResolvedValue({
      running: true,
      bindAddr: "127.0.0.1:9090",
      port: 9090,
    }),
    stopProxy: vi.fn(),
    listTraffic: vi.fn().mockResolvedValue([]),
    clearTraffic: vi.fn(),
    openProxySettings: vi.fn(),
    onTrafficEntry: vi.fn().mockResolvedValue(() => undefined),
  };
});

const capturedEntry: TrafficEntry = {
  id: "captured-connect",
  method: "CONNECT",
  url: "example.test:443",
  host: "example.test",
  path: "",
  requestHeaders: {
    host: "example.test:443",
  },
  status: { kind: "tunnel" },
  startedAtEpochMs: 1_700_000_000_000,
  durationMs: 3,
  matchedRuleIds: [],
};

describe("App navigation", () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it("switches the visible page from the sidebar", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "流量" }));

    expect(
      screen.getByRole("heading", { name: "本地代理抓包" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("本机信息仪表盘")).not.toBeInTheDocument();
  });

  it("shows the application footer status", async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByLabelText("应用状态")).toHaveTextContent("版本 0.1.0");
      expect(screen.getByLabelText("应用状态")).toHaveTextContent("本机信息每 5 秒刷新");
      expect(screen.getByLabelText("应用状态")).toHaveTextContent("代理已停止");
    });
  });

  it("refreshes traffic while the proxy is running even when events are missed", async () => {
    const proxyApi = await import("./lib/proxyApi");
    const user = userEvent.setup();
    vi.mocked(proxyApi.listTraffic)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([capturedEntry]);

    render(<App />);

    await user.click(screen.getByRole("button", { name: "流量" }));
    await user.click(screen.getByRole("button", { name: "启动代理" }));

    expect(
      await screen.findByRole("button", {
        name: "CONNECT example.test example.test:443",
      }),
    ).toBeInTheDocument();
  });
});
