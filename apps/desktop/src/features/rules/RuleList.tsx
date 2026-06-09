import { HeaderRule } from "../../lib/rulesApi";

type RuleListProps = {
  rules: HeaderRule[];
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string, enabled: boolean) => void;
};

export function RuleList({ rules, onDelete, onToggle }: RuleListProps) {
  if (rules.length === 0) {
    return (
      <div className="empty-state compact">
        <span>还没有规则</span>
        <p>创建规则后，可以改写匹配代理流量的请求头。</p>
      </div>
    );
  }

  return (
    <div className="rule-list">
      {rules.map((rule) => (
        <article key={rule.id} className="rule-card">
          <div>
            <strong>{rule.name}</strong>
            <p>{describeRule(rule)}</p>
          </div>
          <div className="rule-actions">
            <button
              type="button"
              onClick={() => onToggle(rule.id, !rule.enabled)}
            >
              {rule.enabled ? `禁用 ${rule.name}` : `启用 ${rule.name}`}
            </button>
            <button type="button" onClick={() => onDelete(rule.id)}>
              删除
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function describeRule(rule: HeaderRule) {
  const matcher = rule.matchers
    .map((item) => `${describeMatcherKind(item.kind)}${describeOperator(item.operator)} ${item.value}`)
    .join(", ");
  const mutation = rule.mutations
    .map((item) =>
      item.kind === "delete"
        ? `删除 ${item.name}`
        : `${describeMutationKind(item.kind)} ${item.name}`,
    )
    .join(", ");

  return `${rule.enabled ? "已启用" : "已禁用"} · ${matcher} · ${mutation}`;
}

function describeMatcherKind(kind: HeaderRule["matchers"][number]["kind"]) {
  return kind === "host" ? "Host " : "路径 ";
}

function describeOperator(operator: HeaderRule["matchers"][number]["operator"]) {
  switch (operator) {
    case "exact":
      return "精确匹配";
    case "contains":
      return "包含";
    case "prefix":
      return "前缀匹配";
  }
}

function describeMutationKind(kind: Exclude<HeaderRule["mutations"][number]["kind"], "delete">) {
  return kind === "add" ? "添加" : "替换";
}
