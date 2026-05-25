import { create } from "zustand";
import type { Track, PlaylistData } from "../types";
import { invoke } from "@tauri-apps/api/core";

interface PlaylistState {
  playlists: PlaylistData[];
  activePlaylistId: string | null;

  // Actions
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTracks: (playlistId: string, tracks: Track[]) => Promise<void>;
  removeTracks: (playlistId: string, trackIndices: number[]) => Promise<void>;
  setActivePlaylist: (id: string | null) => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  activePlaylistId: null,

  loadPlaylists: async () => {
    try {
      const playlists: PlaylistData[] = await invoke("get_playlists");
      set({ playlists });
    } catch (err) {
      console.error("Failed to load playlists:", err);
    }
  },

  createPlaylist: async (name: string) => {
    try {
      const playlist: PlaylistData = await invoke("create_playlist", { name });
      const { playlists } = get();
      set({ playlists: [...playlists, playlist], activePlaylistId: playlist.id });
    } catch (err) {
      console.error("Failed to create playlist:", err);
    }
  },

  renamePlaylist: async (id: string, name: string) => {
    const { playlists } = get();
    const playlist = playlists.find((p) => p.id === id);
    if (!playlist) return;

    try {
      await invoke("update_playlist", {
        playlist: { ...playlist, name },
      });
      set({
        playlists: playlists.map((p) =>
          p.id === id ? { ...p, name } : p
        ),
      });
    } catch (err) {
      console.error("Failed to rename playlist:", err);
    }
  },

  deletePlaylist: async (id: string) => {
    try {
      await invoke("remove_playlist", { id });
      const { playlists, activePlaylistId } = get();
      set({
        playlists: playlists.filter((p) => p.id !== id),
        activePlaylistId: activePlaylistId === id ? null : activePlaylistId,
      });
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    }
  },

  addTracks: async (playlistId: string, tracks: Track[]) => {
    const { playlists } = get();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updated = {
      ...playlist,
      tracks: [...playlist.tracks, ...tracks],
    };

    try {
      await invoke("update_playlist", { playlist: updated });
      set({
        playlists: playlists.map((p) =>
          p.id === playlistId ? updated : p
        ),
      });
    } catch (err) {
      console.error("Failed to add tracks:", err);
    }
  },

  removeTracks: async (playlistId: string, trackIndices: number[]) => {
    const { playlists } = get();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const sorted = [...trackIndices].sort((a, b) => b - a);
    let tracks = [...playlist.tracks];
    for (const idx of sorted) {
      if (idx >= 0 && idx < tracks.length) {
        tracks.splice(idx, 1);
      }
    }

    const updated = { ...playlist, tracks };

    try {
      await invoke("update_playlist", { playlist: updated });
      set({
        playlists: playlists.map((p) =>
          p.id === playlistId ? updated : p
        ),
      });
    } catch (err) {
      console.error("Failed to remove tracks:", err);
    }
  },

  setActivePlaylist: (id: string | null) => {
    set({ activePlaylistId: id });
  },
}));
