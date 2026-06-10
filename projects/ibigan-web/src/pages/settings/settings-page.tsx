import { useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, LoaderCircle, Trash2 } from 'lucide-react';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { tenantSettingsService } from '@/services/tenant-settings.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

const schema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
  timezone: z.string().min(1, 'Selecione um fuso horário.'),
  locale: z.string().min(1, 'Selecione um idioma.'),
});

type FormData = z.infer<typeof schema>;

const TIMEZONES = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/Sao_Paulo', label: 'Brasília (GMT-3)' },
  { value: 'America/Manaus', label: 'Manaus (GMT-4)' },
  { value: 'America/Belem', label: 'Belém (GMT-3)' },
  { value: 'America/Fortaleza', label: 'Fortaleza (GMT-3)' },
  { value: 'America/New_York', label: 'New York (GMT-5)' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (GMT-8)' },
  { value: 'Europe/London', label: 'Londres (GMT+0)' },
  { value: 'Europe/Paris', label: 'Paris (GMT+1)' },
];

const LOCALES = [
  { value: 'pt_BR', label: 'Português (Brasil)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
];

export function SettingsPage() {
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);

  usePageToolbar({
    title: 'Configurações',
    description: 'Gerencie as configurações da sua organização.',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['tenant-settings'],
    queryFn: () => tenantSettingsService.show(),
  });

  const settings = data?.data.result;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    values: {
      name: settings?.name ?? '',
      timezone: settings?.timezone ?? 'UTC',
      locale: settings?.locale ?? 'pt_BR',
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) => tenantSettingsService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      toast.success('Configurações salvas com sucesso!');
    },
    onError: () => toast.error('Erro ao salvar configurações.'),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => tenantSettingsService.uploadLogo(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      toast.success('Logo atualizado!');
    },
    onError: () => toast.error('Erro ao enviar logo.'),
  });

  const deleteLogoMutation = useMutation({
    mutationFn: () => tenantSettingsService.deleteLogo(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
      toast.success('Logo removido!');
    },
    onError: () => toast.error('Erro ao remover logo.'),
  });

  if (isLoading) {
    return (
      <div className="container flex justify-center pb-6">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container space-y-6 pb-6">
      <Card className="max-w-3xl">
        <CardHeader><CardTitle>Logo da organização</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="size-20 rounded-lg border border-border flex items-center justify-center bg-muted overflow-hidden">
              {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Logo" className="size-full object-contain p-1" />
              ) : (
                <span className="text-2xl font-bold text-muted-foreground">
                  {settings?.name?.[0]?.toUpperCase() ?? 'I'}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => logoInputRef.current?.click()}
                disabled={logoMutation.isPending}
              >
                {logoMutation.isPending
                  ? <LoaderCircle className="size-4 mr-2 animate-spin" />
                  : <Camera className="size-4 mr-2" />
                }
                {settings?.logo_url ? 'Trocar logo' : 'Enviar logo'}
              </Button>
              {settings?.logo_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => deleteLogoMutation.mutate()}
                  disabled={deleteLogoMutation.isPending}
                >
                  <Trash2 className="size-4 mr-1" /> Remover
                </Button>
              )}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) logoMutation.mutate(file);
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-3xl">
        <CardHeader><CardTitle>Dados da organização</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit((d) => updateMutation.mutate(d))} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da organização</FormLabel>
                  <FormControl><Input placeholder="Minha Empresa SA" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="timezone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuso horário</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {TIMEZONES.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="locale" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Idioma</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {LOCALES.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <span className="font-medium">ID da organização:</span> {settings?.slug}
                </div>
                <Button type="submit" disabled={updateMutation.isPending}>
                  {updateMutation.isPending && <LoaderCircle className="size-4 mr-2 animate-spin" />}
                  Salvar configurações
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
