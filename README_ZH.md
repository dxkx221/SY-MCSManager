<div align="center">
  <img src="./frontend/src/assets/logo.png" alt="SY MCSManager" width="480px" />

  # SY MCSManager

  ### 神之翼工作室 · 二次开发增强版

  基于 MCSManager v10 深度定制，新增邮箱注册、兑换码、套餐管理、品牌定制，专为商用游戏服务器托管设计。

  ---

  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
  [![Node](https://img.shields.io/badge/Node-%E2%89%A516.20.2-blue.svg)](https://nodejs.org/)
  [![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20Mac-lightgrey.svg)]()
  [![Repo](https://img.shields.io/badge/Gitee-divine--wings--studio/symcsmanager-C71D23.svg)](https://gitee.com/divine-wings-studio/symcsmanager)

</div>

<br />

## 关于本项目

**SY MCSManager** 是**神之翼工作室**基于 [MCSManager](https://github.com/MCSManager/MCSManager) 二次开发的增强版本，专注于商用游戏服务器托管场景。

继承上游全部能力——**Minecraft**、**泰拉瑞亚**、**幻兽帕鲁**等 Steam 游戏的 Docker 一键部署，并在此基础上增加了实际商用所需的运营功能。

### 新增功能

| 功能 | 说明 |
|------|------|
| 📧 **邮箱注册** | 用户通过邮箱 + 密码 + 验证码注册，管理员配置 SMTP 即可启用 |
| 🎫 **兑换码** | 管理员生成有时长和使用次数限制的兑换码，用户兑换后自动开通实例 |
| 📦 **套餐管理** | 可复用实例模板：Docker 镜像、内存、CPU、端口、环境变量等 |
| 🎨 **品牌定制** | 网站标题、Favicon、Logo、背景图均可在后台上传配置 |
| ✨ **现代 SaaS UI** | 克制商务风格，白金配色，全中文界面 |

详见 [FEATURES.md](./FEATURES.md)。

<br />

## 快速开始

### 环境要求
- **Node.js** 16.20.2+
- **Docker**（用于容器化游戏服务器）

### Windows

```bash
# 安装依赖并构建
cd panel && npm install && npm run build
cd ../daemon && npm install && npm run build
cd ../frontend && npm install && npm run build-only

# 启动守护进程
cd daemon && node production/app.js

# 新开终端，启动面板
cd panel && node production/app.js

# 浏览器打开 http://127.0.0.1:23333
```

### Linux

```bash
git clone https://gitee.com/divine-wings-studio/symcsmanager.git
cd symcsmanager && npm install

cd frontend && npm run build-only
cd ../panel && npm run build
cd ../daemon && npm run build

# 启动
cd ../daemon && node production/app.js &
cd ../panel && node production/app.js &
```

### Docker

```yaml
services:
  panel:
    image: githubyumao/mcsmanager-web:latest
    ports: ["23333:23333"]
    volumes:
      - ./panel/data:/opt/mcsmanager/web/data
  daemon:
    image: githubyumao/mcsmanager-daemon:latest
    ports: ["24444:24444"]
    volumes:
      - ./daemon/data:/opt/mcsmanager/daemon/data
      - /var/run/docker.sock:/var/run/docker.sock
```

<br />

## 项目结构

```
symcsmanager/
├── panel/          # Web 后端（Koa + TypeScript）
├── daemon/         # 守护进程（实例管理）
├── frontend/       # Web 前端（Vue 3 + Ant Design Vue）
└── common/         # 公共工具
```

<br />

## 鸣谢

- **上游项目**：[MCSManager](https://github.com/MCSManager/MCSManager)
- **二次开发**：[神之翼工作室](https://gitee.com/divine-wings-studio)
- **许可证**：[Apache 2.0](LICENSE)
