import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ChevronsUpDown } from 'lucide-react';
import type { Control, FieldPath, FieldValues } from 'react-hook-form';
import { formatRoleName } from '@/lib/role-permission-labels';
import { cn } from '@/lib/utils';
import { rolesService } from '@/services/roles.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandCheck,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const PROTECTED_ROLES = new Set(['super-admin']);

interface UserRolesFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  lockedRoles?: string[];
  canAssignProtected?: boolean;
}

function formatSelectedRolesLabel(
  selected: string[],
  emptyLabel: string,
): string {
  if (selected.length === 0) {
    return emptyLabel;
  }

  const labels = selected.map((role) => formatRoleName(role));

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return `${labels[0]}, ${labels[1]}`;
  }

  return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
}

export function UserRolesField<T extends FieldValues>({
  control,
  name,
  lockedRoles = [],
  canAssignProtected = false,
}: UserRolesFieldProps<T>) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesService.list(),
  });

  const assignableRoles = useMemo(
    () => (data?.data.result ?? []).filter(
      (role) => canAssignProtected || !PROTECTED_ROLES.has(role.name),
    ),
    [canAssignProtected, data],
  );

  const locked = useMemo(
    () => (canAssignProtected
      ? []
      : lockedRoles.filter((role) => PROTECTED_ROLES.has(role))),
    [canAssignProtected, lockedRoles],
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const selected = Array.isArray(field.value) ? field.value : [];

        function toggleRole(roleName: string) {
          const next = selected.includes(roleName)
            ? selected.filter((item) => item !== roleName)
            : [...selected, roleName];
          field.onChange(next);
        }

        return (
          <FormItem>
            <FormLabel required>{t('users.form.roles')}</FormLabel>
            {locked.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {locked.map((role) => (
                  <Badge key={role} variant="outline">
                    {formatRoleName(role)} {t('users.form.role_system')}
                  </Badge>
                ))}
              </div>
            )}
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <FormControl>
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={isLoading}
                    className={cn(
                      'h-8.5 w-full justify-between px-3 font-normal shadow-xs shadow-black/5',
                      selected.length === 0 && 'text-muted-foreground',
                    )}
                  >
                    <span className="truncate">
                      {isLoading
                        ? t('users.form.roles_loading')
                        : formatSelectedRolesLabel(selected, t('users.form.roles_select'))}
                    </span>
                    <ChevronsUpDown className="size-4 shrink-0 opacity-60" />
                  </Button>
                </FormControl>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
                <Command>
                  <CommandInput placeholder={t('users.form.roles_search')} />
                  <CommandList>
                    <CommandEmpty>{t('roles.empty')}</CommandEmpty>
                    <CommandGroup>
                      {assignableRoles.map((role) => {
                        const isSelected = selected.includes(role.name);

                        return (
                          <CommandItem
                            key={role.id}
                            value={`${role.name} ${formatRoleName(role.name)}`}
                            onSelect={() => toggleRole(role.name)}
                          >
                            <CommandCheck className={cn(!isSelected && 'opacity-0')} />
                            {formatRoleName(role.name)}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {selected.map((role) => (
                  <Badge key={role} variant="secondary" className="font-normal">
                    {formatRoleName(role)}
                  </Badge>
                ))}
              </div>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

export function splitUserRoles(roles: string[] = [], canAssignProtected = false) {
  if (canAssignProtected) {
    return {
      lockedRoles: [] as string[],
      assignableRoles: roles,
    };
  }

  return {
    lockedRoles: roles.filter((role) => PROTECTED_ROLES.has(role)),
    assignableRoles: roles.filter((role) => !PROTECTED_ROLES.has(role)),
  };
}
