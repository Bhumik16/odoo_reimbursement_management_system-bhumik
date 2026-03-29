import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'auth-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ user: state.user }) // Keep only user in localStorage, keep token in memory/store but it resets on page reload, but refresh endpoint revives it. Wait, if token is not persisted, we lose it on reload but that's standard. Actually since zustand persist stores it, let's persist everything but token might expire. If it expires, axios catches 401 and refreshes it.
    }
  )
);
