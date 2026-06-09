export function App() {
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
          <button className="nav-item nav-item-active" type="button">
            Dashboard
          </button>
          <button className="nav-item" type="button">
            Traffic
          </button>
          <button className="nav-item" type="button">
            Header Rules
          </button>
          <button className="nav-item" type="button">
            Settings
          </button>
        </nav>
      </aside>

      <section className="content-panel" aria-labelledby="app-title">
        <p className="section-label">Version 0.1</p>
        <h1 id="app-title">Local macOS toolbox</h1>
        <p className="lede">
          Inspect system information, run a local proxy, and safely rewrite
          request headers for traffic that you intentionally route through the
          app.
        </p>
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
      </section>
    </main>
  );
}
