import { usePlayerStore } from "../../stores/playerStore";
import { trackTitle, trackArtist, trackAlbum } from "../../lib/utils";

export function PlayingTrackInfo() {
  const playingTrack = usePlayerStore((s) => s.playingTrack);

  if (!playingTrack) {
    return (
      <div className="min-w-0 w-full max-w-xl">
        <p className="text-sm text-muted-foreground truncate text-center">No track playing</p>
      </div>
    );
  }

  const title = trackTitle(playingTrack);
  const subtitle = [trackArtist(playingTrack), trackAlbum(playingTrack)].filter(Boolean).join(" — ");

  return (
    <div className="min-w-0 w-full">
      <p className="text-sm font-medium truncate text-center cursor-default">
        {title}
      </p>
      {subtitle && (
        <p className="text-xs text-muted-foreground truncate text-center cursor-default">
          {subtitle}
        </p>
      )}
    </div>
  );
}
