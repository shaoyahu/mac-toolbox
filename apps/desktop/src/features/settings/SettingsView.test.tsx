import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsView } from "./SettingsView";

describe("SettingsView", () => {
  it("validates proxy port before saving", async () => {
    const onSave = vi.fn();
    render(
      <SettingsView
        settings={{ proxyPort: 9090, trafficLimit: 500, windowPreset: "comfortable" }}
        onSave={async (settings) => {
          onSave(settings);
          return null;
        }}
      />,
    );

    const port = screen.getByLabelText("代理端口");
    await userEvent.clear(port);
    await userEvent.type(port, "0");
    await userEvent.click(screen.getByRole("button", { name: "保存设置" }));

    expect(screen.getByText("端口必须在 1 到 65535 之间。")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("saves the selected window preset", async () => {
    const onSave = vi.fn();
    render(
      <SettingsView
        settings={{ proxyPort: 9090, trafficLimit: 500, windowPreset: "comfortable" }}
        onSave={async (settings) => {
          onSave(settings);
          return "设置已保存，当前窗口约为 1280 x 800。";
        }}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("窗口分辨率"), "wide");
    await userEvent.click(screen.getByRole("button", { name: "保存设置" }));

    expect(await screen.findByText("设置已保存，当前窗口约为 1280 x 800。")).toBeInTheDocument();
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ windowPreset: "wide" }),
    );
  });

  it("shows save errors", async () => {
    render(
      <SettingsView
        settings={{ proxyPort: 9090, trafficLimit: 500, windowPreset: "comfortable" }}
        onSave={async () => {
          throw new Error("当前是在浏览器预览中，无法修改桌面应用主窗口大小。");
        }}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText("窗口分辨率"), "large");
    await userEvent.click(screen.getByRole("button", { name: "保存设置" }));

    expect(
      await screen.findByText("当前是在浏览器预览中，无法修改桌面应用主窗口大小。"),
    ).toBeInTheDocument();
  });
});
