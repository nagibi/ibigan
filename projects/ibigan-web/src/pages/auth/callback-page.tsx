import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';

export function CallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, logout } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const tenantId = searchParams.get('tenant_id');
    const error = searchParams.get('error');

    if (error) {
      logout();
      navigate(`/auth/login?error=${error}`);
      return;
    }

    if (!token || !tenantId) {
      navigate('/auth/login');
      return;
    }

    async function fetchUser() {
      try {
        localStorage.setItem('ibigan_token', token!);
        localStorage.setItem('ibigan_tenant_id', tenantId!);

        const { data } = await authService.me();
        setAuth(token!, tenantId!, data.result);
        navigate('/dashboard');
      } catch {
        logout();
        navigate('/auth/login?error=auth_failed');
      }
    }

    fetchUser();
  }, [searchParams, navigate, logout, setAuth]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="text-center space-y-3">
        <LoaderCircle className="size-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">Autenticando com Google...</p>
      </div>
    </div>
  );
}
