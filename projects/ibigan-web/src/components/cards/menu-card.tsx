import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { GridBadge } from '@/components/grid/grid-badge';
import { GridCardActions } from '@/components/grid/grid-card-actions';
import type { GridRowAction } from '@/components/grid/grid-row-actions';
import { resolveMenuIcon } from '@/lib/menu-icons';
import type { ApiMenu } from '@/services/menus.service';

export function MenuCard({
  menu,
  depth = 0,
  actions,
}: {
  menu: ApiMenu;
  depth?: number;
  actions: GridRowAction[];
}) {
  const { t } = useTranslation();
  const Icon = resolveMenuIcon({
    icon: menu.icon,
    path: menu.path,
    slug: menu.slug,
    title: menu.title,
  });

  return (
    <div
      className="flex h-full min-w-0 w-full max-w-full flex-col gap-3 p-4"
      style={{ paddingInlineStart: `${16 + depth * 12}px` }}
    >
      <div className="flex min-w-0 items-start gap-3">
        <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{menu.title}</p>
          <p className="truncate text-sm text-muted-foreground">{menu.path ?? '—'}</p>
        </div>
        <GridBadge tone={menu.is_active ? 'success' : 'destructive'} className="shrink-0">
          {menu.is_active ? t('status.active') : t('status.inactive')}
        </GridBadge>
      </div>

      <p className="min-w-0 text-sm text-muted-foreground">
        {format(new Date(menu.updated_at ?? menu.created_at), 'dd/MM/yyyy', { locale: ptBR })}
      </p>

      <GridCardActions actions={actions} />
    </div>
  );
}
