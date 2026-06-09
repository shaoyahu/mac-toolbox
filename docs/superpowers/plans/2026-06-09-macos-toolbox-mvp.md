# macOS 全能工具箱 MVP 任务列表

> **给自动化执行代理的要求：** 实现本计划时必须使用 `superpowers:subagent-driven-development`（推荐）或 `superpowers:executing-plans`，并按任务逐项执行。步骤使用复选框（`- [ ]`）语法，便于追踪。

**目标：** 构建第一版可运行的 macOS 工具箱应用，包含 React/Tauri 桌面壳、本机信息仪表盘、本地代理抓包、基础请求头改写规则。

**架构：** Tauri 2 承载 macOS 桌面应用，React + TypeScript 渲染 UI，Rust 负责原生命令、本机信息、代理服务、流量模型和规则改写逻辑。MVP 保持仅本地运行、手动配置、保守抓包；HTTPS 解密、浏览器扩展、系统透明代理属于后续项目。

**技术栈：** Tauri 2、React、TypeScript、Vite、Rust、Cargo workspace、Vitest、Rust 单元测试。

---

## 范围

版本 0.1 包含：

- 桌面应用脚手架。
- 仪表盘、流量、请求头规则、设置的侧边栏/详情布局。
- 本机系统信息快照。
- 本地手动配置代理服务。
- 内存中的流量日志。
- 对代理流量生效的请求头改写规则。
- 基础设置和规则持久化。
- 抓包与改写行为的安全说明文档。

版本 0.1 不包含：

- 自动切换系统代理。
- HTTPS 请求体解密。
- 自动安装 root CA。
- Safari 或 Chrome 扩展打包。
- Network Extension 透明代理模式。
- 完整 packet capture。
- 持久化流量历史。

## 目标文件结构

- `package.json`：根目录脚本。
- `pnpm-workspace.yaml`：JavaScript 工作区。
- `Cargo.toml`：Rust 工作区。
- `apps/desktop`：Tauri + React 应用。
- `apps/desktop/src/app`：应用级导航和状态。
- `apps/desktop/src/components`：共享 UI 组件。
- `apps/desktop/src/features/dashboard`：本机信息仪表盘。
- `apps/desktop/src/features/traffic`：代理控制、流量表格、请求详情。
- `apps/desktop/src/features/rules`：请求头改写规则编辑器。
- `apps/desktop/src/features/settings`：偏好设置 UI。
- `apps/desktop/src/lib`：类型化 Tauri API client 和格式化工具。
- `apps/desktop/src-tauri`：Tauri 后端。
- `crates/system-info`：系统快照提供模块。
- `crates/proxy-core`：代理模型、代理服务、流量存储、改写引擎。
- `docs/security`：本地抓包、隐私、信任边界说明。

## 里程碑 0：Workspace 基础

- [x] 创建根目录 `package.json`，包含脚本：`dev`、`build`、`test`、`test:ui`、`test:rust`、`tauri`。
- [x] 创建 `pnpm-workspace.yaml`，包含 `apps/*`。
- [x] 创建根目录 `Cargo.toml` 工作区，包含 `apps/desktop/src-tauri`、`crates/system-info`、`crates/proxy-core`。
- [x] 创建 `.gitignore`，忽略 `node_modules`、`dist`、`target`、`.env*`、`.DS_Store`。
- [x] 用 `pnpm --version` 验证包管理器。
- [x] 如果 `pnpm` 不可用，通过 Corepack 启用。
- [x] 提交：`chore: add workspace foundation`。

验收标准：

- 根目录工作区文件存在。
- 提交后 `git status` 没有与基础工作区相关的未提交变更。

## 里程碑 1：Tauri React 桌面壳

- [x] 创建 `apps/desktop/package.json`，加入 Vite、React、TypeScript、Tauri API、Vitest、Testing Library 依赖。
- [x] 创建 `apps/desktop/index.html`。
- [x] 创建 `apps/desktop/vite.config.ts`，使用端口 `1420`。
- [x] 创建 `apps/desktop/tsconfig.json`，启用严格 TypeScript 配置。
- [x] 创建 `apps/desktop/src/main.tsx`。
- [x] 创建初始 `apps/desktop/src/App.tsx`。
- [x] 创建 `apps/desktop/src/styles.css`，实现桌面侧边栏布局。
- [x] 创建 `apps/desktop/src-tauri/Cargo.toml`。
- [x] 创建 `apps/desktop/src-tauri/tauri.conf.json`。
- [x] 创建 `apps/desktop/src-tauri/src/main.rs`。
- [x] 创建 `apps/desktop/src-tauri/src/lib.rs`，包含 `app_version` 命令。
- [x] 运行 `pnpm install`。
- [x] 运行 `pnpm build`。
- [x] 运行 `cargo check --workspace`。
- [x] 提交：`feat: scaffold Tauri desktop shell`。

