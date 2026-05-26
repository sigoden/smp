import { usePlayerStore } from "../../stores/playerStore";
import { Slider } from "../ui/slider";

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
    <div className="w-full">
      <Slider
        value={[Math.min(position, max)]}
        onValueChange={handleSeek}
        min={0}
        max={max}
        step={0.5}
        disabled={!hasTracks}
      />
    </div>
  );
}
