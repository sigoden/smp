# smp — Simple Music Player

A lightweight, local-first music player for your desktop.
Built with Tauri 2 · React 19 · TypeScript

---

**Simple Music Player (smp)** is a no-nonsense music player that plays your local audio files. No accounts, no streaming, no ads — just your music library, organized the way you have it on disk.

---

## Features

- **Local-first** — Plays audio files from your file system. Zero network requests at runtime.
- **Directory tree browser** — Navigate your music folders, double-click to play, right-click for context actions.
- **Playlist management** — Create, rename, delete playlists. M3U8 format for easy portability.
- **Queue system** — Replace or append tracks to the queue from any context.
- **Play modes** — Sequential, Repeat One, and Shuffle (no consecutive repeats).
- **Tag display & editing** — View and edit title, artist, and album metadata.
- **Customizable columns** — Choose which columns to show in the track table.
- **Settings persistence** — Volume, play mode, window layout, and active playlist are saved across sessions.
- **System tray** — Minimize to tray, control playback from the tray menu, and surface the window with a click.
- **Loading indicators** — Visual feedback during async directory scans and playlist operations.
- **Lazy-loaded playlists** — Playlist metadata loads instantly; track data loads on demand.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/) (latest stable)
- System dependencies for [Tauri 2](https://v2.tauri.app/start/prerequisites/)

### Install & Run

```bash
git clone https://github.com/sigoden/smp.git
cd smp
npm install
npm run tauri:dev
```

Starts Vite dev server on `http://localhost:1420` with hot-reload for both frontend and Rust backend.

### Build Production

```bash
npm run tauri:build
```

Produces an installer in `src-tauri/target/release/bundle/`.

---

## Usage

### Adding Music

1. Click the **Files** tab in the sidebar.
2. Click **Add Folder** to select a directory containing your audio files.
3. The directory tree populates with your folders and audio files.

### Playing Tracks

| Action | How |
|--------|-----|
| Play a single track | **Double-click** on any track in the tree or track table |
| Play all tracks in a folder | Right-click a folder → **Replace Queue** |
| Add tracks without interrupting playback | Right-click → **Add to Queue** |
| Control playback | Use the **player bar** at the bottom or the **system tray** icon |

### Playlists

| Action | How |
|--------|-----|
| Create a playlist | Switch to the **Playlists** tab → **New Playlist** |
| Add tracks to a playlist | Right-click a track → **Add to Playlist** |
| Play a playlist | **Double-click** the playlist name |
| Delete / Rename | Right-click the playlist → context menu |
| Open playlists folder | Right-click the playlist panel → **Open Playlists Folder** |

### Tag Editing

Right-click any track → **Edit Tags** to modify title, artist, or album metadata.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop shell | [Tauri 2](https://v2.tauri.app/) (Rust) | Native window, system tray, file system access |
| Frontend | [React 19](https://react.dev/) + TypeScript | UI components and state |
| Build tool | [Vite 6](https://vite.dev/) | Fast HMR and bundling |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS via `@tailwindcss/vite` |
| UI primitives | [Radix UI](https://www.radix-ui.com/) | Accessible dialog, menu, slider, tabs, tooltip |
| State management | [Zustand 5](https://github.com/pmndrs/zustand) | Lightweight reactive store |
| Icons | [lucide-react](https://lucide.dev/) | Consistent icon set |
| Audio metadata | [`lofty`](https://crates.io/crates/lofty) (Rust) | Read/write ID3 tags |
| File scanning | [`walkdir`](https://crates.io/crates/walkdir) (Rust) | Recursive directory traversal |
| Plugin dialogs | [`tauri-plugin-dialog`](https://v2.tauri.app/plugin/dialog/) | Native file picker |

---

## Project Structure

```
smp/
├── src-tauri/                # Rust backend
│   ├── src/
│   │   ├── commands.rs       # Tauri IPC command handlers
│   │   ├── scanner.rs        # Directory scan and audio file filtering
│   │   ├── metadata.rs       # Audio tag reading/writing
│   │   ├── playlist.rs       # M3U8 playlist I/O
│   │   └── settings.rs       # JSON settings persistence
│   └── tauri.conf.json       # Window config, permissions, build settings
├── src/                      # React frontend
│   ├── App.tsx               # Root layout, audio setup, settings auto-save
│   ├── types/index.ts        # Shared TypeScript types
│   ├── lib/
│   │   ├── audio.ts          # HTML audio element wrapper
│   │   ├── constants.ts      # Column definitions, queue name constant
│   │   └── utils.ts          # cn() helper, IPC wrappers
│   ├── stores/               # Zustand stores (player, library, playlist, UI)
│   └── components/           # React components
│       ├── ui/               # shadcn-style primitives
│       ├── Sidebar/          # Directory tree and playlist panels
│       ├── TrackList/        # Track table, context menu, tag editor
│       └── Player/           # Player bar, controls, progress, volume
└── package.json              # Scripts and dependencies
```

---

## Development

```bash
# Check types
npx tsc -b --noEmit

# Lint
npm run lint

# Build frontend standalone
npm run build

# Build Rust backend standalone
cd src-tauri && cargo build
```

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