验收标准：

- 前端能构建。
- Rust 后端能检查通过。
- 本地运行时，Tauri 壳能显示初始窗口。

## 里程碑 2：应用导航和基础 UI

- [ ] 创建 `apps/desktop/src/app/navigation.ts`，包含 section id：`dashboard`、`traffic`、`rules`、`settings`。
- [ ] 添加导航单元测试，验证 section 顺序。
- [ ] 用导航模型渲染侧边栏，替换硬编码按钮。
- [ ] 在 `App.tsx` 中添加当前选中页面状态。
- [ ] 为非仪表盘页面添加临时内容。
- [ ] 添加小窗口下的响应式布局 CSS。
- [ ] 运行 `pnpm --filter desktop test`。
- [ ] 运行 `pnpm build`。
- [ ] 提交：`feat: add app navigation`。

验收标准：

- 点击侧边栏能切换可见页面。
- 导航顺序符合 MVP 设计。
- UI 在配置的最小窗口尺寸下仍可用。

## 里程碑 3：本机信息后端

- [ ] 创建 `crates/system-info/Cargo.toml`。
- [ ] 创建 `crates/system-info/src/lib.rs`。
- [ ] 定义 `SystemSnapshot`，包含 OS 名称、OS 版本、kernel 版本、host 名、CPU 名称、CPU 核心数、总内存、已用内存、磁盘容量、可用磁盘、网络接口数量。
- [ ] 实现 `collect_system_snapshot()`。
- [ ] 添加 Rust 测试，证明 CPU 核心数、内存、OS 名称已填充。
- [ ] 把 `system-info` 加为 `apps/desktop/src-tauri` 的依赖。
- [ ] 暴露 `system_snapshot` Tauri 命令。
- [ ] 运行 `cargo test -p system-info`。
- [ ] 运行 `cargo check --workspace`。
- [ ] 提交：`feat: add system information backend`。

验收标准：

- `system-info` 测试通过。
- Tauri 后端带新命令能编译。
- 快照字段能干净序列化到前端。

## 里程碑 4：本机信息仪表盘

- [ ] 创建 `apps/desktop/src/lib/systemInfo.ts`，包含前端类型、DTO 映射、`loadSystemSnapshot()`、字节格式化。
- [ ] 创建 `apps/desktop/src/features/dashboard/SystemDashboard.tsx`。
- [ ] 添加仪表盘卡片渲染测试。
- [ ] 在 `App.tsx` 中接入仪表盘加载流程。
- [ ] 添加加载态和错误态。
- [ ] 添加仪表盘卡片样式。
- [ ] 运行 `pnpm --filter desktop test`。
- [ ] 运行 `pnpm build`。
- [ ] 运行应用，视觉确认仪表盘数据出现。
- [ ] 提交：`feat: add system dashboard`。

验收标准：

- 仪表盘显示 host、OS、CPU、内存、磁盘、网络信息。
- 加载态和错误态清晰可见。
- 测试和构建通过。

## 里程碑 5：代理领域模型和改写引擎

- [ ] 创建 `crates/proxy-core/Cargo.toml`。
- [ ] 创建 `crates/proxy-core/src/lib.rs`。
- [ ] 创建 `crates/proxy-core/src/traffic.rs`，包含 `TrafficEntry`、`TrafficStatus`、请求头 map、时间戳、耗时、命中规则 id。
- [ ] 创建 `crates/proxy-core/src/rules.rs`，包含 `HeaderRule`、`RuleMatcher`、`HeaderMutation`、`RuleSet`。
- [ ] 实现 host 精确匹配、host 包含匹配、path 前缀匹配、path 包含匹配。
- [ ] 实现请求头添加、替换、删除。
- [ ] 添加 Rust 单元测试覆盖 host 匹配。
- [ ] 添加 Rust 单元测试覆盖 path 匹配。
- [ ] 添加 Rust 单元测试覆盖添加、替换、删除请求头。
- [ ] 运行 `cargo test -p proxy-core`。
- [ ] 提交：`feat: add proxy rewrite engine`。

验收标准：

- 规则匹配行为确定。
- 请求头改写行为先有测试覆盖，再接入代理服务。
- 代理网络代码不依赖 UI 类型。

## 里程碑 6：代理服务 MVP

