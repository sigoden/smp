import type { TrackColumn } from "../types";

export const QUEUE_PLAYLIST_NAME = "PLAYING";

export const ALL_TRACK_COLUMNS: TrackColumn[] = [
  "title",
  "artist",
  "album",
  "album_artist",
  "track_number",
  "genre",
  "year",
  "duration",
  "filename",
];

export const DEFAULT_TRACK_COLUMNS: TrackColumn[] = [
  "title",
  "artist",
  "album",
  "duration",
  "filename",
];

export const TRACK_COLUMN_LABELS: Record<TrackColumn, string> = {
  title: "Title",
  artist: "Artist",
  album: "Album",
  duration: "Duration",
  track_number: "#",
  genre: "Genre",
  album_artist: "Album Artist",
  year: "Year",
  filename: "Filename",
};

