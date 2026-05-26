import { useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ListMusic,
  Check,
  X,
} from "lucide-react";
import { usePlaylistStore } from "../../stores/playlistStore";
import { usePlayerStore } from "../../stores/playerStore";
import { cn } from "../../lib/utils";
import { QUEUE_PLAYLIST_NAME } from "../../lib/constants";

export function PlaylistPanel() {
  const playlists = usePlaylistStore((s) => s.playlists);
  const activePlaylistId = usePlaylistStore((s) => s.activePlaylistId);
  const setActivePlaylist = usePlaylistStore((s) => s.setActivePlaylist);
  const createPlaylist = usePlaylistStore((s) => s.createPlaylist);
  const renamePlaylist = usePlaylistStore((s) => s.renamePlaylist);
  const deletePlaylist = usePlaylistStore((s) => s.deletePlaylist);
  const loadQueue = usePlayerStore((s) => s.loadQueue);
  const play = usePlayerStore((s) => s.play);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    await createPlaylist(name);
    setNewName("");
    setCreating(false);
  };

  const handleRename = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    await renamePlaylist(id, name);
    setRenamingId(null);
    setEditName("");
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deletePlaylist(id);
  };

  const handleDoubleClick = (playlistId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (pl && pl.tracks.length > 0) {
      loadQueue(pl.tracks);
      play();
    }
    setActivePlaylist(playlistId);
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
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => {
              setCreating(false);
              setNewName("");
            }}
            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
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
            const isActive = pl.id === activePlaylistId;
            const isRenaming = pl.id === renamingId;

            return (
              <div
                key={pl.id}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-none text-sm group hover:bg-accent/50",
                  isActive && "bg-accent text-accent-foreground"
                )}
                onDoubleClick={() => handleDoubleClick(pl.id)}
                onClick={() => {
                  setActivePlaylist(pl.id);
                  if (pl.tracks.length > 0) {
                    loadQueue(pl.tracks);
                    play();
                  }
                }}
              >
                <ListMusic className="h-4 w-4 shrink-0 text-muted-foreground" />

                {isRenaming ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(pl.id);
                      if (e.key === "Escape") {
                        setRenamingId(null);
                        setEditName("");
                      }
                    }}
                    autoFocus
                    className="flex-1 h-6 rounded border border-input bg-background px-1 text-xs outline-none focus:border-ring"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span className="flex-1 truncate text-sm">{pl.name}</span>
                )}

                <span className="text-xs text-muted-foreground tabular-nums">
                  {pl.tracks.length}
                </span>

                {/* Action buttons — visible on hover or when active */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isRenaming ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRename(pl.id);
                        }}
                        className="p-0.5 rounded hover:bg-accent-foreground/20 text-muted-foreground hover:text-foreground"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(null);
                          setEditName("");
                        }}
                        className="p-0.5 rounded hover:bg-accent-foreground/20 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingId(pl.id);
                          setEditName(pl.name);
                        }}
                        className="p-0.5 rounded hover:bg-accent-foreground/20 text-muted-foreground hover:text-foreground"
                        title="Rename"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(pl.id, e)}
                        className="p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
