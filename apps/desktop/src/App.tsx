import { useState } from "react";
import { SectionId, sections } from "./app/navigation";

function PageContent({ sectionId }: { sectionId: SectionId }) {
  const section = sections.find((item) => item.id === sectionId) ?? sections[0];

  return (
    <section className="content-panel" aria-labelledby="app-title">
      <p className="section-label">Version 0.1</p>
      <h1 id="app-title">{section.title}</h1>
      <p className="lede">{section.description}</p>
      {section.id === "dashboard" ? (
        <div className="placeholder-grid" aria-label="MVP capabilities">
          <article>
            <span>01</span>
            <h2>System snapshot</h2>
            <p>Read-only host, OS, CPU, memory, disk, and network details.</p>
          </article>
          <article>
            <span>02</span>
            <h2>Manual local proxy</h2>
            <p>Start a loopback proxy and capture conservative HTTP metadata.</p>
          </article>
          <article>
            <span>03</span>
            <h2>Header rules</h2>
            <p>Add, replace, or remove request headers for matching traffic.</p>
          </article>
        </div>
      ) : (
        <div className="empty-state">
          <span>{section.label}</span>
          <p>This workspace is ready for the next MVP milestone.</p>
        </div>
      )}
    </section>
  );
}

export function App() {
  const [activeSection, setActiveSection] = useState<SectionId>("dashboard");

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

      <PageContent sectionId={activeSection} />
    </main>
  );
}
