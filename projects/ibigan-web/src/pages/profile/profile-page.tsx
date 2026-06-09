import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, LoaderCircle, Trash2 } from 'lucide-react';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/stores/auth.store';
import { getInitials } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { AppearanceSettingsCard } from '@/components/settings/appearance-settings-card';
import { toast } from 'sonner';

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, 'Senha atual é obrigatória.'),
  password: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres.'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'As senhas não coincidem.',
  path: ['password_confirmation'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { user, setAuth, tenantId, token } = useAuthStore();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => profileService.show(),
  });

  const profile = data?.data.result;

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: {
      name: profile?.name ?? '',
      email: profile?.email ?? '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: '', password: '', password_confirmation: '',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => profileService.update(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (token && tenantId) {
        setAuth(token, tenantId, {
          ...user!,
          name: res.data.result.name,
          email: res.data.result.email,
        });
      }
      toast.success('Perfil atualizado com sucesso!');
    },
    onError: () => toast.error('Erro ao atualizar perfil.'),
  });

  const passwordMutation = useMutation({
    mutationFn: (data: PasswordFormData) => profileService.updatePassword(data),
    onSuccess: () => {
      passwordForm.reset();
      toast.success('Senha alterada com sucesso!');
    },
    onError: () => toast.error('Senha atual incorreta.'),
  });

  const avatarMutation = useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarPreview(null);
      toast.success('Avatar atualizado!');
    },
    onError: () => toast.error('Erro ao enviar avatar.'),
  });

  const deleteAvatarMutation = useMutation({
    mutationFn: () => profileService.deleteAvatar(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAvatarPreview(null);
      toast.success('Avatar removido!');
    },
    onError: () => toast.error('Erro ao remover avatar.'),
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarPreview(URL.createObjectURL(file));
    avatarMutation.mutate(file);
  }

  if (isLoading) {
    return (
      <div className="container py-6 flex justify-center">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Meu Perfil</h1>
        <p className="text-sm text-muted-foreground">Gerencie suas informações pessoais.</p>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="size-20">
                <AvatarImage src={avatarPreview ?? profile?.avatar_url ?? undefined} />
                <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                  {getInitials(profile?.name ?? '', 2)}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="outline"
                mode="icon"
                size="sm"
                className="absolute -bottom-1 -right-1 size-7 rounded-full"
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarMutation.isPending}
              >
                {avatarMutation.isPending
                  ? <LoaderCircle className="size-3 animate-spin" />
                  : <Camera className="size-3" />
                }
              </Button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{profile?.name}</p>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex gap-1 mt-1">
                {profile?.roles?.map((role) => (
                  <Badge key={role} variant="outline" className="text-xs">{role}</Badge>
                ))}
              </div>
            </div>
            {profile?.avatar_url && (
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={() => deleteAvatarMutation.mutate()}
                disabled={deleteAvatarMutation.isPending}
              >
                <Trash2 className="size-4 mr-1" /> Remover foto
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <AppearanceSettingsCard />

      <Card className="mb-6">
        <CardHeader><CardTitle>Dados pessoais</CardTitle></CardHeader>
        <CardContent>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
              <FormField control={profileForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl><Input placeholder="Seu nome completo" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={profileForm.control} name="email" render={({ field }) => (
                <FormItem>
                  <FormLabel>E-mail</FormLabel>
                  <FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <LoaderCircle className="size-4 mr-2 animate-spin" />}
                Salvar alterações
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Alterar senha</CardTitle></CardHeader>
        <CardContent>
          <Form {...passwordForm}>
            <form onSubmit={passwordForm.handleSubmit((d) => passwordMutation.mutate(d))} className="space-y-4">
              <FormField control={passwordForm.control} name="current_password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha atual</FormLabel>
                  <FormControl><Input type="password" placeholder="Sua senha atual" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Separator />
              <FormField control={passwordForm.control} name="password" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nova senha</FormLabel>
                  <FormControl><Input type="password" placeholder="Mínimo 8 caracteres" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={passwordForm.control} name="password_confirmation" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmar nova senha</FormLabel>
                  <FormControl><Input type="password" placeholder="Repita a nova senha" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <Button type="submit" disabled={passwordMutation.isPending}>
                {passwordMutation.isPending && <LoaderCircle className="size-4 mr-2 animate-spin" />}
                Alterar senha
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
