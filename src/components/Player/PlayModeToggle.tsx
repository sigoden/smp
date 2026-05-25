import { List, Repeat, Shuffle } from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";
import { cn } from "../../lib/utils";
import type { PlayMode } from "../../types";

const modes: { mode: PlayMode; icon: typeof List; label: string }[] = [
  { mode: "sequential", icon: List, label: "Sequential" },
  { mode: "repeat-one", icon: Repeat, label: "Repeat One" },
  { mode: "shuffle", icon: Shuffle, label: "Shuffle" },
];

export function PlayModeToggle() {
  const playMode = usePlayerStore((s) => s.playMode);
  const setPlayMode = usePlayerStore((s) => s.setPlayMode);

  const handleCycle = () => {
    const currentIndex = modes.findIndex((m) => m.mode === playMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setPlayMode(modes[nextIndex].mode);
  };

  const currentMode = modes.find((m) => m.mode === playMode)!;

  return (
    <button
      onClick={handleCycle}
      className={cn(
        "p-1.5 rounded-full transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-accent/50"
      )}
      title={`Play Mode: ${currentMode.label}`}
    >
      <currentMode.icon className="h-4 w-4" />
    </button>
  );
}
