<div align="center">
  <img src="./frontend/src/assets/logo.png" alt="SY MCSManager" width="480px" />

  # SY MCSManager

  ### Shen Zhi Yi Studio · Enhanced Edition

  Forked from MCSManager v10 with email registration, redeem codes, plan management, and modern SaaS UI.

  ---

  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](LICENSE)
  [![Node](https://img.shields.io/badge/Node-%E2%89%A516.20.2-blue.svg)](https://nodejs.org/)
  [![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20Mac-lightgrey.svg)]()
  [![Repo](https://img.shields.io/badge/Gitee-divine--wings--studio/symcsmanager-C71D23.svg)](https://gitee.com/divine-wings-studio/symcsmanager)

</div>

<br />

## About

**SY MCSManager** is a fork of [MCSManager](https://github.com/MCSManager/MCSManager) enhanced by **Shen Zhi Yi Studio** for commercial game server hosting.

It retains all upstream capabilities — one-click deployment of **Minecraft**, **Terraria**, **Palworld**, and other **Steam-based game servers** via Docker — and adds production-ready features for paid hosting businesses.

### What's New

| Feature | Description |
|---------|-------------|
| 📧 **Email Registration** | Users sign up with email + password + verification code. SMTP configurable by admin. |
| 🎫 **Redeem Codes** | Generate one-time codes with configurable duration and usage limits. Users redeem to get instances instantly. |
| 📦 **Plan Management** | Reusable instance templates (Docker image, RAM, CPU, ports, env vars). Select a plan when creating codes. |
| 🎨 **Brand Customization** | Favicon, logo, site title, background image — all configurable from the settings panel. |
| ✨ **Modern SaaS UI** | Clean, low-saturation, rounded-corner interface. Full Chinese localization. |

All features are documented in [FEATURES.md](./FEATURES.md).

<br />

## Quick Start

### Prerequisites
- **Node.js** 16.20.2 or later (LTS recommended)
- **Docker** (for container-based game servers)

### Windows

Download and extract the release archive, then run:

```bash
cd panel && npm install && npm run build
cd ../daemon && npm install && npm run build
cd ../frontend && npm install && npm run build-only

# Start daemon
cd daemon && node production/app.js

# Start panel (in another terminal)
cd panel && node production/app.js

# Open http://127.0.0.1:23333
```

### Linux

```bash
# Install dependencies
sudo apt install -y nodejs npm  # or use nvm

# Clone and build
git clone https://gitee.com/divine-wings-studio/symcsmanager.git
cd symcsmanager
npm install

# Build frontend
cd frontend && npm run build-only

# Build backend
cd ../panel && npm run build
cd ../daemon && npm run build

# Start
cd ../daemon && node production/app.js &
cd ../panel && node production/app.js &

# Open http://<your-ip>:23333
```

### Docker

```yaml
services:
  panel:
    image: githubyumao/mcsmanager-web:latest
    ports: ["23333:23333"]
    volumes:
      - ./panel/data:/opt/mcsmanager/web/data
      - ./panel/logs:/opt/mcsmanager/web/logs

  daemon:
    image: githubyumao/mcsmanager-daemon:latest
    ports: ["24444:24444"]
    volumes:
      - ./daemon/data:/opt/mcsmanager/daemon/data
      - /var/run/docker.sock:/var/run/docker.sock
```

<br />

## Project Structure

```
symcsmanager/
├── panel/          # Web backend (Koa + TypeScript)
│   └── src/app/    # Routes, services, entities
├── daemon/         # Daemon (instance management)
│   └── src/        # Process, Docker, file management
├── frontend/       # Web UI (Vue 3 + Ant Design Vue)
│   └── src/        # Components, views, stores
└── common/         # Shared utilities
```

<br />

## Credits

- **Upstream**: [MCSManager](https://github.com/MCSManager/MCSManager) by MCSManager Team
- **Enhanced by**: [Shen Zhi Yi Studio](https://gitee.com/divine-wings-studio)
- **License**: [Apache 2.0](LICENSE)
