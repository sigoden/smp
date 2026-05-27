import { create } from "zustand";
import type { Track, PlaylistData } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { QUEUE_PLAYLIST_NAME } from "../lib/constants";
import { useUIStore } from "./uiStore";

const FALLBACK_PLAYLIST: PlaylistData = { name: QUEUE_PLAYLIST_NAME, tracks: [] };

interface PlaylistState {
  playlists: PlaylistData[];
  activePlaylistName: string;
  isDirty: boolean;

  loadPlaylists: () => Promise<void>;
  fetchTracksForPlaylist: (name: string) => Promise<Track[]>;
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
      set({
        playlists: playlists.map((p) => ({ ...p, tracks: [], loaded: false })),
        isDirty: false,
      });
    } catch (err) {
      console.error("Failed to load playlists:", err);
    }
  },

  fetchTracksForPlaylist: async (name: string): Promise<Track[]> => {
    const { playlists } = get();
    const playlist = playlists.find((p) => p.name === name);
    if (playlist?.loaded) {
      return playlist.tracks;
    }

    useUIStore.getState().setLoading(true);
    try {
      const tracks: Track[] = await invoke("get_playlist_tracks", { name });
      const { savePlaylist } = get();
      await savePlaylist({ name, tracks });
      return tracks;
    } catch (err) {
      console.error(`Failed to fetch tracks for playlist "${name}":`, err);
      return [];
    } finally {
      useUIStore.getState().setLoading(false);
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
      set((state) => ({
        playlists: [...state.playlists, newPlaylist],
        activePlaylistName: name,
      }));
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
      set((state) => ({
        playlists: state.playlists.map((p) =>
          p.name === oldName ? updated : p
        ),
        activePlaylistName:
          state.activePlaylistName === oldName ? newName : state.activePlaylistName,
      }));
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
    if (!playlist || !playlist.loaded) return;

    const oldTracks = playlist.tracks;
    const toAddTracks = tracks.filter(
      v => oldTracks.every(t => t.path !== v.path)
    );
    const newTracks = [...oldTracks, ...toAddTracks];

    const updated = {
      ...playlist,
      tracks: newTracks,
      track_count: newTracks.length,
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
    if (!playlist || !playlist.loaded) return;

    const newTracks = [...playlist.tracks].filter(
      (_, i) => !trackIndices.includes(i)
    );

    const updated = {
      ...playlist,
      tracks: newTracks,
      track_count: newTracks.length
    };

    set({
      playlists: playlists.map((p) =>
        p.name === playlistName ? updated : p
      ),
      isDirty: activePlaylistName === playlistName,
    });
  },

  savePlaylist: async (playlist: PlaylistData) => {
    playlist = { ...playlist, track_count: playlist.tracks.length, loaded: true };
    try {
      await invoke("sync_playlist", { playlist });
      set((state) => {
        const updates: Partial<PlaylistState> = {};
        if (state.activePlaylistName === playlist.name) {
          updates.isDirty = false;
        }
        if (!state.playlists.find((p) => p.name === playlist.name)) {
          updates.playlists = [...state.playlists, playlist];
        }
        return updates;
      });
    } catch (err) {
      console.error("Failed to save playlist:", err);
    }
  },

  saveQueueAsNewPlaylist: async (name: string, tracks: Track[]) => {
    const { savePlaylist, setActivePlaylist, playlists } = get();
    if (playlists.some((p) => p.name === name)) {
      console.error("Playlist already exists:", name);
      return;
    }
    const playlist: PlaylistData = { name, tracks };
    await savePlaylist(playlist);
    setActivePlaylist(name);
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
    return playlists.find((p) => p.name === activePlaylistName) || FALLBACK_PLAYLIST;
  },
}));
