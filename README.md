<div align="center">
  <img src="./frontend/src/assets/logo.png" alt="SY MCSManager" width="420" />

# SY MCSManager v2.0.0

**神之翼工作室 · MCSManager 二次开发增强版**

基于 MCSManager v10 深度定制，面向游戏服务器托管、实例交付和日常运维场景。

[![Version](https://img.shields.io/badge/version-v2.0.0-ec4899.svg)](https://gitee.com/divine-wings-studio/symcsmanager/releases)
[![License](https://img.shields.io/badge/license-Apache--2.0-green.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node.js-%3E%3D16.20.2-43853d.svg)](https://nodejs.org/)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux-blue.svg)]()

</div>

---

## 项目说明

**SY MCSManager** 是神之翼工作室基于开源项目 [MCSManager](https://github.com/MCSManager/MCSManager) 开发的增强版本。

本仓库发布的是 **v2.0.0 不含用户中心版**：保留 MCSManager 的节点、实例、终端、文件、计划任务和 Docker 管理能力，并加入邮箱注册、兑换码、套餐管理、公告、全局搜索、移动端快捷操作以及全新的双主题毛玻璃界面。

> 本版本不包含独立用户中心页面、用户中心 API、用户中心卡片及默认布局注册。如需用户中心，请使用单独的含用户中心发行包。

## v2.0.0 主要更新

### 全新双主题界面

- 浅色：夕阳日系背景、樱花粉交互色、低透明毛玻璃卡片。
- 深色：夜樱背景、低饱和薰衣草紫交互色、冷灰白正文。
- 本地化背景资源，不依赖随机背景接口。
- 卡片、表格、表单、分页、弹窗、抽屉、下拉菜单和通知统一使用语义主题变量。
- 加载页同步适配深浅主题，不再使用旧金色加载界面。
- 终端保持独立纯黑，不应用背景图和毛玻璃；使用兼容性更高的 Canvas 渲染路径。

### 公告中心

- 管理员可在设置中发布、编辑、启用、停用和删除公告。
- 登录用户可查看历史公告。
- 有效未读公告会在登录后弹出。
- 已读状态由服务端持久化，支持跨设备同步。
- 公告按纯文本渲染，避免将公告内容作为 HTML 注入页面。

### 全局搜索

- 管理员可搜索权限范围内的页面、节点、实例和用户。
- 普通用户仅能搜索本人实例和有权访问的页面。
- 支持搜索结果直接跳转。
- 后端仍对实例归属和操作权限进行校验，不依赖前端隐藏实现权限控制。

### 移动端增强

- 适配约 320–480px 常见手机宽度、横屏和全面屏安全区。
- 新增可识别文字的移动端导航面板。
- 弹窗、抽屉、表格和设置页针对窄屏优化。
- 本人实例支持快速进入终端、启动、停止和重启。
- 快捷操作仅使用当前账号被分配实例，并保留确认、状态判断和 EULA 流程。

### 商业运营功能

- 邮箱注册、验证码和 SMTP 配置。
- 兑换码生成、使用次数、有效期和实例交付。
- 套餐模板：Docker 镜像、内存、CPU、端口、环境变量等。
- 自定义站点标题、Logo、Favicon 和背景资源。
- 实例、节点、用户及操作日志管理。

详细功能可参阅 [FEATURES.md](./FEATURES.md)。

## 技术栈

- **Frontend**：Vue 3、TypeScript、Vite、Ant Design Vue、xterm.js
- **Panel**：Node.js、Koa、TypeScript、Webpack
- **Daemon**：Node.js、TypeScript、Docker、PTY
- **Storage**：文件存储或 Redis（按 MCSManager 配置）

## 环境要求

- Node.js `>= 16.20.2`，建议使用当前 LTS 版本
- npm
- Docker（使用容器实例时需要）
- Linux 或 Windows
- PTY、Zip-Tools 等二进制依赖按 MCSManager 官方方式安装

## 获取源码

```bash
git clone https://gitee.com/divine-wings-studio/symcsmanager.git
cd symcsmanager
git checkout v2.0.0
```

## 安装依赖与构建

### 一次性安装依赖

```bash
npm run install-dependents
```

也可以分别安装：

```bash
cd common && npm install
cd ../daemon && npm install
cd ../panel && npm install
cd ../frontend && npm install
```

### 构建前端

```bash
cd frontend
npm run build-only
```

将生成的 `frontend/dist/` 内容部署至 Panel 的静态目录时，请确保旧静态资源得到备份。

### 构建 Panel

```bash
cd panel
npm run build
```

产物位于：

```text
panel/production/app.js
panel/production/app.js.map
```

### 构建 Daemon

```bash
cd daemon
npm run build
```

产物位于：

```text
daemon/production/app.js
```

## 开发运行

在项目根目录安装依赖后：

```bash
npm run dev
```

也可以分别运行：

```bash
npm run frontend
npm run panel
npm run daemon
```

默认端口：

- Panel：`23333`
- Daemon：`24444`

浏览器访问：

```text
http://127.0.0.1:23333
```

## 生产部署提醒

升级已有环境前，请先备份：

- Panel 程序和静态目录
- `panel/data/`
- Daemon 的 `data/`
- 配置文件和自定义资源

请勿使用源码包直接覆盖运行数据目录。推荐只更新经过构建的程序文件和前端静态资源，并在切换后检查：

1. Panel、Daemon 服务状态；
2. `23333`、`24444` 端口监听；
3. 节点连接状态；
4. 登录、公告、搜索、实例操作和终端显示；
5. 浏览器强制刷新后的静态资源版本。

## 项目结构

```text
symcsmanager/
├─ common/          # Panel 与 Daemon 共用代码
├─ daemon/          # 节点守护进程、实例与 Docker 管理
├─ frontend/        # Vue 3 管理界面
├─ languages/       # 多语言资源
├─ panel/           # Web 后端、权限、公告和业务服务
├─ prod-scripts/    # 生产环境脚本
└─ scripts/         # 项目辅助脚本
```

## 安全与权限

- 普通用户的实例查询和快捷操作只针对本人被分配的实例。
- 实例终端、启动、停止和重启均由后端再次校验用户 UUID、节点 ID 和实例 UUID。
- 公告管理接口要求管理员权限，查看和已读接口要求登录。
- 公告正文以纯文本方式展示。
- 不要将 `panel/data`、日志、密钥、数据库、`.env` 或服务器备份提交到公开仓库。

安全问题请参阅 [SECURITY.md](./SECURITY.md)。

## 版本说明

当前版本：**v2.0.0**

该标签对应本仓库不含用户中心的正式版本，包含双主题界面、公告中心、全局搜索、移动端实例快捷操作及终端兼容性修复。

## 开源许可与致谢

- 上游项目：[MCSManager](https://github.com/MCSManager/MCSManager)
- 二次开发：[神之翼工作室](https://gitee.com/divine-wings-studio)
- 开源许可证：[Apache License 2.0](LICENSE)

本项目基于上游开源项目进行二次开发。使用、分发和修改时，请遵守 Apache License 2.0 及相关第三方组件许可证。

---

<div align="center">

**SY MCSManager v2.0.0 · 神之翼工作室**

</div>
