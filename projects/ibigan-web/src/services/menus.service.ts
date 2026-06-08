import api from '@/lib/axios';

export interface ApiMenu {
  id: number;
  title: string;
  slug: string;
  icon: string | null;
  path: string | null;
  target: string;
  parent_id: number | null;
  order: number;
  is_active: boolean;
  requires_auth: boolean;
  roles: string[] | null;
  children: ApiMenu[];
}

export interface MenusResponse {
  status: number;
  result: ApiMenu[];
}

export const menusService = {
  list: () => api.get<MenusResponse>('/v1/menus'),

  show: (id: number) =>
    api.get<{ status: number; result: ApiMenu }>(`/v1/menus/${id}`),

  store: (payload: Omit<ApiMenu, 'id' | 'children'>) =>
    api.post<{ status: number; result: ApiMenu }>('/v1/menus', payload),

  update: (id: number, payload: Partial<Omit<ApiMenu, 'id' | 'children'>>) =>
    api.put<{ status: number; result: ApiMenu }>(`/v1/menus/${id}`, payload),

  destroy: (id: number) =>
    api.delete(`/v1/menus/${id}`),

  reorder: (items: { id: number; order: number; parent_id?: number | null }[]) =>
    api.patch<{ status: number; result: ApiMenu[] }>('/v1/menus/reorder', { items }),
};
