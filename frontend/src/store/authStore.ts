import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginResponse } from '@/types/auth.types';
import { Role } from '@/constants/roles';

interface AuthStore {
  user: User | null;
  token: string | null;
  role: Role | null;
  isAuthenticated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      role: null,
      isAuthenticated: false,

      login: (response: LoginResponse) => {
        const user: User = {
          id: response.user_id,
          name: response.name,
          email: response.email,
          role: response.role,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        set({
          user,
          token: response.access_token,
          role: response.role,
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({
          user: null,
          token: null,
          role: null,
          isAuthenticated: false,
        });
      },

      setUser: (user: User) => {
        set({ user, role: user.role, isAuthenticated: true });
      },
    }),
    {
      name: 'empay_token',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
