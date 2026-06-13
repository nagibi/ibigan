import { PageBody } from '@/components/common/page-body';
import { FormFieldSkeleton, FormPanelSkeleton } from '@/components/grid/form-page-skeleton';
import { FormFieldGrid, FormFieldGridItem } from '@/components/grid/form-field-grid';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

function ProfileAvatarPanelSkeleton() {
  return (
    <Card className="mb-4">
      <CardHeader className="min-h-0 px-4 py-3 max-xl:px-4 max-xl:py-4">
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="max-xl:px-4 max-xl:pb-4 max-xl:pt-5">
        <div className="flex items-center gap-4 sm:gap-6">
          <Skeleton className="size-20 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-52 max-w-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="size-8 shrink-0 rounded-md sm:h-7 sm:w-24" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileTenantListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton className="size-9 shrink-0 rounded-lg" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function ProfileLinkRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <Skeleton className="size-9 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-56 max-w-full" />
      </div>
      <Skeleton className="size-4 shrink-0 rounded-sm" />
    </div>
  );
}

function ProfileNotificationsPanelSkeleton() {
  return (
    <Card className="mb-4">
      <CardHeader className="min-h-0 px-4 py-3 max-xl:px-4 max-xl:py-4">
        <Skeleton className="h-5 w-28" />
      </CardHeader>
      <CardContent className="max-xl:px-4 max-xl:pb-4 max-xl:pt-5">
        <div className="space-y-2">
          <ProfileLinkRowSkeleton />
          <ProfileLinkRowSkeleton />
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileAppearancePanelSkeleton() {
  return (
    <Card className="mb-4">
      <CardHeader className="min-h-0 px-4 py-3 max-xl:px-4 max-xl:py-4">
        <Skeleton className="h-5 w-24" />
      </CardHeader>
      <CardContent className="max-xl:px-4 max-xl:pb-4 max-xl:pt-5">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }, (_, index) => (
              <Skeleton key={index} className="h-28 rounded-md" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 2 }, (_, index) => (
              <Skeleton key={index} className="h-28 rounded-md" />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileSecurityPanelSkeleton() {
  return (
    <Card className="mb-4">
      <CardHeader className="min-h-0 px-4 py-3 max-xl:px-4 max-xl:py-4">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="mt-2 h-4 w-full max-w-md" />
      </CardHeader>
      <CardContent className="max-xl:px-4 max-xl:pb-4 max-xl:pt-5">
        <Skeleton className="h-9 w-36" />
      </CardContent>
    </Card>
  );
}

export function ProfilePageSkeleton() {
  return (
    <PageBody>
      <ProfileAvatarPanelSkeleton />
      <FormPanelSkeleton titleWidth="w-32" fields={6} />
      <Card className="mb-4">
        <CardHeader className="min-h-0 px-4 py-3 max-xl:px-4 max-xl:py-4">
          <Skeleton className="h-5 w-24" />
        </CardHeader>
        <CardContent className="max-xl:px-4 max-xl:pb-4 max-xl:pt-5">
          <ProfileTenantListSkeleton count={2} />
        </CardContent>
      </Card>
      <ProfileNotificationsPanelSkeleton />
      <ProfileAppearancePanelSkeleton />
      <Card className="mb-4">
        <CardHeader className="min-h-0 px-4 py-3 max-xl:px-4 max-xl:py-4">
          <Skeleton className="h-5 w-28" />
        </CardHeader>
        <CardContent className="max-xl:px-4 max-xl:pb-4 max-xl:pt-5">
          <FormFieldGrid columns={3}>
            {Array.from({ length: 3 }, (_, index) => (
              <FormFieldGridItem key={index} columns={3}>
                <FormFieldSkeleton />
              </FormFieldGridItem>
            ))}
          </FormFieldGrid>
        </CardContent>
      </Card>
      <ProfileSecurityPanelSkeleton />
    </PageBody>
  );
}
