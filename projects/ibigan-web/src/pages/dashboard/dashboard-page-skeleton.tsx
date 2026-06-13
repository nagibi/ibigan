import { PageBody } from '@/components/common/page-body';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function StatCardSkeleton() {
  return (
    <Card className="min-w-0 max-w-full gap-0 py-0">
      <CardContent className="grow-0 px-3 py-3 sm:px-4">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="mt-2 h-7 w-10" />
        <Skeleton className="mt-1.5 h-3 w-20" />
      </CardContent>
    </Card>
  );
}

function DashboardCardSkeleton({
  bodyClassName,
  rows = 0,
}: {
  bodyClassName?: string;
  rows?: number;
}) {
  return (
    <Card className="min-w-0 max-w-full overflow-hidden gap-0 py-0">
      <CardHeader className="min-h-0 shrink-0 flex-col items-start gap-2 border-b px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:px-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40 max-sm:w-full" />
      </CardHeader>
      <CardContent className="grow-0 max-w-full p-0">
        {rows > 0 ? (
          <div className="divide-y">
            {Array.from({ length: rows }, (_, index) => (
              <div key={index} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <Skeleton className="size-7 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/5" />
                  <Skeleton className="h-3 w-2/5" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <Skeleton className={cn('w-full rounded-none', bodyClassName ?? 'h-48')} />
        )}
      </CardContent>
    </Card>
  );
}

function BottomCardSkeleton() {
  return (
    <Card className="min-w-0 max-w-full overflow-hidden">
      <CardHeader className="min-h-0 shrink-0 border-b px-4 py-3 sm:px-5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-1 h-3 w-44" />
      </CardHeader>
      <div className="space-y-3 px-4 py-4 sm:px-5">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function DashboardPageSkeleton() {
  return (
    <PageBody className="min-w-0 max-w-full space-y-5">
      <section className="min-w-0 max-w-full">
        <Skeleton className="mb-2 h-3 w-24" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
          {Array.from({ length: 8 }, (_, index) => (
            <StatCardSkeleton key={index} />
          ))}
        </div>
      </section>

      <div className="flex min-w-0 max-w-full flex-col gap-4 xl:flex-row xl:items-start">
        <div className="flex min-w-0 w-full flex-col gap-4 xl:min-w-0 xl:flex-[3]">
          <DashboardCardSkeleton rows={4} />
          <DashboardCardSkeleton bodyClassName="h-[220px] sm:h-[240px]" />
          <DashboardCardSkeleton rows={3} />
          <DashboardCardSkeleton bodyClassName="h-36" />
          <BottomCardSkeleton />
        </div>
        <div className="flex min-w-0 w-full flex-col gap-4 xl:min-w-0 xl:flex-[2]">
          <DashboardCardSkeleton bodyClassName="h-[200px]" />
          <DashboardCardSkeleton bodyClassName="h-44" />
          <DashboardCardSkeleton bodyClassName="h-36" />
          <DashboardCardSkeleton rows={3} />
          <BottomCardSkeleton />
          <BottomCardSkeleton />
        </div>
      </div>

      <section className="min-w-0 max-w-full space-y-4">
        <Skeleton className="h-3 w-36" />
        <div className="grid min-w-0 max-w-full grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 8 }, (_, index) => (
            <DashboardCardSkeleton key={index} bodyClassName="h-52 sm:h-56" />
          ))}
        </div>
      </section>
    </PageBody>
  );
}
