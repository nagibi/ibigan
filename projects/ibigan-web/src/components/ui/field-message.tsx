import { cn } from '@/lib/utils';

export function FieldMessage({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  if (!message) return null;

  return (
    <p className={cn('text-xs font-normal text-destructive', className)} role="alert">
      {message}
    </p>
  );
}
