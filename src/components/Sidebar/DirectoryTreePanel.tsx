import { useState, type ReactNode } from "react";

import { Music, Search, Plus, X, Loader2, RotateCcw, ChevronRight, ChevronDown, FolderOpen, Play, RefreshCw, PlusCircle } from "lucide-react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { open } from "@tauri-apps/plugin-dialog";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { usePlaylistStore } from "../../stores/playlistStore";
import { useUIStore } from "../../stores/uiStore";
import { cn, getTrack, loadTracksFromDir, openContainerFolder } from "../../lib/utils";
import type { FsEntry } from "../../types";
import { QUEUE_PLAYLIST_NAME } from "../../lib/constants";

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

function TreeNode({
  entry,
  depth = 0,
}: {
  entry: FsEntry;
  depth?: number;
}) {
  const expandedPaths = useLibraryStore((s) => s.expandedPaths);
  const toggleExpand = useLibraryStore((s) => s.toggleExpand);
  const loadQueue = usePlayerStore((s) => s.loadQueue);
  const appendAndPlay = usePlayerStore((s) => s.appendAndPlay);
  const play = usePlayerStore((s) => s.play);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const refreshDir = useLibraryStore((s) => s.refreshDir);
  const activePlaylistName = usePlaylistStore((s) => s.activePlaylistName);
  const addTracks = usePlaylistStore((s) => s.addTracks);
  const saveActivePlaylist = usePlaylistStore((s) => s.saveActivePlaylist);
  const syncQueuePlaylist = usePlaylistStore((s) => s.syncQueuePlaylist);
  const setGlobalLoading = useUIStore((s) => s.setLoading);
  const [loading, setLoading] = useState(false);
  const isDir = entry.type === "dir";
  const isExpanded = isDir && expandedPaths.has(entry.path);
  const isPlaying = !isDir && queue[currentIndex]?.path === entry.path;

  const handleClick = async () => {
    if (isDir) {
      if (!isExpanded) {
        setLoading(true);
        await refreshDir(entry.path);
        setLoading(false);
      }
      toggleExpand(entry.path);
    }
  };

  const handleDoubleClick = () => {
    if (!isDir) {
      handlePlayFile();
    } 
  };

  const handlePlayFile = async () => {
    const existingIdx = queue.findIndex((t) => t.path === entry.path);
    if (existingIdx >= 0) {
      playTrack(queue[existingIdx]);
    } else {
      const track = await getTrack(entry.path);
      appendAndPlay([track]);
      addTracks(activePlaylistName, [track]);
      if (activePlaylistName === QUEUE_PLAYLIST_NAME) {
        saveActivePlaylist();
      }
    }
  };

  const handleReplaceQueue = async () => {
    setGlobalLoading(true);
    const tracks = await loadTracksFromDir(entry.path);
    setGlobalLoading(false);
    if (tracks.length > 0) {
      loadQueue(tracks);
      play();
      syncQueuePlaylist(tracks);
    }
  };

  const handleAddToQueue = async () => {
    setGlobalLoading(true);
    const tracks = await loadTracksFromDir(entry.path);
    setGlobalLoading(false);
    if (tracks.length > 0) {
      appendAndPlay(tracks);
      addTracks(activePlaylistName, tracks);
      if (activePlaylistName === QUEUE_PLAYLIST_NAME) {
        saveActivePlaylist();
      }
    }
  };

  return (
    <div>
      <ContextMenuPrimitive.Root>
        <ContextMenuPrimitive.Trigger disabled={loading} asChild>
          <div
            className={cn(
              "flex items-center gap-1.5 px-2 py-0.5 rounded text-sm cursor-pointer hover:bg-accent/50 select-none",
              depth > 0 && "ml-4",
              isPlaying && "text-accent-foreground bg-accent/30"
            )}
            style={{ paddingLeft: `${8 + depth * 16}px` }}
            onClick={handleClick}
            onDoubleClick={isDir ? undefined : handleDoubleClick}
            title={entry.path}
          >
            {isDir ? (
              loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  )}
                </>
              )
            ) : (
              <Music className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className="whitespace-nowrap">{entry.name}</span>
          </div>
        </ContextMenuPrimitive.Trigger>
        <ContextMenuPrimitive.Portal>
          <ContextMenuPrimitive.Content
            className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            alignOffset={-4}
          >
            <ContextMenuItem onClick={() => openContainerFolder(entry.path)}>
              <FolderOpen className="mr-2 h-3.5 w-3.5" />
              Open Containing Folder
            </ContextMenuItem>
            <ContextSeparator />
            {entry.type === "file" ? (
              <ContextMenuItem onClick={handlePlayFile}>
                <Play className="mr-2 h-3.5 w-3.5" />
                Play
              </ContextMenuItem>
            ) : (
              <>
                <ContextMenuItem onClick={handleReplaceQueue}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Replace Queue
                </ContextMenuItem>
                <ContextMenuItem onClick={handleAddToQueue}>
                  <PlusCircle className="mr-2 h-3.5 w-3.5" />
                  Add to Queue
                </ContextMenuItem>
              </>
            )}
          </ContextMenuPrimitive.Content>
        </ContextMenuPrimitive.Portal>
      </ContextMenuPrimitive.Root>
      {isDir && isExpanded && entry.children && (
        <div>
          {entry.children.length === 0 ? (
            <div
              className="text-xs text-muted-foreground italic px-2 py-0.5"
              style={{ paddingLeft: `${8 + (depth + 1) * 16}px` }}
            >
              Empty
            </div>
          ) : (
            entry.children.map((child, i) => (
              <TreeNode key={`${child.path}-${i}`} entry={child} depth={depth + 1} />
            ))
          )}
        </div>
      )}

    </div>
  );
}

