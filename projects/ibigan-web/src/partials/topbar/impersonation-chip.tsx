import { useNavigate } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { cn } from '@/lib/utils';

export function ImpersonationChip() {
  const navigate = useNavigate();
  const impersonatedTenant = useCentralAuthStore((s) => s.impersonatedTenant);

  if (!impersonatedTenant) return null;

  return (
    <button
      type="button"
      onClick={() => navigate('/admin/tenants')}
      title="Voltar ao painel central"
      className={cn(
        'flex h-9 items-center gap-1.5 rounded-md border border-amber-400 bg-amber-50 px-2.5',
        'text-sm font-medium text-amber-900 transition-colors hover:bg-amber-100',
        'dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20',
      )}
    >
      <Building2 className="size-4 shrink-0" />
      <span className="hidden max-w-[160px] truncate sm:inline">
        {impersonatedTenant.name}
      </span>
      <span className="rounded bg-amber-400/30 px-1 text-[10px] uppercase tracking-wide">
        plataforma
      </span>
    </button>
  );
}
