import { create } from "zustand";
import type { SidebarTab, TrackColumn } from "../types";
import { ALL_TRACK_COLUMNS } from "../lib/constants";

interface UIState {
  sidebarTab: SidebarTab;
  visibleColumns: TrackColumn[];
  sidebarWidth: number;

  // Actions
  setTab: (tab: SidebarTab) => void;
  toggleColumn: (column: TrackColumn) => void;
  setSidebarWidth: (width: number) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarTab: "tree",
  visibleColumns: ALL_TRACK_COLUMNS,
  sidebarWidth: 256,

  setTab: (tab: SidebarTab) => set({ sidebarTab: tab }),
  setSidebarWidth: (width: number) => set({ sidebarWidth: width }),

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
