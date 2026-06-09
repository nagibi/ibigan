import { useEffect, type ReactNode } from 'react';
import { useSetPageToolbar } from '@/providers/page-toolbar-provider';

type UsePageToolbarOptions = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
};

export function usePageToolbar({
  title,
  description,
  actions,
}: UsePageToolbarOptions) {
  const setConfig = useSetPageToolbar();

  useEffect(() => {
    setConfig({ title, description, actions });
    return () => setConfig(null);
  }, [setConfig, title, description, actions]);
}
