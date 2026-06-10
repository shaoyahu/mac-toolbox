import { fireEvent, render, screen } from "@testing-library/react";
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
  requestBody: null,
  responseHeaders: {
    "content-type": "application/json",
    date: "Wed, 10 Jun 2026 01:53:25 GMT",
  },
  responseBody: "{\"ok\":true}",
  status: { kind: "complete", value: 204 },
  startedAtEpochMs: 1_700_000_000_000,
  durationMs: 42,
  matchedRuleIds: ["debug"],
};

const staticEntry: TrafficEntry = {
  ...entry,
  id: "static-css",
  method: "GET",
  url: "http://100.81.161.119/src/App.css",
  host: "100.81.161.119",
  path: "/src/App.css",
  requestHeaders: {
    accept: "text/css,*/*;q=0.1",
  },
  responseHeaders: {
    "content-type": "text/css",
  },
  responseBody: "body { color: #17201b; }",
  matchedRuleIds: [],
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
    expect(screen.getByText("当前请求没有可展示的请求体")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Cookies(2)" }));
    expect(screen.getByText("session")).toBeInTheDocument();
    expect(screen.getByText("abc123")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "响应头(2)" }));
    expect(screen.getByText("content-type")).toBeInTheDocument();
    expect(screen.getByText("application/json")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "响应体" }));
    expect(screen.getByText("{\"ok\":true}")).toBeInTheDocument();
  });

  it("keeps a sticky header with resizable columns", () => {
    render(
      <TrafficView
        entries={[entry]}
        status={{ running: true, bindAddr: "127.0.0.1:9090", port: 9090 }}
        onStart={vi.fn()}
        onStop={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    const table = screen.getByRole("table", { name: "流量记录" });
    expect(table).toHaveStyle("--traffic-col-method: 4.2rem");

    fireEvent.pointerDown(screen.getByRole("separator", { name: "调整方法列宽" }), {
      clientX: 100,
    });
    fireEvent.pointerMove(window, { clientX: 132 });
    fireEvent.pointerUp(window);

    expect(table).toHaveStyle("--traffic-col-method: 91px");
    expect(screen.getByRole("row", { name: "ID图标方法URL" })).toHaveClass(
      "traffic-row-head",
    );
  });

  it("hides static asset requests by default and can show them", async () => {
    render(
      <TrafficView
        entries={[entry, staticEntry]}
        status={{ running: true, bindAddr: "127.0.0.1:9090", port: 9090 }}
        onStart={vi.fn()}
        onStop={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /GET .*api.example.test/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /GET .*App\.css/ })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("checkbox", { name: "隐藏静态资源请求" }));

    expect(screen.getByRole("button", { name: /GET .*App\.css/ })).toBeInTheDocument();
  });
});
