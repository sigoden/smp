import { create } from "zustand";
import type { FsEntry, RootDir } from "../types";
import { logger } from "../lib/logger";
import { scanDirectory } from "../lib/utils";

interface LibraryState {
  rootDirs: RootDir[];
  enqueuedPaths: string[];
  searchQuery: string;

  // Actions
  addRootDir: (path: string) => Promise<void>;
  removeRootDir: (path: string) => void;
  recordEnqueuedPaths: (paths: string[]) => void;
  clearEnqueuedPaths: () => void;
  setSearch: (query: string) => void;
  toggleExpand: (path: string) => void;
  collapseAll: () => void;
  refreshDir: (path?: string) => Promise<void>;
  refreshAll: () => Promise<void>;
}

export const useLibraryStore = create<LibraryState>((set, get) => ({
  rootDirs: [],
  searchQuery: "",
  enqueuedPaths: [],

  addRootDir: async (path: string) => {
    const { rootDirs } = get();
    if (rootDirs.some((r) => r.path === path)) return;
    const entries = await scanDirectory(path);
    set((state) => ({
      rootDirs: [...state.rootDirs, { path, tree: entries, expandedPaths: [] }],
    }));
  },

  removeRootDir: (path: string) => {
    set((state) => ({
      rootDirs: state.rootDirs.filter((r) => r.path !== path),
    }));
  },

  setSearch: (query: string) => {
    set({ searchQuery: query });
  },

  recordEnqueuedPaths: (paths: string[]) => {
    const { enqueuedPaths } = get();
    const newPaths = paths.filter(p => !enqueuedPaths.includes(p));
    if (newPaths.length === 0) return;
    set({ enqueuedPaths: [...enqueuedPaths, ...newPaths] });
  },

  clearEnqueuedPaths: () => {
    const { enqueuedPaths } = get();
    if (enqueuedPaths.length === 0) return;
    set({ enqueuedPaths: [] });
  },

  collapseAll: () => {
    set((state) => ({
      rootDirs: state.rootDirs.map((r) => ({ ...r, expandedPaths: [] })),
    }));
  },

  toggleExpand: (path: string) => {
    set((state) => ({
      rootDirs: state.rootDirs.map((root) => {
        if (
          path !== root.path &&
          !path.startsWith(root.path + "/") &&
          !path.startsWith(root.path + "\\")
        ) {
          return root;
        }
        const relPath = path === root.path ? "/" : "/" + path.slice(root.path.length + 1).replace(/\\/g, "/");
        const already = root.expandedPaths.includes(relPath);
        return {
          ...root,
          expandedPaths: already
            ? root.expandedPaths.filter((p) => p !== relPath)
            : combineAndSortPaths(root.expandedPaths, relPath),
        };
      }),
    }));
  },

  refreshDir: async (path?: string) => {
    try {
      const { rootDirs } = get();
      const targetPath = path || rootDirs[0]?.path;
      if (!targetPath) return;
      const entries: FsEntry[] = await scanDirectory(targetPath);

      set((state) => ({
        rootDirs: state.rootDirs.map((root) => {
          // Check if targetPath is under this root
          if (
            targetPath !== root.path &&
            !targetPath.startsWith(root.path + "/") &&
            !targetPath.startsWith(root.path + "\\")
          ) {
            return root;
          }

          // Target is the root itself — replace tree
          if (targetPath === root.path) {
            return { ...root, tree: entries };
          }

          // Target is a subdirectory — find and update its children
          const updateChildren = (nodes: FsEntry[]): FsEntry[] =>
            nodes.map((node) => {
              if (node.type === "dir") {
                if (node.path === targetPath) {
                  return { ...node, children: entries };
                }
                return { ...node, children: updateChildren(node.children) };
              }
              return node;
            });

          return { ...root, tree: updateChildren(root.tree) };
        }),
      }));
    } catch (err) {
      logger.error("library", `refreshDir failed: ${path ?? "unknown"}`, err);
    }
  },

  refreshAll: async () => {
    const { rootDirs } = get();
    if (rootDirs.length === 0) return;
    try {
      const updated = await Promise.all(
        rootDirs.map(async (root) => {
          const entries = await scanDirectory(root.path);
          return { ...root, tree: entries };
        })
      );
      set({ rootDirs: updated });
    } catch (err) {
      logger.error("library", "refreshAll failed", err);
    }
  },
}));


function combineAndSortPaths(oldPaths: string[], path: string) {
  const newPaths = [...oldPaths, path];
  newPaths.sort((a, b) =>
    a.localeCompare(b, undefined, {
      numeric: true,
      sensitivity: "base",
    })
  );
  return newPaths;
}