- [ ] 给 `proxy-core` 添加 async runtime 依赖。
- [ ] 实现绑定到 `127.0.0.1` 的本地 HTTP 代理服务。
- [ ] 实现启动和停止 handle。
- [ ] 记录请求 method、URL、host、path、请求头、时间戳、命中规则 id。
- [ ] 转发普通 HTTP 请求。
- [ ] 可用时记录响应 status、响应头、耗时。
- [ ] 对 HTTPS `CONNECT` 只记录 tunnel 元数据，不解密内容。
- [ ] 添加有界内存 `TrafficStore`。
- [ ] 使用本地 HTTP test server 添加集成测试。
- [ ] 添加测试，证明改写后的请求头到达上游 HTTP server。
- [ ] 运行 `cargo test -p proxy-core`。
- [ ] 提交：`feat: add local proxy server`。

验收标准：

- 普通 HTTP 流量可以经过代理。
- HTTPS tunnel 尝试会被记录，但不解密请求体。
- Header 规则能修改匹配的代理 HTTP 请求。
- 流量存储有数量上限。

## 里程碑 7：代理 Tauri Commands 和事件

- [ ] 把 `proxy-core` 加为 `apps/desktop/src-tauri` 的依赖。
- [ ] 添加后端应用状态：代理状态、设置、规则、流量存储。
- [ ] 暴露 `proxy_status` 命令。
- [ ] 暴露带可配置本地端口的 `start_proxy` 命令。
- [ ] 暴露 `stop_proxy` 命令。
- [ ] 暴露 `list_traffic` 命令。
- [ ] 暴露 `clear_traffic` 命令。
- [ ] 暴露 `list_rules`、`save_rule`、`delete_rule`、`toggle_rule` 命令。
- [ ] 抓到新请求时向前端 emit traffic event。
- [ ] 在可行范围内添加 Rust 测试覆盖命令级状态转换。
- [ ] 运行 `cargo test --workspace`。
- [ ] 运行 `cargo check --workspace`。
- [ ] 提交：`feat: expose proxy commands`。

验收标准：

- 代理可以通过 Tauri 命令启动和停止。
- 前端可以获取流量条目。
- 规则命令能安全修改后端状态。

## 里程碑 8：流量 UI

- [ ] 创建 `apps/desktop/src/lib/proxyApi.ts`，包含类型化 Tauri client 函数。
- [ ] 创建 `apps/desktop/src/features/traffic/TrafficView.tsx`。
- [ ] 创建 `apps/desktop/src/features/traffic/ProxyControls.tsx`。
- [ ] 创建 `apps/desktop/src/features/traffic/TrafficTable.tsx`。
- [ ] 创建 `apps/desktop/src/features/traffic/TrafficDetail.tsx`。
- [ ] 添加空流量状态渲染测试。
- [ ] 添加测试覆盖选中一行流量并展示详情。
- [ ] 添加启动/停止代理按钮。
- [ ] 添加清空流量按钮。
- [ ] 添加按 host、method、URL 搜索/过滤。
- [ ] 订阅后端 traffic event。
- [ ] 将流量页面接入 `App.tsx`。
- [ ] 运行 `pnpm --filter desktop test`。
- [ ] 运行 `pnpm build`。
- [ ] 手动运行应用，配置浏览器代理，验证请求行出现。
- [ ] 提交：`feat: add traffic capture UI`。

验收标准：

- 用户可以从 UI 启动和停止本地代理。
- 浏览器手动走代理后，请求行会出现。
- 选中请求行后能展示请求头和元数据。
- 清空操作会删除当前内存流量。

## 里程碑 9：请求头规则 UI

- [ ] 创建 `apps/desktop/src/lib/rulesApi.ts`。
- [ ] 创建 `apps/desktop/src/features/rules/RulesView.tsx`。
- [ ] 创建 `apps/desktop/src/features/rules/RuleEditor.tsx`。
- [ ] 创建 `apps/desktop/src/features/rules/RuleList.tsx`。
- [ ] 添加测试覆盖创建规则草稿。
- [ ] 添加测试覆盖校验：规则名非空、matcher 存在、请求头名非空。
- [ ] 添加测试覆盖启用和禁用规则。
- [ ] 实现创建、编辑、删除、启用/禁用交互。
- [ ] 在流量详情中显示命中的规则名或 id。
- [ ] 运行 `pnpm --filter desktop test`。
- [ ] 运行 `pnpm build`。
- [ ] 手动验证某条规则会修改经过代理的 HTTP 请求。
- [ ] 提交：`feat: add header rewrite rules UI`。

验收标准：

- 用户可以创建、编辑、删除、启用、禁用规则。
- 无效规则不能保存。
- 匹配且启用的规则会影响代理 HTTP 请求。
- 流量日志能识别命中的规则。

## 里程碑 10：设置与持久化

