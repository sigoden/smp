import { useState } from "react";

import { Music, Search, Plus, X, Loader2, RotateCcw, ChevronRight, ChevronDown, FolderOpen, RefreshCw, PlusCircle, ChevronsUp } from "lucide-react";
import * as ContextMenuPrimitive from "@radix-ui/react-context-menu";
import { open } from "@tauri-apps/plugin-dialog";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { usePlaylistStore } from "../../stores/playlistStore";
import { useUIStore } from "../../stores/uiStore";
import { cn, getTrack, loadTracksFromDir, revealInFileManager } from "../../lib/utils";
import type { FsEntry, RootDir } from "../../types";
import { QUEUE_PLAYLIST_NAME } from "../../lib/constants";
import { ContextMenuItem, ContextSeparator } from "../ui/context-menu";
import { ConfirmDialog } from "../ui/confirm-dialog";

// ──── Helpers ────

function findEnclosingRoot(rootDirs: RootDir[], entryPath: string): { root: RootDir; relPath: string } | undefined {
  for (const root of rootDirs) {
    if (entryPath === root.path) return { root, relPath: "/" };
    if (entryPath.startsWith(root.path + "/") || entryPath.startsWith(root.path + "\\")) {
      return { root, relPath: "/" + entryPath.slice(root.path.length + 1).replace(/\\/g, "/") };
    }
  }
  return undefined;
}

function isEntryExpanded(rootDirs: RootDir[], entryPath: string): boolean {
  const enclosing = findEnclosingRoot(rootDirs, entryPath);
  return enclosing ? enclosing.root.expandedPaths.includes(enclosing.relPath) : false;
}

function filterRootDirs(rootDirs: RootDir[], query: string): RootDir[] {
  if (!query) return rootDirs;
  const q = query.toLowerCase();
  return rootDirs.reduce<RootDir[]>((acc, root) => {
    const filterEntries = (entries: FsEntry[]): FsEntry[] =>
      entries.reduce<FsEntry[]>((acc2, entry) => {
        if (entry.type === "dir") {
          const filtered = filterEntries(entry.children);
          if (filtered.length > 0 || entry.name.toLowerCase().includes(q)) {
            acc2.push({ ...entry, children: filtered });
          }
        } else if (entry.name.toLowerCase().includes(q)) {
          acc2.push(entry);
        }
        return acc2;
      }, []);

    const filteredTree = filterEntries(root.tree);
    if (filteredTree.length > 0) {
      acc.push({ ...root, tree: filteredTree });
    } else {
      // Keep root if its basename matches the query
      const dirName = root.path.split(/[/\\]/).filter(Boolean).pop() || root.path;
      if (dirName.toLowerCase().includes(q)) {
        acc.push(root);
      }
    }
    return acc;
  }, []);
}

// ──── TreeNode ────

