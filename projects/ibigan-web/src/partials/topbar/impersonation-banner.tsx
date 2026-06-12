import { useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { Button } from '@/components/ui/button';

export function ImpersonationBanner() {
  const impersonatedTenant = useCentralAuthStore((s) => s.impersonatedTenant);

  useEffect(() => {
    if (!impersonatedTenant) return;
    document.body.classList.add('impersonation-banner-visible');
    return () => document.body.classList.remove('impersonation-banner-visible');
  }, [impersonatedTenant]);

  if (!impersonatedTenant) return null;

  function handleExit() {
    localStorage.removeItem('ibigan_token');
    localStorage.removeItem('ibigan_tenant_id');
    localStorage.removeItem('ibigan-auth');
    window.location.href = '/admin/tenants';
  }

  return (
    <div className="impersonation-banner z-[9] flex w-full shrink-0 items-center justify-center gap-3 border-b border-amber-600/30 bg-amber-500 px-4 py-2 text-sm text-amber-950">
      <span>
        Você está acessando <strong>{impersonatedTenant.name}</strong> como plataforma.
      </span>
      <Button size="sm" variant="outline" onClick={handleExit}>
        <LogOut size={14} className="mr-1" />
        Voltar ao painel
      </Button>
    </div>
  );
}
