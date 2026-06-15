import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertCircle, LoaderCircle } from 'lucide-react';
import { AuthPageShell } from '@/components/auth/auth-page-shell';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { authService } from '@/services/auth.service';
import { buildTenantLoginPath } from '@/lib/tenant-login-path';
import { resolvePostLoginDestination } from '@/lib/post-login-navigation';
import { centralAuthService } from '@/services/central-auth.service';
import { twoFactorService } from '@/services/two-factor.service';
import { useAuthStore } from '@/stores/auth.store';
import { useCentralAuthStore } from '@/stores/central-auth.store';
import { cn } from '@/lib/utils';

type LocationState = {
  tenant_id?: string;
  scope?: 'central' | 'tenant';
  two_factor_method?: 'totp' | 'email';
  masked_email?: string;
};

const OTP_SLOT_CLASS =
  'h-12 w-11 rounded-lg border border-input bg-background text-lg font-semibold shadow-none first:rounded-lg last:rounded-lg first:border-l';

function AuthenticatorIllustration() {
  return (
    <svg
      viewBox="0 0 80 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="mx-auto h-[88px] w-[58px]"
      aria-hidden
    >
      <rect x="8" y="4" width="64" height="112" rx="12" fill="#EAF2FF" stroke="#B8D4FF" strokeWidth="2" />
      <rect x="28" y="10" width="24" height="4" rx="2" fill="#B8D4FF" />
      <rect x="16" y="28" width="48" height="64" rx="8" fill="white" stroke="#D6E8FF" strokeWidth="1.5" />
      <rect x="24" y="40" width="32" height="6" rx="3" fill="#3B82F6" opacity="0.15" />
      <rect x="24" y="52" width="24" height="6" rx="3" fill="#3B82F6" opacity="0.15" />
      <rect x="24" y="64" width="28" height="6" rx="3" fill="#3B82F6" opacity="0.15" />
      <circle cx="40" cy="78" r="10" fill="#3B82F6" opacity="0.12" />
      <path
        d="M36 78l3 3 6-6"
        stroke="#3B82F6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="40" cy="104" r="5" fill="#B8D4FF" />
    </svg>
  );
}

