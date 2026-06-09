import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App navigation", () => {
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
});