function TreeNode({
  entry,
  depth = 0,
  isRoot = false,
  onRemoveRoot,
}: {
  entry: FsEntry;
  depth?: number;
  isRoot?: boolean;
  onRemoveRoot?: (path: string) => void;
}) {
  const rootDirs = useLibraryStore((s) => s.rootDirs);
  const toggleExpand = useLibraryStore((s) => s.toggleExpand);
  const loadQueue = usePlayerStore((s) => s.loadQueue);
  const appendToQueue = usePlayerStore((s) => s.appendToQueue);
  const pushQueueAndPlay = usePlayerStore((s) => s.pushQueueAndPlay);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const enqueuedPaths = useLibraryStore((s) => s.enqueuedPaths);
  const recordEnqueuedPaths = useLibraryStore((s) => s.recordEnqueuedPaths);
  const replaceEnqueuedPaths = useLibraryStore((s) => s.replaceEnqueuedPaths);
  const refreshDir = useLibraryStore((s) => s.refreshDir);
  const activePlaylistName = usePlaylistStore((s) => s.activePlaylistName);
  const addTracks = usePlaylistStore((s) => s.addTracks);
  const saveActivePlaylist = usePlaylistStore((s) => s.saveActivePlaylist);
  const syncQueuePlaylist = usePlaylistStore((s) => s.syncQueuePlaylist);
  const setGlobalLoading = useUIStore((s) => s.setLoading);
  const [loading, setLocalLoading] = useState(false);
  const isDir = entry.type === "dir";
  const isExpanded = isDir && isEntryExpanded(rootDirs, entry.path);
  const isPlaying = !isDir && queue[currentIndex]?.path === entry.path;
  const isEnqueuedExact = enqueuedPaths.includes(entry.path);
  const hasEnqueuedChildren = isDir && enqueuedPaths.some(p => p !== entry.path && (p.startsWith(entry.path + "/") || p.startsWith(entry.path + "\\")));

  const handleClick = async () => {
    if (isDir) {
      if (!isExpanded && isRoot) {
        setLocalLoading(true);
        await refreshDir(entry.path);
        setLocalLoading(false);
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
      pushQueueAndPlay(track);
      addTracks(activePlaylistName, [track]);
      if (activePlaylistName === QUEUE_PLAYLIST_NAME) {
        saveActivePlaylist();
        recordEnqueuedPaths([entry.path]);
      }
    }
  };

  const handleAddFileToQueue = async () => {
    const track = await getTrack(entry.path);
    appendToQueue([track]);
    addTracks(activePlaylistName, [track]);
    if (activePlaylistName === QUEUE_PLAYLIST_NAME) {
      saveActivePlaylist();
      recordEnqueuedPaths([entry.path]);
    }
  };

  const handleReplaceQueue = async () => {
    setGlobalLoading(true);
    const tracks = await loadTracksFromDir(entry.path);
    setGlobalLoading(false);
    if (tracks.length > 0) {
      loadQueue(tracks);
      syncQueuePlaylist(tracks);
      replaceEnqueuedPaths([entry.path]);
    }
  };

  const handleAddToQueue = async () => {
    setGlobalLoading(true);
    const tracks = await loadTracksFromDir(entry.path);
    setGlobalLoading(false);
    if (tracks.length > 0) {
      appendToQueue(tracks);
      addTracks(activePlaylistName, tracks);
      if (activePlaylistName === QUEUE_PLAYLIST_NAME) {
        saveActivePlaylist();
        recordEnqueuedPaths([entry.path]);
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
              depth > 0 && "ml-2",
              isEnqueuedExact && "border-l-2 border-primary text-primary/70" ,
              hasEnqueuedChildren && "border-l-2 border-primary/30",
              isPlaying && "bg-primary/10 text-primary font-medium"
            )}
            style={{ paddingLeft: `${(depth * 12) - 6}px` }}
            onClick={handleClick}
            onDoubleClick={isDir ? undefined : handleDoubleClick}
            title={entry.path}
          >
            {isDir ? (
              loading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <>
                  {isExpanded ? (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                  )}
                </>
              )
            ) : (
              <Music className="h-4 w-4 shrink-0" />
            )}
            <span className="whitespace-nowrap">{entry.name}</span>
          </div>
        </ContextMenuPrimitive.Trigger>
        <ContextMenuPrimitive.Portal>
          <ContextMenuPrimitive.Content
            className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
            alignOffset={-4}
          >
            <ContextMenuItem onClick={() => revealInFileManager(entry.path)}>
              <FolderOpen className="mr-2 h-3.5 w-3.5" />
              {isDir ? "Open Folder" : "Open File"}
            </ContextMenuItem>
            <ContextSeparator />
            {entry.type === "file" ? (
              <ContextMenuItem onClick={handleAddFileToQueue}>
                <PlusCircle className="mr-2 h-3.5 w-3.5" />
                Add to Queue
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
                {isRoot && (
                  <>
                    <ContextSeparator />
                    <ContextMenuItem onClick={() => onRemoveRoot?.(entry.path)}>
                      <X className="mr-2 h-3.5 w-3.5" />
                      Remove Directory
                    </ContextMenuItem>
                  </>
                )}
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
              style={{ paddingLeft: `${(depth + 1) * 12}px` }}
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

// ──── Panel ────

export function DirectoryTreePanel() {
  const rootDirs = useLibraryStore((s) => s.rootDirs);
  const searchQuery = useLibraryStore((s) => s.searchQuery);
  const setSearch = useLibraryStore((s) => s.setSearch);
  const addRootDir = useLibraryStore((s) => s.addRootDir);
  const removeRootDir = useLibraryStore((s) => s.removeRootDir);
  const collapseAll = useLibraryStore((s) => s.collapseAll);
  const refreshAll = useLibraryStore((s) => s.refreshAll);
  const [refreshing, setRefreshing] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

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

  const filteredRootDirs = filterRootDirs(rootDirs, searchQuery);

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="relative px-2 pt-2 pb-1">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <input
          id="library-search"
          type="text"
          placeholder="Search files..."
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-8 rounded-md border border-input bg-background pl-7 pr-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring"
        />
      </div>

      {/* Files header */}
      <div className="flex items-center justify-between px-2 py-1 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground">Files</span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={collapseAll}
            className="p-0.5 rounded hover:bg-accent text-muted-foreground hover:text-foreground"
            title="Collapse all"
          >
            <ChevronsUp className="h-3.5 w-3.5" />
          </button>
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

      {/* Tree */}
      <div className="flex-1 overflow-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        {filteredRootDirs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic px-3 py-2">
            {searchQuery ? "No matching files" : rootDirs.length === 0 ? "No directories added" : "No files loaded"}
          </p>
        ) : (
          filteredRootDirs.map((root) => {
            const dirName = root.path.split(/[/\\]/).filter(Boolean).pop() || root.path;
            const rootNode: FsEntry = {
              type: "dir",
              name: dirName,
              path: root.path,
              children: root.tree,
            };
            return (
              <TreeNode
                key={root.path}
                entry={rootNode}
                depth={0}
                isRoot={true}
                onRemoveRoot={setRemoveTarget}
              />
            );
          })
        )}
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        onOpenChange={() => setRemoveTarget(null)}
        title="Remove Directory"
        description="Are you sure you want to remove this directory from the library? Files on disk will not be affected."
        confirmLabel="Remove"
        onConfirm={() => {
          if (removeTarget) {
            removeRootDir(removeTarget);
            setRemoveTarget(null);
          }
        }}
      />
    </div>
  );
}
