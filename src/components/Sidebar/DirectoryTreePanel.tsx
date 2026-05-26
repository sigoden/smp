import { useState, useRef } from "react";

import { Music, Search, Plus, X, Loader2, RotateCcw, ChevronRight, ChevronDown } from "lucide-react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useLibraryStore } from "../../stores/libraryStore";
import { usePlayerStore } from "../../stores/playerStore";
import { cn } from "../../lib/utils";
import type { FsEntry, Track, TrackMetadata } from "../../types";

function TreeNode({
  entry,
  depth = 0,
}: {
  entry: FsEntry;
  depth?: number;
}) {
  const expandedPaths = useLibraryStore((s) => s.expandedPaths);
  const toggleExpand = useLibraryStore((s) => s.toggleExpand);
  const appendAndPlay = usePlayerStore((s) => s.appendAndPlay);
  const playTrack = usePlayerStore((s) => s.playTrack);
  const queue = usePlayerStore((s) => s.queue);
  const currentIndex = usePlayerStore((s) => s.currentIndex);
  const refreshDir = useLibraryStore((s) => s.refreshDir);
  const [loading, setLoading] = useState(false);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDir = entry.type === "dir";
  const isExpanded = isDir && expandedPaths.has(entry.path);
  const isPlaying = !isDir && queue[currentIndex]?.path === entry.path;

  /** Load all audio files from a directory and append to the queue */
  const loadDirectory = async (dirPath: string) => {
    try {
      const files: string[] = await invoke("get_audio_files", { path: dirPath });
      if (files.length === 0) return;
      const metadata: TrackMetadata[] = await invoke("get_metadata_batch", { paths: files });
      const tracks: Track[] = metadata.map((m) => ({
        path: m.path,
        title: m.title ?? "",
        artist: m.artist ?? "",
        album: m.album ?? "",
        duration: m.duration,
      }));
      appendAndPlay(tracks);
    } catch (err) {
      console.error("Failed to load directory:", err);
    }
  };

  const handleClick = () => {
    if (isDir) {
      // Cancel if this click is part of a double-click
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
        return;
      }
      // Small delay to distinguish single vs double click
      clickTimerRef.current = setTimeout(async () => {
        clickTimerRef.current = null;
        if (!isExpanded) {
          setLoading(true);
          await refreshDir(entry.path);
          setLoading(false);
        }
        toggleExpand(entry.path);
      }, 200);
    }
  };

  const handleDoubleClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
      clickTimerRef.current = null;
    }
    if (isDir) {
      // Append all audio files from this directory to the queue
      loadDirectory(entry.path);
    } else {
      // If track is already in the queue, jump to it; otherwise append and play
      const existingIdx = queue.findIndex((t) => t.path === entry.path);
      if (existingIdx >= 0) {
        playTrack(queue[existingIdx]);
      } else {
        const track: Track = {
          path: entry.path,
          title: "",
          artist: "",
          album: "",
          duration: 0,
        };
        appendAndPlay([track]);
      }
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded text-sm cursor-pointer hover:bg-accent/50 select-none",
          depth > 0 && "ml-4",
          isPlaying && "text-accent-foreground bg-accent/30"
        )}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
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
