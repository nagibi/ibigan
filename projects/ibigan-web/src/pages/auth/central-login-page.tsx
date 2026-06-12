import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { resolveApiMessage } from '@/lib/resolve-api-message';
import { toAbsoluteUrl } from '@/lib/helpers';
import { centralAuthService } from '@/services/central-auth.service';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { SocialLoginButtons } from '@/components/auth/social-login-buttons';
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
import { AuthLanguageSwitcher } from '@/components/auth/auth-language-switcher';

type FormData = {
  email: string;
  password: string;
};

export function CentralLoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setCentralAuth } = useCentralAuthStore();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const authError = searchParams.get('error');
    if (authError === 'auth_failed' || authError === 'oauth_failed') {
      setError(t('auth.login.oauth_failed'));
    } else if (authError === 'email_not_provided') {
      setError(t('auth.login.email_not_provided'));
    } else if (authError === 'unauthorized') {
      setError(t('auth.login.unauthorized'));
    } else if (authError) {
      setError(t('auth.login.generic_error'));
    }
  }, [searchParams, t]);

  const schema = useMemo(
    () => z.object({
      email: z.string().email(t('validation.email')).min(1, t('validation.required')),
      password: z.string().min(1, t('validation.required')),
    }),
    [t],
  );

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
      const payload = (err as { response?: { data?: { message_code?: string; status?: number } } })
        ?.response?.data;
      const status = (err as { response?: { status?: number } })?.response?.status;

      if (status === 403) {
        setError(t('auth.login.unauthorized'));
      } else if (status === 401) {
        setError(resolveApiMessage(payload, 'auth.login.invalid_credentials'));
      } else {
        setError(resolveApiMessage(payload, 'auth.login.generic_error'));
      }
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
        <div className="mb-5">
          <Link to="/">
            <img
              src={toAbsoluteUrl('/media/app/mini-logo.svg')}
              className="h-[35px] max-w-none"
              alt="Ibigan"
            />
          </Link>
        </div>

        <Card className="relative w-full max-w-md mx-4">
          <AuthLanguageSwitcher className="absolute top-4 right-4" />
          <CardContent className="p-6 pt-14">
            <div className="mb-6 text-center">
              <h1 className="text-xl font-semibold">{t('auth.central.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('auth.central.subtitle')}</p>
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
                      <FormLabel>{t('auth.login.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="admin@ibigan.com" {...field} />
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
                      <FormLabel>{t('auth.login.password')}</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            type={passwordVisible ? 'text' : 'password'}
                            placeholder="••••••••"
                            {...field}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="ghost"
                          mode="icon"
                          onClick={() => setPasswordVisible((current) => !current)}
                          className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        >
                          {passwordVisible ? (
                            <EyeOff className="size-4 text-muted-foreground" />
                          ) : (
                            <Eye className="size-4 text-muted-foreground" />
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
                      {t('auth.login.submitting')}
                    </span>
                  ) : (
                    t('auth.login.submit')
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('auth.login.or')}</span>
              </div>
            </div>

            <SocialLoginButtons scope="central" onError={setError} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
