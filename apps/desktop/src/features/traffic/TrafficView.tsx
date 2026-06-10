import { useMemo, useState } from "react";
import { ProxyStatus, TrafficEntry } from "../../lib/proxyApi";
import { HeaderRule } from "../../lib/rulesApi";
import { ProxyControls } from "./ProxyControls";
import { TrafficDetail } from "./TrafficDetail";
import { TrafficTable } from "./TrafficTable";

type TrafficViewProps = {
  entries: TrafficEntry[];
  status: ProxyStatus;
  rules?: HeaderRule[];
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onOpenSettings?: () => void;
  onCopyProxyAddress?: () => void;
};

export function TrafficView({
  entries,
  status,
  rules = [],
  onStart,
  onStop,
  onClear,
  onOpenSettings = () => undefined,
  onCopyProxyAddress = () => undefined,
}: TrafficViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(entries[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [hideStaticAssets, setHideStaticAssets] = useState(true);

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (hideStaticAssets && isStaticAssetRequest(entry)) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [entry.host, entry.method, entry.url].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });
  }, [entries, hideStaticAssets, query]);
  const selectedEntry =
    filteredEntries.find((entry) => entry.id === selectedId) ?? filteredEntries[0] ?? null;

  return (
    <div className="traffic-view">
      <ProxyControls
        status={status}
        onStart={onStart}
        onStop={onStop}
        onClear={onClear}
        onOpenSettings={onOpenSettings}
        onCopyProxyAddress={onCopyProxyAddress}
      />
      <div className="traffic-filter-bar">
        <label className="traffic-search">
          搜索流量
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="按主机、方法或 URL 过滤"
          />
        </label>
        <label className="traffic-filter-toggle">
          <input
            type="checkbox"
            checked={hideStaticAssets}
            onChange={(event) => setHideStaticAssets(event.target.checked)}
          />
          隐藏静态资源请求
        </label>
      </div>
      <div className="traffic-layout">
        <TrafficTable
          entries={filteredEntries}
          selectedId={selectedEntry?.id ?? null}
          onSelect={(entry) => setSelectedId(entry.id)}
        />
        <TrafficDetail entry={selectedEntry} rules={rules} />
      </div>
    </div>
  );
}

const staticAssetExtensions = new Set([
  "avif",
  "bmp",
  "css",
  "eot",
  "gif",
  "ico",
  "jpeg",
  "jpg",
  "js",
  "map",
  "mjs",
  "otf",
  "png",
  "svg",
  "ttf",
  "webp",
  "woff",
  "woff2",
]);

function isStaticAssetRequest(entry: TrafficEntry) {
  const pathname = pathFromEntry(entry).toLowerCase();
  const extension = pathname.split("/").pop()?.split(".").pop();
  if (extension && staticAssetExtensions.has(extension)) {
    return true;
  }

  const contentType = entry.responseHeaders["content-type"]?.toLowerCase() ?? "";
  return (
    contentType.startsWith("image/") ||
    contentType.startsWith("font/") ||
    contentType.includes("text/css") ||
    contentType.includes("javascript")
  );
}

function pathFromEntry(entry: TrafficEntry) {
  if (entry.path) {
    return entry.path.split("?")[0];
  }

  try {
    return new URL(entry.url).pathname;
  } catch {
    return entry.url.split("?")[0];
  }
}
