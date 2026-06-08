import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Check, LoaderCircle } from 'lucide-react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { authService } from '@/services/auth.service';

const schema = z.object({
  tenant_id: z.string().min(1, 'ID da organização é obrigatório.'),
  email: z.string().email('E-mail inválido.'),
});

type FormData = z.infer<typeof schema>;

export function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tenant_id: '', email: '' },
  });

  async function onSubmit(values: FormData) {
    try {
      setIsLoading(true);
      setError(null);
      await authService.forgotPassword(values.email, values.tenant_id);
      setSuccess(true);
    } catch {
      setError('Erro ao enviar e-mail. Tente novamente.');
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
            <img src={toAbsoluteUrl('/media/app/mini-logo.svg')} className="h-[35px]" alt="Ibigan" />
          </Link>
        </div>

        <Card className="w-full max-w-[420px] mx-4">
          <CardContent className="p-8">
            <div className="text-center space-y-1 pb-5">
              <h1 className="text-2xl font-semibold">Esqueceu a senha?</h1>
              <p className="text-sm text-muted-foreground">
                Informe seu e-mail e enviaremos as instruções.
              </p>
            </div>

            {success ? (
              <div className="space-y-4">
                <Alert appearance="light">
                  <AlertIcon><Check className="text-green-600" /></AlertIcon>
                  <AlertTitle>E-mail enviado! Verifique sua caixa de entrada.</AlertTitle>
                </Alert>
                <Button asChild className="w-full" variant="outline">
                  <Link to="/auth/login">Voltar ao login</Link>
                </Button>
              </div>
            ) : (
              <>
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
                            <Input type="email" placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <LoaderCircle className="size-4 animate-spin" /> Enviando...
                        </span>
                      ) : (
                        'Enviar instruções'
                      )}
                    </Button>

                    <Button asChild variant="ghost" className="w-full">
                      <Link to="/auth/login">Voltar ao login</Link>
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
