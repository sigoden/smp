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
}

/** Play mode */
export type PlayMode = "sequential" | "repeat-one" | "shuffle";

/** Sidebar tab */
export type SidebarTab = "tree" | "playlist";

/** Visible columns in the track table */
export type TrackColumn = "artist" | "title" | "album" | "filename" | "duration";

/** Playlist from Rust backend */
export interface PlaylistData {
  id: string;
  name: string;
  tracks: Track[];
  created_at: string;
  updated_at: string;
}

/** Tree node for the file tree (used for UI display) */
export interface TreeNode {
  name: string;
  path: string;
  children: TreeNode[];
  isDir: boolean;
}
