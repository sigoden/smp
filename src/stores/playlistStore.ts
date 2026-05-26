import { create } from "zustand";
import type { Track, PlaylistData } from "../types";
import { invoke } from "@tauri-apps/api/core";

interface PlaylistState {
  playlists: PlaylistData[];
  activePlaylistId: string | null;
  dirtyPlaylistIds: Set<string>;

  // Actions
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTracks: (playlistId: string, tracks: Track[]) => void;
  removeTracks: (playlistId: string, trackIndices: number[]) => void;
  savePlaylist: (playlistId: string) => Promise<void>;
  saveQueueAsNewPlaylist: (name: string, tracks: Track[]) => Promise<void>;
  setActivePlaylist: (id: string | null) => void;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  activePlaylistId: null,
  dirtyPlaylistIds: new Set<string>(),

  loadPlaylists: async () => {
    try {
      const playlists: PlaylistData[] = await invoke("get_playlists");
      set({ playlists, dirtyPlaylistIds: new Set<string>() });
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

  addTracks: (playlistId: string, tracks: Track[]) => {
    const { playlists, dirtyPlaylistIds } = get();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const updated = {
      ...playlist,
      tracks: [...playlist.tracks, ...tracks],
    };

    const nextDirty = new Set(dirtyPlaylistIds);
    nextDirty.add(playlistId);

    set({
      playlists: playlists.map((p) =>
        p.id === playlistId ? updated : p
      ),
      dirtyPlaylistIds: nextDirty,
    });
  },

  removeTracks: (playlistId: string, trackIndices: number[]) => {
    const { playlists, dirtyPlaylistIds } = get();
    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    const tracks = [...playlist.tracks].filter(
      (_, i) => !trackIndices.includes(i)
    );

    const updated = { ...playlist, tracks };

    const nextDirty = new Set(dirtyPlaylistIds);
    nextDirty.add(playlistId);

    set({
      playlists: playlists.map((p) =>
        p.id === playlistId ? updated : p
      ),
      dirtyPlaylistIds: nextDirty,
    });
  },

  savePlaylist: async (playlistId: string) => {
    const { playlists, dirtyPlaylistIds } = get();
    if (!dirtyPlaylistIds.has(playlistId)) return;

    const playlist = playlists.find((p) => p.id === playlistId);
    if (!playlist) return;

    try {
      await invoke("update_playlist", { playlist });
      const nextDirty = new Set(dirtyPlaylistIds);
      nextDirty.delete(playlistId);
      set({ dirtyPlaylistIds: nextDirty });
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
      });
    } catch (err) {
      console.error("Failed to create playlist from queue:", err);
    }
  },

  setActivePlaylist: (id: string | null) => {
    set({ activePlaylistId: id });
  },
}));
