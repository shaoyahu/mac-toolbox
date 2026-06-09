export type SectionId = "dashboard" | "traffic" | "rules" | "settings";

export type NavigationSection = {
  id: SectionId;
  label: string;
  title: string;
  description: string;
};

export const sections: NavigationSection[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "System dashboard",
    description: "Read-only host, OS, CPU, memory, disk, and network details.",
  },
  {
    id: "traffic",
    label: "Traffic",
    title: "Traffic capture",
    description: "Start a loopback proxy and inspect routed request metadata.",
  },
  {
    id: "rules",
    label: "Header Rules",
    title: "Header rewrite rules",
    description: "Add, replace, or remove request headers for matching traffic.",
  },
  {
    id: "settings",
    label: "Settings",
    title: "Settings",
    description: "Control proxy defaults, retention limits, and privacy behavior.",
  },
];
