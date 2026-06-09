import { ProxyStatus } from "../../lib/proxyApi";

type ProxyControlsProps = {
  status: ProxyStatus;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
};

export function ProxyControls({
  status,
  onStart,
  onStop,
  onClear,
}: ProxyControlsProps) {
  return (
    <div className="traffic-toolbar">
      <div>
        <span className={status.running ? "status-dot is-running" : "status-dot"} />
        {status.running ? `Proxy running at ${status.bindAddr}` : "Proxy stopped"}
      </div>
      <div className="toolbar-actions">
        {status.running ? (
          <button type="button" onClick={onStop}>
            Stop proxy
          </button>
        ) : (
          <button type="button" onClick={onStart}>
            Start proxy
          </button>
        )}
        <button type="button" onClick={onClear}>
          Clear traffic
        </button>
      </div>
    </div>
  );
}
