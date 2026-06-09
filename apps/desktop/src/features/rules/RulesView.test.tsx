import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RulesView } from "./RulesView";

describe("RulesView", () => {
  it("creates a valid rule draft", async () => {
    const onSave = vi.fn();
    render(<RulesView rules={[]} onSave={onSave} onDelete={vi.fn()} onToggle={vi.fn()} />);

    await userEvent.type(screen.getByLabelText("规则名称"), "调试 API");
    await userEvent.type(screen.getByLabelText("Host 包含"), "example.test");
    await userEvent.type(screen.getByLabelText("请求头名称"), "x-debug");
    await userEvent.type(screen.getByLabelText("请求头值"), "true");
    await userEvent.click(screen.getByRole("button", { name: "保存规则" }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "调试 API",
        enabled: true,
      }),
    );
  });

  it("requires a name, matcher, and header name", async () => {
    const onSave = vi.fn();
    render(<RulesView rules={[]} onSave={onSave} onDelete={vi.fn()} onToggle={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "保存规则" }));

    expect(screen.getByText("规则名称不能为空。")).toBeInTheDocument();
    expect(screen.getByText("Host 匹配条件不能为空。")).toBeInTheDocument();
    expect(screen.getByText("请求头名称不能为空。")).toBeInTheDocument();
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

    await userEvent.click(screen.getByRole("button", { name: "禁用 Debug" }));

    expect(onToggle).toHaveBeenCalledWith("rule-1", false);
  });
});
