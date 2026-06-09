# macOS Toolbox MVP Task List

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first working macOS toolbox app with a React/Tauri shell, system information dashboard, local proxy capture, and basic request-header rewrite rules.

**Architecture:** Tauri 2 hosts the macOS desktop app, React + TypeScript renders the UI, and Rust owns native commands, system information, proxy services, traffic models, and rewrite logic. The MVP stays local-only and manually configured; HTTPS decryption, browser extensions, and system transparent proxying are later projects.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Rust, Cargo workspace, Vitest, Rust unit tests.

---

## Scope

Included in Version 0.1:

- Desktop app scaffold.
- Sidebar/detail UI with Dashboard, Traffic, Header Rules, and Settings.
- Local system information snapshot.
- Local manually configured proxy server.
- In-memory traffic log.
- Request-header rewrite rules for proxied traffic.
- Basic settings and rule persistence.
- Security documentation for capture and rewrite behavior.

Excluded from Version 0.1:

- Automatic system proxy switching.
- HTTPS body decryption.
- Automatic root CA installation.
- Safari or Chrome extension packaging.
- Network Extension transparent proxy mode.
- Full packet capture.
- Persistent traffic history.

## Target File Structure

- `package.json`: root scripts.
- `pnpm-workspace.yaml`: JavaScript workspace.
- `Cargo.toml`: Rust workspace.
- `apps/desktop`: Tauri + React app.
- `apps/desktop/src/app`: app-level navigation and state.
- `apps/desktop/src/components`: shared UI components.
- `apps/desktop/src/features/dashboard`: system info dashboard.
- `apps/desktop/src/features/traffic`: proxy controls, traffic table, request detail.
- `apps/desktop/src/features/rules`: header rewrite rule editor.
- `apps/desktop/src/features/settings`: preferences UI.
- `apps/desktop/src/lib`: typed Tauri API clients and formatters.
- `apps/desktop/src-tauri`: Tauri backend.
- `crates/system-info`: system snapshot provider.
- `crates/proxy-core`: proxy models, server, traffic store, and rewrite engine.
- `docs/security`: local capture, privacy, and trust notes.

## Milestone 0: Workspace Foundation

- [ ] Create root `package.json` with scripts: `dev`, `build`, `test`, `test:ui`, `test:rust`, and `tauri`.
- [ ] Create `pnpm-workspace.yaml` with `apps/*`.
- [ ] Create root `Cargo.toml` workspace with `apps/desktop/src-tauri`, `crates/system-info`, and `crates/proxy-core`.
- [ ] Create `.gitignore` for `node_modules`, `dist`, `target`, `.env*`, and `.DS_Store`.
- [ ] Verify package manager with `pnpm --version`.
- [ ] If `pnpm` is unavailable, enable it with Corepack.
- [ ] Commit: `chore: add workspace foundation`.

Acceptance:

- Root workspace files exist.
- `git status` shows no uncommitted foundation changes after commit.

## Milestone 1: Tauri React Desktop Shell

- [ ] Create `apps/desktop/package.json` with Vite, React, TypeScript, Tauri API, Vitest, and Testing Library dependencies.
- [ ] Create `apps/desktop/index.html`.
- [ ] Create `apps/desktop/vite.config.ts` using port `1420`.
- [ ] Create `apps/desktop/tsconfig.json` with strict TypeScript settings.
- [ ] Create `apps/desktop/src/main.tsx`.
- [ ] Create initial `apps/desktop/src/App.tsx`.
- [ ] Create `apps/desktop/src/styles.css` with desktop sidebar layout.
- [ ] Create `apps/desktop/src-tauri/Cargo.toml`.
- [ ] Create `apps/desktop/src-tauri/tauri.conf.json`.
- [ ] Create `apps/desktop/src-tauri/src/main.rs`.
- [ ] Create `apps/desktop/src-tauri/src/lib.rs` with an `app_version` command.
- [ ] Run `pnpm install`.
- [ ] Run `pnpm build`.
- [ ] Run `cargo check --workspace`.
- [ ] Commit: `feat: scaffold Tauri desktop shell`.

Acceptance:

- Frontend builds.
- Rust backend checks.
- Tauri shell has a visible initial window when run locally.

