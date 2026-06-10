import { useMemo } from 'react';
import type { Permission } from '@/services/permissions.service';
import {
  formatPermissionAction,
  formatPermissionResource,
} from '@/lib/role-permission-labels';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface RolePermissionsPanelProps {
  allPermissions: Permission[];
  selected: string[];
  disabled?: boolean;
  onChange: (permissions: string[]) => void;
}

export function RolePermissionsPanel({
  allPermissions,
  selected,
  disabled = false,
  onChange,
}: RolePermissionsPanelProps) {
  const grouped = useMemo(() => {
    const map = new Map<string, Permission[]>();

    for (const permission of allPermissions) {
      const current = map.get(permission.resource) ?? [];
      current.push(permission);
      map.set(permission.resource, current);
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([resource, permissions]) => ({
        resource,
        permissions: permissions.sort((a, b) => a.action.localeCompare(b.action)),
      }));
  }, [allPermissions]);

  const togglePermission = (name: string, checked: boolean) => {
    if (checked) {
      onChange([...new Set([...selected, name])].sort());
      return;
    }

    onChange(selected.filter((item) => item !== name));
  };

  if (grouped.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Nenhuma permissão disponível.</p>
    );
  }

  return (
    <div className="divide-y rounded-md border">
      <div className="grid grid-cols-[minmax(0,1fr)_88px_88px] gap-3 px-4 py-3 text-xs font-medium text-muted-foreground">
        <span>Recurso</span>
        <span className="text-center">Visualizar</span>
        <span className="text-center">Gerenciar</span>
      </div>

      {grouped.map(({ resource, permissions }) => {
        const visualizar = permissions.find((item) => item.action === 'visualizar');
        const gerenciar = permissions.find((item) => item.action === 'gerenciar');

        return (
          <div
            key={resource}
            className="grid grid-cols-[minmax(0,1fr)_88px_88px] items-center gap-3 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium">{formatPermissionResource(resource)}</p>
              <p className="text-xs text-muted-foreground">{resource}</p>
            </div>

            {visualizar ? (
              <div className="flex justify-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`permission-${visualizar.name}`}
                    checked={selected.includes(visualizar.name)}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      togglePermission(visualizar.name, checked === true)
                    }
                  />
                  <Label htmlFor={`permission-${visualizar.name}`} className="sr-only">
                    {formatPermissionAction('visualizar')}
                  </Label>
                </div>
              </div>
            ) : (
              <span className="text-center text-xs text-muted-foreground">—</span>
            )}

            {gerenciar ? (
              <div className="flex justify-center">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`permission-${gerenciar.name}`}
                    checked={selected.includes(gerenciar.name)}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      togglePermission(gerenciar.name, checked === true)
                    }
                  />
                  <Label htmlFor={`permission-${gerenciar.name}`} className="sr-only">
                    {formatPermissionAction('gerenciar')}
                  </Label>
                </div>
              </div>
            ) : (
              <span className="text-center text-xs text-muted-foreground">—</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
