import { TrafficEntry } from "../../lib/proxyApi";

type TrafficDetailProps = {
  entry: TrafficEntry | null;
};

export function TrafficDetail({ entry }: TrafficDetailProps) {
  if (!entry) {
    return (
      <aside className="traffic-detail">
        <h2>Request detail</h2>
        <p>Select a request to inspect headers and metadata.</p>
      </aside>
    );
  }

  return (
    <aside className="traffic-detail">
      <h2>Request detail</h2>
      <dl>
        <dt>URL</dt>
        <dd>{entry.url}</dd>
        <dt>Host</dt>
        <dd>{entry.host}</dd>
        <dt>Matched rules</dt>
        <dd>
          {entry.matchedRuleIds.length > 0
            ? `Matched rules: ${entry.matchedRuleIds.join(", ")}`
            : "No matched rules"}
        </dd>
      </dl>
      <h3>Request headers</h3>
      <pre>
        {Object.entries(entry.requestHeaders)
          .map(([name, value]) => `${name}: ${value}`)
          .join("\n")}
      </pre>
    </aside>
  );
}