## Milestone 2: App Navigation And Base UI

- [ ] Create `apps/desktop/src/app/navigation.ts` with section ids: `dashboard`, `traffic`, `rules`, `settings`.
- [ ] Add a navigation unit test that verifies section order.
- [ ] Replace hardcoded sidebar buttons with navigation model rendering.
- [ ] Add selected-section state in `App.tsx`.
- [ ] Add placeholder content for non-dashboard sections.
- [ ] Add responsive layout CSS for smaller windows.
- [ ] Run `pnpm --filter desktop test`.
- [ ] Run `pnpm build`.
- [ ] Commit: `feat: add app navigation`.

Acceptance:

- Clicking sidebar items changes the visible section.
- Navigation order matches the MVP design.
- UI remains usable at the configured minimum window size.

## Milestone 3: System Information Backend

- [ ] Create `crates/system-info/Cargo.toml`.
- [ ] Create `crates/system-info/src/lib.rs`.
- [ ] Define `SystemSnapshot` with OS name, OS version, kernel version, host name, CPU brand, CPU count, total memory, used memory, disk capacity, free disk, and network interface count.
- [ ] Implement `collect_system_snapshot()`.
- [ ] Add Rust tests proving CPU count, memory, and OS name are populated.
- [ ] Add `system-info` as a dependency of `apps/desktop/src-tauri`.
- [ ] Expose `system_snapshot` as a Tauri command.
- [ ] Run `cargo test -p system-info`.
- [ ] Run `cargo check --workspace`.
- [ ] Commit: `feat: add system information backend`.

Acceptance:

- `system-info` tests pass.
- Tauri backend compiles with the new command.
- Snapshot fields serialize cleanly to the frontend.

## Milestone 4: System Information Dashboard

- [ ] Create `apps/desktop/src/lib/systemInfo.ts` with frontend types, DTO mapping, `loadSystemSnapshot()`, and byte formatting.
- [ ] Create `apps/desktop/src/features/dashboard/SystemDashboard.tsx`.
- [ ] Add a rendering test for dashboard cards.
- [ ] Wire dashboard loading into `App.tsx`.
- [ ] Add loading and error states.
- [ ] Add dashboard card styling.
- [ ] Run `pnpm --filter desktop test`.
- [ ] Run `pnpm build`.
- [ ] Run the app and visually verify dashboard data appears.
- [ ] Commit: `feat: add system dashboard`.

Acceptance:

- Dashboard shows host, OS, CPU, memory, disk, and network information.
- Loading and error states are visible and understandable.
- Tests and build pass.

## Milestone 5: Proxy Domain And Rewrite Engine

- [ ] Create `crates/proxy-core/Cargo.toml`.
- [ ] Create `crates/proxy-core/src/lib.rs`.
- [ ] Create `crates/proxy-core/src/traffic.rs` with `TrafficEntry`, `TrafficStatus`, header map, timestamps, duration, and matched rule id.
- [ ] Create `crates/proxy-core/src/rules.rs` with `HeaderRule`, `RuleMatcher`, `HeaderMutation`, and `RuleSet`.
- [ ] Implement matching by host exact, host contains, path prefix, and path contains.
- [ ] Implement header add, replace, and remove mutations.
- [ ] Add Rust unit tests for host matching.
- [ ] Add Rust unit tests for path matching.
- [ ] Add Rust unit tests for add, replace, and remove mutations.
- [ ] Run `cargo test -p proxy-core`.
- [ ] Commit: `feat: add proxy rewrite engine`.

Acceptance:

- Rule matching is deterministic.
- Header mutation behavior is covered by tests before server integration.
- No proxy networking code depends on UI types.

## Milestone 6: Proxy Server MVP

- [ ] Add async runtime dependencies to `proxy-core`.
- [ ] Implement a local HTTP proxy server bound to `127.0.0.1`.
- [ ] Implement start and stop handles.
- [ ] Record request method, URL, host, path, request headers, timestamp, and matched rule id.
- [ ] Forward plain HTTP requests.
- [ ] Record response status, response headers, and duration when available.
- [ ] Handle HTTPS `CONNECT` as tunnel metadata only; do not decrypt content.
- [ ] Add an in-memory bounded `TrafficStore`.
- [ ] Add integration tests using a local HTTP test server.
- [ ] Add a test proving rewritten headers reach the upstream HTTP server.
- [ ] Run `cargo test -p proxy-core`.
- [ ] Commit: `feat: add local proxy server`.

