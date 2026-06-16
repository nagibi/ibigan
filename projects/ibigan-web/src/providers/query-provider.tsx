'use client';

import { ReactNode, useState } from 'react';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { showAppToast } from '@/lib/show-app-toast';

function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status;
  if (status === 429 || status === 401 || status === 403) {
    return false;
  }
  return failureCount < 1;
}

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            retry: shouldRetryQuery,
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            const status = (error as AxiosError)?.response?.status;
            if (status === 429) {
              return;
            }

            const message =
              error.message || 'Something went wrong. Please try again.';

            showAppToast({
              title: message,
              variant: 'destructive',
            });
          },
        }),
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { QueryProvider };
