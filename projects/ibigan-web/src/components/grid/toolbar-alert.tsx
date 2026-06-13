import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n/i18next';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { Alert, AlertContent, AlertIcon, AlertTitle, AlertToolbar } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export const TOOLBAR_ALERT_AUTO_DISMISS_MS = 5000;

export type ToolbarAlertVariant = 'info' | 'warning' | 'success' | 'destructive';

export type ToolbarAlertConfig = {
  variant?: ToolbarAlertVariant;
  title: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  /** Padrão: 5000ms. Use `false` para manter visível até a condição mudar. */
  autoDismissMs?: number | false;
  /** Identificador para reexibir o alert após novo disparo. */
  id?: string | number;
  /** Chamado ao clicar em Fechar no overlay do alerta. */
  onClose?: () => void;
};

export function getToolbarAlertIcon(variant: ToolbarAlertVariant = 'info') {
  const className = 'size-4 shrink-0';

  switch (variant) {
    case 'destructive':
      return <AlertCircle className={className} />;
    case 'warning':
      return <AlertTriangle className={className} />;
    case 'success':
      return <CheckCircle2 className={className} />;
    case 'info':
    default:
      return <Info className={className} />;
  }
}

export function resolveToolbarAlert(alert: ToolbarAlertConfig): ToolbarAlertConfig {
  const variant = alert.variant ?? 'info';

  return {
    ...alert,
    variant,
    icon: alert.icon ?? getToolbarAlertIcon(variant),
  };
}

import type { EntityKey } from '@/lib/entity-i18n';
import { entityLabelKey } from '@/lib/entity-i18n';

export function buildInactiveAlert(entityKey: EntityKey = 'record'): ToolbarAlertConfig {
  return {
    variant: 'destructive',
    title: i18n.t('toolbar.inactive_record', { entity: i18n.t(entityLabelKey(entityKey)) }),
    autoDismissMs: false,
    id: 'inactive',
  };
}

/** @deprecated Use `buildInactiveAlert(entityKey)`. */
export function buildInactiveAlertFromLabel(entityLabel = 'registro'): ToolbarAlertConfig {
  return {
    variant: 'destructive',
    title: i18n.t('toolbar.inactive_record', { entity: entityLabel }),
    autoDismissMs: false,
    id: 'inactive',
  };
}

function getToolbarAlertDismissMs(alert: ToolbarAlertConfig) {
  if (alert.autoDismissMs === false) return null;
  return alert.autoDismissMs ?? TOOLBAR_ALERT_AUTO_DISMISS_MS;
}

export function useToolbarAlertVisible(alert?: ToolbarAlertConfig | null) {
  const [dismissed, setDismissed] = useState(false);
  const dismiss = useCallback(() => setDismissed(true), []);

  const alertKey = useMemo(() => {
    if (!alert) return null;
    return `${alert.variant ?? 'info'}:${String(alert.title)}:${alert.id ?? ''}`;
  }, [alert]);

  useEffect(() => {
    setDismissed(false);
    if (!alert) return undefined;

    const dismissMs = getToolbarAlertDismissMs(alert);
    if (dismissMs == null || dismissMs <= 0) return undefined;

    const timer = window.setTimeout(() => setDismissed(true), dismissMs);
    return () => window.clearTimeout(timer);
  }, [alert, alertKey]);

  return {
    visible: Boolean(alert) && !dismissed,
    dismiss,
  };
}

export function mergeToolbarAlerts(
  ...alerts: Array<ToolbarAlertConfig | null | undefined>
): ToolbarAlertConfig | null {
  for (const alert of alerts) {
    if (alert) return alert;
  }
  return null;
}

export function formatToolbarSelectedCount(count: number) {
  return count === 1
    ? i18n.t('grid.selected_one')
    : i18n.t('grid.selected_many', { count });
}

const toolbarAlertClassName =
  'pointer-events-auto absolute inset-0 z-10 flex h-full w-full items-center rounded-none border-0 px-4 [&_[data-slot=alert-icon]]:mt-0';

export function ToolbarAlertOverlay({
  alert,
  onClose,
}: {
  alert: ToolbarAlertConfig;
  onClose?: () => void;
}) {
  const { t } = useTranslation();
  const resolvedAlert = resolveToolbarAlert(alert);

  return (
    <Alert
      variant={resolvedAlert.variant ?? 'info'}
      appearance="light"
      size="sm"
      className={toolbarAlertClassName}
    >
      <AlertIcon className="mt-0">{resolvedAlert.icon}</AlertIcon>
      <AlertContent className="flex-1">
        <AlertTitle>{resolvedAlert.title}</AlertTitle>
      </AlertContent>
      {(resolvedAlert.actions || onClose) ? (
        <AlertToolbar className="flex items-center gap-1">
          {resolvedAlert.actions}
          {onClose ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 px-2 text-xs font-medium"
            >
              {t('common.close')}
            </Button>
          ) : null}
        </AlertToolbar>
      ) : null}
    </Alert>
  );
}

export function ToolbarAlertHost({
  children,
  alert,
  className,
  contentClassName,
}: {
  children: ReactNode;
  alert?: ToolbarAlertConfig | null;
  className?: string;
  contentClassName?: string;
}) {
  const { visible, dismiss } = useToolbarAlertVisible(alert);

  return (
    <div className={cn('relative w-full', className)}>
      <div
        className={cn(
          'w-full',
          contentClassName,
          visible && 'pointer-events-none invisible',
        )}
      >
        {children}
      </div>

      {visible && alert ? (
        <ToolbarAlertOverlay
          alert={alert}
          onClose={() => {
            alert.onClose?.();
            dismiss();
          }}
        />
      ) : null}
    </div>
  );
}
