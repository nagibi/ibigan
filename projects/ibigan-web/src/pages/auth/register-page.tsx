import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Eye, EyeOff, LoaderCircle } from 'lucide-react';
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
  company_name: z.string().min(2, 'Nome da empresa deve ter pelo menos 2 caracteres.'),
  name: z.string().min(2, 'Seu nome deve ter pelo menos 2 caracteres.'),
  email: z.string().email('E-mail inválido.'),
  password: z.string().min(8, 'Senha deve ter pelo menos 8 caracteres.').regex(/[a-zA-Z]/, 'Deve conter letras.').regex(/[0-9]/, 'Deve conter números.'),
  password_confirmation: z.string(),
}).refine((d) => d.password === d.password_confirmation, {
  message: 'As senhas não coincidem.',
  path: ['password_confirmation'],
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      company_name: '', name: '', email: '', password: '', password_confirmation: '',
    },
  });

  async function onSubmit(values: FormData) {
    try {
      setIsLoading(true);
      setError(null);
      const { data } = await authService.register(values);
      setAuth(data.result.token, data.result.tenant_id, data.result.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Erro ao criar conta. Tente novamente.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .auth-bg { background-image: url('${toAbsoluteUrl('/media/images/2600x1200/bg-10.png')}'); }
      `}</style>
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-center bg-no-repeat bg-cover auth-bg overflow-y-auto py-8">
        <div className="mb-5">
          <Link to="/"><img src={toAbsoluteUrl('/media/app/mini-logo.svg')} className="h-[35px]" alt="Ibigan" /></Link>
        </div>
        <Card className="w-full max-w-[420px] mx-4">
          <CardContent className="p-8">
            <div className="text-center space-y-1 pb-5">
              <h1 className="text-2xl font-semibold">Criar conta</h1>
              <p className="text-sm text-muted-foreground">Comece seu período gratuito hoje.</p>
            </div>

            {error && (
              <Alert variant="destructive" appearance="light" className="mb-4" onClose={() => setError(null)}>
                <AlertIcon><AlertCircle /></AlertIcon>
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="company_name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da empresa</FormLabel>
                    <FormControl><Input placeholder="Minha Empresa SA" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Seu nome</FormLabel>
                    <FormControl><Input placeholder="João Silva" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>E-mail</FormLabel>
                    <FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <div className="relative">
                      <FormControl>
                        <Input type={passwordVisible ? 'text' : 'password'} placeholder="Mínimo 8 caracteres" {...field} />
                      </FormControl>
                      <Button type="button" variant="ghost" mode="icon"
                        onClick={() => setPasswordVisible(!passwordVisible)}
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent">
                        {passwordVisible ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="password_confirmation" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar senha</FormLabel>
                    <FormControl><Input type="password" placeholder="Repita a senha" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <LoaderCircle className="size-4 animate-spin" /> Criando conta...
                    </span>
                  ) : 'Criar conta'}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Já tem conta?{' '}
                  <Link to="/auth/login" className="font-semibold text-foreground hover:text-primary">
                    Entrar
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
