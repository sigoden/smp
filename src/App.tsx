import { useCallback, useEffect, useRef } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { logger } from "./lib/logger";
import { DirectoryTreePanel } from "./components/Sidebar/DirectoryTreePanel";
import { PlaylistPanel } from "./components/Sidebar/PlaylistPanel";
import { ResizeHandle } from "./components/Sidebar/ResizeHandle";
import { TrackListHeader } from "./components/TrackList/TrackListHeader";
import { TrackTable } from "./components/TrackList/TrackTable";
import { PlayerBar } from "./components/Player/PlayerBar";
import { LoadingBar } from "./components/ui/loading-bar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { TooltipProvider } from "./components/ui/tooltip";
import { useUIStore } from "./stores/uiStore";
import { usePlayerStore } from "./stores/playerStore";
import { usePlaylistStore } from "./stores/playlistStore";
import { useLibraryStore } from "./stores/libraryStore";
import { setCallbacks } from "./lib/audio";
import { loadSettings, saveSettings, trackTitle, trackArtist } from "./lib/utils";
import type { PlayMode, SidebarTab, TrackColumn } from "./types";

function App() {
  const sidebarTab = useUIStore((s) => s.sidebarTab);
  const setTab = useUIStore((s) => s.setTab);
  // Audio/tray callbacks use usePlayerStore.getState() at call-time; no captured selectors needed

  // Throttle auto-save: executes immediately if 500ms since last run, otherwise schedules trailing
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRunRef = useRef<number>(0);
  const lastSavedJsonRef = useRef<string | null>(null);

  const performSave = () => {
    const player = usePlayerStore.getState();
    const library = useLibraryStore.getState();
    const ui = useUIStore.getState();
    const playlist = usePlaylistStore.getState();

    const settings = {
      sidebar_width: ui.sidebarWidth,
      root_dirs: library.rootDirs.map((r) => ({
        path: r.path,
        expanded_paths: r.expandedPaths,
      })),
      volume: player.volume,
      play_mode: player.playMode,
      visible_columns: ui.visibleColumns,
      sidebar_tab: ui.sidebarTab,
      active_playlist_name: playlist.activePlaylistName,
      track_index: player.currentIndex,
    };

    // Serialized dirty check: skip IPC if nothing relevant changed
    const json = JSON.stringify(settings);
    if (json === lastSavedJsonRef.current) return;
    lastSavedJsonRef.current = json;

    saveSettings(settings);
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

  // Load settings on mount
  useEffect(() => {
    const init = async () => {
      try {
        const settings = await loadSettings();

        // Apply sidebar width — sync both Zustand and the CSS variable
        useUIStore.setState({ sidebarWidth: settings.sidebar_width });
        document.documentElement.style.setProperty("--sidebar-width", `${settings.sidebar_width}px`);

        // Apply loaded settings to stores via setState to trigger proper reactivity
        if (settings.root_dirs.length > 0) {
          useLibraryStore.setState({
            rootDirs: settings.root_dirs.map((r) => ({
              path: r.path,
              tree: [],
              expandedPaths: r.expanded_paths,
            })),
          });
          // Scan each root dir to populate trees
          await useLibraryStore.getState().refreshAll();
        }

        const playerStore = usePlayerStore.getState();
        playerStore.setVolume(settings.volume);
        playerStore.setPlayMode(settings.play_mode as PlayMode);

        useUIStore.setState({
          sidebarTab: settings.sidebar_tab as SidebarTab,
          visibleColumns: settings.visible_columns as TrackColumn[],
        });

        const playlistsStore = usePlaylistStore.getState();

        // Load playlists from disk (lightweight — no tracks yet)
        await playlistsStore.loadPlaylists();

        playlistsStore.setActivePlaylist(settings.active_playlist_name);

        // Fetch tracks for the active playlist and load into queue
        const activeName = playlistsStore.getActivePlaylist().name;
        const resolvedTracks = await playlistsStore.fetchTracksForPlaylist(activeName);
        let startIndex: number | undefined;
        if (settings.track_index >= 0 && settings.track_index < resolvedTracks.length) {
          startIndex = settings.track_index;
        } else if (resolvedTracks.length > 0) {
          startIndex = 0;
        }
        playerStore.loadQueue(resolvedTracks, startIndex);
      } catch (err) {
        logger.error("app", "init failed", err);
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

    // Listen for tray actions
    const unlistenPlayPause = listen<string>("tray-action", (event) => {
      const store = usePlayerStore.getState();
      switch (event.payload) {
        case "play-pause":
          if (store.playing) store.pause();
          else store.play();
          break;
        case "next":
          store.next();
          break;
        case "prev":
          store.prev();
          break;
      }
    });

    // Subscribe to store changes for auto-save
    const unsubPlayer = usePlayerStore.subscribe(() => scheduleSave());
    const unsubLibrary = useLibraryStore.subscribe(() => scheduleSave());
    const unsubUI = useUIStore.subscribe(() => scheduleSave());
    const unsubPlaylist = usePlaylistStore.subscribe(() => scheduleSave());

    return () => {
      unlistenPlayPause.then((fn) => fn());
      unsubPlayer();
      unsubLibrary();
      unsubUI();
      unsubPlaylist();
    };
  }, [scheduleSave]);

  // Update tray tooltip when nowPlaying changes
  const nowPlaying = usePlayerStore((s) => s.nowPlaying);
  useEffect(() => {
    if (nowPlaying) {
      const text = `${trackTitle(nowPlaying)} — ${trackArtist(nowPlaying)}`;
      emit("update-tray-tooltip", text);
    } else {
      emit("update-tray-tooltip", "Music Player");
    }
  }, [nowPlaying]);

  // Update tray play/pause label when playing state changes
  const playing = usePlayerStore((s) => s.playing);
  useEffect(() => {
    emit("update-tray-play-state", playing ? "true" : "false");
  }, [playing]);

  return (
    <TooltipProvider>
      <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden select-none">
        <LoadingBar />
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="relative flex-shrink-0 border-r border-border bg-muted/20 flex flex-col" style={{ width: "var(--sidebar-width, 256px)" }}>
            <Tabs
              value={sidebarTab}
              onValueChange={(v) => setTab(v as "tree" | "playlist")}
              className="flex flex-col h-full"
            >
              <div className="flex-1 px-2 py-2 overflow-hidden">
                <TabsContent value="tree" className="mt-0 data-[state=active]:flex flex-col h-full">
                  <DirectoryTreePanel />
                </TabsContent>
                <TabsContent value="playlist" className="mt-0 data-[state=active]:flex flex-col h-full">
                  <PlaylistPanel />
                </TabsContent>
              </div>

              {/* Sidebar tab buttons at bottom */}
              <TabsList className="grid grid-cols-2 mx-2 mb-2 mt-auto flex-shrink-0">
                <TabsTrigger value="tree" className="text-xs">
                  Files
                </TabsTrigger>
                <TabsTrigger value="playlist" className="text-xs">
                  Playlists
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <ResizeHandle />
          </aside>

          {/* Right panel */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {/* Track list header (column config + playlist name) */}
            <TrackListHeader />

            {/* Track table */}
            <div className="flex-1 overflow-hidden">
              <TrackTable />
            </div>
          </main>
        </div>

        {/* Bottom player bar */}
        <PlayerBar />
      </div>
    </TooltipProvider>
  );
}

export default App;
