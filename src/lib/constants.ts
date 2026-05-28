import type { TrackColumn } from "../types";

export const QUEUE_PLAYLIST_NAME = "PLAYING";

export const ALL_TRACK_COLUMNS = {
  filename: { width: "minmax(160px, 0.8fr)", label: "Filename" },
  track_number: { width: "52px", label: "#" },
  title: { width: "minmax(240px, 2.4fr)", label: "Title" },
  artist: { width: "minmax(140px, 1.2fr)", label: "Artist" },
  album: { width: "minmax(140px, 1.2fr)", label: "Album" },
  duration: { width: "72px", label: "Time" },
  genre: { width: "minmax(90px, 0.7fr)", label: "Genre" },
  year: { width: "64px", label: "Year" },
  album_artist: { width: "minmax(140px, 1fr)", label: "Album Artist" },
};

export const ALL_TRACK_COLUMN_KEYS = Object.keys(ALL_TRACK_COLUMNS) as TrackColumn[];


export const DEFAULT_TRACK_COLUMNS: TrackColumn[] = [
  "title",
  "artist",
  "album",
  "duration",
];

