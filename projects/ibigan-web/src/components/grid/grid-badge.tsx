import { X } from 'lucide-react';
import { Badge, BadgeButton, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type GridBadgeTone = 'success' | 'warning' | 'info' | 'destructive' | 'muted' | 'primary' | 'secondary';

const TONE_TO_VARIANT: Record<GridBadgeTone, NonNullable<BadgeProps['variant']>> = {
  success: 'success',
  warning: 'warning',
  info: 'info',
  destructive: 'destructive',
  muted: 'secondary',
  primary: 'primary',
  secondary: 'secondary',
};

type GridBadgeProps = BadgeProps & {
  tone?: GridBadgeTone;
};

export function GridBadge({
  className,
  size = 'sm',
  variant,
  tone,
  ...props
}: GridBadgeProps) {
  const resolvedVariant = variant ?? (tone ? TONE_TO_VARIANT[tone] : undefined);

  return (
    <Badge
      shape="circle"
      appearance="light"
      size={size}
      variant={resolvedVariant}
      className={className}
      {...props}
    />
  );
}

interface GridFilterBadgeProps extends BadgeProps {
  onRemove?: () => void;
  removeLabel?: string;
}

export function GridFilterBadge({
  children,
  className,
  onRemove,
  removeLabel = 'Remover filtro',
  variant = 'primary',
  size = 'sm',
  ...props
}: GridFilterBadgeProps) {
  return (
    <Badge
      shape="circle"
      appearance="light"
      size={size}
      variant={variant}
      className={cn('gap-1', className)}
      {...props}
    >
      {children}
      {onRemove ? (
        <BadgeButton
          aria-label={removeLabel}
          onClick={(event) => {
            event.stopPropagation();
            onRemove();
          }}
        >
          <X className="size-3" />
        </BadgeButton>
      ) : null}
    </Badge>
  );
}
