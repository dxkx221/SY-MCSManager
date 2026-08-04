

# SY MCSManager

神之翼工作室 · 二次开发增强版

## 关于本项目

**SY MCSManager** 是由**神之翼工作室**基于 [MCSManager](https://github.com/MCSManager/MCSManager) v10 分支开发的商业级游戏服务端管理系统。

在保留上游所有功能的基础上（支持 Minecraft、Terraria、Palworld 等游戏服务器的一键部署），我们为商业付费主机业务场景增加了多项实用功能。

## 新增功能

| 功能 | 描述 |
|------|------|
| 📧 **邮箱注册** | 用户可通过邮箱+密码+验证码的方式注册，管理员可在后台配置 SMTP 信息 |
| 🎫 **兑换码系统** | 支持生成一次性兑换码，可配置时长、使用次数和关联套餐，用户兑换后直接获得实例 |
| 📦 **套餐管理** | 可复用的实例模板（Docker 镜像、内存、CPU、端口、环境变量等），生成兑换码时选择对应套餐 |
| 🎨 **品牌定制** | 支持自定义网站图标 Logo、站点标题、背景图片等，可在设置面板中一键配置 |
| ✨ **现代化 SaaS UI** | 低饱和度、圆角设计的清洁界面，支持完整的简体中文/English 切换 |

详细功能说明请参阅 [FEATURES.md](./FEATURES.md)。

## 快速开始

### 环境要求

- **Node.js** 16.20.2 或更高版本（建议使用 LTS 版本）
- **Docker**（用于容器化游戏服务器）

### Windows

1. 下载并解压 release 压缩包
2. 安装依赖并构建：

```bash
cd panel && npm install && npm run build
cd ../daemon && npm install && npm run build
cd ../frontend && npm install && npm run build-only
```

3. 启动服务（需要两个终端窗口）：

```bash
# 终端 1：启动守护进程
cd daemon && node production/app.js

# 终端 2：启动面板
cd panel && node production/app.js
```

4. 浏览器访问 http://127.0.0.1:23333

### Linux/macOS

```bash
# 安装依赖
sudo apt install -y nodejs npm  # 或使用 nvm 管理 Node.js 版本

# 克隆并构建
git clone https://gitee.com/divine-wings-studio/symcsmanager.git
cd symcsmanager

# 安装项目依赖
npm install

# 构建前端
cd frontend && npm run build-only

# 构建后端
cd ../panel && npm run build
cd ../daemon && npm run build

# 启动服务
cd ../daemon && node production/app.js &
cd ../panel && node production/app.js &

# 浏览器访问 http://<你的IP>:23333
```

### Docker 部署

```yaml
version: '3.8'

services:
  panel:
    image: githubyumao/mcsmanager-web:latest
    container_name: mcsmanager-web
    ports:
      - "23333:23333"
    volumes:
      - ./panel/data:/opt/mcsmanager/web/data
      - ./panel/logs:/opt/mcsmanager/web/logs
    restart: unless-stopped

  daemon:
    image: githubyumao/mcsmanager-daemon:latest
    container_name: mcsmanager-daemon
    ports:
      - "24444:24444"
    volumes:
      - ./daemon/data:/opt/mcsmanager/daemon/data
      - /var/run/docker.sock:/var/run/docker.sock
    restart: unless-stopped
```

## 项目结构

```
symcsmanager/
├── panel/           # Web 后端服务 (Koa + TypeScript)
│   └── src/app/     # 路由、服务层、数据实体
├── daemon/          # 守护进程 (进程与 Docker 管理)
│   └── src/         # 实例管理、终端、文件操作
├── frontend/        # Web 前端 (Vue 3 + Ant Design Vue)
│   └── src/         # 组件、视图、状态管理
├── common/          # 共享工具库
└── languages/       # 多语言文件
```

### 核心模块说明

- **panel**：提供 Web API 接口，处理用户认证、业务逻辑、数据存储
- **daemon**：负责游戏服务器的启动、停止、文件管理、Docker 容器操作
- **frontend**：用户界面，提供实例管理、文件管理、计划任务等功能

## 开发指南

### 环境搭建

详细开发环境配置请参考：
- [DEVELOPMENT.md](./DEVELOPMENT.md) （英文）
- [DEVELOPMENT_ZH.md](./DEVELOPMENT_ZH.md) （中文）

### 二进制依赖

部分功能需要下载预编译的二进制文件：
- **PTY**：用于终端模拟，下载地址 [MCSManager/PTY](https://github.com/MCSManager/PTY/releases)
- **Zip-Tools**：用于压缩/解压操作，下载地址 [MCSManager/Zip-Tools](https://github.com/MCSManager/Zip-Tools/releases)

### 国际化

支持多语言扩展，开发时请使用 `$t('key')` 进行字符串标记：

```typescript
// i18n 标记示例
$t('instanceManagement.terminalTip')
```

语言文件位于 `languages/` 目录下。

## 鸣谢

- **上游项目**：[MCSManager](https://github.com/MCSManager/MCSManager) by MCSManager Team
- **二次开发**：[神之翼工作室](https://gitee.com/divine-wings-studio)
- **许可证**：[Apache 2.0](LICENSE)

---

Copyright © 神之翼工作室 · All Rights Reserved