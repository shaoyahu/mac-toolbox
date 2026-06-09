import { useEffect, useState } from "react";
import { SectionId, sections } from "./app/navigation";
import { SystemDashboard } from "./features/dashboard/SystemDashboard";
import { RulesView } from "./features/rules/RulesView";
import { SettingsView } from "./features/settings/SettingsView";
import { TrafficView } from "./features/traffic/TrafficView";
import { getAppVersion } from "./lib/appInfo";
import { loadSystemSnapshot, SystemSnapshot } from "./lib/systemInfo";
import {
  clearTraffic,
  listTraffic,
  onTrafficEntry,
  openProxySettings,
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
  getCurrentWindowSize,
  getSettings,
  saveSettings,
  SettingsSnapshot,
} from "./lib/settingsApi";

type SnapshotState =
  | { status: "loading" }
  | { status: "ready"; snapshot: SystemSnapshot; updatedAt: Date }
  | { status: "error"; message: string };

const SYSTEM_REFRESH_INTERVAL_MS = 5_000;
const TRAFFIC_REFRESH_INTERVAL_MS = 1_000;

function PageContent({
  sectionId,
  snapshotState,
  trafficEntries,
  proxyState,
  onStartProxy,
  onStopProxy,
  onClearTraffic,
  onOpenProxySettings,
  onCopyProxyAddress,
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
  onOpenProxySettings: () => void;
  onCopyProxyAddress: () => void;
  rules: HeaderRule[];
  onSaveRule: (rule: HeaderRule) => void;
  onDeleteRule: (ruleId: string) => void;
  onToggleRule: (ruleId: string, enabled: boolean) => void;
  settings: SettingsSnapshot;
  onSaveSettings: (settings: SettingsSnapshot) => Promise<string | null>;
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
          onOpenSettings={onOpenProxySettings}
          onCopyProxyAddress={onCopyProxyAddress}
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
    windowPreset: "comfortable",
  });
  const [appVersion, setAppVersion] = useState("0.1.0");
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let cancelled = false;

    async function refreshSnapshot() {
      try {
        const snapshot = await loadSystemSnapshot();
        if (!cancelled) {
          setSnapshotState({ status: "ready", snapshot, updatedAt: new Date() });
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setSnapshotState({
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    refreshSnapshot();
    const interval = window.setInterval(refreshSnapshot, SYSTEM_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getAppVersion()
      .then((version) => {
        if (!cancelled) {
          setAppVersion(version);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(interval);
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

  useEffect(() => {
    if (!proxyState.running) {
      return;
    }

    let cancelled = false;
    const refreshTraffic = () => {
      listTraffic()
        .then((entries) => {
          if (!cancelled) {
            setTrafficEntries(entries);
          }
        })
        .catch(() => undefined);
    };

    refreshTraffic();
    const interval = window.setInterval(refreshTraffic, TRAFFIC_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [proxyState.running]);

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

  async function handleOpenProxySettings() {
    await openProxySettings();
  }

  async function handleCopyProxyAddress() {
    const address = proxyState.bindAddr ?? `127.0.0.1:${settings.proxyPort}`;
    await navigator.clipboard?.writeText(address);
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
    const savedSettings = await saveSettings(nextSettings);
    setSettings(savedSettings);

    const currentSize = await getCurrentWindowSize();
    if (!currentSize) {
      return "设置已保存。浏览器预览不会改变外层浏览器窗口大小，请在桌面应用窗口中查看效果。";
    }
    return `设置已保存，当前窗口约为 ${currentSize.width} x ${currentSize.height}。`;
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
        onOpenProxySettings={handleOpenProxySettings}
        onCopyProxyAddress={handleCopyProxyAddress}
        rules={rules}
        onSaveRule={handleSaveRule}
        onDeleteRule={handleDeleteRule}
        onToggleRule={handleToggleRule}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
      <AppFooter
        appVersion={appVersion}
        currentTime={now}
        proxyState={proxyState}
        snapshotState={snapshotState}
        trafficCount={trafficEntries.length}
      />
    </main>
  );
}

function AppFooter({
  appVersion,
  currentTime,
  proxyState,
  snapshotState,
  trafficCount,
}: {
  appVersion: string;
  currentTime: Date;
  proxyState: ProxyStatus;
  snapshotState: SnapshotState;
  trafficCount: number;
}) {
  const formattedTime = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(currentTime);
  const refreshedAt =
    snapshotState.status === "ready"
      ? new Intl.DateTimeFormat("zh-CN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(snapshotState.updatedAt)
      : "未完成";

  return (
    <footer className="app-footer" aria-label="应用状态">
      <span>时间 {formattedTime}</span>
      <span>版本 {appVersion}</span>
      <span>本机信息每 {SYSTEM_REFRESH_INTERVAL_MS / 1000} 秒刷新</span>
      <span>最近刷新 {refreshedAt}</span>
      <span>{proxyState.running ? `代理运行中：${proxyState.bindAddr}` : "代理已停止"}</span>
      <span>流量 {trafficCount} 条</span>
    </footer>
  );
}
