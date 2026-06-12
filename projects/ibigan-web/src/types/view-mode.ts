export type ViewMode = 'table' | 'list' | 'cards';

export const VIEW_MODES: ViewMode[] = ['table', 'list', 'cards'];

export const VIEW_PREFERENCE_KEYS = {
  users: 'users.view',
  roles: 'roles.view',
  permissions: 'permissions.view',
  organizations: 'organizations.view',
  menus: 'menus.view',
} as const;

export type ViewPreferenceKey = (typeof VIEW_PREFERENCE_KEYS)[keyof typeof VIEW_PREFERENCE_KEYS];

export function isViewMode(value: string | null | undefined): value is ViewMode {
  return VIEW_MODES.includes(value as ViewMode);
}

export function defaultViewMode(isMobile: boolean): ViewMode {
  return isMobile ? 'cards' : 'table';
}
