import { useEffect } from "react";
import { usePlayerStore } from "../stores/playerStore";
import { useUIStore } from "../stores/uiStore";

/**
 * Register global keyboard shortcuts:
 *   Space        — play/pause
 *   ArrowUp      — previous track
 *   ArrowDown    — next track
 *   M            — toggle mute
 *   Ctrl/Cmd+K   — focus library search
 *   Ctrl/Cmd+S   — toggle shuffle
 *   Ctrl/Cmd+R   — toggle repeat-one
 *
 * Shortcuts that involve typing (Space, arrows, M) are suppressed when
 * an input/textarea/select is focused.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const isInputFocused = (): boolean => {
      const tag = document.activeElement?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;
      const store = usePlayerStore.getState();

      // Ctrl+K / Cmd+K: Focus library search (always works)
      if (e.key === "k" && isMod) {
        e.preventDefault();
        useUIStore.getState().setTab("tree");
        document.getElementById("library-search")?.focus();
        return;
      }

      // Ctrl+S / Cmd+S: Toggle shuffle (always works)
      if (e.key === "s" && isMod) {
        e.preventDefault();
        store.setPlayMode(store.playMode === "shuffle" ? "sequential" : "shuffle");
        return;
      }

      // Ctrl+R / Cmd+R: Toggle repeat-one (always works)
      if (e.key === "r" && isMod) {
        e.preventDefault();
        store.setPlayMode(store.playMode === "repeat-one" ? "sequential" : "repeat-one");
        return;
      }

      // Skip remaining shortcuts when typing in inputs
      if (isInputFocused()) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          if (store.playing) store.pause();
          else store.play();
          break;
        case "p":
        case "P":
          e.preventDefault();
          store.prev();
          break;
        case "n":
        case "N":
          e.preventDefault();
          store.next();
          break;
        case "m":
        case "M":
          if (store.volume === 0) {
            store.setVolume(store.prevVolume);
          } else {
            store.setPrevVolume(store.volume);
            store.setVolume(0);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
}
