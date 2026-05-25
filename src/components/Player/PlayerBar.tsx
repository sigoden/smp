import { NowPlayingInfo } from "./NowPlayingInfo";
import { PlaybackControls } from "./PlaybackControls";
import { ProgressBar } from "./ProgressBar";
import { VolumeSlider } from "./VolumeSlider";
import { PlayModeToggle } from "./PlayModeToggle";

export function PlayerBar() {
  return (
    <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-background">
      {/* Left: now playing info */}
      <NowPlayingInfo />

      {/* Center: controls + progress */}
      <div className="flex flex-col items-center flex-1 gap-0.5">
        <PlaybackControls />
        <ProgressBar />
      </div>

      {/* Right: play mode + volume */}
      <div className="flex items-center gap-3">
        <PlayModeToggle />
        <VolumeSlider />
      </div>
    </div>
  );
}
