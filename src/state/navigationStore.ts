import { create } from 'zustand';

interface NavigationState {
  currentTab: string;
  navigationHistory: string[];
  isDrawerOpen: boolean;
  setCurrentTab: (tab: string) => void;
  addToHistory: (route: string) => void;
  clearHistory: () => void;
  toggleDrawer: () => void;
  setDrawerOpen: (open: boolean) => void;
}

export const useNavigationStore = create<NavigationState>((set, get) => ({
  currentTab: 'index',
  navigationHistory: [],
  isDrawerOpen: false,
  setCurrentTab: (tab: string) => set({ currentTab: tab }),
  addToHistory: (route: string) =>
    set((state) => ({
      navigationHistory: [...state.navigationHistory, route],
    })),
  clearHistory: () => set({ navigationHistory: [] }),
  toggleDrawer: () =>
    set((state) => ({ isDrawerOpen: !state.isDrawerOpen })),
  setDrawerOpen: (open: boolean) => set({ isDrawerOpen: open }),
}));