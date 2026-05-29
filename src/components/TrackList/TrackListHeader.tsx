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
import { PlaylistNameDialog } from "../ui/playlist-name-dialog";
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
import { ALL_TRACK_COLUMNS, QUEUE_PLAYLIST_NAME, ALL_TRACK_COLUMN_KEYS } from "../../lib/constants";
import { createQueuePlaylist } from "../../lib/utils";

export function TrackListHeader() {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  const playlists = usePlaylistStore((s) => s.playlists);
  const activePlaylistName = usePlaylistStore((s) => s.activePlaylistName);
  const saveActivePlaylist = usePlaylistStore((s) => s.saveActivePlaylist);
  const saveQueueAsNewPlaylist = usePlaylistStore(
    (s) => s.saveQueueAsNewPlaylist
  );
  const visibleColumns = useUIStore((s) => s.visibleColumns);
  const toggleColumn = useUIStore((s) => s.toggleColumn);
  const queue = usePlayerStore((s) => s.queue);
  const clearQueue = usePlayerStore((s) => s.clearQueue);

  const activePlaylist =
    playlists.find((p) => p.name === activePlaylistName) || createQueuePlaylist();
  const isDirty = activePlaylist.isDirty ?? false;

  const allColumns: TrackColumn[] = ALL_TRACK_COLUMN_KEYS;
  
  const handleSaveAsNewPlaylist = async (name: string) => {
    await saveQueueAsNewPlaylist(name, queue);
  };

  const saveValidator = (name: string) =>
    name && playlists.some((p) => p.name === name)
      ? `A playlist named "${name}" already exists`
      : "";

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
            onClick={() => setSaveDialogOpen(true)}
          >
            <Save className="h-4 w-4" />
          </button>
        ) : null}

        <PlaylistNameDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          title="Save as Playlist"
          description={`Create a new playlist from the current queue (${queue.length} tracks).`}
          confirmLabel="Save"
          validate={saveValidator}
          onSubmit={handleSaveAsNewPlaylist}
        />

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
                  {ALL_TRACK_COLUMNS[col].label}
                </label>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
