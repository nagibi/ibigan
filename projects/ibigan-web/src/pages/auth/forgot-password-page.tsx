import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { AlertCircle, Building2, Check, LoaderCircle } from 'lucide-react';
import { buildTenantAuthQuery, useTenantAuthContext } from '@/hooks/use-tenant-auth-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { authService } from '@/services/auth.service';

type FormData = {
  tenant_id: string;
  email: string;
};

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const tenantContext = useTenantAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const schema = useMemo(
    () => z.object({
      tenant_id: tenantContext.isResolved
        ? z.string().optional()
        : z.string().min(1, t('validation.required')),
      email: z.string().email(t('validation.email')),
    }),
    [t, tenantContext.isResolved],
  );

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { tenant_id: '', email: '' },
  });

  useEffect(() => {
    if (tenantContext.isResolved && tenantContext.tenantId) {
      form.setValue('tenant_id', tenantContext.tenantId, { shouldValidate: true });
    }
  }, [form, tenantContext.isResolved, tenantContext.tenantId]);

  async function onSubmit(values: FormData) {
    try {
      setIsLoading(true);
      setError(null);

      const tenantId = tenantContext.tenantId || values.tenant_id?.trim() || undefined;
      await authService.forgotPassword(values.email, tenantId);
      setSuccess(true);
    } catch {
      setError(t('auth.forgot_password.error'));
    } finally {
      setIsLoading(false);
    }
  }

  const loginPath = `/auth/login${buildTenantAuthQuery(tenantContext.tenantSlug)}`;

  return (
    <AuthPageShell>
      <Card className="w-full max-w-[420px]">
        <CardContent className="p-8">
          <div className="space-y-1 pb-5 text-center">
            <h1 className="text-2xl font-semibold">{t('auth.forgot_password.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('auth.forgot_password.subtitle')}</p>
          </div>

          {tenantContext.isResolved && tenantContext.tenant ? (
            <div className="mb-4 flex justify-center">
              <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm font-normal">
                <Building2 className="size-3.5" />
                {tenantContext.tenant.name ?? tenantContext.tenant.slug}
              </Badge>
            </div>
          ) : null}

          {success ? (
            <div className="space-y-4">
              <Alert appearance="light">
                <AlertIcon><Check className="text-green-600" /></AlertIcon>
                <AlertTitle>{t('auth.forgot_password.success')}</AlertTitle>
              </Alert>
              <Button asChild className="w-full" variant="outline">
                <Link to={loginPath}>{t('auth.forgot_password.back_to_login')}</Link>
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
                  {!tenantContext.isResolved ? (
                    <FormField
                      control={form.control}
                      name="tenant_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('auth.login.tenant_id')}</FormLabel>
                          <FormControl>
                            <Input placeholder="ex: techsolutions" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : null}

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('auth.login.email')}</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="seu@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={isLoading || tenantContext.isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <LoaderCircle className="size-4 animate-spin" />
                        {t('auth.forgot_password.submitting')}
                      </span>
                    ) : (
                      t('auth.forgot_password.submit')
                    )}
                  </Button>

                  <Button asChild variant="ghost" className="w-full">
                    <Link to={loginPath}>{t('auth.forgot_password.back_to_login')}</Link>
                  </Button>
                </form>
              </Form>
            </>
          )}
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
