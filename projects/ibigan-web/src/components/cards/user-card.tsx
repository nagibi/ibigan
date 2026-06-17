import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { GridCardActions } from '@/components/grid/grid-card-actions';
import { GridStatusSwitch } from '@/components/grid/grid-status-switch';
import type { GridRowAction } from '@/components/grid/grid-row-actions';
import { getInitials } from '@/lib/helpers';
import { isUserActive, type User } from '@/services/users.service';

export function UserCard({
  user,
  actions,
  statusUpdating = false,
  onActiveChange,
}: {
  user: User;
  actions: GridRowAction[];
  statusUpdating?: boolean;
  onActiveChange?: (active: boolean) => void;
}) {
  const active = isUserActive(user);
  const updatedAt = user.updated_at ?? user.created_at;

  return (
    <div className="flex h-full min-w-0 w-full max-w-full flex-col gap-3 p-4 font-normal [&_*]:font-normal">
      <div className="flex min-w-0 items-start gap-3">
        <Avatar className="size-10 shrink-0">
          <AvatarImage src={user.avatar_url ?? undefined} />
          <AvatarFallback className="bg-primary text-sm text-primary-foreground">
            {getInitials(user.name, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate">{user.name}</p>
          <p className="truncate text-sm text-muted-foreground">{user.email}</p>
        </div>
        {onActiveChange ? (
          <GridStatusSwitch
            checked={active}
            disabled={statusUpdating}
            onCheckedChange={onActiveChange}
          />
        ) : null}
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
