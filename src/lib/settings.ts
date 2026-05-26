import { invoke } from "@tauri-apps/api/core";
import { ALL_TRACK_COLUMNS, QUEUE_PLAYLIST } from "./constants";

/** Mirrors the Rust AppSettings struct */
export interface AppSettings {
  root_dirs: string[];
  expanded_paths: string[];
  volume: number;
  play_mode: string;
  visible_columns: string[];
  sidebar_tab: string;
  active_playlist_id: string;
  sidebar_width: number;
  track_index: number;
}

/** Load app settings from disk, returns defaults if no saved settings exist */
export async function loadSettings(): Promise<AppSettings> {
  try {
    return await invoke<AppSettings>("load_app_settings");
  } catch (err) {
    console.error("Failed to load settings:", err);
    return {
      root_dirs: [],
      expanded_paths: [],
      volume: 0.8,
      play_mode: "sequential",
      visible_columns: ALL_TRACK_COLUMNS,
      sidebar_tab: "tree",
      active_playlist_id: QUEUE_PLAYLIST.id,
      sidebar_width: 256,
      track_index: -1,
    };
  }
}

/** Save app settings to disk */
export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await invoke("save_app_settings", { settings });
  } catch (err) {
    console.error("Failed to save settings:", err);
  }
}
