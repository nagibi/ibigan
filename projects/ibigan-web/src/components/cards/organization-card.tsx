import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LoaderCircle, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GridBadge } from '@/components/grid/grid-badge';
import { GridCardActions } from '@/components/grid/grid-card-actions';
import type { GridRowAction } from '@/components/grid/grid-row-actions';
import { formatCnpj } from '@/lib/brazilian-masks';
import type { AdminTenant } from '@/services/admin-tenants.service';
import { Button } from '@/components/ui/button';

export function OrganizationCard({
  tenant,
  actions,
  onEnter,
  enterDisabled = false,
  enterLoading = false,
}: {
  tenant: AdminTenant;
  actions: GridRowAction[];
  onEnter?: () => void;
  enterDisabled?: boolean;
  enterLoading?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full min-w-0 w-full max-w-full flex-col gap-3 p-4">
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate">{tenant.name ?? tenant.slug}</p>
          <p className="truncate text-sm text-muted-foreground">{tenant.slug}</p>
        </div>
        <GridBadge tone={tenant.is_active ? 'success' : 'destructive'} className="shrink-0">
          {tenant.is_active ? t('status.active') : t('status.inactive')}
        </GridBadge>
      </div>

      <div className="min-w-0 space-y-1 text-sm text-muted-foreground">
        {tenant.cnpj ? <p>{formatCnpj(tenant.cnpj)}</p> : null}
        <p>{format(new Date(tenant.created_at), 'dd/MM/yyyy', { locale: ptBR })}</p>
      </div>

      <div className="mt-auto flex items-center gap-2">
        {onEnter ? (
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="h-8 gap-1.5"
            disabled={enterDisabled}
            onClick={(event) => {
              event.stopPropagation();
              onEnter();
            }}
          >
            {enterLoading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <LogIn className="size-4" />
            )}
            Entrar
          </Button>
        ) : null}
        <GridCardActions actions={actions} />
      </div>
    </div>
  );
}
