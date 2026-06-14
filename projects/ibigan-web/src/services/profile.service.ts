import api from '@/lib/axios';
import { profileApiBase } from '@/lib/profile-api';
import type { UserProfileFormData } from '@/lib/user-profile-fields';

export interface Profile {
  id: number;
  name: string;
  email: string;
  cpf?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  bio?: string | null;
  avatar_url: string | null;
  roles: string[];
  created_at: string;
}

export const profileService = {
  show: () =>
    api.get<{ status: number; result: Profile }>(profileApiBase()),

  update: (payload: UserProfileFormData) =>
    api.put<{ status: number; result: Profile }>(profileApiBase(), payload),

  updatePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.put(`${profileApiBase()}/password`, payload),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post<{ status: number; result: Profile }>(`${profileApiBase()}/avatar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAvatar: () =>
    api.delete(`${profileApiBase()}/avatar`),
};
