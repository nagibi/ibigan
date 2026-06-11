import * as Sentry from '@sentry/react';
import { AppErrorFallback } from '@/components/errors/app-error-fallback';
import { GlobalLoadingBar } from '@/components/global-loading-bar';
import { AppRouting } from '@/routing/app-routing';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { LoadingBarContainer } from 'react-top-loading-bar';
import { Toaster } from '@/components/ui/sonner';
import { I18nProvider } from '@/providers/i18n-provider';
import { ModulesProvider } from '@/providers/modules-provider';
import { QueryProvider } from '@/providers/query-provider';
import { SettingsProvider } from '@/providers/settings-provider';
import { ThemeProvider } from '@/providers/theme-provider';
import { TooltipsProvider } from '@/providers/tooltips-provider';

const { BASE_URL } = import.meta.env;

export function App() {
  return (
    <Sentry.ErrorBoundary fallback={<AppErrorFallback />}>
    <div className="flex h-full min-h-0 w-full flex-col">
    <QueryProvider>
      <SettingsProvider>
        <ThemeProvider>
          <I18nProvider>
            <HelmetProvider>
              <TooltipsProvider>
                <LoadingBarContainer>
                  <BrowserRouter basename={BASE_URL}>
                    <GlobalLoadingBar />
                    <Toaster />
                    <ModulesProvider>
                      <AppRouting />
                    </ModulesProvider>
                  </BrowserRouter>
                </LoadingBarContainer>
              </TooltipsProvider>
            </HelmetProvider>
          </I18nProvider>
        </ThemeProvider>
      </SettingsProvider>
    </QueryProvider>
    </div>
    </Sentry.ErrorBoundary>
  );
}
