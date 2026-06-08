import { useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toAbsoluteUrl } from '@/lib/helpers';
import { authService } from '@/services/auth.service';
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

const schema = z.object({
  tenant_id: z.string().min(1, 'ID da organização é obrigatório.'),
  email: z.string().email('E-mail inválido.').min(1, 'E-mail é obrigatório.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, setRequires2FA } = useAuthStore();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tenant_id: '', email: '', password: '' },
  });

  async function onSubmit(values: FormData) {
    try {
      setIsLoading(true);
      setError(null);

      const { data } = await authService.login(values);

      if (data.result.requires_2fa && data.result.two_factor_token) {
        setRequires2FA(data.result.two_factor_token);
        navigate('/auth/two-factor', {
          state: { tenant_id: values.tenant_id },
        });
        return;
      }

      setAuth(data.result.token, data.result.tenant_id, data.result.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Credenciais inválidas. Tente novamente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .auth-bg {
          background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10.png')}');
        }
        .dark .auth-bg {
          background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10-dark.png')}');
        }
      `}</style>

      <div className="flex flex-col items-center justify-center w-screen min-h-screen bg-center bg-no-repeat bg-cover auth-bg">
        <div className="mb-5">
          <Link to="/">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.svg')}
              className="h-[35px] max-w-none"
              alt="Ibigan"
            />
          </Link>
        </div>

        <Card className="w-full max-w-[420px] mx-4">
          <CardContent className="p-8">
            <div className="text-center space-y-1 pb-5">
              <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
              <p className="text-sm text-muted-foreground">
                Acesse sua conta no Ibigan
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
                  name="tenant_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID da Organização</FormLabel>
                      <FormControl>
                        <Input placeholder="ex: minha-empresa" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="seu@email.com"
                          {...field}
                        />
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
                      <div className="flex justify-between items-center">
                        <FormLabel>Senha</FormLabel>
                        <Link
                          to="/auth/forgot-password"
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          Esqueceu a senha?
                        </Link>
                      </div>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={passwordVisible ? 'text' : 'password'}
                            placeholder="Sua senha"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          mode="icon"
                          onClick={() => setPasswordVisible(!passwordVisible)}
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        >
                          {passwordVisible ? (
                            <EyeOff className="text-muted-foreground size-4" />
                          ) : (
                            <Eye className="text-muted-foreground size-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="size-4 animate-spin" />
                      Entrando...
                    </span>
                  ) : (
                    'Entrar'
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Não tem conta?{' '}
                  <Link
                    to="/auth/register"
                    className="font-semibold text-foreground hover:text-primary"
                  >
                    Criar conta
                  </Link>
                </p>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
