import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("App navigation", () => {
  it("switches the visible page from the sidebar", async () => {
    render(<App />);

    await userEvent.click(screen.getByRole("button", { name: "Traffic" }));

    expect(
      screen.getByRole("heading", { name: "Traffic capture" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("System dashboard")).not.toBeInTheDocument();
  });
});
