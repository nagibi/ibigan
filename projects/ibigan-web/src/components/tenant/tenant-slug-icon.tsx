import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTenantSlugColors } from '@/lib/tenant-slug-colors';

type TenantSlugIconProps = {
  slug: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  iconClassName?: string;
};

const SIZE_CLASSES = {
  sm: { container: 'size-8 rounded-md', icon: 'size-4' },
  md: { container: 'size-9 rounded-lg', icon: 'size-4' },
  lg: { container: 'size-10 rounded-lg', icon: 'size-5' },
} as const;

export function TenantSlugIcon({
  slug,
  size = 'md',
  className,
  iconClassName,
}: TenantSlugIconProps) {
  const colors = getTenantSlugColors(slug);
  const sizeClasses = SIZE_CLASSES[size];

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center',
        sizeClasses.container,
        colors.bg,
        className,
      )}
    >
      <Building2 className={cn(sizeClasses.icon, colors.icon, iconClassName)} />
    </div>
  );
}
