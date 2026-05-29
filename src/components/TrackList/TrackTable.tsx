import { useEffect, useRef } from "react";
import { useUIStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { usePlaylistStore } from "../../stores/playlistStore";
import {
  cn,
  createQueuePlaylist,
  trackTitle,
  trackArtist,
  trackAlbum,
  trackDuration,
  trackFileBasename,
  formatTrackDuration,
} from "../../lib/utils";
import { TrackContextMenu } from "./TrackContextMenu";
import type { Track, TrackColumn } from "../../types";
import { ALL_TRACK_COLUMNS, QUEUE_PLAYLIST_NAME, ALL_TRACK_COLUMN_KEYS } from "../../lib/constants";


function TrackRow({
  track,
  index,
  isPlaying,
  columns,
}: {
  track: Track;
  index: number;
  isPlaying: boolean;
  columns: TrackColumn[];
}) {
  const rowRef = useRef<HTMLDivElement>(null);
  const playTrack = usePlayerStore((s) => s.playTrack);

  useEffect(() => {
    if (isPlaying && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isPlaying]);

  const handleDoubleClick = () => {
    playTrack(track);
  };

  const cellValues: Record<TrackColumn, string> = {
    title: trackTitle(track),
    artist: trackArtist(track),
    album: trackAlbum(track),
    duration: formatTrackDuration(trackDuration(track)),
    track_number: track.metadata.track_number ?? "",
    genre: track.metadata.genre ?? "",
    album_artist: track.metadata.album_artist ?? "",
    year: track.metadata.year?.toString() ?? "",
    filename: trackFileBasename(track),
  };

  return (
    <TrackContextMenu
      track={track}
      trackIndex={index}
    >
      <div
        ref={rowRef}
        className={cn(
          "grid items-center gap-x-3 px-4 py-1.5 text-sm cursor-pointer border-b border-border/50 hover:bg-accent/30 transition-colors",
          isPlaying && "bg-accent/40 text-accent-foreground hover:bg-accent/50",
          track.invalid && "opacity-50"
        )}
        style={{
          gridTemplateColumns: columns
            .map((c) => ALL_TRACK_COLUMNS[c].width)
            .join(" "),
        }}
        onDoubleClick={handleDoubleClick}
      >
        {columns.map((col) => (
          <span
            key={col}
            className={cn(
              "truncate",
              col === "duration" && "tabular-nums text-right",
              isPlaying && col === "title" && "font-medium"
            )}
          >
            {cellValues[col]}
          </span>
        ))}
      </div>
    </TrackContextMenu>
  );
}

export function TrackTable() {
  const visibleColumns = useUIStore((s) => s.visibleColumns);
  // Always render columns in the fixed order defined by ALL_TRACK_COLUMN_KEYS
  const orderedColumns = ALL_TRACK_COLUMN_KEYS.filter((c) => visibleColumns.includes(c));
  const tracks = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const playingTrack = usePlayerStore((s) => s.playingTrack);
  const playlists = usePlaylistStore((s) => s.playlists);
  const activePlaylistName = usePlaylistStore((s) => s.activePlaylistName);

  const activePlaylist =
    playlists.find((p) => p.name === activePlaylistName) || createQueuePlaylist();

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable container with sticky header — header & rows share the same width */}
      <div className="flex-1 overflow-y-auto [scrollbar-gutter:stable]">
        {/* Column headers — sticky inside scroll container */}
        <div
          className="sticky top-0 z-10 grid items-center gap-x-3 px-4 py-1.5 text-xs font-medium text-muted-foreground border-b border-border bg-muted"
          style={{
            gridTemplateColumns: orderedColumns
              .map((c) => ALL_TRACK_COLUMNS[c].width)
              .join(" "),
          }}
        >
          {orderedColumns.map((col) => (
            <span
              key={col}
              className={cn(
                "truncate uppercase tracking-wider",
                col === "duration" && "text-right"
              )}
            >
              {ALL_TRACK_COLUMNS[col].label}
            </span>
          ))}
        </div>

        {/* Rows */}
        {tracks.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            {activePlaylist.name !== QUEUE_PLAYLIST_NAME ? "Playlist is empty" : "No tracks loaded"}
          </div>
        ) : (
          tracks.map((track, index) => (
            <TrackRow
              key={`${track.path}-${index}`}
              track={track}
              index={index}
              isPlaying={
                track.path === playingTrack?.path && currentIndex === index
              }
              columns={orderedColumns}
            />
          ))
        )}
      </div>
    </div>
  );
}
