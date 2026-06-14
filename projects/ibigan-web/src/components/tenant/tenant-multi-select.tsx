import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { adminTenantsService, type AdminTenant } from '@/services/admin-tenants.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface TenantMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  error?: string;
}

function formatTenantLabel(tenant: Pick<AdminTenant, 'name' | 'slug'>): string {
  return tenant.name ? `${tenant.name} (${tenant.slug})` : tenant.slug;
}

export function TenantMultiSelect({
  value,
  onChange,
  disabled = false,
  placeholder = 'Selecione as empresas',
  className,
  error,
}: TenantMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedTenants, setSelectedTenants] = useState<Map<string, AdminTenant>>(new Map());
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching } = useQuery({
    queryKey: ['admin-tenants-combobox', debouncedSearch],
    queryFn: () => adminTenantsService.list(1, 50, debouncedSearch || undefined),
    enabled: open,
  });

  const tenants = useMemo(
    () => (data?.data.result.data ?? []).filter((tenant) => tenant.is_active),
    [data],
  );

  const selectedLabels = useMemo(
    () => value.map((tenantId) => {
      const tenant = selectedTenants.get(tenantId) ?? tenants.find((item) => item.id === tenantId);

      return tenant ? formatTenantLabel(tenant) : tenantId;
    }),
    [selectedTenants, tenants, value],
  );

  function toggleTenant(tenant: AdminTenant) {
    if (value.includes(tenant.id)) {
      onChange(value.filter((id) => id !== tenant.id));
      setSelectedTenants((current) => {
        const next = new Map(current);
        next.delete(tenant.id);

        return next;
      });

      return;
    }

    onChange([...value, tenant.id]);
    setSelectedTenants((current) => new Map(current).set(tenant.id, tenant));
  }

  function removeTenant(tenantId: string) {
    onChange(value.filter((id) => id !== tenantId));
    setSelectedTenants((current) => {
      const next = new Map(current);
      next.delete(tenantId);

      return next;
    });
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Popover
        open={open}
        onOpenChange={(nextOpen) => {
          setOpen(nextOpen);
          if (!nextOpen) setSearch('');
        }}
      >
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            disabled={disabled}
            className={cn(
              'h-8.5 w-full justify-between px-3 font-normal shadow-xs shadow-black/5',
              value.length === 0 && 'text-muted-foreground',
              error && 'border-destructive',
            )}
          >
            <span className="truncate">
              {value.length === 0
                ? placeholder
                : `${value.length} empresa${value.length === 1 ? '' : 's'} selecionada${value.length === 1 ? '' : 's'}`}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar empresa..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isFetching ? 'Buscando...' : 'Nenhuma empresa encontrada.'}
              </CommandEmpty>
              <CommandGroup>
                {tenants.map((tenant) => {
                  const selected = value.includes(tenant.id);

                  return (
                    <CommandItem
                      key={tenant.id}
                      value={tenant.id}
                      onSelect={() => toggleTenant(tenant)}
                    >
                      <Check className={cn('mr-2 size-4', selected ? 'opacity-100' : 'opacity-0')} />
                      <span className="truncate">{formatTenantLabel(tenant)}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 ? (
        <div className="flex min-h-[32px] flex-wrap gap-1">
          {value.map((tenantId, index) => (
            <Badge key={tenantId} variant="secondary" className="gap-1">
              {selectedLabels[index] ?? tenantId}
              <button type="button" onClick={() => removeTenant(tenantId)}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <span className="text-xs text-muted-foreground">Nenhuma empresa selecionada.</span>
      )}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
