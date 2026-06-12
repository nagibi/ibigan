import { useLayoutEffect, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { PageBreadcrumbItem } from '@/lib/build-page-breadcrumbs';
import type { ToolbarAlertConfig } from '@/components/grid/toolbar-alert';
import {
  useClearPageToolbarAlert,
  useSetPageToolbar,
} from '@/providers/page-toolbar-provider';

type UsePageToolbarOptions = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  alert?: ToolbarAlertConfig | null;
  breadcrumbs?: PageBreadcrumbItem[];
};

export function usePageToolbar({
  title,
  description,
  actions,
  alert,
  breadcrumbs,
}: UsePageToolbarOptions) {
  const { pathname, key } = useLocation();
  const setConfig = useSetPageToolbar();
  const clearPageAlert = useClearPageToolbarAlert();

  useLayoutEffect(() => {
    clearPageAlert();
  }, [pathname, key, clearPageAlert]);

  useLayoutEffect(() => {
    setConfig({ title, description, actions, alert, breadcrumbs });
    return () => clearPageAlert();
  }, [setConfig, clearPageAlert, title, description, actions, alert, breadcrumbs]);
}
