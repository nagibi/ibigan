import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: number;
  name: string;
  email: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  token: string | null;
  tenantId: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  requires2FA: boolean;
  twoFactorToken: string | null;

  setAuth: (token: string, tenantId: string, user: AuthUser) => void;
  setRequires2FA: (twoFactorToken: string) => void;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      tenantId: null,
      user: null,
      isAuthenticated: false,
      requires2FA: false,
      twoFactorToken: null,

      setAuth: (token, tenantId, user) => {
        localStorage.setItem('ibigan_token', token);
        localStorage.setItem('ibigan_tenant_id', tenantId);
        set({
          token,
          tenantId,
          user,
          isAuthenticated: true,
          requires2FA: false,
          twoFactorToken: null,
        });
      },

      setRequires2FA: (twoFactorToken) => {
        set({ requires2FA: true, twoFactorToken });
      },

      logout: () => {
        localStorage.removeItem('ibigan_token');
        localStorage.removeItem('ibigan_tenant_id');
        set({
          token: null,
          tenantId: null,
          user: null,
          isAuthenticated: false,
          requires2FA: false,
          twoFactorToken: null,
        });
      },

      hasPermission: (permission) => {
        return get().user?.permissions.includes(permission) ?? false;
      },

      hasRole: (role) => {
        return get().user?.roles.includes(role) ?? false;
      },
    }),
    {
      name: 'ibigan-auth',
      partialize: (state) => ({
        token: state.token,
        tenantId: state.tenantId,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
