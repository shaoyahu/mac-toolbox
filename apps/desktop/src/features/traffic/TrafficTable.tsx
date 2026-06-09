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
        <span>还没有捕获到流量</span>
        <p>启动代理后，把浏览器或 HTTP 客户端指向本地端口。</p>
      </div>
    );
  }

  return (
    <div className="traffic-table capture-table" role="table" aria-label="流量记录">
      <div className="traffic-row traffic-row-head capture-row" role="row">
        <span>ID</span>
        <span>图标</span>
        <span>方法</span>
        <span>URL</span>
      </div>
      {entries.map((entry) => (
        <button
          className={
            entry.id === selectedId
              ? "traffic-row capture-row traffic-row-selected"
              : "traffic-row capture-row"
          }
          type="button"
          aria-label={`${entry.method} ${entry.host} ${entry.path || entry.url}`}
          key={entry.id}
          onClick={() => onSelect(entry)}
        >
          <span className="capture-id">{shortId(entry.id)}</span>
          <span className="capture-icon" aria-hidden="true">
            {entry.status.kind === "complete" ? "◎" : "{}"}
          </span>
          <span className="capture-method">{entry.method}</span>
          <span className="capture-url">{entry.url}</span>
        </button>
      ))}
    </div>
  );
}

function shortId(id: string) {
  return id.length > 4 ? `${id.slice(0, 2)}...` : id;
}
