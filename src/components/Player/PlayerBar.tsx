import { NowPlayingInfo } from "./NowPlayingInfo";
import { PlaybackControls } from "./PlaybackControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeSlider } from "./VolumeSlider";
import { PlayModeToggle } from "./PlayModeToggle";
import { usePlayerStore } from "../../stores/playerStore";
import { formatTrackDuration } from "../../lib/utils";

export function PlayerBar() {
  const position = usePlayerStore((s) => s.position);
  const duration = usePlayerStore((s) => s.duration);
  const queue = usePlayerStore((s) => s.queue);
  const hasTracks = queue.length > 0;

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-background">
      {/* Left: playback controls */}
      <PlaybackControls />

      {/* Center: now playing info + progress + time */}
      <div className="flex flex-col items-center flex-1 min-w-0 gap-0.5">
        {/* Row 1: song info */}
        <NowPlayingInfo />

        {/* Row 2: progress slider */}
        <ProgressBar />

        {/* Row 3: time display */}
        <div className="flex justify-between w-full text-xs text-muted-foreground tabular-nums">
          <span>{hasTracks ? formatTrackDuration(position, "0:00") : "0:00"}</span>
          <span>{hasTracks ? formatTrackDuration(duration, "0:00") : "0:00"}</span>
        </div>
      </div>

      {/* Right: play mode + volume */}
      <div className="flex items-center gap-3">
        <PlayModeToggle />
        <VolumeSlider />
      </div>
    </div>
  );
}
