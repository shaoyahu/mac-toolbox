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

    const port = screen.getByLabelText("Proxy port");
    await userEvent.clear(port);
    await userEvent.type(port, "0");
    await userEvent.click(screen.getByRole("button", { name: "Save settings" }));

    expect(screen.getByText("Port must be between 1 and 65535.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });
});
