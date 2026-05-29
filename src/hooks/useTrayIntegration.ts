import { useEffect } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { usePlayerStore } from "../stores/playerStore";
import { trackTitle, trackArtist } from "../lib/utils";

/**
 * Sync playback state to the Tauri system tray:
 *   — Update tray tooltip with current track info whenever playingTrack changes
 *   — Update tray Play/Pause menu label whenever playing state changes
 */
export function useTrayIntegration() {
  const playingTrack = usePlayerStore((s) => s.playingTrack);
  const playing = usePlayerStore((s) => s.playing);

  useEffect(() => {
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

    return () => {
      unlistenPlayPause.then((fn) => fn());
    };
  }, []);

  useEffect(() => {
    if (playingTrack) {
      const text = `${trackTitle(playingTrack)} — ${trackArtist(playingTrack)}`;
      emit("update-tray-tooltip", text);
    } else {
      emit("update-tray-tooltip", "Music Player");
    }
  }, [playingTrack]);

  useEffect(() => {
    emit("update-tray-play-state", playing ? "true" : "false");
  }, [playing]);
}
