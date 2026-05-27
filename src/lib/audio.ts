import { logger } from "./logger";
import { convertFileSrc } from "@tauri-apps/api/core";

let audioElement: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = "auto";
  }
  return audioElement;
}

export interface AudioCallbacks {
  onTimeUpdate?: (currentTime: number) => void;
  onDurationChange?: (duration: number) => void;
  onEnded?: () => void;
  onError?: (error: string) => void;
  onLoaded?: () => void;
}


export function setCallbacks(cbs: AudioCallbacks) {
  const audio = getAudio();

  audio.ontimeupdate = cbs.onTimeUpdate
    ? () => cbs.onTimeUpdate?.(audio.currentTime)
    : null;
  audio.ondurationchange = cbs.onDurationChange
    ? () => cbs.onDurationChange?.(audio.duration)
    : null;
  audio.onended = cbs.onEnded ?? null;
  audio.onerror = cbs.onError
    ? () => cbs.onError?.("Audio playback error")
    : null;
  audio.onloadedmetadata = cbs.onLoaded ?? null;
}

export function loadTrack(filePath: string) {
  logger.info("audio", `loadTrack: ${filePath}`);
  const audio = getAudio();
  const src = convertFileSrc(filePath);
  audio.src = src;
  audio.load();
}

export function play() {
  const audio = getAudio();
  audio.play().catch((err) => {
    logger.error("audio", "play failed", err);
  });
}

export function pause() {
  getAudio().pause();
}

export function stop() {
  const audio = getAudio();
  audio.pause();
  audio.currentTime = 0;
}

export function seek(time: number) {
  const audio = getAudio();
  audio.currentTime = time;
}

export function setVolume(volume: number) {
  const audio = getAudio();
  audio.volume = Math.max(0, Math.min(1, volume));
}

export function getCurrentTime(): number {
  return getAudio().currentTime;
}

export function getDuration(): number {
  return getAudio().duration;
}

export function isPlaying(): boolean {
  return !getAudio().paused;
}
