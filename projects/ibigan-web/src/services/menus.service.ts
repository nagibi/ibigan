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
};
