import { invoke } from "@tauri-apps/api/core";

export type MatchOperator = "exact" | "contains" | "prefix";

export type RuleMatcher =
  | { kind: "host"; operator: MatchOperator; value: string }
  | { kind: "path"; operator: MatchOperator; value: string };

export type HeaderMutation =
  | { kind: "add"; name: string; value: string }
  | { kind: "replace"; name: string; value: string }
  | { kind: "delete"; name: string };

export type HeaderRule = {
  id: string;
  name: string;
  enabled: boolean;
  matchers: RuleMatcher[];
  mutations: HeaderMutation[];
};

function hasTauriRuntime() {
  return "__TAURI_INTERNALS__" in window;
}

export function listRules() {
  if (!hasTauriRuntime()) {
    return Promise.resolve([]);
  }
  return invoke<HeaderRule[]>("list_rules");
}

export function saveRule(rule: HeaderRule) {
  if (!hasTauriRuntime()) {
    return Promise.resolve([rule]);
  }
  return invoke<HeaderRule[]>("save_rule", { rule });
}

export function deleteRule(ruleId: string) {
  if (!hasTauriRuntime()) {
    return Promise.resolve([]);
  }
  return invoke<HeaderRule[]>("delete_rule", { ruleId });
}

export function toggleRule(ruleId: string, enabled: boolean) {
  if (!hasTauriRuntime()) {
    return Promise.resolve([]);
  }
  return invoke<HeaderRule[]>("toggle_rule", { ruleId, enabled });
}
