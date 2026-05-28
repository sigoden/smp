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
- **Customizable columns** — Choose which columns to show in the track table.
- **Settings persistence** — Volume, play mode, window layout, and active playlist are saved across sessions.
- **System tray** — Minimize to tray, control playback from the tray menu, and surface the window with a click.
- **Loading indicators** — Visual feedback during async directory scans and playlist operations.
- **Lazy-loaded playlists** — Playlist metadata loads instantly; track data loads on demand.

---

## Getting Started

See [CONTRIBUTING.md](CONTRIBUTING.md) for prerequisites, setup, and development instructions.

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

---

## License

Distributed under the MIT License. See `LICENSE` for more information.
