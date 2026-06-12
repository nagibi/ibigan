import api from '@/lib/axios';
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
    api.get<{ status: number; result: Profile }>('/v1/profile'),

  update: (payload: UserProfileFormData) =>
    api.put<{ status: number; result: Profile }>('/v1/profile', payload),

  updatePassword: (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => api.put('/v1/profile/password', payload),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post<{ status: number; result: Profile }>('/v1/profile/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAvatar: () =>
    api.delete('/v1/profile/avatar'),
};
