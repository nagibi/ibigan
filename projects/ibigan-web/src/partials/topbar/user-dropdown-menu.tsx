import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from 'next-themes';
import {
  Bell,
  Globe,
  LayoutDashboard,
  LogOut,
  Moon,
  PanelLeft,
  PanelTop,
  User,
} from 'lucide-react';
import { type MenuMode } from '@/config/types';
import { useCanAccessCentralFromTenant } from '@/hooks/use-can-access-central-from-tenant';
import { useApiMenuByPath } from '@/hooks/use-api-menu-by-path';
import { resolveMenuIcon } from '@/lib/menu-icons';
import { I18N_LANGUAGES } from '@/i18n/config';
import { getInitials } from '@/lib/helpers';
import { logoutFromApp } from '@/lib/auth-logout';
import { useCentralOnlySession } from '@/hooks/use-central-only-session';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';
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
import { ToolbarTooltip } from '@/components/grid/toolbar-tooltip';
import { useHoverDropdown } from '@/hooks/use-hover-dropdown';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserDropdownMenuProps {
  trigger?: ReactNode;
}

const MENU_MODE_OPTIONS: Array<{ value: MenuMode; labelKey: string; icon: typeof PanelTop }> = [
  { value: 'horizontal', labelKey: 'user.menu.navigation_horizontal', icon: PanelTop },
  { value: 'sidebar', labelKey: 'user.menu.navigation_sidebar', icon: PanelLeft },
];

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function UserDropdownMenu({ trigger }: UserDropdownMenuProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const { centralUser } = useCentralAuthStore();
  const isCentralOnly = useCentralOnlySession();
  const canAccessCentralFromTenant = useCanAccessCentralFromTenant();
  const { currenLanguage, changeLanguage } = useLanguage();
  const { setTheme, resolvedTheme } = useTheme();
  const { settings, storeOption } = useSettings();
  const isMobile = useIsMobile();
  const hover = useHoverDropdown(180);
  const useHoverMenu = !isMobile;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted && resolvedTheme === 'dark';
  const menuMode = (settings.layouts.demo1.menuMode ?? 'horizontal') as MenuMode;
  const currentMenuMode = MENU_MODE_OPTIONS.find((option) => option.value === menuMode)
    ?? MENU_MODE_OPTIONS[0];

  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.show(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const profileMenu = useApiMenuByPath('/profile');
  const myNotificationsMenu = useApiMenuByPath('/notifications');

  const profileLabel = profileMenu?.title ?? t('user.menu.my_profile');
  const myNotificationsLabel = myNotificationsMenu?.title ?? t('user.menu.notifications');

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

  const profilePath = '/profile';

  async function handleLogout() {
    const redirectTo = await logoutFromApp();
    navigate(redirectTo);
  }

  function handleThemeToggle(checked: boolean) {
    const nextTheme = checked ? 'dark' : 'light';
    setTheme(nextTheme);
    storeOption('layouts.demo1.sidebarTheme', nextTheme);
  }

  function handleMenuModeChange(value: MenuMode) {
    storeOption('layouts.demo1.menuMode', value);
  }

  const defaultTrigger = (
    <span className="inline-flex shrink-0 cursor-pointer rounded-full outline-none">
      <Avatar className="size-8 sm:size-9">
        <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
        <AvatarFallback className="bg-primary text-primary-foreground text-sm">
          {getInitials(displayName, 2)}
        </AvatarFallback>
      </Avatar>
    </span>
  );

  const menuTrigger = useHoverMenu ? (
    <span
      className="inline-flex"
      onMouseEnter={hover.handleEnter}
      onMouseLeave={hover.handleLeave}
    >
      {trigger ?? defaultTrigger}
    </span>
  ) : (
    trigger ?? defaultTrigger
  );

  return (
    <DropdownMenu
      modal={false}
      open={useHoverMenu ? hover.open : undefined}
      onOpenChange={useHoverMenu ? hover.setOpen : undefined}
    >
      <DropdownMenuTrigger asChild>{menuTrigger}</DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-64"
        onMouseEnter={useHoverMenu ? hover.handleEnter : undefined}
        onMouseLeave={useHoverMenu ? hover.handleLeave : undefined}
      >
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
                onClick={() => navigate(profilePath)}
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

        <DropdownMenuItem onClick={() => navigate(profilePath)}>
          <ProfileIcon className="size-4" />
          {profileLabel}
        </DropdownMenuItem>

        {!isCentralOnly ? (
          <>
            <DropdownMenuItem onClick={() => navigate('/notifications')}>
              <MyNotificationsIcon className="size-4" />
              {myNotificationsLabel}
            </DropdownMenuItem>

            {canAccessCentralFromTenant ? (
              <DropdownMenuItem onClick={() => navigate('/admin/tenants')}>
                <LayoutDashboard className="size-4" />
                {t('user.menu.central_panel')}
              </DropdownMenuItem>
            ) : null}
          </>
        ) : null}

        <DropdownMenuSeparator />

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="[&_[data-slot=dropdown-menu-sub-trigger-indicator]]:hidden">
            <Globe className="size-4" />
            <span className="relative flex grow items-center justify-between gap-2">
              {t('user.menu.language')}
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
          <DropdownMenuSubContent
            className="w-52"
            onMouseEnter={useHoverMenu ? hover.handleEnter : undefined}
            onMouseLeave={useHoverMenu ? hover.handleLeave : undefined}
          >
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

        <DropdownMenuSub>
          <DropdownMenuSubTrigger className="[&_[data-slot=dropdown-menu-sub-trigger-indicator]]:hidden">
            <currentMenuMode.icon className="size-4" />
            <span className="relative flex grow items-center justify-between gap-2">
              {t('user.menu.navigation_menu')}
              <Badge variant="outline" className="max-w-24 truncate">
                {t(currentMenuMode.labelKey)}
              </Badge>
            </span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent
            className="w-52"
            onMouseEnter={useHoverMenu ? hover.handleEnter : undefined}
            onMouseLeave={useHoverMenu ? hover.handleLeave : undefined}
          >
            <DropdownMenuRadioGroup
              value={menuMode}
              onValueChange={(value) => handleMenuModeChange(value as MenuMode)}
            >
              {MENU_MODE_OPTIONS.map((option) => {
                const Icon = option.icon;

                return (
                  <DropdownMenuRadioItem
                    key={option.value}
                    value={option.value}
                    className="gap-2"
                  >
                    <Icon className="size-4" />
                    <span>{t(option.labelKey)}</span>
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>

        <DropdownMenuItem
          className="focus:bg-transparent"
          onSelect={(event) => event.preventDefault()}
        >
          <Moon className="size-4" />
          <div className="flex grow items-center justify-between gap-2">
            {t('user.menu.dark_mode')}
            <ToolbarTooltip
              content={isDarkMode
                ? t('header.tooltip.dark_mode_off')
                : t('header.tooltip.dark_mode_on')}
            >
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
            </ToolbarTooltip>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="p-2 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full gap-1.5"
            onClick={() => void handleLogout()}
          >
            <LogOut className="size-4" />
            {t('user.menu.logout')}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
