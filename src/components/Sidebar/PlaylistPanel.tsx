import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ListMusic,
  Check,
  X,
  FolderOpen,
  Play,
} from "lucide-react";
import { openPlaylistsDir, cn } from "../../lib/utils";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { usePlaylistStore } from "../../stores/playlistStore";
import { usePlayerStore } from "../../stores/playerStore";
import { QUEUE_PLAYLIST_NAME } from "../../lib/constants";
import { ContextMenuItem, ContextSeparator } from "../ui/context-menu";
import { PlaylistNameDialog } from "../ui/playlist-name-dialog";

export function PlaylistPanel() {
  const playlists = usePlaylistStore((s) => s.playlists);
  const activePlaylistName = usePlaylistStore((s) => s.activePlaylistName);
  const setActivePlaylist = usePlaylistStore((s) => s.setActivePlaylist);
  const createPlaylist = usePlaylistStore((s) => s.createPlaylist);
  const renamePlaylist = usePlaylistStore((s) => s.renamePlaylist);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);
  const fetchTracksForPlaylist = usePlaylistStore((s) => s.fetchTracksForPlaylist);
  const loadQueue = usePlayerStore((s) => s.loadQueue);
  const play = usePlayerStore((s) => s.play);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<string | null>(null);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await createPlaylist(name);
    setNewName("");
    setCreating(false);
  };

  const handleRenameOpen = (name: string) => {
    setRenameTarget(name);
    setRenameDialogOpen(true);
  };

  const renameValidator = (name: string) =>
    name && name !== renameTarget && playlists.some((p) => p.name === name)
      ? `A playlist named "${name}" already exists`
      : "";

  const handleRenameSubmit = async (newName: string) => {
    if (!renameTarget) return;
    await renamePlaylist(renameTarget, newName);
    setRenameTarget(null);
  };

  const handleClick = async (playlistName: string) => {
    const tracks = await fetchTracksForPlaylist(playlistName);
    if (tracks.length > 0) {
      loadQueue(tracks);
      play();
    }
    setActivePlaylist(playlistName);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">Playlists</span>
        <button
          onClick={() => setCreating(true)}
          className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
          title="Create playlist"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Create input */}
      {creating && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-b border-border">
          <input
            type="text"
            placeholder="Playlist name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setCreating(false);
                setNewName("");
              }
            }}
            autoFocus
            className="flex-1 h-7 rounded border border-input bg-background px-2 text-xs outline-none focus:border-ring"
          />
          <button
            onClick={handleCreate}
            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            title="Confirm"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            title="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Playlist list */}
      <div className="flex-1 overflow-y-auto">
        {playlists.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-3 py-2">
            No playlists yet
          </p>
        ) : (
          playlists.filter(pl => pl.name !== QUEUE_PLAYLIST_NAME).map((pl) => {
            const isActive = pl.name === activePlaylistName;

            return (
              <ContextMenuPrimitive.Root key={pl.name}>
                <ContextMenuPrimitive.Trigger asChild>
                  <div
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-none text-sm group hover:bg-accent/50",
                      isActive && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => handleClick(pl.name)}
                  >
                    <ListMusic className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-sm">{pl.name}</span>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {pl?.track_count ?? 0}
                    </span>
                  </div>
                </ContextMenuPrimitive.Trigger>
                <ContextMenuPrimitive.Portal>
                  <ContextMenuPrimitive.Content
                    className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
                    alignOffset={-4}
                  >
                    <ContextMenuItem
                      onClick={() => openPlaylistsDir()}
                    >
                      <FolderOpen className="mr-2 h-3.5 w-3.5" />
                      Open Containing Folder
                    </ContextMenuItem>
                    <ContextSeparator />
                    <ContextMenuItem
                      onClick={async () => {
                        setActivePlaylist(pl.name);
                        const tracks = await fetchTracksForPlaylist(pl.name);
                        if (tracks.length > 0) {
                          loadQueue(tracks);
                          play();
                        }
                      }}
                    >
                      <Play className="mr-2 h-3.5 w-3.5" />
                      Play
                    </ContextMenuItem>
                    <ContextSeparator />
                    <ContextMenuItem
                      onClick={() => handleRenameOpen(pl.name)}
                    >
                      <Pencil className="mr-2 h-3.5 w-3.5" />
                      Rename
                    </ContextMenuItem>
                    <ContextSeparator />
                    <ContextMenuItem
                      onClick={() => deletePlaylist(pl.name)}
                      danger
                    >
                      <Trash2 className="mr-2 h-3.5 w-3.5" />
                      Delete
                    </ContextMenuItem>
                  </ContextMenuPrimitive.Content>
                </ContextMenuPrimitive.Portal>
              </ContextMenuPrimitive.Root>
            );
          })
        )}
      </div>

      <PlaylistNameDialog
        open={renameDialogOpen}
        onOpenChange={(open) => {
          setRenameDialogOpen(open);
          if (!open) setRenameTarget(null);
        }}
        title="Rename Playlist"
        initialName={renameTarget ?? ""}
        confirmLabel="Rename"
        validate={renameValidator}
        onSubmit={handleRenameSubmit}
      />
    </div>
  );
}
