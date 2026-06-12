import { buildGridUrlSearchParams } from '@/lib/grid-url-state';

export interface RolesUserFilter {
  userId: number;
  userName: string;
  roleNames: string[];
}

export function buildRolesUrlWithUserFilter(user: {
  id: number;
  name: string;
  roles: string[];
}): string {
  const params = buildGridUrlSearchParams({
    userFilter: {
      userId: user.id,
      userName: user.name,
      roleNames: user.roles,
    },
  });

  const query = params.toString();
  return query ? `/roles?${query}` : '/roles';
}

export function parseRolesUserFilter(searchParams: URLSearchParams): RolesUserFilter | null {
  const userId = searchParams.get('user_id');
  if (!userId) return null;

  const id = Number(userId);
  if (!Number.isFinite(id)) return null;

  return {
    userId: id,
    userName: searchParams.get('user_name') ?? `Usuário #${id}`,
    roleNames: (searchParams.get('roles') ?? '').split(',').filter(Boolean),
  };
}

export function clearRolesUserFilterParams(searchParams: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(searchParams);
  next.delete('user_id');
  next.delete('user_name');
  next.delete('roles');
  return next;
}
