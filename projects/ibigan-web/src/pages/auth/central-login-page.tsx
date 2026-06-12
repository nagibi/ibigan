import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { resolveApiMessage } from '@/lib/resolve-api-message';
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
import { AuthPageShell } from '@/components/auth/auth-page-shell';

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
    <AuthPageShell>
      <Card className="relative w-full">
        <AuthLanguageSwitcher className="absolute top-4 right-4" />
        <CardContent className="p-6 pt-14 max-xl:p-4 max-xl:pt-10">
            <div className="mb-6 text-center max-xl:mb-2">
              <h1 className="text-xl font-semibold max-xl:text-lg">{t('auth.central.title')}</h1>
              <p className="text-sm text-muted-foreground max-xl:hidden">{t('auth.central.subtitle')}</p>
            </div>

            {error ? (
              <Alert variant="destructive" className="mb-4 max-xl:mb-3 max-xl:py-2">
                <AlertIcon><AlertCircle /></AlertIcon>
                <AlertTitle>{error}</AlertTitle>
              </Alert>
            ) : null}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 max-xl:space-y-3">
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

            <div className="relative py-1.5 max-xl:py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">{t('auth.login.or')}</span>
              </div>
            </div>

            <div className="max-xl:[&_button]:h-9 max-xl:[&_button]:text-sm">
              <SocialLoginButtons scope="central" onError={setError} />
            </div>
          </CardContent>
        </Card>
    </AuthPageShell>
  );
}
