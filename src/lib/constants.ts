import type { TrackColumn } from "../types";

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