export function TwoFactorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state as LocationState | null) ?? {};
  const isCentralFlow = locationState.scope === 'central';
  const { twoFactorToken: tenantTwoFactorToken, setAuth } = useAuthStore();
  const {
    twoFactorToken: centralTwoFactorToken,
    setCentralAuth,
  } = useCentralAuthStore();
  const twoFactorToken = isCentralFlow ? centralTwoFactorToken : tenantTwoFactorToken;
  const isEmailMethod = locationState.two_factor_method === 'email';
  const maskedEmail = locationState.masked_email ?? '';
  const tenantId = locationState.tenant_id ?? '';
  const [code, setCode] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (resendCooldown <= 0) {
      return;
    }

    const timer = window.setTimeout(() => {
      setResendCooldown((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [resendCooldown]);

  async function submit(submittedCode: string) {
    if (!twoFactorToken) {
      navigate(isCentralFlow ? '/central/login' : buildTenantLoginPath(tenantId));
      return;
    }

    if (!submittedCode.trim()) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (isCentralFlow) {
        const { data } = await centralAuthService.twoFactorChallenge({
          two_factor_token: twoFactorToken,
          code: submittedCode.trim(),
        });

        const { token, user } = data.result;
        setCentralAuth(token, user);
        navigate('/admin/tenants');
        return;
      }

      const { data } = await authService.twoFactorChallenge({
        two_factor_token: twoFactorToken,
        code: submittedCode.trim(),
        tenant_id: tenantId,
      });

      const { token, tenant_id, user } = data.result;

      localStorage.setItem('ibigan_token', token);
      localStorage.setItem('ibigan_tenant_id', tenant_id);

      setAuth(token, tenant_id, user);
      navigate(await resolvePostLoginDestination(tenant_id));
    } catch {
      setError(t('auth.two_factor.invalid_code'));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleResendCode() {
    if (!twoFactorToken || resendCooldown > 0 || isResending) {
      return;
    }

    try {
      setIsResending(true);
      setError(null);
      await twoFactorService.resendLoginCode(twoFactorToken);
      setResendCooldown(60);
    } catch {
      setError(t('auth.two_factor.resend_failed'));
    } finally {
      setIsResending(false);
    }
  }

  function handleContinue() {
    void submit(useRecovery ? recoveryCode : code);
  }

  function toggleRecoveryMode() {
    setUseRecovery((current) => !current);
    setCode('');
    setRecoveryCode('');
    setError(null);
  }

  const canSubmit = useRecovery ? recoveryCode.trim().length >= 6 : code.length === 6;

  return (
    <AuthPageShell>
      <Card className="relative w-full border-border/60 shadow-sm">
        <CardContent className="p-6 max-xl:p-5">
          <div className="mb-6 space-y-3 text-center max-xl:mb-5">
            <AuthenticatorIllustration />
            <div className="space-y-1.5">
              <h1 className="text-xl font-semibold tracking-tight max-xl:text-lg">
                {t('auth.two_factor.title')}
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {isEmailMethod
                  ? t('auth.two_factor.email_subtitle', { email: maskedEmail })
                  : t('auth.two_factor.subtitle')}
              </p>
            </div>
          </div>

          {error ? (
            <Alert variant="destructive" appearance="light" className="mb-5" onClose={() => setError(null)}>
              <AlertIcon><AlertCircle /></AlertIcon>
              <AlertTitle>{error}</AlertTitle>
            </Alert>
          ) : null}

          <div className="space-y-5">
            {!useRecovery ? (
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={(value) => {
                    setCode(value);
                    setError(null);
                  }}
                  onComplete={(value) => void submit(value)}
                  containerClassName="justify-center"
                  disabled={isLoading}
                >
                  <InputOTPGroup className="gap-2.5">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot key={index} index={index} className={OTP_SLOT_CLASS} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
            ) : (
              <div className="space-y-2">
                <label htmlFor="recovery-code" className="text-sm font-medium">
                  {t('auth.two_factor.recovery_label')}
                </label>
                <Input
                  id="recovery-code"
                  value={recoveryCode}
                  onChange={(event) => {
                    setRecoveryCode(event.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder={t('auth.two_factor.recovery_placeholder')}
                  className="text-center font-mono tracking-widest"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            )}

            {isEmailMethod && !useRecovery ? (
              <p className="text-center text-sm text-muted-foreground">
                {t('auth.two_factor.resend_prompt')}{' '}
                {resendCooldown > 0 ? (
                  <span>({resendCooldown}s)</span>
                ) : null}{' '}
                <button
                  type="button"
                  onClick={() => void handleResendCode()}
                  disabled={isResending || resendCooldown > 0}
                  className="font-medium text-primary hover:underline disabled:opacity-50"
                >
                  {isResending ? t('auth.two_factor.resending') : t('auth.two_factor.resend')}
                </button>
              </p>
            ) : null}

            <p className="text-center text-sm text-muted-foreground">
              {t('auth.two_factor.recovery_prompt')}{' '}
              <button
                type="button"
                onClick={toggleRecoveryMode}
                className="font-medium text-primary hover:underline"
              >
                {useRecovery
                  ? (isEmailMethod ? t('auth.two_factor.use_email') : t('auth.two_factor.use_authenticator'))
                  : t('auth.two_factor.use_recovery')}
              </button>
            </p>

            <Button
              type="button"
              className="w-full"
              disabled={isLoading || !canSubmit}
              onClick={handleContinue}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderCircle className="size-4 animate-spin" />
                  {t('auth.two_factor.verifying')}
                </span>
              ) : (
                t('auth.two_factor.continue')
              )}
            </Button>

            <Button
              type="button"
              variant="ghost"
              className={cn('w-full text-muted-foreground')}
              onClick={() => navigate(isCentralFlow ? '/central/login' : buildTenantLoginPath(tenantId))}
            >
              {t('auth.two_factor.back_to_login')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
