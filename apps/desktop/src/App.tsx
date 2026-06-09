import { useEffect, useState } from "react";
import { SectionId, sections } from "./app/navigation";
import { SystemDashboard } from "./features/dashboard/SystemDashboard";
import { loadSystemSnapshot, SystemSnapshot } from "./lib/systemInfo";

type SnapshotState =
  | { status: "loading" }
  | { status: "ready"; snapshot: SystemSnapshot }
  | { status: "error"; message: string };

function PageContent({
  sectionId,
  snapshotState,
}: {
  sectionId: SectionId;
  snapshotState: SnapshotState;
}) {
  const section = sections.find((item) => item.id === sectionId) ?? sections[0];

  return (
    <section className="content-panel" aria-labelledby="app-title">
      <p className="section-label">Version 0.1</p>
      <h1 id="app-title">{section.title}</h1>
      <p className="lede">{section.description}</p>
      {section.id === "dashboard" ? (
        <DashboardState state={snapshotState} />
      ) : (
        <div className="empty-state">
          <span>{section.label}</span>
          <p>This workspace is ready for the next MVP milestone.</p>
        </div>
      )}
    </section>
  );
}

function DashboardState({ state }: { state: SnapshotState }) {
  if (state.status === "loading") {
    return <div className="status-panel">Loading system snapshot...</div>;
  }

  if (state.status === "error") {
    return (
      <div className="status-panel status-panel-error">
        Failed to load system snapshot: {state.message}
      </div>
    );
  }

  return <SystemDashboard snapshot={state.snapshot} />;
}

export function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");
  const [snapshotState, setSnapshotState] = useState<SnapshotState>({
    status: "loading",
  });

  useEffect(() => {
    let cancelled = false;

    loadSystemSnapshot()
      .then((snapshot) => {
        if (!cancelled) {
          setSnapshotState({ status: "ready", snapshot });
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSnapshotState({
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Primary navigation">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <strong>macOS Toolbox</strong>
            <span>Local developer utilities</span>
          </div>
        </div>
        <nav className="nav-list">
          {sections.map((section) => (
            <button
              className={
                section.id === activeSection
                  ? "nav-item nav-item-active"
                  : "nav-item"
              }
              type="button"
              key={section.id}
              aria-current={section.id === activeSection ? "page" : undefined}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </aside>

      <PageContent sectionId={activeSection} snapshotState={snapshotState} />
    </main>
  );
}
