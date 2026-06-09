import { CallbackPage } from '@/pages/auth/callback-page';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page';
import { InvitePage } from '@/pages/auth/invite-page';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/register-page';
import { TwoFactorPage } from '@/pages/auth/two-factor-page';
import { DashboardPage } from '@/pages/dashboard/dashboard-page';
import { InvitesPage } from '@/pages/invites/invites-page';
import { MenuFormPage } from '@/pages/menus/menu-form-page';
import { MenusPage } from '@/pages/menus/menus-page';
import { ProfilePage } from '@/pages/profile/profile-page';
import { SecurityPage } from '@/pages/security/security-page';
import { SettingsPage } from '@/pages/settings/settings-page';
import { UserFormPage } from '@/pages/users/user-form-page';
import { UsersPage } from '@/pages/users/users-page';
import { useAuthStore } from '@/stores/auth.store';
import { Navigate, Route, Routes } from 'react-router';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
}

function GuestOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

export function AppRoutingSetup() {
  return (
    <Routes>
      <Route
        path="/auth/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route path="/auth/callback" element={<CallbackPage />} />
      <Route path="/auth/two-factor" element={<TwoFactorPage />} />
      <Route
        path="/auth/forgot-password"
        element={
          <GuestOnly>
            <ForgotPasswordPage />
          </GuestOnly>
        }
      />
      <Route
        path="/auth/register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route
        path="/auth/invite"
        element={
          <GuestOnly>
            <InvitePage />
          </GuestOnly>
        }
      />

      <Route
        element={
          <RequireAuth>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/users/novo" element={<UserFormPage />} />
        <Route path="/users/:id/editar" element={<UserFormPage />} />
        <Route path="/menus" element={<MenusPage />} />
        <Route path="/menus/novo" element={<MenuFormPage />} />
        <Route path="/menus/:id/editar" element={<MenuFormPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/security" element={<SecurityPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/invites" element={<InvitesPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
