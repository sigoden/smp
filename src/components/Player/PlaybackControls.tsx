import { SkipBack, Play, Pause, SkipForward } from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";
import { cn } from "../../lib/utils";

function ControlButton({
  icon: Icon,
  onClick,
  disabled = false,
  size = "md",
  highlight = false,
  title,
}: {
  icon: typeof Play;
  onClick: () => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  highlight?: boolean;
  title?: string;
}) {
  const sizeClasses = {
    sm: "p-1",
    md: "p-1.5",
    lg: "p-2",
  };

  const iconSizes = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "rounded-full transition-colors",
        sizeClasses[size],
        highlight
          ? "bg-accent text-accent-foreground hover:bg-accent/80"
          : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
        disabled && "opacity-40 cursor-not-allowed"
      )}
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
}

export function PlaybackControls() {
  const playing = usePlayerStore((s) => s.playing);
  const queue = usePlayerStore((s) => s.queue);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const next = usePlayerStore((s) => s.next);
  const prev = usePlayerStore((s) => s.prev);

  const hasTracks = queue.length > 0;

  return (
    <div className="flex items-center gap-1">
      <ControlButton
        icon={SkipBack}
        onClick={prev}
        disabled={!hasTracks}
        title="Previous Track"
      />
      <ControlButton
        icon={playing ? Pause : Play}
        onClick={playing ? pause : play}
        disabled={!hasTracks}
        size="lg"
        highlight
        title={playing ? "Pause" : "Play"}
      />
      <ControlButton
        icon={SkipForward}
        onClick={next}
        disabled={!hasTracks}
        title="Next Track"
      />
    </div>
  );
}
