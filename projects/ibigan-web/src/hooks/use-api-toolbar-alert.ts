import { useCallback, useRef } from 'react';
import type { ToolbarAlertConfig } from '@/components/grid/toolbar-alert';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import {
  formatToggleActiveMessage,
  type ToggleActiveLabels,
} from '@/lib/toggle-active-alert';
import {
  toolbarAlertStore,
  useGlobalToolbarAlert,
} from '@/stores/toolbar-alert-store';

function nextApiAlert(
  variant: ToolbarAlertConfig['variant'],
  title: string,
  id: number,
): ToolbarAlertConfig {
  return { variant, title, id };
}

export function useApiToolbarAlert() {
  const apiAlert = useGlobalToolbarAlert();
  const alertId = useRef(0);

  const showSuccess = useCallback((message: string) => {
    alertId.current += 1;
    toolbarAlertStore.show(nextApiAlert('success', message, alertId.current));
  }, []);

  const showError = useCallback((message: string, error?: unknown) => {
    alertId.current += 1;
    toolbarAlertStore.show(nextApiAlert(
      'destructive',
      error ? getApiErrorMessage(error, message) : message,
      alertId.current,
    ));
  }, []);

  const showInfo = useCallback((message: string) => {
    alertId.current += 1;
    toolbarAlertStore.show(nextApiAlert('info', message, alertId.current));
  }, []);

  const showToggleActive = useCallback((
    isActive: boolean,
    labels: ToggleActiveLabels,
    count = 1,
  ) => {
    alertId.current += 1;
    toolbarAlertStore.show(nextApiAlert(
      isActive ? 'success' : 'destructive',
      formatToggleActiveMessage(isActive, labels, count),
      alertId.current,
    ));
  }, []);

  const clear = useCallback(() => toolbarAlertStore.dismiss(), []);

  return {
    apiAlert,
    showSuccess,
    showError,
    showInfo,
    showToggleActive,
    clear,
  };
}

export type ApiToolbarNotify = Pick<
  ReturnType<typeof useApiToolbarAlert>,
  'showSuccess' | 'showError' | 'showInfo' | 'showToggleActive'
>;
