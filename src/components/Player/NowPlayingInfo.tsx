import { Disc3 } from "lucide-react";
import { usePlayerStore } from "../../stores/playerStore";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../ui/tooltip";

export function NowPlayingInfo() {
  const nowPlaying = usePlayerStore((s) => s.nowPlaying);

  if (!nowPlaying) {
    return (
      <div className="flex items-center gap-3 min-w-0 w-56">
        <div className="shrink-0 w-10 h-10 rounded bg-muted flex items-center justify-center">
          <Disc3 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground truncate">No track playing</p>
        </div>
      </div>
    );
  }

  const title =
    nowPlaying.title ||
    nowPlaying.path
      .split(/[/\\]/)
      .pop()
      ?.replace(/\.[^.]+$/, "") ||
    "Unknown";
  const artist = nowPlaying.artist || "Unknown Artist";
  const album = nowPlaying.album || "Unknown Album";

  return (
    <div className="flex items-center gap-3 min-w-0 w-56">
      <div className="shrink-0 w-10 h-10 rounded bg-accent flex items-center justify-center">
        <Disc3 className="h-5 w-5 text-accent-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-sm font-medium truncate cursor-default">
              {title}
            </p>
          </TooltipTrigger>
          <TooltipContent>{title}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-xs text-muted-foreground truncate cursor-default">
              {artist} — {album}
            </p>
          </TooltipTrigger>
          <TooltipContent>{`${artist} — ${album}`}</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
