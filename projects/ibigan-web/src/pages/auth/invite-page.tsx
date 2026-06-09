import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, LoaderCircle, UserCheck } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { toAbsoluteUrl } from '@/lib/helpers';
import { invitesService } from '@/services/invites.service';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

const schema = z
  .object({
    name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres.'),
    password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.'),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    message: 'As senhas não coincidem.',
    path: ['password_confirmation'],
  });

type FormData = z.infer<typeof schema>;

export function InvitePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const token = searchParams.get('token') ?? '';
  const tenantId = searchParams.get('tenant_id') ?? '';
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', password: '', password_confirmation: '' },
  });

  async function onSubmit(values: FormData) {
    try {
      setIsLoading(true);
      setError(null);

      const { data } = await invitesService.accept({
        token,
        ...values,
      }, tenantId);

      setAuth(data.result.token, data.result.tenant_id, data.result.user);
      navigate('/dashboard');
    } catch {
      setError('Convite inválido ou expirado. Solicite um novo convite.');
    } finally {
      setIsLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <p className="text-muted-foreground">Link de convite inválido.</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .auth-bg { background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10.png')}'); }
      `}</style>
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-center bg-no-repeat bg-cover auth-bg">
        <div className="mb-5">
          <img
            src={toAbsoluteUrl('/media/app/mini-logo.svg')}
            className="h-[35px]"
            alt="Ibigan"
          />
        </div>
        <Card className="w-full max-w-[420px] mx-4">
          <CardContent className="p-8">
            <div className="text-center space-y-2 pb-5">
              <UserCheck className="size-10 text-primary mx-auto" />
              <h1 className="text-2xl font-semibold">Você foi convidado!</h1>
              <p className="text-sm text-muted-foreground">
                Complete seu cadastro para acessar a organização.
              </p>
            </div>

            {error && (
              <Alert
                variant="destructive"
                appearance="light"
                className="mb-4"
                onClose={() => setError(null)}
              >
                <AlertIcon>
                  <AlertCircle />
                </AlertIcon>
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu nome</FormLabel>
                      <FormControl>
                        <Input placeholder="João Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Criar senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Mínimo 8 caracteres"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password_confirmation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar senha</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="Repita a senha"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <LoaderCircle className="size-4 mr-2 animate-spin" />{' '}
                      Entrando...
                    </>
                  ) : (
                    'Aceitar convite e entrar'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
