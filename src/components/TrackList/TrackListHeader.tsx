import { Columns3, Trash2 } from "lucide-react";
import { usePlaylistStore } from "../../stores/playlistStore";
import { usePlayerStore } from "../../stores/playerStore";
import { useUIStore } from "../../stores/uiStore";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "../ui/dialog";
import { Button } from "../ui/button";
import type { TrackColumn } from "../../types";
import { ALL_TRACK_COLUMNS, TRACK_COLUMN_LABELS } from "../../lib/constants";

export function TrackListHeader() {
  const playlists = usePlaylistStore((s) => s.playlists);
  const activePlaylistId = usePlaylistStore((s) => s.activePlaylistId);
  const visibleColumns = useUIStore((s) => s.visibleColumns);
  const toggleColumn = useUIStore((s) => s.toggleColumn);
  const queue = usePlayerStore((s) => s.queue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  const activePlaylist = playlists.find((p) => p.id === activePlaylistId);
  const title = activePlaylist ? activePlaylist.name : "Library";

  const allColumns: TrackColumn[] = ALL_TRACK_COLUMNS;

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="flex items-center gap-1">
        {queue.length > 0 && (
          <Dialog>
            <DialogTrigger asChild>
              <button
                className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
                title="Clear playlist"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Clear Playlist</DialogTitle>
                <DialogDescription>
                  Are you sure you want to clear the current playback queue?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancel</Button>
                </DialogClose>
                <DialogClose asChild>
                  <Button variant="destructive" onClick={clearQueue}>
                    Clear
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
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
                  {TRACK_COLUMN_LABELS[col]}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
