import { type ReactNode } from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { FolderOpen, Trash2 } from "lucide-react";
import { usePlaylistStore } from "../../stores/playlistStore";
import { revealInFileManager } from "../../lib/utils";
import type { Track } from "../../types";
import { ContextMenuItem, ContextSeparator } from "../ui/context-menu";
import { usePlayerStore } from "../../stores/playerStore";

export function TrackContextMenu({
  children,
  track,
  trackIndex,
  disabled,
}: {
  children: ReactNode;
  track: Track;
  trackIndex: number;
  disabled?: boolean;
}) {
  const activePlaylistName = usePlaylistStore((s) => s.activePlaylistName);
  const removeTracks = usePlaylistStore((s) => s.removeTracks);
  const removeFromQueue = usePlayerStore((s) => s.removeFromQueue);

  const handleDeleteFromPlaylist = () => {
    if (activePlaylistName) {
      removeTracks(activePlaylistName, [trackIndex]);
      removeFromQueue(track.path);
    }
  };

  return (
    <ContextMenuPrimitive.Root>
      <ContextMenuPrimitive.Trigger disabled={disabled} asChild>
        {children}
      </ContextMenuPrimitive.Trigger>
      <ContextMenuPrimitive.Portal>
        <ContextMenuPrimitive.Content
          className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
          alignOffset={-4}
        >
          <ContextMenuItem onClick={() => revealInFileManager(track.path)} disabled={track.invalid}>
            <FolderOpen className="mr-2 h-3.5 w-3.5" />
            Open File 
          </ContextMenuItem>
          <ContextSeparator />
          <ContextMenuItem
            onClick={handleDeleteFromPlaylist}
            disabled={!activePlaylistName}
            danger
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Remove from Playlist
          </ContextMenuItem>
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
}
