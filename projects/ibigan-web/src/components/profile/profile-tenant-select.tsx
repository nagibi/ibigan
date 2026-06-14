import { useState } from 'react';
import { ChevronsUpDown, LoaderCircle } from 'lucide-react';
import { TenantSlugIcon } from '@/components/tenant/tenant-slug-icon';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';

export type ProfileTenantOption = {
  id: string;
  name: string | null;
  slug: string;
};

function tenantLabel(tenant: ProfileTenantOption) {
  return tenant.name ?? tenant.slug;
}

type ProfileTenantSelectProps = {
  tenants: ProfileTenantOption[];
  currentTenantId?: string | null;
  pendingTenantId?: string | null;
  loading?: boolean;
  disabled?: boolean;
  onSelect: (tenant: ProfileTenantOption) => void;
};

export function ProfileTenantSelect({
  tenants,
  currentTenantId,
  pendingTenantId,
  loading = false,
  disabled = false,
  onSelect,
}: ProfileTenantSelectProps) {
  const [open, setOpen] = useState(false);
  const busy = Boolean(pendingTenantId) || disabled;

  const currentTenant = tenants.find((tenant) => tenant.id === currentTenantId);

  function handleSelect(tenant: ProfileTenantOption) {
    if (tenant.id === currentTenantId || busy) return;

    onSelect(tenant);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-11 w-full justify-between gap-2 px-3 font-normal"
          disabled={loading || busy || tenants.length === 0}
        >
          {loading ? (
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <LoaderCircle className="size-4 shrink-0 animate-spin" />
              Carregando empresas...
            </span>
          ) : currentTenant ? (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <TenantSlugIcon slug={currentTenant.slug} size="sm" />
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate font-medium">{tenantLabel(currentTenant)}</span>
                <span className="block truncate text-xs text-muted-foreground">{currentTenant.slug}</span>
              </span>
              <Badge variant="primary" appearance="light" size="sm" className="shrink-0">
                Atual
              </Badge>
            </span>
          ) : (
            <span className="truncate text-muted-foreground">
              {tenants.length === 0 ? 'Nenhuma empresa disponível' : 'Selecione uma empresa...'}
            </span>
          )}
          {pendingTenantId ? (
            <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
          ) : (
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar empresa..." />
          <CommandList>
            <CommandEmpty>Nenhuma empresa encontrada.</CommandEmpty>
            <CommandGroup>
              {tenants.map((tenant) => {
                const isCurrent = tenant.id === currentTenantId;
                const isPending = tenant.id === pendingTenantId;

                return (
                  <CommandItem
                    key={tenant.id}
                    value={`${tenantLabel(tenant)} ${tenant.slug} ${tenant.id}`}
                    disabled={isCurrent || busy}
                    onSelect={() => handleSelect(tenant)}
                    className="gap-3 py-2.5"
                  >
                    <TenantSlugIcon slug={tenant.slug} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{tenantLabel(tenant)}</p>
                      <p className="truncate text-xs text-muted-foreground">{tenant.slug}</p>
                    </div>
                    {isPending ? (
                      <LoaderCircle className="size-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : (
                      <CommandCheck className={cn(!isCurrent && 'opacity-0')} />
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
