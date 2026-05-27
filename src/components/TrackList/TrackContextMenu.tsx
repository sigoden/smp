import type { ReactNode } from "react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { FolderOpen, Tags, Trash2 } from "lucide-react";
import { usePlaylistStore } from "../../stores/playlistStore";
import { cn, openContainerFolder } from "../../lib/utils";
import type { Track } from "../../types";

function ContextMenuItem({
  children,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <ContextMenuPrimitive.Item
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-xs outline-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        danger
          ? "text-destructive focus:bg-destructive/20 focus:text-destructive"
          : "focus:bg-accent focus:text-accent-foreground"
      )}
    >
      {children}
    </ContextMenuPrimitive.Item>
  );
}

function ContextSeparator() {
  return (
    <ContextMenuPrimitive.Separator className="-mx-1 my-1 h-px bg-border" />
  );
}

export function TrackContextMenu({
  children,
  track,
  trackIndex,
  onEditTags,
  disabled,
}: {
  children: ReactNode;
  track: Track;
  trackIndex: number;
  onEditTags?: () => void;
  disabled?: boolean;
}) {
  const activePlaylistName = usePlaylistStore((s) => s.activePlaylistName);
  const removeTracks = usePlaylistStore((s) => s.removeTracks);

  const handleOpenInExplorer = () => {
    openContainerFolder(track.path);
  };

  const handleDeleteFromPlaylist = () => {
    if (activePlaylistName) {
      removeTracks(activePlaylistName, [trackIndex]);
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
          <ContextMenuItem onClick={handleOpenInExplorer} disabled={track.invalid}>
            <FolderOpen className="mr-2 h-3.5 w-3.5" />
            Open Containing Folder
          </ContextMenuItem>
          <ContextMenuItem onClick={onEditTags} disabled={track.invalid}>
            <Tags className="mr-2 h-3.5 w-3.5" />
            Edit Tags
          </ContextMenuItem>
          <ContextSeparator />
          <ContextMenuItem
            onClick={handleDeleteFromPlaylist}
            disabled={!activePlaylistName}
            danger
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            Delete from Playlist
          </ContextMenuItem>
        </ContextMenuPrimitive.Content>
      </ContextMenuPrimitive.Portal>
    </ContextMenuPrimitive.Root>
  );
}
