import { useEffect } from 'react';
import {
  mergeToolbarAlerts,
  ToolbarAlertOverlay,
  useToolbarAlertVisible,
} from '@/components/grid/toolbar-alert';
import { cn } from '@/lib/utils';
import { usePageToolbarConfig } from '@/providers/page-toolbar-provider';
import {
  useDismissGlobalToolbarAlert,
  useGlobalToolbarAlert,
} from '@/stores/toolbar-alert-store';
import { Container } from '@/components/common/container';

export function PageToolbarBar() {
  const config = usePageToolbarConfig();
  const globalAlert = useGlobalToolbarAlert();
  const dismissGlobalAlert = useDismissGlobalToolbarAlert();
  const pageAlert = config?.alert;
  const mergedAlert = mergeToolbarAlerts(globalAlert, pageAlert);
  const hasActions = Boolean(config?.actions);
  const hasGlobalAlert = Boolean(globalAlert);
  const hasPageAlert = Boolean(pageAlert);
  const showBar = hasActions || hasGlobalAlert || hasPageAlert;
  const { visible: pageAlertVisible, dismiss: dismissPageAlert } = useToolbarAlertVisible(
    globalAlert ? null : pageAlert,
  );
  const alertVisible = hasGlobalAlert || pageAlertVisible;

  const handleCloseAlert = () => {
    mergedAlert?.onClose?.();

    if (globalAlert && mergedAlert === globalAlert) {
      dismissGlobalAlert();
      return;
    }
    dismissPageAlert();
  };

  useEffect(() => {
    document.body.classList.toggle('toolbar-visible', showBar);
    return () => document.body.classList.remove('toolbar-visible');
  }, [showBar]);

  if (!showBar) {
    return null;
  }

  return (
    <div
      className={cn(
        'page-toolbar fixed z-[9] flex shrink-0 overflow-visible border-b border-border bg-background end-0 start-0',
        'top-[var(--header-height)] min-h-[var(--toolbar-height)]',
      )}
    >
      <Container
        className={cn(
          'relative flex w-full min-h-[var(--toolbar-height)] items-center py-1.5',
          alertVisible && 'pointer-events-none invisible',
        )}
      >
        {config?.actions}
      </Container>

      {alertVisible && mergedAlert ? (
        <ToolbarAlertOverlay alert={mergedAlert} onClose={handleCloseAlert} />
      ) : null}
    </div>
  );
}
