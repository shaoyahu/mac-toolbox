import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SettingsView } from "./SettingsView";

describe("SettingsView", () => {
  it("validates proxy port before saving", async () => {
    const onSave = vi.fn();
    render(
      <SettingsView settings={{ proxyPort: 9090, trafficLimit: 500 }} onSave={onSave} />,
    );

    const port = screen.getByLabelText("代理端口");
    await userEvent.clear(port);
    await userEvent.type(port, "0");
    await userEvent.click(screen.getByRole("button", { name: "保存设置" }));

    expect(screen.getByText("端口必须在 1 到 65535 之间。")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
