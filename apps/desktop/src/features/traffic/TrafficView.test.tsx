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
  },
  status: { kind: "complete", value: 204 },
  startedAtEpochMs: 1_700_000_000_000,
  durationMs: 42,
  matchedRuleIds: ["debug"],
};

describe("TrafficView", () => {
  it("renders an empty traffic state", () => {
    render(
      <TrafficView
        entries={[]}
        status={{ running: false, bindAddr: null, port: null }}
        onStart={vi.fn()}
        onStop={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByText("还没有捕获到流量")).toBeInTheDocument();
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

    expect(screen.getByText("请求头")).toBeInTheDocument();
    expect(screen.getByText("accept: application/json")).toBeInTheDocument();
    expect(screen.getByText("命中规则：debug")).toBeInTheDocument();
  });
});
