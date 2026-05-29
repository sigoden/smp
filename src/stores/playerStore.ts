import { create } from "zustand";
import type { Track, PlayMode } from "../types";
import * as audio from "../lib/audio";
import { logger } from "../lib/logger";

// Guards the next timeupdate callback after a seek() to avoid stale position overwrite
let _seekGuard = false;

interface PlayerState {
  queue: Track[];
  currentIndex: number;
  playingTrack: Track | null;
  playing: boolean;
  position: number;
  duration: number;
  volume: number;
  playMode: PlayMode;
  enqueuedPaths: string[];

  // Actions
  loadQueue: (tracks: Track[], index?: number) => void;
  appendToQueue: (tracks: Track[]) => void;
  pushQueueAndPlay: (track: Track) => void;
  removeFromQueue: (trackPath: string) => void;
  clearQueue: () => void;
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
  setTrack: (queue: Track[], index: number,  playing: boolean) => void;
  recordEnqueuedPaths: (paths: string[]) => void;
  clearEnqueuedPaths: () => void;
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
  playingTrack: null,
  playing: false,
  volume: 0.8,
  position: 0,
  duration: 0,
  playMode: "sequential",
  enqueuedPaths: [],

  loadQueue: (tracks, startIndex) => {
    if (tracks.length === 0) return;
    const { playMode, setTrack, playing, clearQueue } = get();
    clearQueue();
    let currentIndex = 0;
    if (startIndex !== undefined) {
      if (startIndex >= 0 && startIndex < tracks.length) {
        currentIndex = startIndex;
      }
    } else if (playMode === "shuffle") {
      currentIndex = Math.floor(Math.random() * tracks.length);
    }
    setTrack(tracks, currentIndex, playing);
  },

  appendToQueue: (tracks: Track[]) => {
    if (tracks.length === 0) return;
    const { queue, playMode, setTrack, playing } = get();
    const existingPaths = new Set(queue.map((t) => t.path));
    const newTracks = tracks.filter((t) => !existingPaths.has(t.path));

    if (newTracks.length === 0) return;

    const newQueue = [...queue, ...newTracks];
    if (queue.length === 0) {
      const newIndex = playMode === "shuffle" ? Math.floor(Math.random() * newQueue.length) : 0;
      setTrack(newQueue, newIndex, playing);
    } else {
      set({
        queue: newQueue,
      });
    }
  },

  pushQueueAndPlay: (track: Track) => {
    const { queue, setTrack } = get();
    let newQueue = queue;
    let newIndex = queue.findIndex((t) => t.path === track.path);
    if (newIndex === - 1) {
      newQueue = [...queue, track];
      newIndex = newQueue.length - 1;
    }
    setTrack(newQueue, newIndex, true);
  },

  removeFromQueue: (trackPath: string) => {
    const { queue, currentIndex, playMode, clearQueue, setTrack } = get();
    const removeIdx = queue.findIndex((t) => t.path === trackPath);
    if (removeIdx === -1) return;

    const newQueue = queue.filter((t) => t.path !== trackPath);

    if (removeIdx < currentIndex) {
      // Removed a track before the current one — shift index down
      set({ queue: [...newQueue], currentIndex: currentIndex - 1 });
    } else if (removeIdx === currentIndex) {
      // Removed the currently playing track
      if (newQueue.length === 0) {
        clearQueue();
      } else {
        const newIndex = playMode === "shuffle" ? Math.floor(Math.random() * newQueue.length) : Math.min(currentIndex, newQueue.length - 1);
        setTrack([...newQueue], newIndex, false);
      }
    } else {
      // Removed after current — index unchanged
      set({ queue: [...newQueue] });
    }
  },

  clearQueue: () => {
    audio.pause();
    audio.stop();
    set({
      queue: [],
      currentIndex: -1,
      playingTrack: null,
      playing: false,
      position: 0,
      enqueuedPaths: [],
    });
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
    const { queue, currentIndex, playMode, setTrack } = get();
    const nextIdx = getNextIndex(queue, currentIndex, playMode);
    if (nextIdx < 0 || nextIdx >= queue.length) return;

    setTrack(queue, nextIdx, true);
  },

  prev: () => {
    const { queue, currentIndex, setTrack } = get();
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

    setTrack(queue, prevIdx, true);
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

  recordEnqueuedPaths: (paths: string[]) => {
    const { enqueuedPaths } = get();
    const newPaths = paths.filter(p => !enqueuedPaths.includes(p));
    if (newPaths.length === 0) return;
    set({ enqueuedPaths: [...enqueuedPaths, ...newPaths] });
  },

  clearEnqueuedPaths: () => {
    const { enqueuedPaths } = get();
    if (enqueuedPaths.length === 0) return;
    set({ enqueuedPaths: [] });
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
    const { queue, setTrack } = get();
    const idx = queue.findIndex((t) => t.path === track.path);
    if (idx === -1) {
      logger.error("player", `Unable to play track, Track '${track.path}' is not in queue`);
      return;
    }
    setTrack(queue, idx, true);
  },

  setTrack: (queue, index,  playing) => {
    const track = queue[index];
    set({
      queue,
      currentIndex: index,
      playingTrack: track,
      position: 0,
      duration: track.duration_ms / 1000,
      playing,
    });
    audio.loadTrack(track.path);
    if (playing && !audio.isPlaying()) audio.play();
  }
}));
