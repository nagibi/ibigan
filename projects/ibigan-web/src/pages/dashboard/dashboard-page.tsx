import { usePageToolbar } from '@/hooks/use-page-toolbar';

export function DashboardPage() {
  usePageToolbar({
    title: 'Dashboard',
    description: 'Bem-vindo ao Ibigan.',
  });

  return null;
}
