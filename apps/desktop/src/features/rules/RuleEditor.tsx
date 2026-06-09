import { FormEvent, useState } from "react";
import { HeaderMutation, HeaderRule, RuleMatcher } from "../../lib/rulesApi";

type RuleEditorProps = {
  onSave: (rule: HeaderRule) => void;
};

type Errors = {
  name?: string;
  matcher?: string;
  headerName?: string;
};

export function RuleEditor({ onSave }: RuleEditorProps) {
  const [name, setName] = useState("");
  const [hostContains, setHostContains] = useState("");
  const [pathPrefix, setPathPrefix] = useState("");
  const [mutationKind, setMutationKind] = useState<HeaderMutation["kind"]>("replace");
  const [headerName, setHeaderName] = useState("");
  const [headerValue, setHeaderValue] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextErrors: Errors = {};
    if (!name.trim()) {
      nextErrors.name = "规则名称不能为空。";
    }
    if (!hostContains.trim() && !pathPrefix.trim()) {
      nextErrors.matcher = "Host 匹配条件不能为空。";
    }
    if (!headerName.trim()) {
      nextErrors.headerName = "请求头名称不能为空。";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    const matchers: RuleMatcher[] = [];
    if (hostContains.trim()) {
      matchers.push({
        kind: "host",
        operator: "contains",
        value: hostContains.trim(),
      });
    }
    if (pathPrefix.trim()) {
      matchers.push({
        kind: "path",
        operator: "prefix",
        value: pathPrefix.trim(),
      });
    }

    const mutation: HeaderMutation =
      mutationKind === "delete"
        ? { kind: "delete", name: headerName.trim() }
        : {
            kind: mutationKind,
            name: headerName.trim(),
            value: headerValue,
          };

    onSave({
      id: crypto.randomUUID(),
      name: name.trim(),
      enabled: true,
      matchers,
      mutations: [mutation],
    });
    setName("");
    setHostContains("");
    setPathPrefix("");
    setHeaderName("");
    setHeaderValue("");
  }

  return (
    <form className="rule-editor" onSubmit={handleSubmit}>
      <label>
        规则名称
        <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      {errors.name && <p className="form-error">{errors.name}</p>}
      <label>
        Host 包含
        <input
          value={hostContains}
          onChange={(event) => setHostContains(event.target.value)}
          placeholder="api.example.test"
        />
      </label>
      <label>
        路径前缀
        <input
          value={pathPrefix}
          onChange={(event) => setPathPrefix(event.target.value)}
          placeholder="/api"
        />
      </label>
      {errors.matcher && <p className="form-error">{errors.matcher}</p>}
      <label>
        改写动作
        <select
          value={mutationKind}
          onChange={(event) => setMutationKind(event.target.value as HeaderMutation["kind"])}
        >
          <option value="add">添加</option>
          <option value="replace">替换</option>
          <option value="delete">删除</option>
        </select>
      </label>
      <label>
        请求头名称
        <input value={headerName} onChange={(event) => setHeaderName(event.target.value)} />
      </label>
      {errors.headerName && <p className="form-error">{errors.headerName}</p>}
      {mutationKind !== "delete" && (
        <label>
          请求头值
          <input value={headerValue} onChange={(event) => setHeaderValue(event.target.value)} />
        </label>
      )}
      <button type="submit">保存规则</button>
    </form>
  );
}
