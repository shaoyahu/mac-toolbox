import { HeaderRule } from "../../lib/rulesApi";
import { RuleEditor } from "./RuleEditor";
import { RuleList } from "./RuleList";

type RulesViewProps = {
  rules: HeaderRule[];
  onSave: (rule: HeaderRule) => void;
  onDelete: (ruleId: string) => void;
  onToggle: (ruleId: string, enabled: boolean) => void;
};

export function RulesView({ rules, onSave, onDelete, onToggle }: RulesViewProps) {
  return (
    <div className="rules-view">
      <RuleEditor onSave={onSave} />
      <RuleList rules={rules} onDelete={onDelete} onToggle={onToggle} />
    </div>
  );
}
