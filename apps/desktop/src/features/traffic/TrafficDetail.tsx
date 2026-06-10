import { useState } from "react";
import { TrafficEntry } from "../../lib/proxyApi";
import { HeaderRule } from "../../lib/rulesApi";

type TrafficDetailProps = {
  entry: TrafficEntry | null;
  rules?: HeaderRule[];
};

type DetailTab =
  | "summary"
  | "raw"
  | "requestHeaders"
  | "requestBody"
  | "responseHeaders"
  | "responseBody"
  | "cookies";

const detailTabs: Array<{ id: DetailTab; label: string }> = [
  { id: "summary", label: "总览" },
  { id: "raw", label: "原始" },
  { id: "requestHeaders", label: "请求头" },
  { id: "requestBody", label: "请求体" },
  { id: "responseHeaders", label: "响应头" },
  { id: "responseBody", label: "响应体" },
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
  const responseHeaderEntries = Object.entries(entry.responseHeaders);
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
            {tab.id === "requestHeaders" ? `(${requestHeaderEntries.length})` : null}
            {tab.id === "responseHeaders" ? `(${responseHeaderEntries.length})` : null}
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
      {activeTab === "requestHeaders" ? (
        <HeaderPanel requestHeaderEntries={requestHeaderEntries} />
      ) : null}
      {activeTab === "requestBody" ? (
        <BodyPanel kind="request" body={entry.requestBody} />
      ) : null}
      {activeTab === "responseHeaders" ? (
        <KeyValuePanel
          entries={responseHeaderEntries}
          emptyName="empty"
          emptyValue="没有响应头"
          label="响应头列表"
        />
      ) : null}
      {activeTab === "responseBody" ? (
        <BodyPanel kind="response" body={entry.responseBody} />
      ) : null}
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
    <KeyValuePanel
      entries={requestHeaderEntries}
      emptyName="empty"
      emptyValue="没有请求头"
      label="请求头列表"
    />
  );
}

function KeyValuePanel({
  entries,
  emptyName,
  emptyValue,
  label,
}: {
  entries: Array<[string, string]>;
  emptyName: string;
  emptyValue: string;
  label: string;
}) {
  return (
    <section className="capture-tab-panel" aria-label={label}>
      <div className="capture-header-grid">
        {entries.length > 0 ? (
          entries.map(([name, value]) => (
            <div className="capture-header-row" key={name}>
              <span>{name}</span>
              <code>{value}</code>
            </div>
          ))
        ) : (
          <div className="capture-header-row">
            <span>{emptyName}</span>
            <code>{emptyValue}</code>
          </div>
        )}
      </div>
    </section>
  );
}

function BodyPanel({ kind, body }: { kind: "request" | "response"; body: string | null }) {
  if (body) {
    return (
      <section className="capture-tab-panel" aria-label={kind === "request" ? "请求体" : "响应体"}>
        <pre className="capture-raw-block">{body}</pre>
      </section>
    );
  }

  return (
    <section
      className="capture-tab-panel capture-empty-panel"
      aria-label={kind === "request" ? "请求体" : "响应体"}
    >
      <strong>
        {kind === "request" ? "当前请求没有可展示的请求体" : "当前响应没有可展示的响应体"}
      </strong>
      <p>{kind === "request" ? "GET、CONNECT 或空 body 请求会显示为空态。" : "空响应、压缩响应或二进制内容会显示为空态。"}</p>
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
