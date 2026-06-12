import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Building2, ChevronsUpDown, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useImpersonate } from '@/hooks/use-impersonate';
import { useCentralOnlySession } from '@/hooks/use-central-only-session';
import { useTenantSwitch } from '@/hooks/use-tenant-switch';
import { adminTenantsService, type AdminTenant } from '@/services/admin-tenants.service';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type SwitchableTenant = { id: string; name: string | null; slug: string };

function tenantLabel(name: string | null | undefined, slug: string, id: string) {
  return name ?? slug ?? id;
}

export function TenantSwitcher() {
  const { t } = useTranslation();
  const { tenantId } = useAuthStore();
  const isCentralOnly = useCentralOnlySession();
  const impersonatedTenant = useCentralAuthStore((s) => s.impersonatedTenant);
  const { switchToTenant, switchingId } = useTenantSwitch();
  const { impersonate, impersonatingId } = useImpersonate();
  const [open, setOpen] = useState(false);

  const isImpersonating = Boolean(impersonatedTenant);

  const { data: tenants = [], isLoading } = useQuery<SwitchableTenant[]>({
    queryKey: isImpersonating ? ['switch-all-tenants'] : ['tenants'],
    queryFn: async () => {
      if (isImpersonating) {
        const res = await adminTenantsService.list(1, 100);
        return res.data.result.data;
      }

      const res = await authService.listTenants();
      return res.data.result;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !isCentralOnly,
  });

  if (isCentralOnly) {
    return null;
  }

  const currentTenant = tenants.find((tenant) => tenant.id === tenantId);
  const currentLabel = tenantLabel(
    impersonatedTenant?.name ?? currentTenant?.name,
    currentTenant?.slug ?? impersonatedTenant?.name ?? '',
    tenantId ?? '',
  );
  const canSwitch = tenants.length > 1;
  const busy = Boolean(switchingId) || Boolean(impersonatingId);

  const triggerClassName = cn(
    'h-9 max-w-[160px] justify-between gap-1.5 px-2 sm:max-w-[220px]',
    isImpersonating
      ? 'border-amber-400 bg-amber-50 font-medium text-amber-900 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-300 dark:hover:bg-amber-500/20'
      : 'max-w-[200px] border-dashed font-normal',
  );

  async function handleSelect(nextTenantId: string) {
    if (nextTenantId === tenantId || busy) return;

    if (isImpersonating) {
      const target = tenants.find((tenant) => tenant.id === nextTenantId);
      if (!target) return;

      try {
        await impersonate(target as AdminTenant);
        setOpen(false);
      } catch {
        toast.error('Erro ao acessar empresa.');
      }
      return;
    }

    const success = await switchToTenant(nextTenantId);
    if (success) {
      setOpen(false);
    }
  }

  const tenantTooltip = canSwitch
    ? t('header.tooltip.tenant_switch')
    : t('header.tooltip.tenant_current', { name: currentLabel });

  const trigger = (
    <Button
      variant="outline"
      size="sm"
      role="combobox"
      aria-expanded={open}
      className={triggerClassName}
      disabled={isLoading || busy}
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <Building2
          className={cn(
            'size-4 shrink-0',
            isImpersonating ? 'text-amber-800 dark:text-amber-300' : 'text-primary',
          )}
        />
        <span className="hidden truncate sm:inline">
          {isLoading ? '...' : currentLabel}
        </span>
      </span>
      {busy ? (
        <LoaderCircle className="size-3.5 shrink-0 animate-spin text-muted-foreground" />
      ) : (
        <span className="flex shrink-0 items-center gap-1">
          {isImpersonating ? (
            <span className="rounded bg-amber-400/30 px-1 text-[10px] uppercase tracking-wide">
              plataforma
            </span>
          ) : null}
          {canSwitch ? (
            <ChevronsUpDown
              className={cn(
                'size-3.5',
                isImpersonating
                  ? 'text-amber-800/70 dark:text-amber-300/70'
                  : 'text-muted-foreground',
              )}
            />
          ) : null}
        </span>
      )}
    </Button>
  );

  const triggerWithTooltip = (
    <Tooltip>
      <TooltipTrigger asChild>
        {trigger}
      </TooltipTrigger>
      <TooltipContent side="bottom" variant="light">
        {tenantTooltip}
      </TooltipContent>
    </Tooltip>
  );

  if (!canSwitch) {
    return triggerWithTooltip;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" variant="light">
          {tenantTooltip}
        </TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-80 p-0">
        <Command>
          <CommandInput placeholder="Buscar organização..." />
          <CommandList>
            <CommandEmpty>Nenhuma organização encontrada.</CommandEmpty>
            <CommandGroup heading={isImpersonating ? 'Empresas da plataforma' : 'Organizações'}>
              {tenants.map((tenant) => {
                const label = tenantLabel(tenant.name, tenant.slug, tenant.id);
                const isActive = tenant.id === tenantId;
                const isSwitching = switchingId === tenant.id || impersonatingId === tenant.id;

                return (
                  <CommandItem
                    key={tenant.id}
                    value={`${label} ${tenant.slug} ${tenant.id}`}
                    disabled={isActive || busy}
                    onSelect={() => void handleSelect(tenant.id)}
                    className="gap-3 py-2.5"
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                      <Building2 className="size-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{label}</p>
                      <p className="truncate text-xs text-muted-foreground">{tenant.id}</p>
                    </div>
                    {isSwitching ? (
                      <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <CommandCheck
                        className={cn(!isActive && 'opacity-0')}
                      />
                    )}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
