import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import { useIntl } from 'react-intl';
import {
  Bell,
  Building2,
  Globe,
  Moon,
  User,
} from 'lucide-react';
import { useApiMenuByPath } from '@/hooks/use-api-menu-by-path';
import { resolveMenuIcon } from '@/lib/menu-icons';
import { I18N_LANGUAGES } from '@/i18n/config';
import { getInitials } from '@/lib/helpers';
import { resetEcho } from '@/lib/echo';
import { useCentralOnlySession } from '@/hooks/use-central-only-session';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { authService } from '@/services/auth.service';
import { centralAuthService } from '@/services/central-auth.service';
import { profileService } from '@/services/profile.service';
import { useLanguage } from '@/providers/i18n-provider';
import { useSettings } from '@/providers/settings-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserDropdownMenuProps {
  trigger?: ReactNode;
}

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function UserDropdownMenu({ trigger }: UserDropdownMenuProps) {
  const navigate = useNavigate();
  const intl = useIntl();
  const { user, logout, isAuthenticated } = useAuthStore();
  const { centralUser, centralLogout } = useCentralAuthStore();
  const isCentralOnly = useCentralOnlySession();
  const { currenLanguage, changeLanguage } = useLanguage();
  const { setTheme, resolvedTheme } = useTheme();
  const { storeOption } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && resolvedTheme === 'dark';

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.show(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const profileMenu = useApiMenuByPath('/profile');
  const myNotificationsMenu = useApiMenuByPath('/notifications');

  const profileLabel = profileMenu?.title ?? intl.formatMessage({ id: 'USER.MENU.MY_PROFILE' });
  const myNotificationsLabel = myNotificationsMenu?.title
    ?? intl.formatMessage({ id: 'USER.MENU.NOTIFICATIONS' });

  const ProfileIcon = profileMenu
    ? resolveMenuIcon({
      icon: profileMenu.icon,
      path: profileMenu.path,
      slug: profileMenu.slug,
      title: profileMenu.title,
    })
    : User;
  const MyNotificationsIcon = myNotificationsMenu
    ? resolveMenuIcon({
      icon: myNotificationsMenu.icon,
      path: myNotificationsMenu.path,
      slug: myNotificationsMenu.slug,
      title: myNotificationsMenu.title,
    })
    : Bell;

  const avatarUrl = profileData?.data.result.avatar_url ?? null;
  const displayName = isCentralOnly
    ? (centralUser?.name ?? 'Super Admin')
    : (profileData?.data.result.name ?? user?.name ?? 'Usuário');
  const displayEmail = isCentralOnly
    ? (centralUser?.email ?? '')
    : (profileData?.data.result.email ?? user?.email ?? '');
  const primaryRole = isCentralOnly ? 'super-admin' : user?.roles?.[0];

  async function handleLogout() {
    if (isCentralOnly) {
      try {
        await centralAuthService.logout();
      } catch {
        // ignora erro de rede
      } finally {
        centralLogout();
        navigate('/central/login');
      }
      return;
    }

    try {
      await authService.logout();
    } catch {
      // ignora erro de rede
    } finally {
      resetEcho();
      logout();
      navigate('/auth/login');
    }
  }

  function handleThemeToggle(checked: boolean) {
    const nextTheme = checked ? 'dark' : 'light';
    setTheme(nextTheme);
    storeOption('layouts.demo1.sidebarTheme', nextTheme);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger ?? (
          <Avatar className="size-9 cursor-pointer">
            <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {getInitials(displayName, 2)}
            </AvatarFallback>
          </Avatar>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" side="bottom" className="w-64">
        <div className="flex items-center justify-between gap-2 p-3">
          <div className="flex min-w-0 items-center gap-2">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="size-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <Avatar className="size-9 shrink-0">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(displayName, 2)}
                </AvatarFallback>
              </Avatar>
            )}
            <div className="min-w-0 flex flex-col">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="truncate text-left text-sm font-semibold text-foreground hover:text-primary"
              >
                {displayName}
              </button>
              <a
                href={`mailto:${displayEmail}`}
                className="truncate text-xs text-muted-foreground hover:text-primary"
              >
                {displayEmail}
              </a>
            </div>
          </div>
          {primaryRole && (
            <Badge variant="primary" appearance="light" size="sm" className="shrink-0">
              {formatRole(primaryRole)}
            </Badge>
          )}
        </div>

        <DropdownMenuSeparator />

        {!isCentralOnly ? (
          <>
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <ProfileIcon className="size-4" />
              {profileLabel}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/notifications')}>
              <MyNotificationsIcon className="size-4" />
              {myNotificationsLabel}
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigate('/auth/select-tenant', { state: { manual: true } })}
            >
              <Building2 className="size-4" />
              Trocar organização
            </DropdownMenuItem>
          </>
        ) : null}

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="[&_[data-slot=dropdown-menu-sub-trigger-indicator]]:hidden">
            <Globe className="size-4" />
            <span className="relative flex grow items-center justify-between gap-2">
              {intl.formatMessage({ id: 'USER.MENU.LANGUAGE' })}
              <Badge variant="outline" className="gap-1 pe-1.5">
                <span className="max-w-20 truncate">{currenLanguage.label}</span>
                <img
                  src={currenLanguage.flag}
                  className="size-3.5 rounded-full"
                  alt={currenLanguage.label}
                />
              </Badge>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-52">
            <DropdownMenuRadioGroup
              value={currenLanguage.code}
              onValueChange={(code) => {
                const language = I18N_LANGUAGES.find((item) => item.code === code);
                if (language) changeLanguage(language);
              }}
            >
              {I18N_LANGUAGES.map((language) => (
                <DropdownMenuRadioItem
                  key={language.code}
                  value={language.code}
                  className="gap-2"
                >
                  <img
                    src={language.flag}
                    className="size-4 rounded-full"
                    alt={language.label}
                  />
                  <span>{language.label}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="focus:bg-transparent"
          onSelect={(event) => event.preventDefault()}
        >
          <Moon className="size-4" />
          <div className="flex grow items-center justify-between gap-2">
            {intl.formatMessage({ id: 'USER.MENU.DARK_MODE' })}
            <span
              className="inline-flex"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={(event) => event.stopPropagation()}
            >
              <Switch
                size="sm"
                checked={isDarkMode}
                onCheckedChange={handleThemeToggle}
              />
            </span>
          </div>
        </DropdownMenuItem>

        <div className="p-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => void handleLogout()}
          >
            {intl.formatMessage({ id: 'USER.MENU.LOGOUT' })}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
