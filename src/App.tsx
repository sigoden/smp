import { useEffect } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { DirectoryTreePanel } from "./components/Sidebar/DirectoryTreePanel";
import { PlaylistPanel } from "./components/Sidebar/PlaylistPanel";
import { TrackListHeader } from "./components/TrackList/TrackListHeader";
import { TrackTable } from "./components/TrackList/TrackTable";
import { PlayerBar } from "./components/Player/PlayerBar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";
import { ScrollArea } from "./components/ui/scroll-area";
import { useUIStore } from "./stores/uiStore";
import { usePlayerStore } from "./stores/playerStore";
import { usePlaylistStore } from "./stores/playlistStore";
import { setCallbacks } from "./lib/audio";

function App() {
  const sidebarTab = useUIStore((s) => s.sidebarTab);
  const setTab = useUIStore((s) => s.setTab);
  const setPosition = usePlayerStore((s) => s.setPosition);
  const setDuration = usePlayerStore((s) => s.setDuration);
  const next = usePlayerStore((s) => s.next);
  const playerPlay = usePlayerStore((s) => s.play);
  const playerPause = usePlayerStore((s) => s.pause);
  const playerStop = usePlayerStore((s) => s.stop);
  const playerNext = usePlayerStore((s) => s.next);
  const playerPrev = usePlayerStore((s) => s.prev);
  const loadPlaylists = usePlaylistStore((s) => s.loadPlaylists);

  // Load playlists on mount
  useEffect(() => {
    loadPlaylists();

    // Set up audio callbacks
    setCallbacks({
      onTimeUpdate: (currentTime) => {
        setPosition(currentTime);
      },
      onDurationChange: (duration) => {
        setDuration(duration);
      },
      onEnded: () => {
        next();
      },
      onError: (error) => {
        console.error(error);
      },
    });

    // Listen for tray actions
    const unlistenPlayPause = listen<string>("tray-action", (event) => {
      switch (event.payload) {
        case "play-pause": {
          const playing = usePlayerStore.getState().playing;
          if (playing) playerPause();
          else playerPlay();
          break;
        }
        case "next":
          playerNext();
          break;
        case "prev":
          playerPrev();
          break;
        case "stop":
          playerStop();
          break;
      }
    });

    return () => {
      unlistenPlayPause.then((fn) => fn());
    };
  }, []);

  // Update tray tooltip when nowPlaying changes
  const nowPlaying = usePlayerStore((s) => s.nowPlaying);
  useEffect(() => {
    if (nowPlaying) {
      const text = `${nowPlaying.title || "Unknown"} - ${nowPlaying.artist || "Unknown Artist"}`;
      emit("update-tray-tooltip", text);
    } else {
      emit("update-tray-tooltip", "Music Player");
    }
  }, [nowPlaying]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden select-none">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 border-r border-border bg-muted/20 flex flex-col">
          <Tabs
            value={sidebarTab}
            onValueChange={(v) => setTab(v as "tree" | "playlist")}
            className="flex flex-col h-full"
          >
            <ScrollArea className="flex-1 px-2 py-2">
              <TabsContent value="tree" className="mt-0 data-[state=active]:flex flex-col h-full">
                <DirectoryTreePanel />
              </TabsContent>
              <TabsContent value="playlist" className="mt-0 data-[state=active]:flex flex-col h-full">
                <PlaylistPanel />
              </TabsContent>
            </ScrollArea>

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
  );
}

export default App;
