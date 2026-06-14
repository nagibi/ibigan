import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { usersService, type User } from '@/services/users.service';
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

interface UserMultiComboboxProps {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function formatUserLabel(user: Pick<User, 'name' | 'email'>): string {
  return `${user.name} (${user.email})`;
}

function parseValue(value?: string): string[] {
  if (!value?.trim()) return [];

  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function serializeValue(values: string[]): string {
  return values.join(',');
}

interface UserMultiComboboxFieldProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function UserMultiComboboxField({
  value,
  onChange,
  disabled,
  placeholder,
  className,
}: UserMultiComboboxFieldProps) {
  const selected = useMemo(() => parseValue(value), [value]);

  return (
    <UserMultiCombobox
      value={selected}
      onChange={(next) => onChange(serializeValue(next))}
      disabled={disabled}
      placeholder={placeholder}
      className={className}
    />
  );
}

export function UserMultiCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = 'Selecione os usuários',
  className,
}: UserMultiComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isFetching } = useQuery({
    queryKey: ['users-multi-combobox', debouncedSearch],
    queryFn: () => usersService.list(1, 20, debouncedSearch || undefined),
    enabled: open,
  });

  const users = data?.data.result.data ?? [];

  const selectedUsersQuery = useQuery({
    queryKey: ['users-multi-combobox-selected', value.join(',')],
    queryFn: async () => {
      const resolved = await Promise.all(
        value.map(async (id) => {
          const response = await usersService.show(Number(id));
          return response.data.result;
        }),
      );

      return resolved;
    },
    enabled: value.length > 0,
  });

  const selectedUsers = selectedUsersQuery.data ?? [];

  function toggleUser(userId: string) {
    if (value.includes(userId)) {
      onChange(value.filter((id) => id !== userId));

      return;
    }

    onChange([...value, userId]);
  }

  function removeUser(userId: string) {
    onChange(value.filter((id) => id !== userId));
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
            )}
          >
            <span className="truncate">
              {value.length === 0
                ? placeholder
                : `${value.length} usuário${value.length === 1 ? '' : 's'} selecionado${value.length === 1 ? '' : 's'}`}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Buscar por nome ou e-mail..."
              value={search}
              onValueChange={setSearch}
            />
            <CommandList>
              <CommandEmpty>
                {isFetching ? 'Buscando...' : 'Nenhum usuário encontrado.'}
              </CommandEmpty>
              <CommandGroup>
                {users.map((user) => {
                  const selected = value.includes(String(user.id));

                  return (
                    <CommandItem
                      key={user.id}
                      value={String(user.id)}
                      onSelect={() => toggleUser(String(user.id))}
                    >
                      <Check className={cn('mr-2 size-4', selected ? 'opacity-100' : 'opacity-0')} />
                      <span className="truncate">{formatUserLabel(user)}</span>
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
          {selectedUsers.map((user) => (
            <Badge key={user.id} variant="secondary" className="gap-1">
              {formatUserLabel(user)}
              <button type="button" onClick={() => removeUser(String(user.id))}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}
