import { create } from "zustand";
import type { Track, PlaylistData } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { QUEUE_PLAYLIST_NAME } from "../lib/constants";

interface PlaylistState {
  playlists: PlaylistData[];
  activePlaylistName: string;
  isDirty: boolean;

  // Actions
  loadPlaylists: () => Promise<void>;
  createPlaylist: (name: string) => Promise<void>;
  renamePlaylist: (oldName: string, newName: string) => Promise<void>;
  deletePlaylist: (name: string) => Promise<void>;
  addTracks: (playlistName: string, tracks: Track[]) => void;
  removeTracks: (playlistName: string, trackIndices: number[]) => void;
  savePlaylist: (playlist: PlaylistData) => Promise<void>;
  saveQueueAsNewPlaylist: (name: string, tracks: Track[]) => Promise<void>;
  saveActivePlaylist: () => Promise<void>;
  syncQueuePlaylist: (tracks: Track[]) => Promise<void>;
  setActivePlaylist: (name: string) => void;
  getActivePlaylist: () => PlaylistData;
}

export const usePlaylistStore = create<PlaylistState>((set, get) => ({
  playlists: [],
  activePlaylistName: QUEUE_PLAYLIST_NAME,
  isDirty: false,

  loadPlaylists: async () => {
    try {
      const playlists: PlaylistData[] = await invoke("get_playlists");
      // QUEUE is not added to the array — getActivePlaylist handles it via fallback
      set({ playlists, isDirty: false });
    } catch (err) {
      console.error("Failed to load playlists:", err);
    }
  },

  createPlaylist: async (name: string) => {
    try {
      const { playlists } = get();
      if (playlists.some((p) => p.name === name)) {
        console.error("Playlist with this name already exists");
        return;
      }
      await invoke("sync_playlist", {
        playlist: { name, tracks: [] },
      });
      const newPlaylist: PlaylistData = { name, tracks: [] };
      set({
        playlists: [...playlists, newPlaylist],
        activePlaylistName: name,
      });
    } catch (err) {
      console.error("Failed to create playlist:", err);
    }
  },

  renamePlaylist: async (oldName: string, newName: string) => {
    const { playlists } = get();
    const playlist = playlists.find((p) => p.name === oldName);
    if (!playlist) return;

    if (playlists.some((p) => p.name === newName && p.name !== oldName)) {
      console.error("Playlist with this name already exists");
      return;
    }

    try {
      await invoke("rename_playlist", { oldName, newName });
      const updated = { ...playlist, name: newName };
      set({
        playlists: playlists.map((p) =>
          p.name === oldName ? updated : p
        ),
        activePlaylistName:
          get().activePlaylistName === oldName ? newName : get().activePlaylistName,
      });
    } catch (err) {
      console.error("Failed to rename playlist:", err);
    }
  },

  deletePlaylist: async (name: string) => {
    try {
      await invoke("remove_playlist", { name });
      const { playlists, activePlaylistName } = get();
      set({
        playlists: playlists.filter((p) => p.name !== name),
        activePlaylistName:
          activePlaylistName === name ? QUEUE_PLAYLIST_NAME : activePlaylistName,
      });
    } catch (err) {
      console.error("Failed to delete playlist:", err);
    }
  },

  addTracks: (playlistName: string, tracks: Track[]) => {
    const { playlists, activePlaylistName } = get();
    const playlist = playlists.find((p) => p.name === playlistName);
    if (!playlist) return;

    const updated = {
      ...playlist,
      tracks: [...playlist.tracks, ...tracks],
    };

    set({
      playlists: playlists.map((p) =>
        p.name === playlistName ? updated : p
      ),
      isDirty: activePlaylistName === playlistName,
    });
  },

  removeTracks: (playlistName: string, trackIndices: number[]) => {
    const { playlists, activePlaylistName } = get();
    const playlist = playlists.find((p) => p.name === playlistName);
    if (!playlist) return;

    const tracks = [...playlist.tracks].filter(
      (_, i) => !trackIndices.includes(i)
    );

    const updated = { ...playlist, tracks };

    set({
      playlists: playlists.map((p) =>
        p.name === playlistName ? updated : p
      ),
      isDirty: activePlaylistName === playlistName,
    });
  },

  savePlaylist: async (playlist: PlaylistData) => {
    const { activePlaylistName, playlists } = get();
    try {
      await invoke("sync_playlist", { playlist });
      if (activePlaylistName === playlist.name) {
        set({ isDirty: false });
      }
      if (!playlists.find((p) => p.name === playlist.name)) {
        set({ playlists: [...playlists, playlist] });
      }
    } catch (err) {
      console.error("Failed to save playlist:", err);
    }
  },

  saveQueueAsNewPlaylist: async (name: string, tracks: Track[]) => {
    const { savePlaylist, setActivePlaylist, playlists } = get();
    // Duplicate name check
    if (playlists.some((p) => p.name === name)) {
      console.error("Playlist already exists:", name);
      return;
    }
    const playlist: PlaylistData = { name, tracks };
    await savePlaylist(playlist);
    setActivePlaylist(playlist.name);
  },

  saveActivePlaylist: async () => {
    const { playlists, activePlaylistName, savePlaylist } = get();
    const playlist = playlists.find((p) => p.name === activePlaylistName);
    if (!playlist) return;
    await savePlaylist(playlist);
  },

  syncQueuePlaylist: async (tracks: Track[]) => {
    const { savePlaylist, setActivePlaylist } = get();
    const playlist: PlaylistData = {
      name: QUEUE_PLAYLIST_NAME,
      tracks,
    };
    await savePlaylist(playlist);
    setActivePlaylist(playlist.name);
  },

  setActivePlaylist: (name: string) => {
    const { activePlaylistName, playlists } = get();
    if (activePlaylistName === name) return;
    if (!playlists.find((p) => p.name === name)) {
      console.warn(`Playlist "${name}" not found`);
      return;
    }
    set({ activePlaylistName: name, isDirty: false });
  },

  getActivePlaylist: () => {
    const { playlists, activePlaylistName } = get();
    return playlists.find((p) => p.name === activePlaylistName) || { name: QUEUE_PLAYLIST_NAME, tracks: [] };
  },
}));
