import { useImpersonationEntryAlert } from '@/hooks/use-impersonation-entry-alert';
import { usePageToolbar } from '@/hooks/use-page-toolbar';

export function DashboardPage() {
  useImpersonationEntryAlert();

  usePageToolbar({
    title: 'Dashboard',
    description: 'Bem-vindo ao Ibigan.',
  });

  return null;
}
