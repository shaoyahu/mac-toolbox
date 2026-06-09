import { render, screen } from "@testing-library/react";
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
});
