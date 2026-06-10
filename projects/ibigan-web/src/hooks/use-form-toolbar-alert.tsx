import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useFormState, type Control, type FieldValues } from 'react-hook-form';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ToolbarAlertConfig } from '@/components/grid/toolbar-alert';

function hasNestedFlagFields(fields: object): boolean {
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
  control: Control<T>,
  onDiscard?: () => void,
  options?: UseFormToolbarAlertOptions,
): ToolbarAlertConfig | null {
  const { key } = useLocation();
  const dirtyTrackingEnabled = useFormDirtyTrackingEnabled(key);
  const phantomDirtyClearedRef = useRef(false);
  const { errors, dirtyFields, touchedFields, submitCount } = useFormState({ control });
  const errorList = Object.values(errors);
  const hasErrors = errorList.some(Boolean);
  const hasServerErrors = errorList.some((error) => error?.type === 'server');
  const hasDirtyFields = hasNestedFlagFields(dirtyFields);
  const hasTouchedFields = hasNestedFlagFields(touchedFields);
  const hasUnsavedChanges = dirtyTrackingEnabled && hasDirtyFields && hasTouchedFields;

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
        title: 'Verifique todos os campos',
        id: hasServerErrors ? `server-${submitCount}` : submitCount,
      };
    }

    if (hasUnsavedChanges && onDiscard) {
      return {
        variant: 'warning',
        title: 'Alterações não salvas',
        autoDismissMs: false,
        id: key,
        actions: (
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onDiscard}
            className="h-8 gap-1.5"
          >
            <RotateCcw className="size-3.5 shrink-0" />
            Descartar
          </Button>
        ),
      };
    }

    return null;
  }, [hasErrors, hasServerErrors, hasUnsavedChanges, key, onDiscard, submitCount]);
}
