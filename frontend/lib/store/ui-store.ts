import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIState {
  sidebarOpen: boolean;
  selectedBranchId: string;
  selectedBranchName: string;

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedBranch: (id: string, name: string) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      selectedBranchId: "all",
      selectedBranchName: "All Branches",

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      setSelectedBranch: (id: string, name: string) =>
        set({ selectedBranchId: id, selectedBranchName: name }),
    }),
    {
      name: "csm-ui-storage",
    }
  )
);
