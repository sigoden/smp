import type { TrackColumn } from "../types";

export const QUEUE_PLAYLIST_NAME = "PLAYING";

export const ALL_TRACK_COLUMNS = {
  title: { width: "minmax(180px, 1fr)", label: "Title" },
  artist: { width: "minmax(140px, 1fr)", label: "Artist" },
  album: { width: "minmax(140px, 1fr)", label: "Album" },
  duration: { width: "minmax(60px, 80px)", label: "Duration" },
  track_number: { width: "minmax(40px, 60px)", label: "#" },
  genre: { width: "minmax(100px, 1fr)", label: "Genre" },
  album_artist: { width: "minmax(140px, 1fr)", label: "Album Artist" },
  year: { width: "minmax(50px, 70px)", label: "Year" },
  filename: { width: "minmax(200px, 1fr)", label: "Filename" },
};

export const ALL_TRACK_COLUMN_KEYS = Object.keys(ALL_TRACK_COLUMNS) as TrackColumn[];


export const DEFAULT_TRACK_COLUMNS: TrackColumn[] = [
  "title",
  "artist",
  "album",
  "duration",
  "filename",
];

