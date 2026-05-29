import type { ALL_TRACK_COLUMNS } from "../lib/constants";

/** A root directory with its tree data and per-root expanded paths (relative, '/' = root itself) */
export interface RootDir {
  path: string;
  tree: FsEntry[];
  expandedPaths: string[];
}

/** Mirrors the Rust FsEntry enum */
export type FsEntry =
  | { type: "dir"; name: string; path: string; children: FsEntry[] }
  | { type: "file"; name: string; path: string };

/** Track metadata from Rust backend */
export interface TrackMetadata {
  title: string | null;
  artist: string | null;
  album: string | null;
  duration_ms: number | null;
  track_number: string | null;
  genre: string | null;
  album_artist: string | null;
  year: number | null;
}

/** A track in the queue/playlist */
export interface Track {
  path: string;
  metadata: TrackMetadata;
  duration_ms: number;
  invalid: boolean;
}

/** Play mode */
export type PlayMode = "sequential" | "repeat-one" | "shuffle";

/** Sidebar tab */
export type SidebarTab = "tree" | "playlist";

/** Visible columns in the track table */
export type TrackColumn = keyof typeof ALL_TRACK_COLUMNS;

/** Playlist from Rust backend */
export interface PlaylistData {
  name: string;
  tracks: Track[];
  track_count?: number;
  loaded?: boolean;
  isDirty?: boolean;
}

/** Mirrors the Rust AppSettings struct */
export interface AppSettings {
  root_dirs: { path: string; expanded_paths: string[] }[];
  enqueued_paths: string[];
  volume: number;
  play_mode: string;
  visible_columns: string[];
  sidebar_tab: string;
  active_playlist_name: string;
  sidebar_width: number;
  track_index: number;
}

/** Tree node for the file tree (used for UI display) */
export interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isDir: boolean;
}
