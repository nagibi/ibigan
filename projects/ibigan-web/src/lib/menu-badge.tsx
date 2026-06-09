import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function MenuBadge({
  badge,
  className,
}: {
  badge?: string;
  className?: string;
}) {
  if (!badge) return null;

  return (
    <Badge
      variant="primary"
      size="sm"
      appearance="light"
      data-slot="badge"
      className={cn('shrink-0', className)}
    >
      {badge}
    </Badge>
  );
}
