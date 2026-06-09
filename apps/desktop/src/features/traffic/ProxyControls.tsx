import { ProxyStatus } from "../../lib/proxyApi";

type ProxyControlsProps = {
  status: ProxyStatus;
  onStart: () => void;
  onStop: () => void;
  onClear: () => void;
  onOpenSettings: () => void;
  onCopyProxyAddress: () => void;
};

export function ProxyControls({
  status,
  onStart,
  onStop,
  onClear,
  onOpenSettings,
  onCopyProxyAddress,
}: ProxyControlsProps) {
  return (
    <div className="traffic-toolbar">
      <div>
        <span className={status.running ? "status-dot is-running" : "status-dot"} />
        {status.running ? `代理运行中：${status.bindAddr}` : "代理已停止"}
        <p className="proxy-help">
          请手动把浏览器 HTTP 代理配置为{" "}
          <strong>{status.bindAddr ?? "127.0.0.1:9090"}</strong>。HTTPS CONNECT
          只记录隧道元数据，不解密内容。
        </p>
      </div>
      <div className="toolbar-actions">
        {status.running ? (
          <button type="button" onClick={onStop}>
            停止代理
          </button>
        ) : (
          <button type="button" onClick={onStart}>
            启动代理
          </button>
        )}
        <button type="button" onClick={onClear}>
          清空流量
        </button>
        <button type="button" className="secondary-action" onClick={onCopyProxyAddress}>
          复制代理地址
        </button>
        <button type="button" className="secondary-action" onClick={onOpenSettings}>
          打开代理设置
        </button>
      </div>
    </div>
  );
}
