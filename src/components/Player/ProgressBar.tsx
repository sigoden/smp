import { usePlayerStore } from "../../stores/playerStore";
import { Slider } from "../ui/slider";

function formatTime(seconds: number): string {
  if (!seconds || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ProgressBar() {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const seek = usePlayerStore((s) => s.seek);
  const queue = usePlayerStore((s) => s.queue);

  const hasTracks = queue.length > 0;
  const max = duration > 0 ? duration : 1;

  const handleSeek = (value: number[]) => {
    seek(value[0]);
  };

  return (
    <div className="flex items-center gap-2 flex-1 max-w-xl">
      <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
        {formatTime(position)}
      </span>
      <Slider
        value={[Math.min(position, max)]}
        onValueChange={handleSeek}
        min={0}
        max={max}
        step={0.5}
        disabled={!hasTracks}
        className="flex-1"
      />
      <span className="text-xs text-muted-foreground tabular-nums w-10">
        {formatTime(duration)}
      </span>
    </div>
  );
}
