import { cn } from '@/lib/utils';
import { getTenantSlugColors } from '@/lib/tenant-slug-colors';

type TenantSlugBadgeProps = {
  slug: string;
  className?: string;
};

export function TenantSlugBadge({ slug, className }: TenantSlugBadgeProps) {
  const colors = getTenantSlugColors(slug);

  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center truncate rounded-md px-2 py-0.5 font-mono text-xs font-medium',
        colors.bg,
        colors.icon,
        className,
      )}
      title={slug}
    >
      {slug}
    </span>
  );
}
