import { useEffect, useState } from "react";
import { SectionId, sections } from "./app/navigation";
import { SystemDashboard } from "./features/dashboard/SystemDashboard";
import { RulesView } from "./features/rules/RulesView";
import { SettingsView } from "./features/settings/SettingsView";
import { TrafficView } from "./features/traffic/TrafficView";
import { loadSystemSnapshot, SystemSnapshot } from "./lib/systemInfo";
import {
  clearTraffic,
  listTraffic,
  onTrafficEntry,
  proxyStatus,
  ProxyStatus,
  startProxy,
  stopProxy,
  TrafficEntry,
} from "./lib/proxyApi";
import {
  deleteRule,
  HeaderRule,
  listRules,
  saveRule,
  toggleRule,
} from "./lib/rulesApi";
import {
  getSettings,
  saveSettings,
  SettingsSnapshot,
} from "./lib/settingsApi";

type SnapshotState =
  | { status: "loading" }
  | { status: "ready"; snapshot: SystemSnapshot }
  | { status: "error"; message: string };

function PageContent({
  sectionId,
  snapshotState,
  trafficEntries,
  proxyState,
  onStartProxy,
  onStopProxy,
  onClearTraffic,
  rules,
  onSaveRule,
  onDeleteRule,
  onToggleRule,
  settings,
  onSaveSettings,
}: {
  sectionId: SectionId;
  snapshotState: SnapshotState;
  trafficEntries: TrafficEntry[];
  proxyState: ProxyStatus;
  onStartProxy: () => void;
  onStopProxy: () => void;
  onClearTraffic: () => void;
  rules: HeaderRule[];
  onSaveRule: (rule: HeaderRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  settings: SettingsSnapshot;
  onSaveSettings: (settings: SettingsSnapshot) => void;
}) {
  const section = sections.find((item) => item.id === sectionId) ?? sections[0];

  return (
    <section className="content-panel" aria-labelledby="app-title">
      <p className="section-label">版本 0.1</p>
      <h1 id="app-title">{section.title}</h1>
      <p className="lede">{section.description}</p>
      {section.id === "dashboard" && <DashboardState state={snapshotState} />}
      {section.id === "traffic" && (
        <TrafficView
          entries={trafficEntries}
          status={proxyState}
          rules={rules}
          onStart={onStartProxy}
          onStop={onStopProxy}
          onClear={onClearTraffic}
        />
      )}
      {section.id === "rules" && (
        <RulesView
          rules={rules}
          onSave={onSaveRule}
          onDelete={onDeleteRule}
          onToggle={onToggleRule}
        />
      )}
      {section.id === "settings" && (
        <SettingsView settings={settings} onSave={onSaveSettings} />
      )}
    </section>
  );
}

function DashboardState({ state }: { state: SnapshotState }) {
  if (state.status === "loading") {
    return <div className="status-panel">正在加载本机信息...</div>;
  }

  if (state.status === "error") {
    return (
      <div className="status-panel status-panel-error">
        本机信息加载失败：{state.message}
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
  const [proxyState, setProxyState] = useState<ProxyStatus>({
    running: false,
    bindAddr: null,
    port: null,
  });
  const [trafficEntries, setTrafficEntries] = useState<TrafficEntry[]>([]);
  const [rules, setRules] = useState<HeaderRule[]>([]);
  const [settings, setSettings] = useState<SettingsSnapshot>({
    proxyPort: 9090,
    trafficLimit: 500,
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

  useEffect(() => {
    proxyStatus().then(setProxyState).catch(() => undefined);
    listTraffic().then(setTrafficEntries).catch(() => undefined);
    listRules().then(setRules).catch(() => undefined);
    getSettings().then(setSettings).catch(() => undefined);

    let unlisten: (() => void) | undefined;
    onTrafficEntry((entry) => {
      setTrafficEntries((entries) => {
        if (entries.some((existing) => existing.id === entry.id)) {
          return entries;
        }
        return [...entries, entry];
      });
    }).then((cleanup) => {
      unlisten = cleanup;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  async function handleStartProxy() {
    setProxyState(await startProxy(settings.proxyPort));
  }

  async function handleStopProxy() {
    setProxyState(await stopProxy());
  }

  async function handleClearTraffic() {
    await clearTraffic();
    setTrafficEntries([]);
  }

  async function handleSaveRule(rule: HeaderRule) {
    setRules(await saveRule(rule));
  }

  async function handleDeleteRule(ruleId: string) {
    setRules(await deleteRule(ruleId));
  }

  async function handleToggleRule(ruleId: string, enabled: boolean) {
    setRules(await toggleRule(ruleId, enabled));
  }

  async function handleSaveSettings(nextSettings: SettingsSnapshot) {
    setSettings(await saveSettings(nextSettings));
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="主导航">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <div>
            <strong>macOS 工具箱</strong>
            <span>本地开发者工具</span>
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

      <PageContent
        sectionId={activeSection}
        snapshotState={snapshotState}
        trafficEntries={trafficEntries}
        proxyState={proxyState}
        onStartProxy={handleStartProxy}
        onStopProxy={handleStopProxy}
        onClearTraffic={handleClearTraffic}
        rules={rules}
        onSaveRule={handleSaveRule}
        onDeleteRule={handleDeleteRule}
        onToggleRule={handleToggleRule}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </main>
  );
}
