import { describe, expect, it } from "vitest";
import { sections } from "./navigation";

describe("navigation sections", () => {
  it("keeps MVP sections in the planned order", () => {
    expect(sections.map((section) => section.id)).toEqual([
      "dashboard",
      "traffic",
      "rules",
      "settings",
    ]);
  });
});
