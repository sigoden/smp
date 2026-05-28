import { create } from "zustand";
import type { SidebarTab, TrackColumn } from "../types";
import { DEFAULT_TRACK_COLUMNS } from "../lib/constants";

interface UIState {
  sidebarTab: SidebarTab;
  visibleColumns: TrackColumn[];
  sidebarWidth: number;
  isLoading: boolean;

  // Actions
  setTab: (tab: SidebarTab) => void;
  toggleColumn: (column: TrackColumn) => void;
  setSidebarWidth: (width: number) => void;
  setLoading: (loading: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarTab: "tree",
  visibleColumns: DEFAULT_TRACK_COLUMNS,
  sidebarWidth: 256,
  isLoading: false,

  setTab: (tab: SidebarTab) => set({ sidebarTab: tab }),
  setSidebarWidth: (width: number) => set({ sidebarWidth: width }),
  setLoading: (loading: boolean) => set({ isLoading: loading }),

  toggleColumn: (column: TrackColumn) =>
    set((state) => {
      const exists = state.visibleColumns.includes(column);
      if (exists) {
        // Don't allow removing all columns
        if (state.visibleColumns.length <= 1) return state;
        return {
          visibleColumns: state.visibleColumns.filter((c) => c !== column),
        };
      }
      return { visibleColumns: [...state.visibleColumns, column] };
    }),
}));

