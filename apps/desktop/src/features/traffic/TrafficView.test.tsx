import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TrafficEntry } from "../../lib/proxyApi";
import { TrafficView } from "./TrafficView";

const entry: TrafficEntry = {
  id: "1",
  method: "GET",
  url: "http://api.example.test/users",
  host: "api.example.test",
  path: "/users",
  requestHeaders: {
    accept: "application/json",
    cookie: "session=abc123; theme=sage",
  },
  status: { kind: "complete", value: 204 },
  startedAtEpochMs: 1_700_000_000_000,
  durationMs: 42,
  matchedRuleIds: ["debug"],
};

describe("TrafficView", () => {
  it("renders an empty traffic state", () => {
    const onOpenSettings = vi.fn();
    const onCopyProxyAddress = vi.fn();
    render(
      <TrafficView
        entries={[]}
        status={{ running: false, bindAddr: null, port: null }}
        onStart={vi.fn()}
        onStop={vi.fn()}
        onClear={vi.fn()}
        onOpenSettings={onOpenSettings}
        onCopyProxyAddress={onCopyProxyAddress}
      />,
    );

    expect(screen.getByText("还没有捕获到流量")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "打开代理设置" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "复制代理地址" })).toBeInTheDocument();
  });

  it("selects a traffic row and shows request details", async () => {
    render(
      <TrafficView
        entries={[entry]}
        status={{ running: true, bindAddr: "127.0.0.1:9090", port: 9090 }}
        onStart={vi.fn()}
        onStop={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /GET .*api.example.test/ }));

    expect(screen.getByRole("tab", { name: "请求头(2)" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "请求头(2)" }));

    expect(screen.getByText("accept")).toBeInTheDocument();
    expect(screen.getByText("application/json")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("tab", { name: "总览" }));

    expect(screen.getByText("命中规则")).toBeInTheDocument();
    expect(screen.getByText("debug")).toBeInTheDocument();
  });

  it("switches between raw headers body and cookies tabs", async () => {
    render(
      <TrafficView
        entries={[entry]}
        status={{ running: true, bindAddr: "127.0.0.1:9090", port: 9090 }}
        onStart={vi.fn()}
        onStop={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("tab", { name: "原始" }));
    expect(screen.getByText(/GET http:\/\/api\.example\.test\/users HTTP\/1\.1/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "请求体" }));
    expect(screen.getByText("当前代理记录暂未包含请求体")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Cookies(2)" }));
    expect(screen.getByText("session")).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();
  });
});
