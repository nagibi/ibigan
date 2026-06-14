import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, LoaderCircle } from 'lucide-react';
import { TenantSlugIcon } from '@/components/tenant/tenant-slug-icon';
import { authService, type UserTenant } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useTenantSwitch } from '@/hooks/use-tenant-switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { toAbsoluteUrl } from '@/lib/helpers';

export function TenantSelectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { switchToTenant, switchingId } = useTenantSwitch();
  const [tenants, setTenants] = useState<UserTenant[]>([]);
  const [loading, setLoading] = useState(true);

  const manualSelection =
    (location.state as { manual?: boolean } | null)?.manual ?? false;

  const handleSelect = useCallback(
    async (tenantId: string) => {
      const success = await switchToTenant(tenantId);
      if (success) {
        navigate('/dashboard');
      }
    },
    [navigate, switchToTenant],
  );

  useEffect(() => {
    async function load() {
      try {
        const res = await authService.listTenants();
        const list = res.data.result;
        setTenants(list);

        if (!manualSelection) {
          if (list.length === 1) {
            await handleSelect(list[0].id);
            return;
          }

          const def = list.find((tenant) => tenant.is_default);
          if (def) {
            await handleSelect(def.id);
            return;
          }
        }
      } catch {
        toast.error('Erro ao carregar organizações.');
        navigate('/auth/login');
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [handleSelect, manualSelection, navigate]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-muted/30">
      <div className="mb-6 text-center">
        <img
          src={toAbsoluteUrl('/media/app/mini-logo.svg')}
          className="mx-auto mb-4 h-8"
          alt="Ibigan"
        />
        <h1 className="text-2xl font-semibold">Selecione a organização</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Olá, <strong>{user?.name}</strong>. Escolha com qual organização deseja trabalhar.
        </p>
      </div>

      <div className="w-full max-w-md space-y-2 px-4">
        {tenants.map((tenant) => (
          <Card
            key={tenant.id}
            className="cursor-pointer transition-colors hover:border-primary"
            onClick={() => void handleSelect(tenant.id)}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <TenantSlugIcon slug={tenant.slug} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{tenant.name ?? tenant.slug}</p>
                <p className="text-xs text-muted-foreground">{tenant.id}</p>
              </div>
              {switchingId === tenant.id ? (
                <LoaderCircle className="size-4 animate-spin text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="mt-6 text-muted-foreground"
        onClick={() => {
          logout();
          navigate('/auth/login');
        }}
      >
        Sair
      </Button>
    </div>
  );
}
