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
import { useAutoSave } from "./hooks/useAutoSave";
import { useInitialization } from "./hooks/useInitialization";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTrayIntegration } from "./hooks/useTrayIntegration";

function App() {
  useAutoSave();
  useInitialization();
  useKeyboardShortcuts();
  useTrayIntegration();

  const sidebarTab = useUIStore((s) => s.sidebarTab);
  const setTab = useUIStore((s) => s.setTab);

  return (
    <TooltipProvider>
      <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden select-none">
        <LoadingBar />
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="relative flex-shrink-0 border-r border-border bg-muted/20 flex flex-col" style={{ width: "var(--sidebar-width, 256px)" }}>
            <Tabs
              value={sidebarTab}
              tabIndex={-1}
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
                  Library
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
