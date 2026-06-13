import { toast } from 'sonner';
import { getIsMobileViewport } from '@/lib/breakpoints';
import { showAlertToast, type AlertToastVariant } from '@/lib/show-alert-toast';

export type AppToastOptions = {
  title: string;
  description?: string;
  variant?: AlertToastVariant;
};

export function showAppToast({
  title,
  description,
  variant = 'success',
}: AppToastOptions): void {
  if (getIsMobileViewport()) {
    showAlertToast({ title, description, variant });
    return;
  }

  switch (variant) {
    case 'destructive':
      toast.error(title, { description });
      break;
    case 'info':
      toast.info(title, { description });
      break;
    default:
      toast.success(title, { description });
  }
}

export function showAppToastMessage(
  message: string,
  variant: AlertToastVariant = 'success',
): void {
  showAppToast({ title: message, variant });
}
