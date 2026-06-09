import { TrafficEntry } from "../../lib/proxyApi";

type TrafficTableProps = {
  entries: TrafficEntry[];
  selectedId: string | null;
  onSelect: (entry: TrafficEntry) => void;
};

export function TrafficTable({ entries, selectedId, onSelect }: TrafficTableProps) {
  if (entries.length === 0) {
    return (
      <div className="empty-state compact">
        <span>No traffic captured yet</span>
        <p>Start the proxy, then point a browser or HTTP client at the local port.</p>
      </div>
    );
  }

  return (
    <div className="traffic-table" role="table" aria-label="Traffic entries">
      <div className="traffic-row traffic-row-head" role="row">
        <span>Method</span>
        <span>Host</span>
        <span>Path</span>
        <span>Status</span>
        <span>Time</span>
      </div>
      {entries.map((entry) => (
        <button
          className={
            entry.id === selectedId ? "traffic-row traffic-row-selected" : "traffic-row"
          }
          type="button"
          aria-label={`${entry.method} ${entry.host} ${entry.path || entry.url}`}
          key={entry.id}
          onClick={() => onSelect(entry)}
        >
          <span>{entry.method}</span>
          <span>{entry.host}</span>
          <span>{entry.path || entry.url}</span>
          <span>{formatStatus(entry)}</span>
          <span>{entry.durationMs ?? "-"} ms</span>
        </button>
      ))}
    </div>
  );
}

function formatStatus(entry: TrafficEntry) {
  switch (entry.status.kind) {
    case "complete":
      return entry.status.value;
    case "failed":
      return "Failed";
    case "tunnel":
      return "CONNECT";
    case "pending":
      return "Pending";
  }
}
