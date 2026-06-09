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
        <span>No rules yet</span>
        <p>Create a rule to rewrite headers for matching proxy traffic.</p>
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
              {rule.enabled ? `Disable ${rule.name}` : `Enable ${rule.name}`}
            </button>
            <button type="button" onClick={() => onDelete(rule.id)}>
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}

function describeRule(rule: HeaderRule) {
  const matcher = rule.matchers
    .map((item) => `${item.kind} ${item.operator} ${item.value}`)
    .join(", ");
  const mutation = rule.mutations
    .map((item) =>
      item.kind === "delete"
        ? `delete ${item.name}`
        : `${item.kind} ${item.name}`,
    )
    .join(", ");

  return `${rule.enabled ? "Enabled" : "Disabled"} · ${matcher} · ${mutation}`;
}
