import { PageBody } from '@/components/common/page-body';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { FormFieldGrid, FormFieldGridItem } from './form-field-grid';

export function FormFieldSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export function FormPanelSkeleton({
  titleWidth = 'w-32',
  fields = 4,
  showBadge = false,
}: {
  titleWidth?: string;
  fields?: number;
  showBadge?: boolean;
}) {
  return (
    <Card className="mb-4">
      <CardHeader className="min-h-0 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className={cn('h-5', titleWidth)} />
          {showBadge && <Skeleton className="h-5 w-16 rounded-full" />}
        </div>
      </CardHeader>
      <CardContent>
        <FormFieldGrid>
          {Array.from({ length: fields }, (_, index) => (
            <FormFieldGridItem key={index}>
              <FormFieldSkeleton />
            </FormFieldGridItem>
          ))}
        </FormFieldGrid>
      </CardContent>
    </Card>
  );
}

export function FormPageSkeleton({
  panels = [{ titleWidth: 'w-36', fields: 4, showBadge: true }],
}: {
  panels?: Array<{ titleWidth?: string; fields?: number; showBadge?: boolean }>;
}) {
  return (
    <PageBody>
      {panels.map((panel, index) => (
        <FormPanelSkeleton key={index} {...panel} />
      ))}
    </PageBody>
  );
}
