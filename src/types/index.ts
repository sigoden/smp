/** Mirrors the Rust FsEntry enum */
export type FsEntry =
  | { type: "dir"; name: string; path: string; children: FsEntry[] }
  | { type: "file"; name: string; path: string };

/** Track metadata from Rust backend */
export interface TrackMetadata {
  path: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  duration: number;
  track_number: number | null;
}

/** A track in the queue/playlist */
export interface Track {
  path: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  invalid: boolean;
}

/** Play mode */
export type PlayMode = "sequential" | "repeat-one" | "shuffle";

/** Sidebar tab */
export type SidebarTab = "tree" | "playlist";

/** Visible columns in the track table */
export type TrackColumn = "artist" | "title" | "album" | "filename" | "duration";

/** Playlist from Rust backend */
export interface PlaylistData {
  name: string;
  tracks: Track[];
  track_count?: number;
  loaded?: boolean;
}

/** Tree node for the file tree (used for UI display) */
export interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isDir: boolean;
}
