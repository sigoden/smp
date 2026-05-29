import { useCallback, useEffect, useRef } from "react";
import { usePlayerStore } from "../stores/playerStore";
import { useLibraryStore } from "../stores/libraryStore";
import { useUIStore } from "../stores/uiStore";
import { usePlaylistStore } from "../stores/playlistStore";
import { savePersistedState } from "../lib/utils";

/**
 * Subscribe to all Zustand stores and throttle-persist state changes to disk.
 * Must be called before useInitialization() so subscriptions are registered
 * before the initial state restore triggers store writes.
 */
export function useAutoSave() {
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRunRef = useRef<number>(0);
  const lastSavedJsonRef = useRef<string | null>(null);

  const performSave = () => {
    const player = usePlayerStore.getState();
    const library = useLibraryStore.getState();
    const ui = useUIStore.getState();
    const playlist = usePlaylistStore.getState();

    const persistedState = {
      root_dirs: library.rootDirs.map((r) => ({
        path: r.path,
        expanded_paths: r.expandedPaths,
      })),
      enqueued_paths: library.enqueuedPaths,
      volume: player.volume,
      prev_volume: player.prevVolume,
      play_mode: player.playMode,
      visible_columns: ui.visibleColumns,
      sidebar_tab: ui.sidebarTab,
      sidebar_width: ui.sidebarWidth,
      active_playlist_name: playlist.activePlaylistName,
      track_index: player.currentIndex,
    };

    // Serialized dirty check: skip IPC if nothing relevant changed
    const json = JSON.stringify(persistedState);
    if (json === lastSavedJsonRef.current) return;
    lastSavedJsonRef.current = json;

    savePersistedState(persistedState);
  };

  const scheduleSave = useCallback(() => {
    const now = Date.now();
    const elapsed = now - lastRunRef.current;
    const delay = 500;

    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }

    if (elapsed >= delay) {
      // Execute immediately if enough time has passed
      lastRunRef.current = now;
      performSave();
    } else {
      // Schedule a trailing execution to ensure the latest state is saved
      saveTimerRef.current = setTimeout(() => {
        lastRunRef.current = Date.now();
        performSave();
      }, delay - elapsed);
    }
  }, []);

  // Subscribe to store changes for auto-save
  useEffect(() => {
    const unsubPlayer = usePlayerStore.subscribe(() => scheduleSave());
    const unsubLibrary = useLibraryStore.subscribe(() => scheduleSave());
    const unsubUI = useUIStore.subscribe(() => scheduleSave());
    const unsubPlaylist = usePlaylistStore.subscribe(() => scheduleSave());

    return () => {
      unsubPlayer();
      unsubLibrary();
      unsubUI();
      unsubPlaylist();
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
    };
  }, [scheduleSave]);
}
