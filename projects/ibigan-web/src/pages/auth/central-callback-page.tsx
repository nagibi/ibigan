import { useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { centralAuthService } from '@/services/central-auth.service';
import { useCentralAuthStore } from '@/stores/central-auth.store';

export function CentralCallbackPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setCentralAuth, centralLogout } = useCentralAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      centralLogout();
      navigate(`/central/login?error=${error}`);
      return;
    }

    if (!token) {
      navigate('/central/login');
      return;
    }

    async function fetchUser() {
      try {
        localStorage.setItem('ibigan_central_token', token!);
        const { data } = await centralAuthService.me();
        setCentralAuth(token!, data.result);
        navigate('/admin/tenants');
      } catch {
        centralLogout();
        navigate('/central/login?error=auth_failed');
      }
    }

    void fetchUser();
  }, [searchParams, navigate, centralLogout, setCentralAuth]);

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="space-y-3 text-center">
        <LoaderCircle className="mx-auto size-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">{t('auth.login.submitting')}</p>
      </div>
    </div>
  );
}
