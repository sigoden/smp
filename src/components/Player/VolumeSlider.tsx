import { VolumeX, Volume2 } from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";
import { Slider } from "../ui/slider";

export function VolumeSlider() {
  const volume = usePlayerStore((s) => s.volume);
  const prevVolume = usePlayerStore((s) => s.prevVolume);
  const setVolume = usePlayerStore((s) => s.setVolume);
  const setPrevVolume = usePlayerStore((s) => s.setPrevVolume);
  const muted = volume === 0;
  const handleIconClick = () => {

    if (muted) {
      setVolume(prevVolume);
    } else {
      setPrevVolume(volume);
      setVolume(0);
    }
  };
  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
  };

  return (
    <div className="flex items-center gap-2 min-w-[8rem]">
      <button
        onClick={handleIconClick}
        className="p-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </button>
      <Slider
        value={[muted ? 0 : volume]}
        onValueChange={handleVolumeChange}
        min={0}
        max={1}
        step={0.01}
        className="w-24"
      />
    </div>
  );
}
