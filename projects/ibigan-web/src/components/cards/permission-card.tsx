import { GridCardActions } from '@/components/grid/grid-card-actions';
import type { GridRowAction } from '@/components/grid/grid-row-actions';
import {
  formatPermissionAction,
  formatPermissionName,
  formatPermissionResource,
} from '@/lib/role-permission-labels';
import type { Permission } from '@/services/permissions.service';

export function PermissionCard({
  permission,
  actions,
}: {
  permission: Permission;
  actions: GridRowAction[];
}) {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate">{formatPermissionName(permission.name)}</p>
        <p className="text-sm text-muted-foreground">
          {formatPermissionResource(permission.resource)} · {formatPermissionAction(permission.action)}
        </p>
      </div>

      <GridCardActions actions={actions} />
    </div>
  );
}
