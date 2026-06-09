import { FormEvent, useState } from "react";
import { SettingsSnapshot, WindowPreset } from "../../lib/settingsApi";

type SettingsViewProps = {
  settings: SettingsSnapshot;
  onSave: (settings: SettingsSnapshot) => Promise<string | null>;
};

export function SettingsView({ settings, onSave }: SettingsViewProps) {
  const [proxyPort, setProxyPort] = useState(String(settings.proxyPort));
  const [trafficLimit, setTrafficLimit] = useState(String(settings.trafficLimit));
  const [windowPreset, setWindowPreset] = useState<WindowPreset>(settings.windowPreset);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSubmit(event: FormEvent) {
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
    setSuccess(null);
    setIsSaving(true);
    try {
      const message = await onSave({ proxyPort: parsedPort, trafficLimit: parsedLimit, windowPreset });
      setSuccess(message ?? "设置已保存，窗口大小已应用。");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : String(saveError));
    } finally {
      setIsSaving(false);
    }
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
      <label>
        窗口分辨率
        <select
          value={windowPreset}
          onChange={(event) => setWindowPreset(event.target.value as WindowPreset)}
        >
          <option value="compact">紧凑：960 x 640</option>
          <option value="comfortable">标准：1120 x 760</option>
          <option value="wide">宽屏：1280 x 800</option>
          <option value="large">大屏：1440 x 900</option>
        </select>
      </label>
      <div className="privacy-note">
        <strong>隐私默认行为</strong>
        <p>
          流量历史只保存在内存中。规则和设置会写入应用数据目录，以便重启后恢复。
        </p>
      </div>
      {error && <p className="form-error">{error}</p>}
      {success && <p className="form-success">{success}</p>}
      <button type="submit" disabled={isSaving}>
        {isSaving ? "正在保存..." : "保存设置"}
      </button>
    </form>
  );
}
