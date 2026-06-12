import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { loadTenantTranslationOverrides } from '@/lib/load-translations';
import { resolveApiMessage } from '@/lib/resolve-api-message';
import { toAbsoluteUrl } from '@/lib/helpers';
import { useLanguage } from '@/providers/i18n-provider';
import { authService } from '@/services/auth.service';
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
  tenant_id: string;
  email: string;
  password: string;
};

export function LoginPage() {
  const { t } = useTranslation();
  const { currenLanguage } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth, setRequires2FA } = useAuthStore();
  const centralLogout = useCentralAuthStore((s) => s.centralLogout);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () => z.object({
      tenant_id: z.string().min(1, t('validation.required')),
      email: z.string().email(t('validation.email')).min(1, t('validation.required')),
      password: z.string().min(1, t('validation.required')),
    }),
    [t],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tenant_id: '', email: '', password: '' },
  });

  const tenantId = form.watch('tenant_id');

  useEffect(() => {
    if (tenantId.trim().length > 0) {
      void loadTenantTranslationOverrides(currenLanguage.code, tenantId.trim());
    }
  }, [tenantId, currenLanguage.code]);

  useEffect(() => {
    const authError = searchParams.get('error');
    if (authError === 'oauth_failed' || authError === 'auth_failed') {
      setError(t('auth.login.oauth_failed'));
    } else if (authError === 'email_not_provided') {
      setError(t('auth.login.email_not_provided'));
    } else if (authError === 'user_not_found') {
      setError(t('auth.login.invalid_credentials'));
    } else if (authError === 'tenant_not_found') {
      setError(t('auth.login.tenant_not_found'));
    } else if (authError) {
      setError(t('auth.login.generic_error'));
    }
  }, [searchParams, t]);

  async function onSubmit(values: FormData) {
    try {
      setIsLoading(true);
      setError(null);

      await loadTenantTranslationOverrides(currenLanguage.code, values.tenant_id);

      const { data } = await authService.login(values);

      if (data.result.requires_2fa && data.result.two_factor_token) {
        setRequires2FA(data.result.two_factor_token);
        navigate('/auth/two-factor', {
          state: { tenant_id: values.tenant_id },
        });
        return;
      }

      const { token, tenant_id, user } = data.result;

      localStorage.setItem('ibigan_token', token);
      localStorage.setItem('ibigan_tenant_id', tenant_id);

      centralLogout();
      setAuth(token, tenant_id, user);
      navigate('/auth/select-tenant');
    } catch (err: unknown) {
      const payload = (err as { response?: { data?: { message_code?: string; errors?: Array<{ message_code?: string }> } } })
        ?.response?.data;
      const fieldErrorCode = payload?.errors?.[0]?.message_code;
      setError(resolveApiMessage(
        fieldErrorCode ? { message_code: fieldErrorCode } : payload,
        'auth.login.invalid_credentials',
      ));
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

        <Card className="relative w-full max-w-[420px] mx-4">
          <AuthLanguageSwitcher className="absolute top-4 right-4" />
          <CardContent className="p-8 pt-14">
            <div className="space-y-1 pb-5 text-center">
              <h1 className="text-2xl font-semibold tracking-tight">{t('auth.login.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('auth.login.subtitle')}</p>
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
                      <FormLabel>{t('auth.login.tenant_id')}</FormLabel>
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
                      <FormLabel>{t('auth.login.email')}</FormLabel>
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
                        <FormLabel>{t('auth.login.password')}</FormLabel>
                        <Link
                          to="/auth/forgot-password"
                          className="text-xs text-muted-foreground hover:text-primary"
                        >
                          {t('auth.login.forgot_password')}
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
                      {t('auth.login.submitting')}
                    </span>
                  ) : (
                    t('auth.login.submit')
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {t('auth.login.no_account')}{' '}
                  <Link
                    to="/auth/register"
                    className="font-semibold text-foreground hover:text-primary"
                  >
                    {t('auth.login.create_account')}
                  </Link>
                </p>
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

            <SocialLoginButtons
              scope="tenant"
              tenantId={tenantId}
              onError={setError}
              onTenantIdRequired={() => {
                form.setError('tenant_id', { message: t('validation.required') });
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
