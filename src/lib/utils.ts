import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PlaylistData, Track, TrackMetadata } from "../types";
import { QUEUE_PLAYLIST_NAME } from "./constants";
import { invoke } from "@tauri-apps/api/core";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createQueuePlaylist(): PlaylistData {
  return {
    name: QUEUE_PLAYLIST_NAME,
    tracks: [],
    loaded: true,
    track_count: 0,
  }
}

/** Open the containing folder of a file/directory path in the system file manager */
export async function openContainerFolder(filePath: string): Promise<void> {
  // Strip trailing separator, then extract parent directory
  const normalized = filePath.replace(/[/\\]$/, '');
  const lastSep = Math.max(normalized.lastIndexOf('/'), normalized.lastIndexOf('\\'));
  const dirPath = lastSep > 0 ? normalized.substring(0, lastSep) : normalized;
  await invoke("open_in_explorer", { path: dirPath });
}

/** Load all audio files from a directory and return track list */
export async function loadTracksFromDir(dirPath: string): Promise<Track[]> {
  try {
    const files: string[] = await invoke("get_audio_files", { path: dirPath });
    if (files.length === 0) return [];
    const metadata: TrackMetadata[] = await invoke("get_metadata_batch", { paths: files });
    return metadata.map((m) => ({
      path: m.path,
      title: m.title ?? "",
      artist: m.artist ?? "",
      album: m.album ?? "",
      duration: m.duration,
      invalid: false,
    }));
  } catch (err) {
    console.error("Failed to load directory:", err);
    return [];
  }
};