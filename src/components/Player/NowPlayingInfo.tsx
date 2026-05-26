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
      <div className="min-w-0 w-full max-w-xl">
        <p className="text-sm text-muted-foreground truncate text-center">No track playing</p>
      </div>
    );
  }

  const title = nowPlaying.title || nowPlaying.path.split(/[/\\]/).pop() || "??";
  const subtitle = [nowPlaying.artist, nowPlaying.album].filter(Boolean).join(" — ");

  return (
    <div className="min-w-0 w-full">
      <Tooltip>
        <TooltipTrigger asChild>
          <p className="text-sm font-medium truncate text-center cursor-default">
            {title}
          </p>
        </TooltipTrigger>
        <TooltipContent>{title}</TooltipContent>
      </Tooltip>
      {subtitle && (
        <Tooltip>
          <TooltipTrigger asChild>
            <p className="text-xs text-muted-foreground truncate text-center cursor-default">
              {subtitle}
            </p>
          </TooltipTrigger>
          <TooltipContent>{subtitle}</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}
