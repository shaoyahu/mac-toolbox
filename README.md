# macOS 工具箱

一个本地运行的 macOS 开发者工具箱，基于 Tauri 2、React、TypeScript 和 Rust 构建。当前功能包括本机信息查看、本地 HTTP 代理抓包、请求头规则管理和应用设置。

## 功能

- 本机信息：查看系统、CPU、内存、磁盘和网络接口信息。
- 本地代理：启动本机 HTTP 代理，查看请求记录。
- 请求头规则：按域名和路径匹配请求，添加、修改或删除请求头。
- 代理设置入口：一键打开 macOS 网络代理设置页面。
- 窗口分辨率：在设置中切换应用主窗口大小。

## 本地运行

安装依赖：

```bash
corepack pnpm install
```

启动桌面应用：

```bash
corepack pnpm tauri dev
```

只启动前端预览：

```bash
corepack pnpm dev
```

前端预览只适合看页面布局。窗口大小调整、macOS 代理设置跳转等能力依赖 Tauri 桌面窗口，不能在普通浏览器预览页中完整验证。

## 验证

运行前端测试：

```bash
corepack pnpm --filter desktop test
```

运行 Rust 检查：

```bash
cargo check --workspace
```

构建前端：

```bash
corepack pnpm build
```

## 项目结构

- `apps/desktop`：Tauri 桌面应用和 React 前端。
- `crates/system-info`：本机信息采集。
- `crates/proxy-core`：本地代理、流量记录和规则处理。
- `docs/security/local-proxy.md`：本地代理的安全边界说明。

## 注意事项

- 当前界面和用户提示以中文为主。
- 代理流量历史只保存在内存中。
- 规则和设置会保存在应用数据目录，用于重启后恢复。
- 本地代理仅绑定本机回环地址，避免暴露到局域网。
