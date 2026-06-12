import { useTranslation } from 'react-i18next';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export function GridEmptyState({
  message,
  className,
}: {
  message?: string;
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'flex items-center justify-center px-4 py-6 text-center text-sm text-muted-foreground',
        'max-xl:min-h-0 max-xl:py-4',
        'xl:min-h-32 xl:rounded-lg xl:border xl:border-dashed xl:border-border xl:bg-muted/20 xl:py-10',
        className,
      )}
    >
      {message ?? t('grid.empty')}
    </div>
  );
}

export function GridCardsSkeleton({
  count = 5,
  variant = 'cards',
}: {
  count?: number;
  variant?: 'cards' | 'list';
}) {
  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <Skeleton className="size-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border lg:grid lg:grid-cols-2 lg:divide-y-0 lg:border-t lg:border-s lg:border-border xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-3 border-border p-4 lg:border-b lg:border-e">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}
