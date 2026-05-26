import { create } from "zustand";
import type { Track, PlaylistData } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { v4 as uuidv4 } from "uuid";
import { QUEUE_PLAYLIST } from "../lib/constants";

interface PlaylistState {
  playlists: PlaylistData[];
  activePlaylistId: string;
  isDirty: boolean;

  // Actions
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  renamePlaylist: (id: string, name: string) => Promise<void>;
  deletePlaylist: (id: string) => Promise<void>;
  addTracks: (playlistId: string, tracks: Track[]) => void;
  removeTracks: (playlistId: string, trackIndices: number[]) => void;
  savePlaylist: (playlist: PlaylistData) => Promise<void>;
  saveQueueAsNewPlaylist: (name: string, tracks: Track[]) => Promise<void>;
  saveActivePlaylist: () => Promise<void>;
  syncQueuePlaylist: (tracks: Track[]) => Promise<void>;
  setActivePlaylist: (id: string) => void;
  getActivePlaylist: () => PlaylistData;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  activePlaylistId: QUEUE_PLAYLIST.id,
  isDirty: false,

  loadPlaylists: async () => {
    try {
      let playlists: PlaylistData[] = await invoke("get_playlists");
      if (!playlists.find((p) => p.id === QUEUE_PLAYLIST.id)) {
        playlists = [QUEUE_PLAYLIST, ...playlists];
      }
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
      const playlist: PlaylistData = await invoke("sync_playlist", { playlist: newPlaylist(name) });
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
      await invoke("sync_playlist", {
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
        activePlaylistId: activePlaylistId === id ? QUEUE_PLAYLIST.id : activePlaylistId,
      });
    } catch (err) {
      console.error("Failed to delete playlist:", err);
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
    const { activePlaylistId, playlists } = get();
    try {
      console.log("Saving playlist:", playlist.tracks.length, "tracks");
      await invoke("sync_playlist", { playlist });
      if (activePlaylistId === playlist.id) {
        set({ isDirty: false });
      }
      if (!playlists.find((p) => p.id === playlist.id)) {
        set({ playlists: [...playlists, playlist] });
      }
    } catch (err) {
      console.error("Failed to save playlist:", err);
    }
  },

  saveQueueAsNewPlaylist: async (name: string, tracks: Track[]) => {
    const { savePlaylist } = get();
    const playlist = newPlaylist(name, tracks);
    await savePlaylist(playlist);
    set({ activePlaylistId: playlist.id });
  },

  saveActivePlaylist(): Promise<void> {
    const { playlists, activePlaylistId, savePlaylist } = get();
    const playlist = playlists.find((p) => p.id === activePlaylistId);
    if (!playlist) return Promise.reject("No active playlist to save");
    return savePlaylist(playlist);
  },

  syncQueuePlaylist: async (tracks: Track[]) => {
    const { savePlaylist, setActivePlaylist } = get();
    const playlist: PlaylistData = {
      ...QUEUE_PLAYLIST,
      tracks,
    };
    await savePlaylist(playlist);
    setActivePlaylist(playlist.id);
  },

  setActivePlaylist: (id: string) => {
    const { activePlaylistId, playlists } = get();
    if (activePlaylistId === id) return; // No change
    if (!playlists.find((p) => p.id === id)) {
      console.warn(`Playlist with id ${id} not found`);
      return;
    }
    set({ activePlaylistId: id, isDirty: false });
  },

  getActivePlaylist: () => {
    const { playlists, activePlaylistId } = get();
    return playlists.find((p) => p.id === activePlaylistId) || QUEUE_PLAYLIST;
  }
}));


function newPlaylist(name: string, tracks: Track[] = []): PlaylistData {
  return {
    id: uuidv4(),
    name,
    tracks,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}