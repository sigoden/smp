import { useEffect, useRef, useState } from "react";
import { useUIStore } from "../../stores/uiStore";
import { usePlayerStore } from "../../stores/playerStore";
import { usePlaylistStore } from "../../stores/playlistStore";
import { cn } from "../../lib/utils";
import { TrackContextMenu } from "./TrackContextMenu";
import { TagEditDialog } from "./TagEditDialog";
import type { Track, TrackColumn } from "../../types";
import { ALL_TRACK_COLUMNS, QUEUE_PLAYLIST_NAME, TRACK_COLUMN_LABELS } from "../../lib/constants";

const columnWidths: Record<TrackColumn, string> = {
  title: "minmax(180px, 1fr)",
  artist: "minmax(140px, 1fr)",
  album: "minmax(140px, 1fr)",
  filename: "minmax(180px, 1.5fr)",
  duration: "minmax(60px, 80px)",
};

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function TrackRow({
  track,
  index,
  isPlaying,
  columns,
  onEditTags,
}: {
  track: Track;
  index: number;
  isPlaying: boolean;
  columns: TrackColumn[];
  onEditTags?: (track: Track) => void;
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
    title: track.title,
    artist: track.artist,
    album: track.album,
    filename: track.path.split(/[/\\]/).pop() || track.path,
    duration: formatDuration(track.duration),
  };

  return (
    <TrackContextMenu
      track={track}
      trackIndex={index}
      onEditTags={onEditTags ? () => onEditTags(track) : undefined}
    >
      <div
        ref={rowRef}
        className={cn(
          "grid items-center px-4 py-1.5 text-sm cursor-pointer border-b border-border/50 hover:bg-accent/30 transition-colors",
          isPlaying && "bg-accent/40 text-accent-foreground hover:bg-accent/50"
        )}
        style={{
          gridTemplateColumns: columns
            .map((c) => columnWidths[c])
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
  // Always render columns in the fixed order defined by ALL_TRACK_COLUMNS
  const orderedColumns = ALL_TRACK_COLUMNS.filter((c) => visibleColumns.includes(c));
  const tracks = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const nowPlaying = usePlayerStore((s) => s.nowPlaying);
  const playlists = usePlaylistStore((s) => s.playlists);
  const activePlaylistName = usePlaylistStore((s) => s.activePlaylistName);

  const [tagEditTrack, setTagEditTrack] = useState<Track | null>(null);
  const [tagEditOpen, setTagEditOpen] = useState(false);

  const activePlaylist =
    playlists.find((p) => p.name === activePlaylistName) ||
    { name: QUEUE_PLAYLIST_NAME, tracks: [] };

  const handleEditTags = (track: Track) => {
    setTagEditTrack(track);
    setTagEditOpen(true);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Column headers */}
      <div
        className="grid items-center px-4 py-1.5 text-xs font-medium text-muted-foreground border-b border-border bg-muted/30"
        style={{
          gridTemplateColumns: orderedColumns
            .map((c) => columnWidths[c])
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
            {TRACK_COLUMN_LABELS[col]}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {tracks.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            {activePlaylist.name !== QUEUE_PLAYLIST_NAME ? "Playlist is empty" : "No tracks loaded"}
          </div>
        ) : (
          tracks.map((track, index) => (
            <TrackRow
              key={`${track.path}-${index}`}
              track={track}
              index={index}
              isPlaying={
                track.path === nowPlaying?.path && currentIndex === index
              }
              columns={orderedColumns}
              onEditTags={handleEditTags}
            />
          ))
        )}
      </div>

      {/* Tag Edit Dialog */}
      <TagEditDialog
        open={tagEditOpen}
        onOpenChange={setTagEditOpen}
        track={tagEditTrack}
      />
    </div>
  );
}