- [ ] 使用 Tauri app data directory 作为持久化位置。
- [ ] 添加代理端口后端持久化。
- [ ] 添加改写规则后端持久化。
- [ ] 添加流量保留上限后端持久化。
- [ ] 创建 `apps/desktop/src/features/settings/SettingsView.tsx`。
- [ ] 添加代理端口输入和校验。
- [ ] 添加流量保留设置。
- [ ] 添加隐私默认行为说明。
- [ ] 添加设置表单校验测试。
- [ ] 将设置页面接入 `App.tsx`。
- [ ] 运行 `pnpm --filter desktop test`。
- [ ] 运行 `cargo test --workspace`。
- [ ] 手动重启应用，验证设置和规则能重新加载。
- [ ] 提交：`feat: persist settings and rules`。

验收标准：

- 规则在应用重启后仍存在。
- 代理端口在应用重启后仍存在。
- 无效端口不能保存。
- 流量历史仍然只存在内存中。

## 里程碑 11：安全与引导文档

- [ ] 创建 `docs/security/local-proxy.md`。
- [ ] 文档说明代理默认捕获什么。
- [ ] 文档说明 MVP 不捕获什么。
- [ ] 文档说明 HTTPS `CONNECT` 元数据行为。
- [ ] 文档说明 HTTPS 请求体解密尚未实现。
- [ ] 文档说明请求头改写只影响经过本地代理的流量。
- [ ] 创建首次运行 UI 文案，解释如何手动配置代理。
- [ ] 在流量 UI 中添加指向代理说明的链接或帮助面板。
- [ ] 提交：`docs: document proxy privacy model`。

验收标准：

- 用户能理解如何手动配置浏览器代理。
- 用户在启用抓包前能理解隐私边界。
- UI 文案不会暗示系统级全局拦截。

## 里程碑 12：本地构建和冒烟 QA

- [ ] 运行 `pnpm test`。
- [ ] 运行 `cargo test --workspace`。
- [ ] 运行 `pnpm build`。
- [ ] 运行 `cargo check --workspace`。
- [ ] 运行 Tauri dev app。
- [ ] 冒烟测试仪表盘。
- [ ] 冒烟测试代理启动/停止。
- [ ] 冒烟测试普通 HTTP 请求捕获。
- [ ] 冒烟测试 HTTPS `CONNECT` 元数据记录。
- [ ] 冒烟测试请求头添加规则。
- [ ] 冒烟测试请求头替换规则。
- [ ] 冒烟测试请求头删除规则。
- [ ] 冒烟测试应用重启后的设置持久化。
- [ ] 修复冒烟 QA 发现的阻塞问题。
- [ ] 使用聚焦的 commit message 提交修复。

验收标准：

- 所有自动化检查通过。
- 手动冒烟测试路径验证 MVP 声明成立。
- 剩余限制已记录在文档中。

## MVP 后续待办

- [ ] 评估 HTTPS 拦截设计，包括显式 CA 生成和信任库流程。
- [ ] 评估 Chrome 扩展，用于浏览器原生请求头修改。
- [ ] 评估 Safari Web Extension 打包和 Apple 签名要求。
- [ ] 评估系统代理切换作为 opt-in helper。
- [ ] 评估 Network Extension 透明代理模式。
- [ ] 添加流量导出。
- [ ] 添加带脱敏和保留控制的持久化流量历史。
- [ ] 添加菜单栏状态项。
- [ ] 添加应用图标、签名、公证、发布打包。

## 执行顺序

1. 里程碑 0：Workspace 基础。
2. 里程碑 1：Tauri React 桌面壳。
3. 里程碑 2：应用导航和基础 UI。
4. 里程碑 3：本机信息后端。
5. 里程碑 4：本机信息仪表盘。
6. 里程碑 5：代理领域模型和改写引擎。
7. 里程碑 6：代理服务 MVP。
8. 里程碑 7：代理 Tauri Commands 和事件。
9. 里程碑 8：流量 UI。
10. 里程碑 9：请求头规则 UI。
11. 里程碑 10：设置与持久化。
12. 里程碑 11：安全与引导文档。
13. 里程碑 12：本地构建和冒烟 QA。

## 验证命令

在声明 MVP 完成前运行：

```bash
pnpm test
cargo test --workspace
pnpm build
cargo check --workspace
```

手动验证还必须覆盖：

- 仪表盘显示当前系统信息。
- 浏览器手动配置代理后，能生成流量日志条目。
- 请求头改写规则会影响匹配的代理 HTTP 请求。
- 除非后续显式加入 HTTPS 功能，否则 HTTPS 请求只记录 tunnel 元数据。
- 设置和规则在重启后能重新加载。
