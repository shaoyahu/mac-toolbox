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
    <div className="traffic-table" role="table" aria-label="流量记录">
      <div className="traffic-row traffic-row-head" role="row">
        <span>方法</span>
        <span>主机</span>
        <span>路径</span>
        <span>状态</span>
        <span>耗时</span>
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
          <span>{entry.durationMs ?? "-"} 毫秒</span>
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
      return "失败";
    case "tunnel":
      return "CONNECT 隧道";
    case "pending":
      return "等待中";
  }
}
