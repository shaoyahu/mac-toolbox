import { TrafficEntry } from "../../lib/proxyApi";
import { HeaderRule } from "../../lib/rulesApi";

type TrafficDetailProps = {
  entry: TrafficEntry | null;
  rules?: HeaderRule[];
};

export function TrafficDetail({ entry, rules = [] }: TrafficDetailProps) {
  if (!entry) {
    return (
      <aside className="traffic-detail">
        <h2>请求详情</h2>
        <p>选择一条请求来查看请求头和元数据。</p>
      </aside>
    );
  }

  return (
    <aside className="traffic-detail">
      <h2>请求详情</h2>
      <dl>
        <dt>URL</dt>
        <dd>{entry.url}</dd>
        <dt>主机</dt>
        <dd>{entry.host}</dd>
        <dt>命中规则</dt>
        <dd>
          {entry.matchedRuleIds.length > 0
            ? `命中规则：${entry.matchedRuleIds
                .map((ruleId) => rules.find((rule) => rule.id === ruleId)?.name ?? ruleId)
                .join(", ")}`
            : "未命中规则"}
        </dd>
      </dl>
      <h3>请求头</h3>
      <pre>
        {Object.entries(entry.requestHeaders)
          .map(([name, value]) => `${name}: ${value}`)
          .join("\n")}
      </pre>
    </aside>
  );
}
