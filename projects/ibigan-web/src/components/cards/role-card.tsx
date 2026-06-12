import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { GridBadge } from '@/components/grid/grid-badge';
import { GridCardActions } from '@/components/grid/grid-card-actions';
import type { GridRowAction } from '@/components/grid/grid-row-actions';
import { formatRoleName } from '@/lib/role-permission-labels';
import type { Role } from '@/services/roles.service';

export function RoleCard({
  role,
  actions,
}: {
  role: Role;
  actions: GridRowAction[];
}) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium">{formatRoleName(role.name)}</p>
          <p className="text-sm text-muted-foreground">
            {t('roles.form.users_count', { count: role.users_count })}
          </p>
        </div>
        {role.is_system ? <GridBadge tone="info">{t('roles.type.system')}</GridBadge> : null}
      </div>

      <p className="text-sm text-muted-foreground">
        {format(new Date(role.updated_at ?? role.created_at), 'dd/MM/yyyy', { locale: ptBR })}
      </p>

      <GridCardActions actions={actions} />
    </div>
  );
}
