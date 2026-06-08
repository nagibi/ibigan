import { useAuthStore } from '@/stores/auth.store';

export function useAuth() {
  const { user, logout, isAuthenticated } = useAuthStore();

  return {
    user: user
      ? {
          fullname: user.name,
          email: user.email,
          first_name: user.name.split(' ')[0],
          last_name: user.name.split(' ').slice(1).join(' '),
          username: user.email,
        }
      : null,
    logout,
    isAuthenticated,
  };
}
