import { AlertCircle, CheckCircle, Info } from 'lucide-react';
import { toast } from 'sonner';
import {
  Alert,
  AlertContent,
  AlertDescription,
  AlertIcon,
  AlertTitle,
} from '@/components/ui/alert';

type AlertToastVariant = 'success' | 'info' | 'destructive';

const ICONS = {
  success: CheckCircle,
  info: Info,
  destructive: AlertCircle,
} as const;

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
        variant="mono"
        icon={variant === 'destructive' ? 'destructive' : variant}
        close
        onClose={() => toast.dismiss(t)}
      >
        <AlertIcon>
          <Icon />
        </AlertIcon>
        <AlertContent>
          <AlertTitle>{title}</AlertTitle>
          {description ? <AlertDescription>{description}</AlertDescription> : null}
        </AlertContent>
      </Alert>
    ),
    { position: 'top-center' },
  );
}
