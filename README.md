<div align="center">

  # Simple Music Player

  **A local-first music player for desktop.**  
  Plays your audio files. No accounts, no streaming, no ads — just your music.

  <p>
    <a href="https://tauri.app/"><img src="https://img.shields.io/badge/Tauri_2-gray?style=flat-square&logo=tauri&logoColor=white" alt="Tauri 2"></a>
    <a href="https://react.dev/"><img src="https://img.shields.io/badge/React_19-gray?style=flat-square&logo=react&logoColor=white" alt="React 19"></a>
    <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript_6-gray?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 6"></a>
    <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_4-gray?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind 4"></a>
    <a href="https://zustand.docs.pmnd.rs/"><img src="https://img.shields.io/badge/Zustand-gray?style=flat-square&logo=&logoColor=white" alt="Zustand"></a>
    <br>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blueviolet?style=flat-square" alt="License"></a>
    <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/contributions-welcome-brightgreen?style=flat-square" alt="Contributions welcome"></a>
  </p>
</div>

## Overview

SimpleMusicPlayer gives you a clean, lightweight interface for your local music library. Point it at your music folders, browse by directory tree, build playlists automatically, and play — no internet required.

---

## Features

<details open>
<summary><b>🎵 Playback</b></summary>

- Play single tracks, folders, or entire playlists
- **Sequential**, **Repeat One**, and **Shuffle** play modes (shuffle guarantees no consecutive repeats)
- Persistent volume and play mode across sessions
- System tray integration — minimize to tray, control playback from tray menu, surface with a click
- Global tray menu controls: Play/Pause, Next, Previous

</details>

<details open>
<summary><b>📂 Library Management</b></summary>

- **Directory tree browser** — navigate your music folders as they appear on disk
- Add multiple root folders; each is scanned recursively for audio files
- Search within your library with real-time filtering
- Track metadata display: title, artist, album, duration, file name
- Edit tags (title/artist/album) directly from the UI

</details>

<details open>
<summary><b>📋 Playlists</b></summary>

- Create, rename, and delete playlists
- Add tracks to playlists from any context (tree, table, queue)
- **M3U8 format** — portable and compatible with other players
- Lazy-loaded tracks — playlist metadata loads instantly, track data loads on demand
- Queue system — replace or append tracks without interrupting playback
- Save any queue as a new playlist

</details>

<details open>
<summary><b>⚡ Performance & UX</b></summary>

- Fast async directory scanning with parallel metadata reads (via Rust's `rayon`)
- Loading indicators for long-running operations
- Configurable columns in the track table
- Resizable sidebar
- State persistence — window layout, volume, play mode, active playlist all restored on restart

</details>

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup and contributing guidelines.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
