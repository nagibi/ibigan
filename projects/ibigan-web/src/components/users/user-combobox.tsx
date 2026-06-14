import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, ChevronsUpDown } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils';
import { usersService, type User } from '@/services/users.service';
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

interface UserComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function formatUserLabel(user: Pick<User, 'name' | 'email'>): string {
  return `${user.name} (${user.email})`;
}

export function UserCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = 'Selecione o usuário',
  className,
}: UserComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const selectedUserId = value ? Number(value) : null;
  const hasValidSelectedId = selectedUserId !== null && !Number.isNaN(selectedUserId);

  const { data: selectedUserData, isLoading: isLoadingSelected } = useQuery({
    queryKey: ['user', selectedUserId],
    queryFn: () => usersService.show(selectedUserId!),
    enabled: hasValidSelectedId,
  });

  const { data: searchData, isFetching: isSearching } = useQuery({
    queryKey: ['users-combobox', debouncedSearch],
    queryFn: () => usersService.list(1, 20, debouncedSearch || undefined),
    enabled: open,
  });

  const users = searchData?.data.result.data ?? [];
  const selectedUser = selectedUserData?.data.result;
  const selectedLabel = selectedUser ? formatUserLabel(selectedUser) : null;

  return (
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
            !selectedLabel && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">
            {isLoadingSelected ? 'Carregando...' : (selectedLabel ?? placeholder)}
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
              {isSearching ? 'Buscando...' : 'Nenhum usuário encontrado.'}
            </CommandEmpty>
            <CommandGroup>
              {users.map((user) => (
                <CommandItem
                  key={user.id}
                  value={String(user.id)}
                  onSelect={() => {
                    onChange(String(user.id));
                    setOpen(false);
                    setSearch('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 size-4',
                      value === String(user.id) ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="truncate">{formatUserLabel(user)}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
