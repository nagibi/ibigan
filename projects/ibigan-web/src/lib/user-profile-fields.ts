import { z } from 'zod';

export const userProfileFieldsSchema = {
  cpf: z.string().max(11, 'CPF inválido.').optional(),
  phone: z.string().max(11, 'Telefone inválido.').optional(),
  birth_date: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say', '']).optional(),
  bio: z.string().max(500, 'Máximo 500 caracteres.').optional(),
};

export const userProfileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  ...userProfileFieldsSchema,
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;

export const USER_PROFILE_DEFAULT_VALUES: UserProfileFormData = {
  name: '',
  email: '',
  cpf: '',
  phone: '',
  birth_date: '',
  gender: '',
  bio: '',
};

export function normalizeUserProfilePayload<T extends UserProfileFormData>(data: T) {
  return {
    ...data,
    cpf: data.cpf?.trim() || null,
    phone: data.phone?.trim() || null,
    birth_date: data.birth_date?.trim() || null,
    gender: data.gender || null,
    bio: data.bio?.trim() || null,
  };
}

export function mapUserProfileToFormValues(profile: {
  name: string;
  email: string;
  cpf?: string | null;
  phone?: string | null;
  birth_date?: string | null;
  gender?: string | null;
  bio?: string | null;
}): UserProfileFormData {
  return {
    name: profile.name,
    email: profile.email,
    cpf: profile.cpf ?? '',
    phone: profile.phone ?? '',
    birth_date: profile.birth_date?.slice(0, 10) ?? '',
    gender: (profile.gender ?? '') as UserProfileFormData['gender'],
    bio: profile.bio ?? '',
  };
}
