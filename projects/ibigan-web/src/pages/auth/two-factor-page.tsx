import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, LoaderCircle, ShieldCheck } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';

const schema = z.object({
  code: z.string().min(6, 'Código inválido.').max(10),
});

type FormData = z.infer<typeof schema>;

export function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { twoFactorToken, setAuth } = useAuthStore();
  const tenantId = (location.state as { tenant_id?: string })?.tenant_id ?? '';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { code: '' },
  });

  async function onSubmit(values: FormData) {
    if (!twoFactorToken) {
      navigate('/auth/login');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data } = await authService.twoFactorChallenge({
        two_factor_token: twoFactorToken,
        code: values.code,
        tenant_id: tenantId,
      });

      setAuth(data.result.token, data.result.tenant_id, data.result.user);
      navigate('/dashboard');
    } catch {
      setError('Código inválido. Tente novamente.');
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
      `}</style>

      <div className="flex flex-col items-center justify-center w-screen min-h-screen bg-center bg-no-repeat bg-cover auth-bg">
        <Card className="w-full max-w-[420px] mx-4">
          <CardContent className="p-8">
            <div className="text-center space-y-2 pb-5">
              <div className="flex justify-center">
                <ShieldCheck className="size-12 text-primary" />
              </div>
              <h1 className="text-2xl font-semibold">Verificação em duas etapas</h1>
              <p className="text-sm text-muted-foreground">
                Insira o código do seu aplicativo autenticador.
              </p>
            </div>

            {error && (
              <Alert variant="destructive" appearance="light" className="mb-4" onClose={() => setError(null)}>
                <AlertIcon><AlertCircle /></AlertIcon>
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Código de verificação</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="000000"
                          maxLength={10}
                          className="text-center text-lg tracking-widest"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="size-4 animate-spin" /> Verificando...
                    </span>
                  ) : (
                    'Verificar'
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate('/auth/login')}
                >
                  Voltar ao login
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
