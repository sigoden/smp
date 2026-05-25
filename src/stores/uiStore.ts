import { create } from "zustand";
import type { SidebarTab, TrackColumn } from "../types";

interface UIState {
  sidebarTab: SidebarTab;
  visibleColumns: TrackColumn[];

  // Actions
  setTab: (tab: SidebarTab) => void;
  toggleColumn: (column: TrackColumn) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarTab: "tree",
  visibleColumns: ["title", "artist", "album", "duration", "filename"],

  setTab: (tab: SidebarTab) => set({ sidebarTab: tab }),

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
