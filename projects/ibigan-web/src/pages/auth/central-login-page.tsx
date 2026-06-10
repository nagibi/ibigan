import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { toAbsoluteUrl } from '@/lib/helpers';
import { centralAuthService } from '@/services/central-auth.service';
import { useCentralAuthStore } from '@/stores/central-auth.store';
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
  email: z.string().email('E-mail inválido.').min(1, 'E-mail é obrigatório.'),
  password: z.string().min(1, 'Senha é obrigatória.'),
});

type FormData = z.infer<typeof schema>;

export function CentralLoginPage() {
  const navigate = useNavigate();
  const { setCentralAuth } = useCentralAuthStore();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: FormData) {
    setIsLoading(true);
    setError(null);

    try {
      const res = await centralAuthService.login(data.email, data.password);
      const { token, user } = res.data.result;
      setCentralAuth(token, user);
      navigate('/admin/tenants');
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      setError(
        status === 403
          ? 'Acesso não autorizado. Esta conta não é super-admin.'
          : status === 401
            ? 'Credenciais inválidas.'
            : 'Erro ao entrar. Tente novamente.',
      );
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

      <div className="flex min-h-screen w-screen flex-col items-center justify-center bg-cover bg-center bg-no-repeat auth-bg">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold">Acesso administrativo</h1>
              <p className="text-sm text-muted-foreground">
                Painel central da plataforma
              </p>
            </div>

            {error ? (
              <Alert variant="destructive" className="mb-4">
                <AlertIcon><AlertCircle /></AlertIcon>
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            ) : null}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="superadmin@ibigan.com" {...field} />
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
                      <FormLabel>Senha</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={passwordVisible ? 'text' : 'password'}
                            {...field}
                          />
                          <button
                            type="button"
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            onClick={() => setPasswordVisible((visible) => !visible)}
                          >
                            {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <LoaderCircle className="mr-2 animate-spin" size={16} /> : null}
                  Entrar
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
