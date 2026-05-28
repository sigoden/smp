# Contributing to smp

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/) (latest stable)
- System dependencies for [Tauri 2](https://v2.tauri.app/start/prerequisites/)

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Desktop shell | [Tauri 2](https://v2.tauri.app/) (Rust) | Native window, system tray, file system access |
| Frontend | [React 19](https://react.dev/) + TypeScript | UI components and state |
| Build tool | [Vite 8](https://vite.dev/) | Fast HMR and bundling |
| Styling | [Tailwind CSS 4](https://tailwindcss.com/) | Utility-first CSS via `@tailwindcss/vite` |
| UI primitives | [Radix UI](https://www.radix-ui.com/) | Accessible dialog, menu, slider, tabs, tooltip |
| State management | [Zustand 5](https://github.com/pmndrs/zustand) | Lightweight reactive store |
| Icons | [lucide-react](https://lucide.dev/) | Consistent icon set |
| Audio metadata | [`lofty`](https://crates.io/crates/lofty) 0.24 (Rust) | Read/write audio tags |
| Parallel iteration | [`rayon`](https://crates.io/crates/rayon) 1.10 (Rust) | Parallel batch metadata reads |
| File scanning | [`walkdir`](https://crates.io/crates/walkdir) (Rust) | Recursive directory traversal |
| Logging | [`tauri-plugin-log`](https://v2.tauri.app/plugin/log/) (Rust) | Backend log to file/stdout, filtered to `app_lib` crate |
| Single instance | [`tauri-plugin-single-instance`](https://v2.tauri.app/plugin/single-instance/) | Prevent multiple app instances |
| Plugin dialogs | [`tauri-plugin-dialog`](https://v2.tauri.app/plugin/dialog/) | Native file picker |

## Project Structure

```
smp/
├── src-tauri/                # Rust backend
│   ├── Cargo.toml            # Rust dependencies and config
│   ├── tauri.conf.json       # Window config, permissions, build settings
│   ├── capabilities/         # Permission grants
│   └── src/
│       ├── main.rs           # Entry point
│       ├── lib.rs            # App builder, plugins, tray icon, command registration
│       ├── commands.rs       # All #[tauri::command] handlers
│       ├── logger.rs         # Log level config, file logging, command error logging
│       ├── scanner.rs        # Directory scan and audio file filtering
│       ├── metadata.rs       # Audio tag reading/writing via `lofty`
│       ├── playlist.rs       # M3U8 playlist CRUD in app data dir
│       └── settings.rs       # JSON settings persistence
├── src/                      # React frontend
│   ├── App.tsx               # Root layout, audio setup, settings auto-save
│   ├── main.tsx              # React entry point
│   ├── types/index.ts        # Shared TypeScript types
│   ├── lib/
│   │   ├── audio.ts          # HTML audio element wrapper
│   │   ├── constants.ts      # Column definitions, queue name constant
│   │   ├── logger.ts         # Console + frontend→Rust log relay
│   │   └── utils.ts          # cn() helper, IPC wrappers, track helpers
│   ├── stores/               # Zustand stores (player, library, playlist, UI)
│   └── components/           # React components
│       ├── ui/               # shadcn-style primitives
│       ├── Sidebar/          # Directory tree and playlist panels
│       ├── TrackList/        # Track table, context menu, tag editor
│       └── Player/           # Player bar, controls, progress, volume
└── package.json              # Scripts and dependencies
```

## Conventions

- **State**: All shared state lives in Zustand stores. Component-local state only for UI (dialog open/close, loading spinners).
- **Audio**: Single `<audio>` element managed by `audio.ts`. All interaction through `playerStore`.
- **Styling**: Tailwind utility classes. `cn()` for conditional merging. CSS variables in `index.css` for theming.
- **Error handling**: Rust commands return `Result<T, String>`. Frontend catches and logs errors.
- **No network**: No fetch/XHR at runtime. All data comes from local filesystem via Tauri IPC.
- **Playlist format**: M3U8 playlists stored in app data directory. Queue is a special playlist named `PLAYING`.
- **TypeScript**: Strict mode. `noUnusedLocals`, `noUnusedParameters` enabled. Use `verbatimModuleSyntax`.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
