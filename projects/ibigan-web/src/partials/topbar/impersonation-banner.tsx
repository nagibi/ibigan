import { LogOut } from 'lucide-react';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { Button } from '@/components/ui/button';

export function ImpersonationBanner() {
  const impersonatedTenant = useCentralAuthStore((s) => s.impersonatedTenant);

  if (!impersonatedTenant) return null;

  function handleExit() {
    // limpa tokens soltos
    localStorage.removeItem('ibigan_token');
    localStorage.removeItem('ibigan_tenant_id');
    // limpa o estado persistido do Zustand de tenant (senão reidrata como "logado")
    localStorage.removeItem('ibigan-auth');
    window.location.href = '/admin/tenants';
  }

  return (
    <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm text-amber-950">
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
