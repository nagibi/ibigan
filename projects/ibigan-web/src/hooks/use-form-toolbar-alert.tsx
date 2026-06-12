import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  useFormState,
  type FieldValues,
  type UseFormReturn,
} from 'react-hook-form';
import { getFormToolbarValidationMessage } from '@/lib/form-toolbar-messages';
import type { ToolbarAlertConfig } from '@/components/grid/toolbar-alert';

export { getFormToolbarValidationMessage };

export function hasNestedFlagFields(fields: object): boolean {
  return Object.values(fields).some(
    (value) =>
      value === true
      || (typeof value === 'object' && value !== null && hasNestedFlagFields(value)),
  );
}

function useFormDirtyTrackingEnabled(routeKey: string) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(false);
    const frame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEnabled(true));
    });
    return () => window.cancelAnimationFrame(frame);
  }, [routeKey]);

  return enabled;
}

export type UseFormToolbarAlertOptions = {
  /** Limpa dirty fantasma (autofill, Select na montagem) sem interação do usuário. */
  resetPhantomDirty?: () => void;
};

export function useFormToolbarAlert<T extends FieldValues>(
  form: UseFormReturn<T>,
  options?: UseFormToolbarAlertOptions,
): ToolbarAlertConfig | null {
  const { key } = useLocation();
  const dirtyTrackingEnabled = useFormDirtyTrackingEnabled(key);
  const phantomDirtyClearedRef = useRef(false);
  const { errors, dirtyFields, touchedFields, submitCount } = useFormState({
    control: form.control,
  });
  const errorList = Object.values(errors);
  const hasErrors = errorList.some(Boolean);
  const hasServerErrors = errorList.some((error) => error?.type === 'server');
  const hasDirtyFields = hasNestedFlagFields(dirtyFields);
  const hasTouchedFields = hasNestedFlagFields(touchedFields);

  useEffect(() => {
    phantomDirtyClearedRef.current = false;
  }, [key]);

  useEffect(() => {
    if (
      !dirtyTrackingEnabled
      || !options?.resetPhantomDirty
      || phantomDirtyClearedRef.current
    ) {
      return;
    }

    if (hasDirtyFields && !hasTouchedFields) {
      phantomDirtyClearedRef.current = true;
      options.resetPhantomDirty();
    }
  }, [
    dirtyTrackingEnabled,
    hasDirtyFields,
    hasTouchedFields,
    options?.resetPhantomDirty,
  ]);

  return useMemo(() => {
    if ((submitCount > 0 || hasServerErrors) && hasErrors) {
      return {
        variant: 'destructive',
        title: getFormToolbarValidationMessage(),
        id: hasServerErrors ? `server-${submitCount}` : submitCount,
      };
    }

    return null;
  }, [hasErrors, hasServerErrors, submitCount]);
}
