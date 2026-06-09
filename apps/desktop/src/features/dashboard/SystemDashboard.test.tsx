import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SystemDashboard } from "./SystemDashboard";
import { SystemSnapshot } from "../../lib/systemInfo";

const snapshot: SystemSnapshot = {
  osName: "macOS",
  osVersion: "15.0",
  kernelVersion: "24.0.0",
  hostName: "studio.local",
  cpuName: "Apple M4",
  cpuCoreCount: 10,
  totalMemory: 32 * 1024 * 1024 * 1024,
  usedMemory: 12 * 1024 * 1024 * 1024,
  totalDisk: 1_000_000_000_000,
  availableDisk: 600_000_000_000,
  networkInterfaceCount: 4,
};

describe("SystemDashboard", () => {
  it("renders system snapshot cards", () => {
    render(<SystemDashboard snapshot={snapshot} />);

    expect(screen.getByText("studio.local")).toBeInTheDocument();
    expect(screen.getByText("macOS 15.0")).toBeInTheDocument();
    expect(screen.getByText("Apple M4")).toBeInTheDocument();
    expect(screen.getByText("10 cores")).toBeInTheDocument();
    expect(screen.getByText("12 GB / 32 GB")).toBeInTheDocument();
    expect(screen.getByText("600 GB available")).toBeInTheDocument();
    expect(screen.getByText("4 interfaces")).toBeInTheDocument();
  });
});
