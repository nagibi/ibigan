import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '@/lib/axios';
import { Icons } from '@/components/layouts/layout-1/shared/common/icons';
import { Button } from '@/components/ui/button';

type SocialProvider = 'google' | 'apple';

interface SocialLoginButtonsProps {
  scope: 'tenant' | 'central';
  tenantId?: string;
  onError: (message: string | null) => void;
  onTenantIdRequired?: () => void;
}

const PROVIDERS: Array<{
  id: SocialProvider;
  icon: typeof Icons.googleColorful;
  labelKey: 'auth.login.google' | 'auth.login.apple';
  failedKey: 'auth.login.google_failed' | 'auth.login.apple_failed';
  startFailedKey: 'auth.login.google_start_failed' | 'auth.login.apple_start_failed';
}> = [
  {
    id: 'google',
    icon: Icons.googleColorful,
    labelKey: 'auth.login.google',
    failedKey: 'auth.login.google_failed',
    startFailedKey: 'auth.login.google_start_failed',
  },
  {
    id: 'apple',
    icon: Icons.apple,
    labelKey: 'auth.login.apple',
    failedKey: 'auth.login.apple_failed',
    startFailedKey: 'auth.login.apple_start_failed',
  },
];

export function SocialLoginButtons({
  scope,
  tenantId,
  onError,
  onTenantIdRequired,
}: SocialLoginButtonsProps) {
  const { t } = useTranslation();
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null);

  async function handleSocialLogin(provider: SocialProvider) {
    if (scope === 'tenant' && !tenantId?.trim()) {
      onTenantIdRequired?.();
      return;
    }

    const config = PROVIDERS.find((item) => item.id === provider)!;

    try {
      setLoadingProvider(provider);
      onError(null);

      const endpoint =
        scope === 'central'
          ? `/central/v1/auth/${provider}`
          : `/v1/auth/${provider}?tenant_id=${encodeURIComponent(tenantId!.trim())}`;

      const { data } = await api.get<{ result: { url: string } }>(endpoint);
      const url = data?.result?.url;

      if (!url) {
        throw new Error('missing_oauth_url');
      }

      window.location.href = url;
    } catch {
      onError(t(config.startFailedKey));
      setLoadingProvider(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {PROVIDERS.map((provider) => {
        const Icon = provider.icon;
        const isLoading = loadingProvider === provider.id;

        return (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => handleSocialLogin(provider.id)}
            disabled={loadingProvider !== null}
          >
            {isLoading ? (
              <LoaderCircle className="mr-2 size-4 animate-spin" />
            ) : (
              <Icon className="mr-2 size-4" />
            )}
            {t(provider.labelKey)}
          </Button>
        );
      })}
    </div>
  );
}
