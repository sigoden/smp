import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PlaylistData } from "../types";
import { QUEUE_PLAYLIST_NAME } from "./constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createQueuePlaylist(): PlaylistData {
  return {
    name: QUEUE_PLAYLIST_NAME,
    tracks: [],
    loaded: true,
    track_count: 0,
  }
}