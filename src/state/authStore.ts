import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { User } from '../types';
import { storageService } from '../utils/storage';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  login: (user: User) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

const secureStorage = {
  getItem: async (name: string) => {
    return await storageService.getItem(name);
  },
  setItem: async (name: string, value: string) => {
    await storageService.setItem(name, value);
  },
  removeItem: async (name: string) => {
    await storageService.removeItem(name);
  },
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      login: (user: User) =>
        set({
          user,
          isAuthenticated: true,
          loading: false,
          error: null,
        }),
      logout: () =>
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          error: null,
        }),
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => secureStorage),
    }
  )
);