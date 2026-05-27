import { useState } from "react";
import { Columns3, Save, Trash2 } from "lucide-react";
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
import { ALL_TRACK_COLUMNS, QUEUE_PLAYLIST_NAME, TRACK_COLUMN_LABELS } from "../../lib/constants";

export function TrackListHeader() {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");

  const playlists = usePlaylistStore((s) => s.playlists);
  const activePlaylistName = usePlaylistStore((s) => s.activePlaylistName);
  const isDirty = usePlaylistStore((s) => s.isDirty);
  const saveActivePlaylist = usePlaylistStore((s) => s.saveActivePlaylist);
  const saveQueueAsNewPlaylist = usePlaylistStore(
    (s) => s.saveQueueAsNewPlaylist
  );
  const visibleColumns = useUIStore((s) => s.visibleColumns);
  const toggleColumn = useUIStore((s) => s.toggleColumn);
  const queue = usePlayerStore((s) => s.queue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  const activePlaylist =
    playlists.find((p) => p.name === activePlaylistName) ||
    { name: QUEUE_PLAYLIST_NAME, tracks: [] };

  const allColumns: TrackColumn[] = ALL_TRACK_COLUMNS;
  
  const handleSaveAsNewPlaylist = () => {
    setSaveDialogOpen(false);
    saveQueueAsNewPlaylist(newPlaylistName.trim(), queue);
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border">
      <h2 className="text-sm font-semibold text-foreground">
        {activePlaylist.name}
        <span className="text-xs text-muted-foreground ml-2 font-normal">
          {queue.length} songs
        </span>
      </h2>
      <div className="flex items-center gap-1">
        {/* Save button */}
        {activePlaylist.name !== QUEUE_PLAYLIST_NAME ? (
          <button
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            title={isDirty ? "Save playlist changes" : "No changes to save"}
            disabled={!isDirty}
            onClick={() => saveActivePlaylist()}
          >
            <Save className="h-4 w-4" />
          </button>
        ) : queue.length > 0 ? (
          <button
            className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            title="Save queue as new playlist"
            onClick={() => {
              setNewPlaylistName("");
              setSaveDialogOpen(true);
            }}
          >
            <Save className="h-4 w-4" />
          </button>
        ) : null}

        {/* Save as new playlist dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save as Playlist</DialogTitle>
              <DialogDescription>
                Create a new playlist from the current queue ({queue.length}{" "}
                tracks).
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="Playlist name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    newPlaylistName.trim().length > 0
                  ) {
                    handleSaveAsNewPlaylist();
                  }
                }}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                disabled={newPlaylistName.trim().length === 0}
                onClick={handleSaveAsNewPlaylist}
              >
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog>
          <DialogTrigger asChild>
            <button
              className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
              title="Clear playlist"
              disabled={queue.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </DialogTrigger>
          {queue.length > 0 && (
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
          )}
        </Dialog>
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