Acceptance:

- Plain HTTP traffic can be proxied.
- HTTPS tunnel attempts are logged without body decryption.
- Header rules modify matching proxied HTTP requests.
- Traffic store retention is bounded.

## Milestone 7: Proxy Tauri Commands And Events

- [ ] Add `proxy-core` as a dependency of `apps/desktop/src-tauri`.
- [ ] Add backend app state for proxy status, settings, rules, and traffic store.
- [ ] Expose `proxy_status` command.
- [ ] Expose `start_proxy` command with configurable local port.
- [ ] Expose `stop_proxy` command.
- [ ] Expose `list_traffic` command.
- [ ] Expose `clear_traffic` command.
- [ ] Expose `list_rules`, `save_rule`, `delete_rule`, and `toggle_rule` commands.
- [ ] Emit traffic events to the frontend when new requests are captured.
- [ ] Add Rust tests for command-level state transitions where practical.
- [ ] Run `cargo test --workspace`.
- [ ] Run `cargo check --workspace`.
- [ ] Commit: `feat: expose proxy commands`.

Acceptance:

- Proxy can be started and stopped from Tauri commands.
- Traffic entries are retrievable from the frontend.
- Rule commands mutate backend state safely.

## Milestone 8: Traffic UI

- [ ] Create `apps/desktop/src/lib/proxyApi.ts` with typed Tauri client functions.
- [ ] Create `apps/desktop/src/features/traffic/TrafficView.tsx`.
- [ ] Create `apps/desktop/src/features/traffic/ProxyControls.tsx`.
- [ ] Create `apps/desktop/src/features/traffic/TrafficTable.tsx`.
- [ ] Create `apps/desktop/src/features/traffic/TrafficDetail.tsx`.
- [ ] Add tests for rendering empty traffic state.
- [ ] Add tests for selecting a traffic row and showing detail.
- [ ] Add start/stop proxy buttons.
- [ ] Add clear traffic button.
- [ ] Add search/filter by host, method, and URL.
- [ ] Subscribe to backend traffic events.
- [ ] Wire Traffic section into `App.tsx`.
- [ ] Run `pnpm --filter desktop test`.
- [ ] Run `pnpm build`.
- [ ] Manually run app, configure browser proxy, and verify request rows appear.
- [ ] Commit: `feat: add traffic capture UI`.

Acceptance:

- User can start and stop the local proxy from the UI.
- Request rows appear for manually proxied browser traffic.
- Selecting a row displays headers and metadata.
- Clear removes current in-memory traffic.

## Milestone 9: Header Rules UI

- [ ] Create `apps/desktop/src/lib/rulesApi.ts`.
- [ ] Create `apps/desktop/src/features/rules/RulesView.tsx`.
- [ ] Create `apps/desktop/src/features/rules/RuleEditor.tsx`.
- [ ] Create `apps/desktop/src/features/rules/RuleList.tsx`.
- [ ] Add tests for creating a rule draft.
- [ ] Add tests for validation: non-empty rule name, matcher, and header name.
- [ ] Add tests for enabling and disabling a rule.
- [ ] Implement create, edit, delete, and toggle interactions.
- [ ] Show matched rule name/id in Traffic detail.
- [ ] Run `pnpm --filter desktop test`.
- [ ] Run `pnpm build`.
- [ ] Manually verify a rule changes an outgoing proxied HTTP request.
- [ ] Commit: `feat: add header rewrite rules UI`.

Acceptance:

- User can create, edit, delete, enable, and disable rules.
- Invalid rules cannot be saved.
- A matching enabled rule affects proxied HTTP requests.
- Traffic log identifies matched rules.

## Milestone 10: Settings And Persistence

