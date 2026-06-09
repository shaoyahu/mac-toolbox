import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RulesView } from "./RulesView";

describe("RulesView", () => {
  it("creates a valid rule draft", async () => {
    const onSave = vi.fn();
    render(<RulesView rules={[]} onSave={onSave} onDelete={vi.fn()} onToggle={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("Rule name"), "Debug API");
    await userEvent.type(screen.getByLabelText("Host contains"), "example.test");
    await userEvent.type(screen.getByLabelText("Header name"), "x-debug");
    await userEvent.type(screen.getByLabelText("Header value"), "true");
    await userEvent.click(screen.getByRole("button", { name: "Save rule" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Debug API",
        enabled: true,
      }),
    );
  });

  it("requires a name, matcher, and header name", async () => {
    const onSave = vi.fn();
    render(<RulesView rules={[]} onSave={onSave} onDelete={vi.fn()} onToggle={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Save rule" }));

    expect(screen.getByText("Rule name is required.")).toBeInTheDocument();
    expect(screen.getByText("Host matcher is required.")).toBeInTheDocument();
    expect(screen.getByText("Header name is required.")).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("toggles a rule", async () => {
    const onToggle = vi.fn();
    render(
      <RulesView
        rules={[
          {
            id: "rule-1",
            name: "Debug",
            enabled: true,
            matchers: [{ kind: "host", operator: "contains", value: "example" }],
            mutations: [{ kind: "replace", name: "x-debug", value: "true" }],
          },
        ]}
        onSave={vi.fn()}
        onDelete={vi.fn()}
        onToggle={onToggle}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Disable Debug" }));

    expect(onToggle).toHaveBeenCalledWith("rule-1", false);
  });
});
