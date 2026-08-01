# dyo-term

A configurable, widget-driven sci-fi terminal for macOS (Apple Silicon).

Unlimited tabs, iTerm-style split panes, a drag-and-resize widget dashboard you
can edit like an iOS home screen, a theme gallery, and English/Russian language
packs — all in a Stark-inspired heads-up aesthetic.

Built from scratch, MIT-licensed. Reuses only permissively-licensed libraries;
no GPL code.

![dyo-term](docs/screenshot.png)

## Features

- **Terminal** — native pty (node-pty) streamed to xterm.js over IPC. No local
  socket or server: the shell is never exposed on the network.
  - Unlimited tabs (`⌘T`, `⌘1`–`⌘9`)
  - Split panes, iTerm-style: `⌘D` vertical, `⌘⇧D` horizontal, drag to resize
  - Find in buffer with regex (`⌘F`)
- **Widget dashboard** — a Gridstack canvas you can rearrange, resize, add to and
  remove from in edit mode (`⌘E`). Layout persists.
  - Clock, System (CPU/RAM/load/uptime), Network (live traffic sparkline),
    Apple Music (control Music.app), Notes (autosaved scratchpad)
- **Themes** — Stark, Nebula, Voltage, Graphite. Gallery at `⌘K`; drop your own
  JSON into the app's `themes/` folder.
- **Languages** — English (default) and Русский, switchable from the top-bar menu.

## Security model

The renderer runs with `contextIsolation` on and `nodeIntegration` off. Every
privileged operation (pty, system info, filesystem, window control) goes through
a small typed bridge in `preload.js`. There is no WebSocket/pty server — pty I/O
is streamed over Electron IPC only.

## Requirements

- Apple Silicon Mac, macOS 12+
- Node.js ≥ 20 and Xcode Command Line Tools (to build `node-pty`)

## Develop

```bash
npm install
npm start
```

## Package

```bash
npm run build      # dist/dyo-term-macOS-arm64.dmg + .zip
```

## Keyboard shortcuts

| Action | Shortcut |
|---|---|
| New tab | `⌘T` |
| Jump to tab | `⌘1`–`⌘9` |
| Split vertical / horizontal | `⌘D` / `⌘⇧D` |
| Close pane | `⌘W` |
| Find | `⌘F` |
| Edit widgets | `⌘E` |
| Theme gallery | `⌘K` |
| Fullscreen | `⌘↵` |

## Configuration

App data lives in `~/Library/Application Support/dyo-term/`
(`settings.json`, `notes.txt`, `themes/`). Set `DYOTERM_USER_DATA=/some/dir` for
a portable data directory.

## License

MIT © lantis. Bundled fonts (JetBrains Mono, Fira Code) are under the SIL Open
Font License 1.1. Third-party libraries retain their own permissive licenses.
