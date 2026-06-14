import { GridBadge } from '@/components/grid/grid-badge';
import { cn } from '@/lib/utils';

export function PlatformCatalogBadge({ className }: { className?: string }) {
  return (
    <GridBadge tone="info" className={cn('shrink-0', className)}>
      Plataforma
    </GridBadge>
  );
}
