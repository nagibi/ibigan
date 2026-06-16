import api from '@/lib/axios';

export interface UserAuditRef {
  id: number;
  name: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  cpf?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  bio?: string | null;
  status: string;
  is_active: boolean;
  last_login_at?: string | null;
  last_login_ip?: string | null;
  last_login_device?: string | null;
  roles: string[];
  created_at: string;
  updated_at?: string | null;
  created_by?: UserAuditRef | null;
  updated_by?: UserAuditRef | null;
  created_by_name?: string | null;
  updated_by_name?: string | null;
  avatar_url?: string | null;
}

export interface UsersPaginatedResponse {
  status: number;
  result: {
    data: User[];
    meta: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export interface UserProfilePayload {
  cpf?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  bio?: string | null;
}

export interface StoreUserPayload extends UserProfilePayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  roles: string[];
}

export interface UpdateUserPayload extends UserProfilePayload {
  name?: string;
  email?: string;
  roles?: string[];
  status?: string;
}

export function isUserActive(user: Pick<User, 'is_active' | 'status'>): boolean {
  if (typeof user.is_active === 'boolean') return user.is_active;
  return user.status === 'active';
}

export const usersService = {
  list: (
    page = 1,
    perPage = 10,
    search?: string,
    sort?: string | null,
    direction?: 'asc' | 'desc',
    columnFilters?: Record<string, string>,
  ) => {
    const filterParams = Object.fromEntries(
      Object.entries(columnFilters ?? {})
        .filter(([, value]) => value.trim().length > 0)
        .map(([key, value]) => [`filter_${key}`, value]),
    );

    return api.get<UsersPaginatedResponse>('/v1/users', {
      params: {
        page,
        per_page: perPage,
        ...(search ? { search } : {}),
        ...(sort ? { sort, direction: direction ?? 'asc' } : {}),
        ...filterParams,
      },
    });
  },

  show: (id: number) =>
    api.get<{ result: User }>(`/v1/users/${id}`),

  store: (payload: StoreUserPayload) =>
    api.post<{ result: User }>('/v1/users', payload),

  update: (id: number, payload: UpdateUserPayload) =>
    api.put<{ result: User }>(`/v1/users/${id}`, payload),

  destroy: (id: number) =>
    api.delete(`/v1/users/${id}`),

  toggleActive: (id: number, isActive: boolean) =>
    api.patch<{ result: User }>(`/v1/users/${id}/toggle-active`, { is_active: isActive }),

  listAllActive: async (search?: string): Promise<User[]> => {
    const perPage = 100;
    const firstPage = await usersService.list(1, perPage, search);
    const { data: initialUsers, meta } = firstPage.data.result;

    if (meta.last_page <= 1) {
      return initialUsers.filter(isUserActive);
    }

    const remainingPages = await Promise.all(
      Array.from({ length: meta.last_page - 1 }, (_, index) =>
        usersService.list(index + 2, perPage, search).then((response) => response.data.result.data),
      ),
    );

    return [...initialUsers, ...remainingPages.flat()].filter(isUserActive);
  },
};
