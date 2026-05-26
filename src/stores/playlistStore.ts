import { create } from "zustand";
import type { Track, PlaylistData } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { QUEUE_PLAYLIST_NAME } from "../lib/constants";

interface PlaylistState {
  playlists: PlaylistData[];
  activePlaylistId: string | null;
  isDirty: boolean;

  // Actions
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  syncQueuePlaylist: (tracks: Track[]) => void;
  addTracks: (playlistId: string, tracks: Track[]) => void;
  removeTracks: (playlistId: string, trackIndices: number[]) => void;
  savePlaylist: (playlist: PlaylistData) => Promise<void>;
  saveQueueAsNewPlaylist: (name: string, tracks: Track[]) => Promise<void>;
  saveActivePlaylist: () => Promise<void>;
  setActivePlaylist: (id: string | null) => void;
  isQueuePlaylist: () => boolean;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  activePlaylistId: null,
  isDirty: false,

  loadPlaylists: async () => {
    try {
      const playlists: PlaylistData[] = await invoke("get_playlists");
      // Filter out the special queue playlist (id "queue") — not user-visible
      set({
        playlists,
        isDirty: false,
      });
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

  syncQueuePlaylist: async (tracks: Track[]) => {
    const { playlists, savePlaylist, saveQueueAsNewPlaylist } = get();
    const playlist = playlists.find((p) => p.name === QUEUE_PLAYLIST_NAME);
    if (playlist) {
      playlist.tracks = tracks;
      await savePlaylist(playlist);
      set({ activePlaylistId: playlist.id, isDirty: false });
    } else {
      await saveQueueAsNewPlaylist(QUEUE_PLAYLIST_NAME, tracks);
    }
  },

  addTracks: (playlistId: string, tracks: Track[]) => {
    const { playlists, activePlaylistId } = get();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updated = {
      ...playlist,
      tracks: [...playlist.tracks, ...tracks],
    };


    set({
      playlists: playlists.map((p) =>
        p.id === playlistId ? updated : p
      ),
      isDirty: activePlaylistId === playlistId,
    });
  },

  removeTracks: (playlistId: string, trackIndices: number[]) => {
    const { playlists, activePlaylistId } = get();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const tracks = [...playlist.tracks].filter(
      (_, i) => !trackIndices.includes(i)
    );

    const updated = { ...playlist, tracks };

    set({
      playlists: playlists.map((p) =>
        p.id === playlistId ? updated : p
      ),
      isDirty: activePlaylistId === playlistId,
    });
  },

  savePlaylist: async (playlist: PlaylistData) => {
    const { activePlaylistId } = get();
    try {
      await invoke("update_playlist", { playlist });
      if (activePlaylistId === playlist.id) {
        set({ isDirty: false });
      }
    } catch (err) {
      console.error("Failed to save playlist:", err);
    }
  },

  saveQueueAsNewPlaylist: async (name: string, tracks: Track[]) => {
    try {
      const playlist: PlaylistData = await invoke("create_playlist", { name });
      const updated: PlaylistData = { ...playlist, tracks };
      await invoke("update_playlist", { playlist: updated });
      const { playlists } = get();
      set({
        playlists: [...playlists, updated],
        activePlaylistId: updated.id,
        isDirty: false,
      });
    } catch (err) {
      console.error("Failed to create playlist from queue:", err);
    }
  },

  saveActivePlaylist(): Promise<void> {
    const { playlists, activePlaylistId, savePlaylist } = get();
    const playlist = playlists.find((p) => p.id === activePlaylistId);
    if (!playlist) return Promise.reject("No active playlist to save");
    return savePlaylist(playlist);
  },

  setActivePlaylist: (id: string | null) => {
    const { activePlaylistId } = get();
    if (activePlaylistId === id) return; // No change
    set({ activePlaylistId: id, isDirty: false });
  },

  isQueuePlaylist: () => {
    const { activePlaylistId, playlists } = get();
    const playlist = playlists.find((p) => p.id === activePlaylistId);
    return playlist?.name === QUEUE_PLAYLIST_NAME;
  },

}));
