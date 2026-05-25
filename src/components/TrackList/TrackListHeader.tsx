import { Columns3 } from "lucide-react";
import { usePlaylistStore } from "../../stores/playlistStore";
import { useUIStore } from "../../stores/uiStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import type { TrackColumn } from "../../types";

const columnLabels: Record<TrackColumn, string> = {
  title: "Title",
  artist: "Artist",
  album: "Album",
  duration: "Duration",
  filename: "Filename",
};

export function TrackListHeader() {
  const playlists = usePlaylistStore((s) => s.playlists);
  const activePlaylistId = usePlaylistStore((s) => s.activePlaylistId);
  const visibleColumns = useUIStore((s) => s.visibleColumns);
  const toggleColumn = useUIStore((s) => s.toggleColumn);

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);
  const title = activePlaylist ? activePlaylist.name : "Library";

  const allColumns: TrackColumn[] = [
    "title",
    "artist",
    "album",
    "duration",
    "filename",
  ];

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <Popover>
        <PopoverTrigger asChild>
          <button
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            title="Configure columns"
          >
            <Columns3 className="h-4 w-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-44 p-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Visible Columns
            </p>
            {allColumns.map((col) => (
              <label
                key={col}
                className="flex items-center gap-2 px-1 py-0.5 text-xs cursor-pointer rounded hover:bg-accent"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(col)}
                  onChange={() => toggleColumn(col)}
                  className="accent-primary"
                />
                {columnLabels[col]}
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
