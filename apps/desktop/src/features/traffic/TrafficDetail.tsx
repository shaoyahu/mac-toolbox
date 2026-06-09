import { useState } from "react";
import { TrafficEntry } from "../../lib/proxyApi";
import { HeaderRule } from "../../lib/rulesApi";

type TrafficDetailProps = {
  entry: TrafficEntry | null;
  rules?: HeaderRule[];
};

type DetailTab = "summary" | "raw" | "headers" | "body" | "cookies";

const detailTabs: Array<{ id: DetailTab; label: string }> = [
  { id: "summary", label: "总览" },
  { id: "raw", label: "原始" },
  { id: "headers", label: "请求头" },
  { id: "body", label: "请求体" },
  { id: "cookies", label: "Cookies" },
];

export function TrafficDetail({ entry, rules = [] }: TrafficDetailProps) {
  const [activeTab, setActiveTab] = useState<DetailTab>("summary");

  if (!entry) {
    return (
      <aside className="traffic-detail">
        <div className="capture-detail-tabs" aria-hidden="true">
          <span className="is-active">总览</span>
          <span>原始</span>
          <span>请求头</span>
          <span>请求体</span>
          <span>Cookies</span>
        </div>
        <div className="capture-empty-detail">
          <h2>选择请求</h2>
          <p>选择一条请求来查看请求头和元数据。</p>
        </div>
      </aside>
    );
  }

  const matchedRuleNames = entry.matchedRuleIds.map(
    (ruleId) => rules.find((rule) => rule.id === ruleId)?.name ?? ruleId,
  );
  const requestHeaderEntries = Object.entries(entry.requestHeaders);
  const cookies = parseCookies(entry.requestHeaders.cookie);

  return (
    <aside className="traffic-detail">
      <div className="capture-detail-tabs" role="tablist" aria-label="请求详情分组">
        {detailTabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "is-active" : undefined}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === "headers" ? `(${requestHeaderEntries.length})` : null}
            {tab.id === "cookies" ? `(${cookies.length})` : null}
          </button>
        ))}
      </div>

      {activeTab === "summary" ? (
        <SummaryPanel entry={entry} matchedRuleNames={matchedRuleNames} />
      ) : null}
      {activeTab === "raw" ? (
        <RawPanel entry={entry} requestHeaderEntries={requestHeaderEntries} />
      ) : null}
      {activeTab === "headers" ? (
        <HeaderPanel requestHeaderEntries={requestHeaderEntries} />
      ) : null}
      {activeTab === "body" ? <BodyPanel /> : null}
      {activeTab === "cookies" ? <CookiePanel cookies={cookies} /> : null}
    </aside>
  );
}

function SummaryPanel({
  entry,
  matchedRuleNames,
}: {
  entry: TrafficEntry;
  matchedRuleNames: string[];
}) {
  return (
    <section className="capture-summary" aria-label="请求总览">
      <div className="capture-url-line">
        <span>{entry.url.split("://")[0]}://</span>
        <strong>{entry.host}</strong>
        <span>{entry.path}</span>
      </div>
      <dl>
        <div>
          <dt>状态</dt>
          <dd>{formatStatusLabel(entry)}</dd>
        </div>
        <div>
          <dt>方法</dt>
          <dd>{entry.method}</dd>
        </div>
        <div>
          <dt>协议</dt>
          <dd>{entry.url.startsWith("https://") ? "https" : "http"}</dd>
        </div>
        <div>
          <dt>Code</dt>
          <dd>{formatCode(entry)}</dd>
        </div>
        <div>
          <dt>服务器地址</dt>
          <dd>{entry.host}</dd>
        </div>
        <div>
          <dt>Keep Alive</dt>
          <dd>{entry.requestHeaders.connection === "close" ? "false" : "true"}</dd>
        </div>
        <div>
          <dt>耗时</dt>
          <dd>{entry.durationMs === null ? "-" : `${entry.durationMs} ms`}</dd>
        </div>
        <div>
          <dt>命中规则</dt>
          <dd>{matchedRuleNames.length > 0 ? matchedRuleNames.join(", ") : "未命中规则"}</dd>
        </div>
      </dl>
    </section>
  );
}

function RawPanel({
  entry,
  requestHeaderEntries,
}: {
  entry: TrafficEntry;
  requestHeaderEntries: Array<[string, string]>;
}) {
  const rawRequest = [
    `${entry.method} ${entry.url} HTTP/1.1`,
    `Host: ${entry.host}`,
    ...requestHeaderEntries.map(([name, value]) => `${name}: ${value}`),
  ].join("\n");

  return (
    <section className="capture-tab-panel" aria-label="原始请求">
      <pre className="capture-raw-block">{rawRequest}</pre>
    </section>
  );
}

function HeaderPanel({
  requestHeaderEntries,
}: {
  requestHeaderEntries: Array<[string, string]>;
}) {
  return (
    <section className="capture-tab-panel" aria-label="请求头列表">
      <div className="capture-header-grid">
        {requestHeaderEntries.length > 0 ? (
          requestHeaderEntries.map(([name, value]) => (
            <div className="capture-header-row" key={name}>
              <span>{name}</span>
              <code>{value}</code>
            </div>
          ))
        ) : (
          <div className="capture-header-row">
            <span>empty</span>
            <code>没有请求头</code>
          </div>
        )}
      </div>
    </section>
  );
}

function BodyPanel() {
  return (
    <section className="capture-tab-panel capture-empty-panel" aria-label="请求体">
      <strong>当前代理记录暂未包含请求体</strong>
      <p>后续如果代理核心记录 body，可在这里展示文本、JSON 或二进制摘要。</p>
    </section>
  );
}

function CookiePanel({ cookies }: { cookies: Array<[string, string]> }) {
  return (
    <section className="capture-tab-panel" aria-label="Cookies">
      <div className="capture-header-grid">
        {cookies.length > 0 ? (
          cookies.map(([name, value]) => (
            <div className="capture-header-row" key={name}>
              <span>{name}</span>
              <code>{value}</code>
            </div>
          ))
        ) : (
          <div className="capture-header-row">
            <span>empty</span>
            <code>没有 Cookie</code>
          </div>
        )}
      </div>
    </section>
  );
}

function formatStatusLabel(entry: TrafficEntry) {
  switch (entry.status.kind) {
    case "complete":
      return "Completed";
    case "failed":
      return `Failed: ${entry.status.value}`;
    case "tunnel":
      return "Tunnel";
    case "pending":
      return "Pending";
  }
}

function formatCode(entry: TrafficEntry) {
  switch (entry.status.kind) {
    case "complete":
      return entry.status.value;
    case "failed":
      return "ERR";
    case "tunnel":
      return "CONNECT";
    case "pending":
      return "-";
  }
}

function parseCookies(cookieHeader: string | undefined) {
  if (!cookieHeader) {
    return [];
  }

  return cookieHeader
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .map((cookie) => {
      const separatorIndex = cookie.indexOf("=");
      if (separatorIndex === -1) {
        return [cookie, ""] as [string, string];
      }
      return [
        cookie.slice(0, separatorIndex).trim(),
        cookie.slice(separatorIndex + 1).trim(),
      ] as [string, string];
    });
}