export function DirectoryTreePanel() {
  const rootDirs = useLibraryStore((s) => s.rootDirs);
  const treeData = useLibraryStore((s) => s.treeData);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const setSearch = useLibraryStore((s) => s.setSearch);
  const addRootDir = useLibraryStore((s) => s.addRootDir);
  const removeRootDir = useLibraryStore((s) => s.removeRootDir);
  const refreshAll = useLibraryStore((s) => s.refreshAll);
  const [refreshing, setRefreshing] = useState(false);

  const handleAddRoot = async () => {
    const selected = await open({
      directory: true,
      multiple: false,
      title: "Select music directory",
    });
    if (selected) {
      await addRootDir(selected);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const filterTree = (entries: FsEntry[]): FsEntry[] => {
    if (!searchQuery) return entries;
    const q = searchQuery.toLowerCase();
    return entries.reduce<FsEntry[]>((acc, entry) => {
      if (entry.type === "dir") {
        const filtered = filterTree(entry.children);
        if (filtered.length > 0 || entry.name.toLowerCase().includes(q)) {
          acc.push({ ...entry, children: filtered });
        }
      } else if (entry.name.toLowerCase().includes(q)) {
        acc.push(entry);
      }
      return acc;
    }, []);
  };

  const filteredTree = filterTree(treeData);

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="relative px-2 pt-2 pb-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 rounded-md border border-input bg-background pl-7 pr-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Root dir manager */}
      <div className="px-2 py-1 border-b border-border">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">Files</span>
          <div className="flex items-center gap-0.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-50"
              title="Refresh"
            >
              {refreshing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RotateCcw className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              onClick={handleAddRoot}
              className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
              title="Add directory"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        {rootDirs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No directories added</p>
        ) : (
          <div className="space-y-0.5">
            {rootDirs.map((dir) => (
              <div
                key={dir}
                className="flex items-center justify-between text-xs rounded px-1 py-0.5 hover:bg-accent/50 group"
              >
                <span className="truncate text-muted-foreground">{dir}</span>
                <button
                  onClick={() => removeRootDir(dir)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive shrink-0"
                  title="Remove directory"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto">
        {filteredTree.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-3 py-2">
            {searchQuery ? "No matching files" : "No files loaded"}
          </p>
        ) : (
          filteredTree.map((entry, i) => (
            <TreeNode key={`${entry.path}-${i}`} entry={entry} depth={0} />
          ))
        )}
      </div>
    </div>
  );
}
