import { CentralLayout } from '@/components/layouts/central-layout';
import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { useCentralOnlySession } from '@/hooks/use-central-only-session';

export function AccountLayout() {
  const isCentralOnly = useCentralOnlySession();

  if (isCentralOnly) {
    return <CentralLayout />;
  }

  return <DashboardLayout />;
}
