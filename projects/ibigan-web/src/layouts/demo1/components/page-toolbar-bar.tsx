import { useLayoutEffect, useRef } from 'react';
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
  const toolbarRef = useRef<HTMLDivElement>(null);
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

  useLayoutEffect(() => {
    document.body.classList.toggle('toolbar-visible', showBar);
    return () => document.body.classList.remove('toolbar-visible');
  }, [showBar]);

  useLayoutEffect(() => {
    const toolbar = toolbarRef.current;
    if (!showBar || !toolbar) {
      document.documentElement.style.removeProperty('--page-toolbar-measured-height');
      return undefined;
    }

    const syncHeight = () => {
      document.documentElement.style.setProperty(
        '--page-toolbar-measured-height',
        `${toolbar.offsetHeight}px`,
      );
    };

    syncHeight();

    const resizeObserver = new ResizeObserver(syncHeight);
    resizeObserver.observe(toolbar);

    return () => {
      resizeObserver.disconnect();
      document.documentElement.style.removeProperty('--page-toolbar-measured-height');
    };
  }, [showBar]);

  if (!showBar) {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
        className={cn(
        'page-toolbar relative z-0 flex w-full shrink-0 overflow-x-auto overflow-y-visible border-b border-border bg-background',
        'min-h-[var(--toolbar-height)] max-xl:min-h-0',
      )}
    >
      <Container
        className={cn(
          'relative flex w-full min-w-0 min-h-[var(--toolbar-height)] flex-wrap items-center gap-x-0.5 gap-y-1 py-1 max-xl:py-0.5',
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
