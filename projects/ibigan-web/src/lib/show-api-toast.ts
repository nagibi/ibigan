import { toast } from 'sonner';
import { resolveApiMessage, type ApiMessagePayload } from '@/lib/resolve-api-message';

export function showApiToast(payload: ApiMessagePayload | undefined, fallbackCode = 'common.success'): void {
  const message = resolveApiMessage(payload, fallbackCode);
  const severity = payload?.severity ?? 'success';

  switch (severity) {
    case 'error':
      toast.error(message);
      break;
    case 'warning':
      toast.warning(message);
      break;
    case 'info':
      toast.info(message);
      break;
    default:
      toast.success(message);
  }
}
