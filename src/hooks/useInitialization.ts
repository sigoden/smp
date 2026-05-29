import { useEffect } from "react";
import { logger } from "../lib/logger";
import { usePlayerStore } from "../stores/playerStore";
import { useLibraryStore } from "../stores/libraryStore";
import { useUIStore } from "../stores/uiStore";
import { usePlaylistStore } from "../stores/playlistStore";
import { setCallbacks } from "../lib/audio";
import { loadPersistedState } from "../lib/utils";
import type { PlayMode, SidebarTab, TrackColumn } from "../types";

/**
 * Load persisted state on mount, apply it to all Zustand stores,
 * set up audio callbacks, and register the tray-action event listener.
 */
export function useInitialization() {
  useEffect(() => {
    const init = async () => {
      try {
        const persistedState = await loadPersistedState();

        // Apply sidebar width — sync both Zustand and the CSS variable
        useUIStore.setState({ sidebarWidth: persistedState.sidebar_width });
        document.documentElement.style.setProperty("--sidebar-width", `${persistedState.sidebar_width}px`);

        // Apply loaded persisted state to stores via setState to trigger proper reactivity
        if (persistedState.root_dirs.length > 0) {
          useLibraryStore.setState({
            rootDirs: persistedState.root_dirs.map((r) => ({
              path: r.path,
              tree: [],
              expandedPaths: r.expanded_paths,
            })),
            enqueuedPaths: persistedState.enqueued_paths || [],
          });
          // Scan each root dir to populate trees
          await useLibraryStore.getState().refreshAll();
        }

        const playerStore = usePlayerStore.getState();
        playerStore.setVolume(persistedState.volume);
        playerStore.setPrevVolume(persistedState.prev_volume);
        playerStore.setPlayMode(persistedState.play_mode as PlayMode);

        useUIStore.setState({
          sidebarTab: persistedState.sidebar_tab as SidebarTab,
          visibleColumns: persistedState.visible_columns as TrackColumn[],
        });

        const playlistsStore = usePlaylistStore.getState();

        // Load playlists from disk (lightweight — no tracks yet)
        await playlistsStore.loadPlaylists();

        playlistsStore.setActivePlaylist(persistedState.active_playlist_name);

        // Fetch tracks for the active playlist and load into queue
        const resolvedTracks = await playlistsStore.fetchTracksForPlaylist(playlistsStore.activePlaylistName);
        let startIndex: number | undefined;
        if (persistedState.track_index >= 0 && persistedState.track_index < resolvedTracks.length) {
          startIndex = persistedState.track_index;
        } else if (resolvedTracks.length > 0) {
          startIndex = 0;
        }
        playerStore.loadQueue(resolvedTracks, startIndex);
      } catch (err) {
        logger.error("init failed", err);
      }
    };

    init();

    // Set up audio callbacks
    setCallbacks({
      onTimeUpdate: (currentTime) => {
        usePlayerStore.getState().setPosition(currentTime);
      },
      onDurationChange: (duration) => {
        usePlayerStore.getState().setDuration(duration);
      },
      onEnded: () => {
        usePlayerStore.getState().next();
      },
      onError: (error) => {
        console.error(error);
      },
    }); 
  }, []);
}
