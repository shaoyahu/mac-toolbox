import { FormEvent, useState } from "react";
import { SettingsSnapshot } from "../../lib/settingsApi";

type SettingsViewProps = {
  settings: SettingsSnapshot;
  onSave: (settings: SettingsSnapshot) => void;
};

export function SettingsView({ settings, onSave }: SettingsViewProps) {
  const [proxyPort, setProxyPort] = useState(String(settings.proxyPort));
  const [trafficLimit, setTrafficLimit] = useState(String(settings.trafficLimit));
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsedPort = Number(proxyPort);
    const parsedLimit = Number(trafficLimit);

    if (!Number.isInteger(parsedPort) || parsedPort < 1 || parsedPort > 65535) {
      setError("端口必须在 1 到 65535 之间。");
      return;
    }
    if (!Number.isInteger(parsedLimit) || parsedLimit < 10 || parsedLimit > 10000) {
      setError("流量保留上限必须在 10 到 10000 之间。");
      return;
    }

    setError(null);
    onSave({ proxyPort: parsedPort, trafficLimit: parsedLimit });
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <label>
        代理端口
        <input
          inputMode="numeric"
          value={proxyPort}
          onChange={(event) => setProxyPort(event.target.value)}
        />
      </label>
      <label>
        流量保留上限
        <input
          inputMode="numeric"
          value={trafficLimit}
          onChange={(event) => setTrafficLimit(event.target.value)}
        />
      </label>
      <div className="privacy-note">
        <strong>隐私默认行为</strong>
        <p>
          流量历史只保存在内存中。规则和设置会写入应用数据目录，以便重启后恢复。
        </p>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit">保存设置</button>
    </form>
  );
}
