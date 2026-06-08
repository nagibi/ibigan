import api from '@/lib/axios';

export interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  roles: string[];
  created_at: string;
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

export interface StoreUserPayload {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

export const usersService = {
  list: (page = 1, perPage = 10) =>
    api.get<UsersPaginatedResponse>('/v1/users', { params: { page, per_page: perPage } }),

  show: (id: number) =>
    api.get<{ result: User }>(`/v1/users/${id}`),

  store: (payload: StoreUserPayload) =>
    api.post<{ result: User }>('/v1/users', payload),

  update: (id: number, payload: UpdateUserPayload) =>
    api.put<{ result: User }>(`/v1/users/${id}`, payload),

  destroy: (id: number) =>
    api.delete(`/v1/users/${id}`),
};
