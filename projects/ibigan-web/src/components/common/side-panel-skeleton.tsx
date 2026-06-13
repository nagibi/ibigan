import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function SidePanelSkeletonList({
  count,
  children,
  className,
}: {
  count: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col divide-y divide-border', className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index}>{children}</div>
      ))}
    </div>
  );
}

function NotificationItemSkeleton() {
  return (
    <div className="flex items-start gap-2.5 px-5 py-4">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2 pe-10">
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <SidePanelSkeletonList count={count}>
      <NotificationItemSkeleton />
    </SidePanelSkeletonList>
  );
}

function ActivityLogItemSkeleton() {
  return (
    <div className="flex gap-3 pb-6">
      <Skeleton className="size-8 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <Skeleton className="h-4 w-full max-w-sm" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
    </div>
  );
}

export function ActivityLogListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: count }, (_, index) => (
        <ActivityLogItemSkeleton key={index} />
      ))}
    </div>
  );
}

export function NotificationPreferencesSkeleton() {
  return (
    <div className="divide-y rounded-md border">
      <div className="flex items-center gap-4 px-4 py-3">
        <Skeleton className="h-4 w-16" />
        <div className="flex w-40 shrink-0 justify-around">
          <Skeleton className="size-4 rounded-sm" />
          <Skeleton className="size-4 rounded-sm" />
        </div>
      </div>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 px-4 py-3.5">
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-52" />
          </div>
          <div className="flex w-40 shrink-0 justify-around">
            <Skeleton className="h-5 w-9 rounded-full" />
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
