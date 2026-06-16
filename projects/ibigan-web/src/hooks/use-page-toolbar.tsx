import { useLayoutEffect, type ReactNode } from 'react';
import type { PageBreadcrumbItem } from '@/lib/build-page-breadcrumbs';
import type { ToolbarAlertConfig } from '@/components/grid/toolbar-alert';
import { useSetPageToolbar } from '@/providers/page-toolbar-provider';

type UsePageToolbarOptions = {
  title: ReactNode;
  description?: ReactNode;
  headerActions?: ReactNode;
  actions?: ReactNode;
  alert?: ToolbarAlertConfig | null;
  breadcrumbs?: PageBreadcrumbItem[];
};

export function usePageToolbar({
  title,
  description,
  headerActions,
  actions,
  alert,
  breadcrumbs,
}: UsePageToolbarOptions) {
  const setConfig = useSetPageToolbar();

  useLayoutEffect(() => {
    setConfig({ title, description, headerActions, actions, alert, breadcrumbs });
  }, [setConfig, title, description, headerActions, actions, alert, breadcrumbs]);

  useLayoutEffect(() => {
    return () => setConfig(null);
  }, [setConfig]);
}
