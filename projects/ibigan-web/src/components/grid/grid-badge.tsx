import { X } from 'lucide-react';
import { Badge, BadgeButton, type BadgeProps } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function GridBadge({ className, size = 'sm', ...props }: BadgeProps) {
  return (
    <Badge
      shape="circle"
      appearance="light"
      size={size}
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
  ...props
}: GridFilterBadgeProps) {
  return (
    <Badge
      shape="circle"
      appearance="light"
      size="sm"
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
