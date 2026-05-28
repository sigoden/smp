import { create } from "zustand";
import type { FsEntry } from "../types";
import { logger } from "../lib/logger";
import { scanDirectory } from "../lib/utils";

interface LibraryState {
  rootDirs: string[];
  treeData: FsEntry[];
  searchQuery: string;
  expandedPaths: Set<string>;

  // Actions
  addRootDir: (path: string) => Promise<void>;
  removeRootDir: (path: string) => void;
  setSearch: (query: string) => void;
  toggleExpand: (path: string) => void;
  refreshDir: (path?: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  rootDirs: [],
  treeData: [],
  searchQuery: "",
  expandedPaths: new Set<string>(),

  addRootDir: async (path: string) => {
    const { rootDirs, refreshDir } = get();
    if (rootDirs.includes(path)) return;
    set({ rootDirs: [...rootDirs, path] });
    await refreshDir(path);
  },

  removeRootDir: (path: string) => {
    const { rootDirs, treeData } = get();
    set({
      rootDirs: rootDirs.filter((d) => d !== path),
      treeData: treeData.filter((entry) => entry.path !== path),
    });
  },

  setSearch: (query: string) => {
    set({ searchQuery: query });
  },

  toggleExpand: (path: string) => {
    const expanded = new Set(get().expandedPaths);
    if (expanded.has(path)) {
      expanded.delete(path);
    } else {
      expanded.add(path);
    }
    set({ expandedPaths: expanded });
  },

  refreshDir: async (path?: string) => {
    try {
      const targetPath = path || (get().rootDirs[0]);
      if (!targetPath) return;
      const entries: FsEntry[] = await scanDirectory(targetPath);
      const { treeData, rootDirs } = get();

      // If refreshing a root dir or no specific path given, replace entire tree
      if (!path || rootDirs.includes(path)) {
        set({ treeData: entries });
      } else {
        // Update only the children of the matching node in-place
        const updateChildren = (nodes: FsEntry[]): FsEntry[] =>
          nodes.map((node) => {
            if (node.type === "dir") {
              if (node.path === path) {
                return { ...node, children: entries };
              }
              return { ...node, children: updateChildren(node.children) };
            }
            return node;
          });
        set({ treeData: updateChildren(treeData) });
      }
    } catch (err) {
      logger.error("library", `refreshDir failed: ${path ?? 'unknown'}`, err);
    }
  },

  refreshAll: async () => {
    const { rootDirs } = get();
    if (rootDirs.length === 0) {
      set({ treeData: [] });
      return;
    }
    try {
      const results = await Promise.all(rootDirs.map((dir) => scanDirectory(dir)));
      set({ treeData: results.flat() });
    } catch (err) {
      logger.error("library", "refreshAll failed", err);
    }
  },
}));
