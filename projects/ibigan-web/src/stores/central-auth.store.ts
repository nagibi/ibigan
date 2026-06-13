import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CentralUser {
  id: number;
  name: string;
  email: string;
  is_super_admin: boolean;
}

interface ImpersonatedTenant {
  id: string;
  name: string;
}

interface CentralAuthState {
  centralToken: string | null;
  centralUser: CentralUser | null;
  isCentralAuthenticated: boolean;
  impersonatedTenant: ImpersonatedTenant | null;
  requires2FA: boolean;
  twoFactorToken: string | null;
  setCentralAuth: (token: string, user: CentralUser) => void;
  setRequires2FA: (twoFactorToken: string) => void;
  centralLogout: () => void;
  startImpersonation: (tenant: ImpersonatedTenant) => void;
  stopImpersonation: () => void;
}

export const useCentralAuthStore = create<CentralAuthState>()(
  persist(
    (set) => ({
      centralToken: null,
      centralUser: null,
      isCentralAuthenticated: false,
      impersonatedTenant: null,
      requires2FA: false,
      twoFactorToken: null,
      setCentralAuth: (token, user) => {
        localStorage.setItem('ibigan_central_token', token);
        set({
          centralToken: token,
          centralUser: user,
          isCentralAuthenticated: true,
          requires2FA: false,
          twoFactorToken: null,
        });
      },
      setRequires2FA: (twoFactorToken) => {
        set({ requires2FA: true, twoFactorToken });
      },
      centralLogout: () => {
        localStorage.removeItem('ibigan_central_token');
        set({
          centralToken: null,
          centralUser: null,
          isCentralAuthenticated: false,
          impersonatedTenant: null,
          requires2FA: false,
          twoFactorToken: null,
        });
      },
      startImpersonation: (tenant) => set({ impersonatedTenant: tenant }),
      stopImpersonation: () => set({ impersonatedTenant: null }),
    }),
    {
      name: 'ibigan-central-auth',
      partialize: (state) => ({
        centralToken: state.centralToken,
        centralUser: state.centralUser,
        isCentralAuthenticated: state.isCentralAuthenticated,
        impersonatedTenant: state.impersonatedTenant,
      }),
    },
  ),
);

export type { CentralUser, ImpersonatedTenant };
