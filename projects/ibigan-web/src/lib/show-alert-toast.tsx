import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export type AlertToastVariant = 'success' | 'info' | 'destructive';

const ICONS = {
  success: CheckCircle,
  info: Info,
  destructive: AlertCircle,
} as const;

const ICON_CLASS: Record<AlertToastVariant, string> = {
  success: 'text-green-600 dark:text-green-500',
  info: 'text-violet-600 dark:text-violet-400',
  destructive: 'text-destructive',
};

export function showAlertToast(options: {
  title: string;
  description?: string;
  variant?: AlertToastVariant;
}): void {
  const { title, description, variant = 'success' } = options;
  const Icon = ICONS[variant];

  toast.custom(
    (t) => (
      <Alert
        variant="secondary"
        appearance="solid"
        close
        onClose={() => toast.dismiss(t)}
        className={cn(
          'w-[min(100%,calc(100vw-2rem))] max-w-md border-0 shadow-lg',
          'bg-foreground text-background',
          'dark:bg-card dark:text-card-foreground dark:border dark:border-border',
          '[&_[data-slot=alert-title]]:font-semibold',
          '[&_[data-slot=alert-description]]:text-background/75',
          'dark:[&_[data-slot=alert-description]]:text-muted-foreground',
          '[&_[data-slot=alert-close]]:text-background/70 hover:[&_[data-slot=alert-close]]:text-background',
          'dark:[&_[data-slot=alert-close]]:text-muted-foreground dark:hover:[&_[data-slot=alert-close]]:text-foreground',
        )}
      >
        <AlertIcon className={ICON_CLASS[variant]}>
          <Icon />
        </AlertIcon>
        <AlertContent>
          <AlertTitle>{title}</AlertTitle>
          {description ? <AlertDescription>{description}</AlertDescription> : null}
        </AlertContent>
      </Alert>
    ),
    { position: 'top-center', duration: 5000 },
  );
}
