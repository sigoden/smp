import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FsEntry, AppSettings, PlaylistData, Track, TrackMetadata } from "../types";
import { DEFAULT_TRACK_COLUMNS, QUEUE_PLAYLIST_NAME } from "./constants";
import { logger } from "./logger";
import { invoke } from "@tauri-apps/api/core";

// ──── Tailwind helpers ────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ──── Playlist helpers ────

export function createQueuePlaylist(): PlaylistData {
  return {
    name: QUEUE_PLAYLIST_NAME,
    tracks: [],
    loaded: true,
    track_count: 0,
  }
}

// ─────────────────────────────────────────────
//  Tauri invoke wrappers — one per Rust command
// ─────────────────────────────────────────────

// ──── Filesystem ────

/** Open a path in the system file manager */
export async function revealInFileManager(path: string): Promise<void> {
  await invoke("reveal_in_file_manager", { path });
}

/** List audio files in a directory */
export async function collectAudioFiles(path: string): Promise<string[]> {
  return await invoke("collect_audio_files", { path });
}

/** Read metadata for a single audio file */
export async function readMetadata(path: string): Promise<TrackMetadata> {
  return await invoke("read_metadata", { path });
}

/** Fetch metadata for multiple audio files */
export async function getMetadataBatch(paths: string[]): Promise<TrackMetadata[]> {
  return await invoke("get_metadata_batch", { paths });
}

/** Scan a directory and return its FS tree */
export async function scanDirectory(path: string): Promise<FsEntry[]> {
  return await invoke("scan_directory", { path });
}

// ──── Settings ────

/** Load app settings from disk, returns defaults if no saved settings exist */
export async function loadSettings(): Promise<AppSettings> {
  try {
    return await invoke<AppSettings>("load_settings");
  } catch (err) {
    logger.warn("utils", "loadSettings failed, using defaults", err);
    return {
      root_dirs: [],
      expanded_paths: [],
      volume: 0.8,
      play_mode: "sequential",
      visible_columns: DEFAULT_TRACK_COLUMNS,
      sidebar_tab: "tree",
      active_playlist_name: QUEUE_PLAYLIST_NAME,
      sidebar_width: 256,
      track_index: -1,
    };
  }
}

/** Save app settings to disk */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await invoke("save_settings", { settings });
  } catch (err) {
    logger.error("utils", "saveSettings failed", err);
  }
}

// ──── Playlists ────

/** Get all playlists from disk */
export async function listPlaylists(): Promise<PlaylistData[]> {
  return await invoke("list_playlists");
}

/** Get tracks for a specific playlist */
export async function loadPlaylistTracks(name: string): Promise<Track[]> {
  return await invoke("load_playlist_tracks", { name });
}

/** Sync a playlist to disk (create or update) */
export async function savePlaylist(playlist: PlaylistData): Promise<void> {
  try {
    await invoke("save_playlist", { playlist });
  } catch (err) {
    logger.error("utils", "savePlaylist failed", err);
    throw err;
  }
}

/** Rename a playlist */
export async function renamePlaylist(oldName: string, newName: string): Promise<void> {
  await invoke("rename_playlist", { oldName, newName });
}

/** Remove a playlist from disk */
export async function deletePlaylist(name: string): Promise<void> {
  await invoke("delete_playlist", { name });
}

/** Open the playlists directory in the system file manager */
export async function openPlaylistsDir(): Promise<void> {
  await invoke("open_playlists_dir");
}

// ─────────────────────────────────────────────
//  Higher-level utilities (use wrappers above)
// ─────────────────────────────────────────────

/** Open the containing folder of a file/directory path in the system file manager */
export async function openContainerFolder(filePath: string): Promise<void> {
  // Strip trailing separator, then extract parent directory
  const normalized = filePath.replace(/[/\\]$/, '');
  const lastSep = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  const dirPath = lastSep > 0 ? normalized.substring(0, lastSep) : normalized;
  await revealInFileManager(dirPath);
}

/** Load all audio files from a directory and return track list */
export async function loadTracksFromDir(dirPath: string): Promise<Track[]> {
  try {
    const files: string[] = await collectAudioFiles(dirPath);
    if (files.length === 0) return [];
    const metadata: TrackMetadata[] = await getMetadataBatch(files);
    return files.map((path, i) => mapMetadataToTrack(path, metadata[i]));
  } catch (err) {
    logger.error("utils", "loadTracksFromDir failed", err);
    return [];
  }
};

/** Load a single track's metadata and return a Track object */
export async function getTrack(path: string): Promise<Track> {
  let metadata: TrackMetadata | undefined;
  try {
    metadata = await readMetadata(path);
  } catch (err) {
    logger.error("utils", `Failed to load metadata for '${path}'`, err);
  }
  return mapMetadataToTrack(path, metadata);
}

/** Map TrackMetadata to Track */
export function mapMetadataToTrack(
  path: string,
  metadata?: TrackMetadata,
): Track {
  return {
    path,
    metadata: metadata ?? {
      title: null,
      artist: null,
      album: null,
      duration_ms: null,
      track_number: null,
      genre: null,
      album_artist: null,
      year: null,
    },
    duration_ms: metadata?.duration_ms ?? 0,
    invalid: !metadata,
  }
}

/** Convenience accessors for Track (flatten metadata fields) */
export function trackTitle(track: Track): string {
  return track.metadata.title ?? getBasenameWithoutExt(track.path);
}
export function trackArtist(track: Track): string {
  return track.metadata.artist ?? "";
}
export function trackAlbum(track: Track): string {
  return track.metadata.album ?? "";
}
export function trackDuration(track: Track): number {
  return track.duration_ms / 1000;
}
export function trackFileBasename(track: Track): string {
  return (track.path || "").split(/[/\\]/).pop() || track.path;
}

export function getBasenameWithoutExt(path: string) {
    if (typeof path !== "string" || path.length === 0) {
        return "";
    }
    const basenameWithExt = path.replace(/[\\/]+/g, "/").split("/").pop() || path;
    const lastDotIndex = basenameWithExt.lastIndexOf(".");
    if (lastDotIndex <= 0) {
        return basenameWithExt;
    }
    return basenameWithExt.substring(0, lastDotIndex);
}

/** Format seconds to m:ss, with configurable placeholder for empty/zero */
export function formatTrackDuration(seconds: number, placeholder = "--:--"): string {
  if (!seconds || seconds <= 0) return placeholder;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
