import { create } from "zustand";
import type { Track, PlayMode } from "../types";
import * as audio from "../lib/audio";
import { logger } from "../lib/logger";

// Guards the next timeupdate callback after a seek() to avoid stale position overwrite
let _seekGuard = false;

interface PlayerState {
  queue: Track[];
  currentIndex: number;
  playing: boolean;
  volume: number;
  position: number;
  duration: number;
  playMode: PlayMode;
  nowPlaying: Track | null;

  // Actions
  loadQueue: (tracks: Track[], index?: number) => void;
  appendToQueue: (tracks: Track[]) => void;
  pushQueueAndPlay: (track: Track) => void;
  play: () => void;
  pause: () => void;
  stop: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setPlayMode: (mode: PlayMode) => void;
  setPosition: (pos: number) => void;
  setDuration: (dur: number) => void;
  playTrack: (track: Track) => Promise<void>;
  clearQueue: () => void;
}

function getNextIndex(
  queue: Track[],
  currentIndex: number,
  playMode: PlayMode
): number {
  if (queue.length === 0) return -1;

  switch (playMode) {
    case "repeat-one":
      return currentIndex;
    case "shuffle": {
      if (queue.length <= 1) return 0;
      let next: number;
      do {
        next = Math.floor(Math.random() * queue.length);
      } while (next === currentIndex && queue.length > 1);
      return next;
    }
    case "sequential":
    default: {
      const next = currentIndex + 1;
      return next >= queue.length ? 0 : next;
    }
  }
}

function getPrevIndex(
  queue: Track[],
  currentIndex: number
): number {
  const prev = currentIndex - 1;
  return prev < 0 ? queue.length - 1 : prev;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  playing: false,
  volume: 0.8,
  position: 0,
  duration: 0,
  playMode: "sequential",
  nowPlaying: null,

  loadQueue: (tracks, startIndex) => {
    if (tracks.length === 0)  return;
    audio.pause();
    audio.stop();
    const { playMode } = get();
    let currentIndex = 0;
    if (startIndex !== undefined) {
      if (startIndex >= 0 && startIndex < tracks.length) {
        currentIndex = startIndex;
      }
    } else if (playMode === "shuffle") {
      currentIndex = Math.floor(Math.random() * tracks.length);
    }
    const track = tracks[currentIndex];
    set({
      queue: tracks,
      currentIndex: currentIndex,
      position: 0,
      duration: 0,
      playing: false,
      nowPlaying: track,
    });

    audio.loadTrack(track.path);
  },

  appendToQueue: (tracks: Track[]) => {
    if (tracks.length === 0) return;
    const { queue, currentIndex, playMode } = get();
    const existingPaths = new Set(queue.map((t) => t.path));
    const newTracks = tracks.filter((t) => !existingPaths.has(t.path));

    if (newTracks.length === 0) return;

    const newQueue = [...queue, ...newTracks];
    let newIndex = currentIndex;
    if (queue.length === 0) {
      newIndex = playMode === "shuffle" ? Math.floor(Math.random() * newQueue.length) : 0;
    }
    set({
      queue: newQueue,
      currentIndex: newIndex,
    });
  },

  pushQueueAndPlay: (track: Track) => {
    const { queue } = get();

    let newQueue = queue;
    let index = queue.findIndex((t) => t.path === track.path);
    if (index === - 1) {
      newQueue = [...queue, track];
      index = newQueue.length - 1;
    }
    audio.loadTrack(track.path);
    set({
      queue: newQueue,
      currentIndex: index,
      nowPlaying: track,
      position: 0,
      duration: track.duration_ms / 1000,
      playing: true,
    });
    audio.play();
  },

  play: () => {
    audio.play();
    set({ playing: true });
  },

  pause: () => {
    audio.pause();
    set({ playing: false });
  },

  stop: () => {
    audio.stop();
    set({ playing: false, position: 0 });
  },

  next: () => {
    const { queue, currentIndex, playMode } = get();
    const nextIdx = getNextIndex(queue, currentIndex, playMode);
    if (nextIdx < 0 || nextIdx >= queue.length) return;

    const track = queue[nextIdx];
    audio.loadTrack(track.path);
    set({
      currentIndex: nextIdx,
      nowPlaying: track,
      position: 0,
      duration: track.duration_ms / 1000,
      playing: true,
    });
    audio.play();
  },

  prev: () => {
    const { queue, currentIndex } = get();
    // If more than 3 seconds in, restart current track instead
    const currentTime = audio.getCurrentTime();
    if (currentTime > 3) {
      audio.seek(0);
      _seekGuard = true;
      set({ position: 0 });
      return;
    }

    const prevIdx = getPrevIndex(queue, currentIndex);
    if (prevIdx < 0 || prevIdx >= queue.length) return;

    const track = queue[prevIdx];
    audio.loadTrack(track.path);
    set({
      currentIndex: prevIdx,
      nowPlaying: track,
      position: 0,
      duration: track.duration_ms / 1000,
      playing: true,
    });
    audio.play();
  },

  seek: (time: number) => {
    audio.seek(time);
    _seekGuard = true;
    set({ position: time });
  },

  setVolume: (volume: number) => {
    audio.setVolume(volume);
    set({ volume });
  },

  setPlayMode: (mode: PlayMode) => {
    set({ playMode: mode });
  },

  setPosition: (pos: number) => {
    // Suppress stale timeupdate that was queued before a seek()
    if (_seekGuard) {
      _seekGuard = false;
      return;
    }
    set({ position: pos });
  },
  setDuration: (dur: number) => set({ duration: dur }),

  playTrack: async (track: Track) => {
    const { queue } = get();
    const idx = queue.findIndex((t) => t.path === track.path);
    if (idx === -1) {
      logger.error("player", `Unable to play track, Track '${track.path}' is not in queue`);
      return;
    }
    set({ currentIndex: idx });
    audio.loadTrack(track.path);
    set({
      nowPlaying: track,
      position: 0,
      duration: 0,
      playing: true,
    });
    audio.play();
  },

  clearQueue: () => {
    audio.pause();
    audio.stop();
    set({
      queue: [],
      currentIndex: -1,
      playing: false,
      position: 0,
      nowPlaying: null,
    });
  },
}));
