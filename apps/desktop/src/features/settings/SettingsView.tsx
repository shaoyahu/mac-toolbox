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
      setError("Port must be between 1 and 65535.");
      return;
    }
    if (!Number.isInteger(parsedLimit) || parsedLimit < 10 || parsedLimit > 10000) {
      setError("Traffic retention must be between 10 and 10000.");
      return;
    }

    setError(null);
    onSave({ proxyPort: parsedPort, trafficLimit: parsedLimit });
  }

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      <label>
        Proxy port
        <input
          inputMode="numeric"
          value={proxyPort}
          onChange={(event) => setProxyPort(event.target.value)}
        />
      </label>
      <label>
        Traffic retention limit
        <input
          inputMode="numeric"
          value={trafficLimit}
          onChange={(event) => setTrafficLimit(event.target.value)}
        />
      </label>
      <div className="privacy-note">
        <strong>Privacy defaults</strong>
        <p>
          Traffic history remains in memory only. Rules and settings are stored in the
          app data directory so they can be restored after restart.
        </p>
      </div>
      {error && <p className="form-error">{error}</p>}
      <button type="submit">Save settings</button>
    </form>
  );
}
