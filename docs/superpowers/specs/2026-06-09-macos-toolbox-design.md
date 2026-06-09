# macOS Toolbox App Design

Date: 2026-06-09
Status: Draft approved for implementation planning

## Goal

Build a macOS desktop toolbox app for developers and power users. The first product version should combine local machine visibility with request inspection and safe request-header rewriting, while keeping system-level proxy and browser-extension complexity out of the initial critical path.

## Target User

The primary user is a frontend or full-stack developer who wants one lightweight macOS utility for:

- Inspecting local device and system status.
- Capturing browser or app HTTP traffic through a local proxy.
- Creating request-header rewrite rules for debugging, testing, or environment switching.

## Recommended Stack

Use Tauri 2 with React and TypeScript for the desktop app shell and UI.

The frontend should stay in React because it matches the developer's existing experience and is well suited for data-heavy panels such as request tables, filters, charts, rule editors, and detail inspectors.

The desktop backend should use Rust through Tauri commands and sidecar processes. Rust is a good fit for long-running local services, local proxy code, process supervision, and structured communication with the UI.

Use Swift or Objective-C only where native macOS APIs are meaningfully easier or required, such as battery details, menu bar integration gaps, privileged helpers, certificate trust flows, or future Network Extension work.

## Architecture

The app should be split into these layers:

- `apps/desktop`: Tauri + React + TypeScript UI.
- `crates/system-info`: system information provider exposed to the Tauri backend.
- `crates/proxy-core`: local HTTP proxy, capture pipeline, and rewrite engine.
- `extensions/chrome`: later optional Chrome extension for browser-native header rewrite.
- `docs`: product, security, permission, and implementation notes.

The React UI should not directly own platform details. It should call typed Tauri commands or subscribe to events. The Rust backend should normalize platform-specific data into stable app models.

## MVP Scope

Version 0.1 should include:

- A dashboard with system version, device model if available, CPU, memory, disk, network addresses, and battery status.
- A local manually configured proxy server, for example `127.0.0.1:<port>`.
- A request log with method, URL, host, status if available, duration, timestamp, and matched rule.
- Request and response header inspection when technically available.
- Basic request-header rewrite rules for traffic flowing through the app proxy.
- App settings for proxy port, startup behavior, data retention, and rule enablement.

Version 0.1 should not include:

- Automatic system-wide proxy switching.
- HTTPS body decryption by default.
- Installing a root CA certificate automatically.
- Safari extension packaging.
- Network Extension transparent proxy mode.
- Full packet capture.

These exclusions keep the first version useful and shippable while avoiding the hardest macOS permission and trust workflows.

## Feature Areas

### System Information

The system information module should expose read-only snapshots. The first implementation can collect common values through Rust crates and shell-safe system APIs, then move specific fields to native macOS APIs if accuracy requires it.

Data should be refreshed on a timer controlled by the UI, not streamed constantly unless needed. Battery and network status can refresh more frequently than static hardware data.

### Local Proxy Capture

The proxy should start and stop from inside the app. Users configure their browser or OS proxy manually for the MVP.

The proxy should record metadata first. Capturing body content and decrypting HTTPS should be treated as separate opt-in features because they change privacy, storage, and certificate requirements.

The request log should be append-only in memory for the first version, with a bounded retention limit. Persistent history can be added after the capture model is stable.

### Header Rewrite

The first rewrite engine should operate only on traffic passing through the app proxy. Rules should support:

- Match by host substring or exact host.
- Match by path prefix or substring.
- Add, replace, or remove request headers.
- Enable and disable individual rules.

Browser-native request-header modification should be a later browser extension project. It has a different permission model and should not be mixed with the proxy MVP.

## UX Model

Use a desktop-style sidebar and detail layout:

- Dashboard
- Traffic
- Header Rules
- Settings

The Traffic screen should behave like a developer tool: searchable table on the left or top, detail inspector on selection, and clear controls for start, stop, clear, and export.

The Header Rules screen should prioritize clarity and reversibility. Each rule should show whether it is enabled, what it matches, and what it changes.

Settings should be a separate macOS settings scene or a clear settings screen depending on the final Tauri shell capabilities. Avoid hiding security-sensitive controls in secondary menus.

## Security And Trust

The app must make trust boundaries explicit:

- Local machine information is read-only.
- Proxy capture is local-only unless explicitly exported.
- Header rewrite only affects traffic routed through the local proxy in the MVP.
- HTTPS decryption requires a separate design because it needs local CA generation, certificate installation, trust-store changes, and clear user consent.

Avoid logging sensitive request bodies, cookies, authorization headers, or full payloads by default. If these are ever captured, provide masking and retention controls.

## Implementation Phases

### Phase 1: App Shell And Dashboard

Create the Tauri + React project, desktop layout, navigation, settings shell, and system info dashboard. This phase proves packaging, app startup, backend command calls, and basic UI conventions.

### Phase 2: Proxy Capture MVP

Add a Rust proxy sidecar or backend service with start/stop controls, request metadata capture, event streaming to the UI, and bounded in-memory traffic history.

### Phase 3: Header Rule Engine

Add match conditions, request-header mutations, rule persistence, and matched-rule display in the traffic log.

### Phase 4: HTTPS And Browser Integrations

Design HTTPS interception as an opt-in advanced feature. Separately evaluate Chrome/Safari extensions for browser-native header rewriting.

### Phase 5: Polish And Distribution

Add app icon, onboarding, first-run proxy instructions, signing, notarization, update strategy, and export/import of rules.

## Testing Strategy

Use layered validation:

- Frontend unit tests for rule editing and UI state.
- Rust unit tests for rule matching and header mutation.
- Integration tests for proxy start/stop and simple HTTP traffic capture.
- Manual macOS smoke tests for app startup, permissions, settings, and proxy configuration instructions.

The proxy and rewrite engine should have tests before complex UI work depends on them.

## Open Decisions

- Exact package manager: `pnpm` is recommended unless the developer already prefers `npm`.
- UI component approach: start with custom lightweight components; add a component library only if needed.
- Proxy implementation crate: choose during implementation planning after checking current Rust ecosystem options.
- Data persistence: start with settings and rules only; defer persistent traffic history.

## Acceptance Criteria For Version 0.1

- The macOS app launches from local development and production build.
- The dashboard shows useful current system and battery information.
- The proxy can be started and stopped from the UI.
- A browser manually pointed to the proxy produces visible request log entries.
- At least one enabled header rewrite rule can change a matching proxied request.
- Sensitive capture behavior is documented and conservative by default.
