import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GridBadge } from '@/components/grid/grid-badge';
import { GridCardActions } from '@/components/grid/grid-card-actions';
import type { GridRowAction } from '@/components/grid/grid-row-actions';
import { getInitials } from '@/lib/helpers';
import { isUserActive, type User } from '@/services/users.service';

export function UserCard({
  user,
  actions,
}: {
  user: User;
  actions: GridRowAction[];
}) {
  const { t } = useTranslation();
  const active = isUserActive(user);
  const updatedAt = user.updated_at ?? user.created_at;

  return (
    <div className="flex h-full min-w-0 w-full max-w-full flex-col gap-3 p-4">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary text-sm text-primary-foreground">
            {getInitials(user.name, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        <GridBadge tone={active ? 'success' : 'destructive'} className="shrink-0">
          {active ? t('status.active') : t('status.inactive')}
        </GridBadge>
      </div>

      <div className="min-w-0 space-y-1 text-sm text-muted-foreground">
        {user.roles.length > 0 ? (
          <p className="truncate">{user.roles.join(', ')}</p>
        ) : null}
        <p>
          {format(new Date(updatedAt), 'dd/MM/yyyy', { locale: ptBR })}
        </p>
      </div>

      <GridCardActions actions={actions} />
    </div>
  );
}