- [ ] Decide persistence location using Tauri app data directory.
- [ ] Add backend persistence for proxy port.
- [ ] Add backend persistence for rewrite rules.
- [ ] Add backend persistence for traffic retention limit.
- [ ] Create `apps/desktop/src/features/settings/SettingsView.tsx`.
- [ ] Add proxy port input with validation.
- [ ] Add traffic retention setting.
- [ ] Add privacy defaults explanation.
- [ ] Add tests for settings form validation.
- [ ] Wire Settings section into `App.tsx`.
- [ ] Run `pnpm --filter desktop test`.
- [ ] Run `cargo test --workspace`.
- [ ] Restart app manually and verify saved settings/rules reload.
- [ ] Commit: `feat: persist settings and rules`.

Acceptance:

- Rules survive app restart.
- Proxy port survives app restart.
- Invalid ports cannot be saved.
- Traffic history remains in-memory only.

## Milestone 11: Security And Onboarding Documentation

- [ ] Create `docs/security/local-proxy.md`.
- [ ] Document what the proxy captures by default.
- [ ] Document what the proxy does not capture in MVP.
- [ ] Document HTTPS `CONNECT` metadata behavior.
- [ ] Document that HTTPS body decryption is not implemented.
- [ ] Document that header rewrite only affects traffic routed through the local proxy.
- [ ] Create first-run UI copy explaining manual proxy configuration.
- [ ] Add a link or help panel from Traffic UI to the proxy instructions.
- [ ] Commit: `docs: document proxy privacy model`.

Acceptance:

- User can understand how to configure a browser manually.
- User can understand the privacy boundary before enabling capture.
- No UI copy implies system-wide interception.

## Milestone 12: Local Build And Smoke QA

- [ ] Run `pnpm test`.
- [ ] Run `cargo test --workspace`.
- [ ] Run `pnpm build`.
- [ ] Run `cargo check --workspace`.
- [ ] Run Tauri dev app.
- [ ] Smoke test Dashboard.
- [ ] Smoke test proxy start/stop.
- [ ] Smoke test plain HTTP request capture.
- [ ] Smoke test HTTPS `CONNECT` metadata logging.
- [ ] Smoke test header add rule.
- [ ] Smoke test header replace rule.
- [ ] Smoke test header remove rule.
- [ ] Smoke test settings persistence after app restart.
- [ ] Fix any blocking defects found by smoke QA.
- [ ] Commit fixes with focused messages.

Acceptance:

- All automated checks pass.
- Manual smoke path verifies the MVP claim.
- Remaining limitations are documented.

## Post-MVP Backlog

- [ ] Evaluate HTTPS interception design with explicit CA generation and trust-store flow.
- [ ] Evaluate Chrome extension for browser-native request-header modification.
- [ ] Evaluate Safari Web Extension packaging and Apple signing requirements.
- [ ] Evaluate system proxy switching as an opt-in helper.
- [ ] Evaluate Network Extension transparent proxy mode.
- [ ] Add traffic export.
- [ ] Add persistent traffic history with masking and retention controls.
- [ ] Add menu bar status item.
- [ ] Add app icon, signing, notarization, and release packaging.

## Execution Order

1. Milestone 0: Workspace Foundation.
2. Milestone 1: Tauri React Desktop Shell.
3. Milestone 2: App Navigation And Base UI.
4. Milestone 3: System Information Backend.
5. Milestone 4: System Information Dashboard.
6. Milestone 5: Proxy Domain And Rewrite Engine.
7. Milestone 6: Proxy Server MVP.
8. Milestone 7: Proxy Tauri Commands And Events.
9. Milestone 8: Traffic UI.
10. Milestone 9: Header Rules UI.
11. Milestone 10: Settings And Persistence.
12. Milestone 11: Security And Onboarding Documentation.
13. Milestone 12: Local Build And Smoke QA.

## Verification Commands

Run these before claiming the MVP complete:

```bash
pnpm test
cargo test --workspace
pnpm build
cargo check --workspace
```

Manual verification must also cover:

- Dashboard shows current system information.
- Browser manually configured to the proxy creates traffic log entries.
- Header rewrite rules affect matching proxied HTTP requests.
- HTTPS requests are logged only as tunnel metadata unless a later HTTPS feature is explicitly added.
- Settings and rules reload after restart.
