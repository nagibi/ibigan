import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, User } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { getInitials } from '@/lib/helpers';
import { useAuthStore } from '@/stores/auth.store';
import { authService } from '@/services/auth.service';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserDropdownMenuProps {
  trigger?: ReactNode;
}

export function UserDropdownMenu({ trigger }: UserDropdownMenuProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  async function handleLogout() {
    try {
      await authService.logout();
    } catch {
      // ignora erro de rede
    } finally {
      logout();
      navigate('/auth/login');
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Avatar className="size-9 cursor-pointer border-2 border-green-500">
            <AvatarImage src={toAbsoluteUrl('/media/avatars/300-2.png')} />
            <AvatarFallback>{getInitials(user?.name ?? '', 2)}</AvatarFallback>
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.name ?? 'Usuário'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email ?? ''}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="size-4 mr-2" /> Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="size-4 mr-2" /> Configurações
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
          <LogOut className="size-4 mr-2" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
