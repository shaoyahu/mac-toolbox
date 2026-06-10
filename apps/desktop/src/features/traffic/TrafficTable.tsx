import { useState } from "react";
import { TrafficEntry } from "../../lib/proxyApi";

type TrafficTableProps = {
  entries: TrafficEntry[];
  selectedId: string | null;
  onSelect: (entry: TrafficEntry) => void;
};

type ColumnKey = "id" | "icon" | "method";
type ColumnWidths = Record<ColumnKey, number>;

const defaultColumnWidths: ColumnWidths = {
  id: 45,
  icon: 33,
  method: 59,
};

export function TrafficTable({ entries, selectedId, onSelect }: TrafficTableProps) {
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths);

  if (entries.length === 0) {
    return (
      <div className="empty-state compact">
        <span>还没有捕获到流量</span>
        <p>启动代理后，把浏览器或 HTTP 客户端指向本地端口。</p>
      </div>
    );
  }

  return (
    <div
      className="traffic-table capture-table"
      role="table"
      aria-label="流量记录"
      style={
        {
          "--traffic-col-id":
            columnWidths.id === defaultColumnWidths.id
              ? "3.2rem"
              : `${columnWidths.id}px`,
          "--traffic-col-icon":
            columnWidths.icon === defaultColumnWidths.icon
              ? "2.35rem"
              : `${columnWidths.icon}px`,
          "--traffic-col-method":
            columnWidths.method === defaultColumnWidths.method
              ? "4.2rem"
              : `${columnWidths.method}px`,
        } as React.CSSProperties
      }
    >
      <div
        className="traffic-row traffic-row-head capture-row"
        role="row"
        aria-label="ID图标方法URL"
      >
        <HeaderCell label="ID" columnKey="id" onResize={setColumnWidths} />
        <HeaderCell label="图标" columnKey="icon" onResize={setColumnWidths} />
        <HeaderCell label="方法" columnKey="method" onResize={setColumnWidths} />
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

function HeaderCell({
  label,
  columnKey,
  onResize,
}: {
  label: string;
  columnKey: ColumnKey;
  onResize: React.Dispatch<React.SetStateAction<ColumnWidths>>;
}) {
  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    const startX = event.clientX;

    onResize((currentWidths) => {
      const startWidth = currentWidths[columnKey];

      function handlePointerMove(moveEvent: PointerEvent) {
        const width = Math.max(28, startWidth + moveEvent.clientX - startX);
        onResize((widths) => ({ ...widths, [columnKey]: width }));
      }

      function handlePointerUp() {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      }

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp, { once: true });

      return currentWidths;
    });
  }

  return (
    <span className="traffic-head-cell">
      {label}
      <button
        className="traffic-column-resizer"
        type="button"
        role="separator"
        aria-label={`调整${label}列宽`}
        aria-hidden={false}
        onPointerDown={handlePointerDown}
      />
    </span>
  );
}

function shortId(id: string) {
  return id.length > 4 ? `${id.slice(0, 2)}...` : id;
}
