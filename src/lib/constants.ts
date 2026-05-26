import type { TrackColumn, PlaylistData } from "../types";

export const QUEUE_PLAYLIST: PlaylistData = {
  id: "__queue__",
  name: "QUEUE",
  tracks: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const ALL_TRACK_COLUMNS: TrackColumn[] = [
  "title",
  "artist",
  "album",
  "filename",
  "duration",
];

export const TRACK_COLUMN_LABELS: Record<TrackColumn, string> = {
  title: "Title",
  artist: "Artist",
  album: "Album",
  filename: "Filename",
  duration: "Duration",
};
