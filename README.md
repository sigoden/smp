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

<img width="2400" height="1656" alt="Screenshot" src="https://github.com/user-attachments/assets/451ce432-881a-47dc-8475-ddaa86d0a7cc" />

---

## Features

- **🎵 Playback** — Sequential, Repeat One & Shuffle modes; system tray controls; persistent volume
- **📂 Library** — Directory tree browser; multi-root scanning; real-time search; in-app tag editing
- **📋 Playlists** — M3U8 format; create / rename / delete; lazy-loaded tracks; save queue as playlist
- **🎧 Queue** — Append or replace without interrupting playback; shuffle never repeats same track twice
- **⚡ Performance** — Parallel metadata reads (rayon); resizable sidebar; configurable columns; state persistence
- **🖥️ Cross-platform** — Built with Tauri 2, runs on Windows, macOS, and Linux

## Installation

Download the latest installer for your platform from [Releases](https://github.com/sigoden/smp/releases) — no compilation needed.

## Build from Source

1. Set up the [Tauri 2 prerequisites](https://tauri.app/start/prerequisites/) for your platform
2. Run `npm install` (Node.js 22+ required)
3. Build with `npm run tauri:build`

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed setup and contributing guidelines.

## License

Distributed under the MIT License. See [LICENSE](LICENSE) for more information.
