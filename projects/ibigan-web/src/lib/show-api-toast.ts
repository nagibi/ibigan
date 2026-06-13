import { resolveApiMessage, type ApiMessagePayload } from '@/lib/resolve-api-message';
import { showAppToast, type AppToastOptions } from '@/lib/show-app-toast';

function severityToVariant(severity: ApiMessagePayload['severity']): AppToastOptions['variant'] {
  switch (severity) {
    case 'error':
      return 'destructive';
    case 'warning':
    case 'info':
      return 'info';
    default:
      return 'success';
  }
}

export function showApiToast(payload: ApiMessagePayload | undefined, fallbackCode = 'common.success'): void {
  const message = resolveApiMessage(payload, fallbackCode);

  showAppToast({
    title: message,
    variant: severityToVariant(payload?.severity),
  });
}
