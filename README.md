# cmux-remote

[日本語](README.ja.md)

Remote terminal viewer for [cmux](https://cmux.dev) — access your cmux workspaces from anywhere via iPhone PWA.

## Overview

cmux-remote is a lightweight bridge that lets you monitor and switch between cmux terminal workspaces from your iPhone. Designed for developers who use AI-assisted coding and primarily need to **watch** terminal output on the go.

```
iPhone PWA (React + xterm.js)
    ↕ WebSocket
Bridge Server (Bun + Hono)
    ↕ Unix Domain Socket
cmux (~/.../cmux.sock)
```

### Key Features

- **Real-time terminal display** via xterm.js with 1-second polling
- **Gesture navigation** — 2-finger swipe up/down to switch workspaces, left/right to switch panes
- **PWA** — install to home screen for a native app experience
- **Lightweight** — ~144KB gzipped client, zero cloud infrastructure required
- **Secure** — deploy behind Tailscale or Cloudflare Tunnel

## Prerequisites

- [cmux](https://cmux.dev) running on your local machine
- [Bun](https://bun.sh) runtime
- Network tunnel for remote access (e.g., [Tailscale](https://tailscale.com), [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/))

## Quick Start

### 1. Build the client

```bash
cd client
bun install
bun run build
```

### 2. Start the bridge server

```bash
cd server
bun install
bun run start
```

The server starts on `http://localhost:3456` by default.

### 3. Access from iPhone

Open `http://<your-host>:3456` in Safari and add to home screen.

## Configuration

| Environment Variable | Default | Description |
|---|---|---|
| `PORT` | `3456` | Bridge server port |
| `CMUX_SOCKET_PATH` | `~/Library/Application Support/cmux/cmux.sock` | cmux Unix socket path |

## Development

```bash
# Terminal 1: Start the server in watch mode
cd server && bun run dev

# Terminal 2: Start the client dev server (with proxy to bridge server)
cd client && bun run dev
```

The Vite dev server proxies `/ws` and `/health` to `localhost:3456`.

### Running Tests

```bash
# Client tests
cd client && bun run test

# Server tests
cd server && bun test
```

## Architecture

### Bridge Server (`server/`)

Built with Bun + Hono. Handles:

- **WebSocket relay** — transparent JSON-RPC proxy between the PWA and cmux Unix socket
- **CLI fallback** — some methods (e.g., `surface.read_text`) use the `cmux` CLI for reliability
- **Static file serving** — serves the built PWA from `client/dist/`
- **Health check** — `GET /health` returns server and cmux socket status

### PWA Client (`client/`)

Built with React 19 + TypeScript + Vite. Components:

| Component | Role |
|---|---|
| `Terminal` | xterm.js terminal renderer |
| `Header` | Workspace name + hamburger menu |
| `Drawer` | Workspace list sidebar (responsive) |
| `StatusBar` | Connection status indicator |

Hooks:

| Hook | Role |
|---|---|
| `useWebSocket` | Connection management with exponential backoff reconnect |
| `useCmux` | cmux JSON-RPC wrapper |
| `useGesture` | Hammer.js 2-finger gesture handling |

## License

[MIT](LICENSE)
