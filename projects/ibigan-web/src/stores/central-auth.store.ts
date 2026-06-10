import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CentralUser {
  id: number;
  name: string;
  email: string;
  is_super_admin: boolean;
}

interface CentralAuthState {
  centralToken: string | null;
  centralUser: CentralUser | null;
  isCentralAuthenticated: boolean;
  setCentralAuth: (token: string, user: CentralUser) => void;
  centralLogout: () => void;
}

export const useCentralAuthStore = create<CentralAuthState>()(
  persist(
    (set) => ({
      centralToken: null,
      centralUser: null,
      isCentralAuthenticated: false,
      setCentralAuth: (token, user) => {
        localStorage.setItem('ibigan_central_token', token);
        set({ centralToken: token, centralUser: user, isCentralAuthenticated: true });
      },
      centralLogout: () => {
        localStorage.removeItem('ibigan_central_token');
        set({ centralToken: null, centralUser: null, isCentralAuthenticated: false });
      },
    }),
    {
      name: 'ibigan-central-auth',
      partialize: (state) => ({
        centralToken: state.centralToken,
        centralUser: state.centralUser,
        isCentralAuthenticated: state.isCentralAuthenticated,
      }),
    },
  ),
);

export type { CentralUser };
