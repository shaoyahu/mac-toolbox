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

  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return entries;
    }
    return entries.filter((entry) =>
      [entry.host, entry.method, entry.url].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [entries, query]);
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
      <label className="traffic-search">
        搜索流量
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="按主机、方法或 URL 过滤"
        />
      </label>
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
