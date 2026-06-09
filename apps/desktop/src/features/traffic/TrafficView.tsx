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
};

export function TrafficView({
  entries,
  status,
  rules = [],
  onStart,
  onStop,
  onClear,
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
      />
      <label className="traffic-search">
        Search traffic
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by host, method, or URL"
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
