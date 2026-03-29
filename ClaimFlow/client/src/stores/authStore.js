import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: {
    name: 'Admin User',
    role: 'admin', // default to admin for testing. Can be 'admin', 'manager', 'employee'
    email: 'admin@company.com'
  },
  setUser: (user) => set({ user }),
  logout: () => set({ user: null }),
}));
