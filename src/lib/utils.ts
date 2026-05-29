import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { FsEntry, PersistedState, PlaylistData, Track, TrackMetadata } from "../types";
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
    isDirty: false,
  }
}

// ─────────────────────────────────────────────
//  Tauri invoke wrappers — one per Rust command
// ─────────────────────────────────────────────

// ──── Filesystem ────

/** Open a path in the system file manager */
export async function revealInFileManager(path: string): Promise<void> {
  try {
    await invoke("reveal_in_file_manager", { path });
  } catch (err) {
    logger.error(`revealInFileManager failed for path: ${path}`, err);
  }
}

/** Open the playlists directory in the system file manager */
export async function openPlaylist(name: string): Promise<void> {
  try {
    await invoke("open_playlist", { name });
  } catch(err) {
    logger.error(`openPlay failed for playlist: ${name}`, err);
  }
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

// ──── Persisted State ────

/** Load persisted state from disk, returns defaults if no saved state exists */
export async function loadPersistedState(): Promise<PersistedState> {
  try {
    return await invoke<PersistedState>("load_persisted_state");
  } catch (err) {
    logger.warn("loadPersistedState failed, using defaults", err);
    return {
      root_dirs: [],
      enqueued_paths: [],
      volume: 0.8,
      play_mode: "sequential",
      visible_columns: DEFAULT_TRACK_COLUMNS,
      sidebar_tab: "tree",
      sidebar_width: 256,
      active_playlist_name: QUEUE_PLAYLIST_NAME,
      track_index: -1,
    };
  }
}

/** Save persisted state to disk */
export async function savePersistedState(state: PersistedState): Promise<void> {
  try {
    await invoke("save_persisted_state", { state });
  } catch (err) {
    logger.error("savePersistedState failed", err);
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
    logger.error("savePlaylist failed", err);
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

// ─────────────────────────────────────────────
//  Higher-level utilities (use wrappers above)
// ─────────────────────────────────────────────

/** Load all audio files from a directory and return track list */
export async function loadTracksFromDir(dirPath: string): Promise<Track[]> {
  try {
    const files: string[] = await collectAudioFiles(dirPath);
    if (files.length === 0) return [];
    const metadata: TrackMetadata[] = await getMetadataBatch(files);
    return files.map((path, i) => mapMetadataToTrack(path, metadata[i]));
  } catch (err) {
    logger.error("loadTracksFromDir failed", err);
    return [];
  }
};

/** Load a single track's metadata and return a Track object */
export async function getTrack(path: string): Promise<Track> {
  let metadata: TrackMetadata | undefined;
  try {
    metadata = await readMetadata(path);
  } catch (err) {
    logger.error(`Failed to load metadata for '${path}'`, err);
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
      track: null,
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
