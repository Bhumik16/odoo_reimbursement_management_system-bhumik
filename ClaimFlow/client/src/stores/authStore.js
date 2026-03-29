import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      setAuth: (user, token) => set({ user, token }),

      logout: () => {
        set({ user: null, token: null });
      },
    }),
    {
      name: 'claimflow-auth', // localStorage key
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
);
