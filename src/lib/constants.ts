import type { TrackColumn } from "../types";

export const QUEUE_PLAYLIST_NAME = "PLAYING";

export const ALL_TRACK_COLUMNS: TrackColumn[] = [
  "filename",
  "title",
  "artist",
  "album",
  "album_artist",
  "track_number",
  "genre",
  "year",
  "duration",
];

export const DEFAULT_TRACK_COLUMNS: TrackColumn[] = [
  "filename",
  "title",
  "artist",
  "album",
  "duration",
];

export const TRACK_COLUMN_LABELS: Record<TrackColumn, string> = {
  filename: "Filename",
  title: "Title",
  artist: "Artist",
  album: "Album",
  duration: "Duration",
  track_number: "#",
  genre: "Genre",
  album_artist: "Album Artist",
  year: "Year",
};

