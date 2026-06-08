import { Navigate, Route, Routes } from 'react-router';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { ForgotPasswordPage } from '@/pages/auth/forgot-password-page';
import { LoginPage } from '@/pages/auth/login-page';
import { RegisterPage } from '@/pages/auth/register-page';
import { TwoFactorPage } from '@/pages/auth/two-factor-page';
import { DashboardPage } from '@/pages/dashboard/dashboard-page';
import { UserFormPage } from '@/pages/users/user-form-page';
import { UsersPage } from '@/pages/users/users-page';
import { useAuthStore } from '@/stores/auth.store';

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
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
