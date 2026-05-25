import { create } from "zustand";
import type { Track, PlayMode } from "../types";
import * as audio from "../lib/audio";

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
  loadQueue: (tracks: Track[], startIndex?: number) => void;
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

  loadQueue: (tracks, startIndex = 0) => {
    // Pause current playback
    // Pause current playback
    audio.pause();
    audio.stop();

    set({
      queue: tracks,
      currentIndex: startIndex,
      position: 0,
      duration: 0,
      playing: false,
      nowPlaying: tracks[startIndex] || null,
    });

    if (tracks[startIndex]) {
      audio.loadTrack(tracks[startIndex].path);
    }
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
      duration: 0,
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
      duration: 0,
      playing: true,
    });
    audio.play();
  },

  seek: (time: number) => {
    audio.seek(time);
    set({ position: time });
  },

  setVolume: (volume: number) => {
    audio.setVolume(volume);
    set({ volume });
  },

  setPlayMode: (mode: PlayMode) => {
    set({ playMode: mode });
  },

  setPosition: (pos: number) => set({ position: pos }),
  setDuration: (dur: number) => set({ duration: dur }),

  playTrack: async (track: Track) => {
    const { queue } = get();
    const idx = queue.findIndex((t) => t.path === track.path);
    if (idx >= 0) {
      set({ currentIndex: idx });
    }
    audio.loadTrack(track.path);
    set({
      nowPlaying: track,
      position: 0,
      duration: 0,
      playing: true,
    });
    audio.play();
  },
}));
