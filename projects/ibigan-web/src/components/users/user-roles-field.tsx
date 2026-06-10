import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { formatRoleName } from '@/lib/role-permission-labels';
import { rolesService } from '@/services/roles.service';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Label } from '@/components/ui/label';

const PROTECTED_ROLES = new Set(['super-admin']);

interface UserRolesFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  lockedRoles?: string[];
}

export function UserRolesField<T extends FieldValues>({
  control,
  name,
  lockedRoles = [],
}: UserRolesFieldProps<T>) {
  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesService.list(),
  });

  const assignableRoles = useMemo(
    () => (data?.data.result ?? []).filter((role) => !PROTECTED_ROLES.has(role.name)),
    [data],
  );

  const locked = useMemo(
    () => lockedRoles.filter((role) => PROTECTED_ROLES.has(role)),
    [lockedRoles],
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel required>Papéis</FormLabel>
          {locked.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {locked.map((role) => (
                <Badge key={role} variant="outline">
                  {formatRoleName(role)} (sistema)
                </Badge>
              ))}
            </div>
          )}
          <FormControl>
            <div className="space-y-2 rounded-md border p-3">
              {isLoading && (
                <p className="text-sm text-muted-foreground">Carregando papéis...</p>
              )}
              {!isLoading && assignableRoles.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum papel disponível.</p>
              )}
              {assignableRoles.map((role) => {
                const selected = Array.isArray(field.value) && field.value.includes(role.name);

                return (
                  <div key={role.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`user-role-${role.name}`}
                      checked={selected}
                      onCheckedChange={(checked) => {
                        const current = Array.isArray(field.value) ? field.value : [];
                        const next = checked
                          ? [...new Set([...current, role.name])]
                          : current.filter((item: string) => item !== role.name);
                        field.onChange(next);
                      }}
                    />
                    <Label htmlFor={`user-role-${role.name}`} className="font-normal">
                      {formatRoleName(role.name)}
                    </Label>
                  </div>
                );
              })}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function splitUserRoles(roles: string[] = []) {
  return {
    lockedRoles: roles.filter((role) => PROTECTED_ROLES.has(role)),
    assignableRoles: roles.filter((role) => !PROTECTED_ROLES.has(role)),
  };
}
