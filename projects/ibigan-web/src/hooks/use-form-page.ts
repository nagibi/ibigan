import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import type { ApiToolbarNotify } from '@/hooks/use-api-toolbar-alert';
import type { EntityKey } from '@/lib/entity-i18n';
import { useEntityLabel, useEntityToggleLabels } from '@/lib/entity-i18n';
import type { FormSaveMode } from '@/lib/resolve-form-save-path';
import { toggleActiveLabelsFromEntity } from '@/lib/toggle-active-alert';

export type { FormSaveMode };

export interface UseFormPageOptions {
  backPath: string;
  newPath?: string;
  /** Chave i18n em `entities.*` */
  entityKey?: EntityKey;
  /** Fallback legado quando `entityKey` não é informado */
  entityLabel?: string;
  onDelete?: () => Promise<void>;
  onToggleActive?: (isActive: boolean) => Promise<void>;
  onDuplicate?: () => Promise<void>;
  notify?: ApiToolbarNotify;
}

export function useFormPage({
  backPath,
  newPath,
  entityKey,
  entityLabel,
  onDelete,
  onToggleActive,
  onDuplicate,
  notify,
}: UseFormPageOptions) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const keyedEntityLabel = useEntityLabel(entityKey ?? 'record');
  const keyedToggleLabels = useEntityToggleLabels(entityKey ?? 'record');
  const resolvedEntityLabel = entityKey
    ? keyedEntityLabel
    : (entityLabel ?? t('entities.record'));
  const toggleLabels = useMemo(
    () => (entityKey ? keyedToggleLabels : toggleActiveLabelsFromEntity(resolvedEntityLabel)),
    [entityKey, keyedToggleLabels, resolvedEntityLabel],
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingActive, setIsTogglingActive] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [saveMode, setSaveMode] = useState<FormSaveMode>('list');

  const handleBack = useCallback(() => navigate(backPath), [navigate, backPath]);

  const handleNew = useCallback(() => {
    if (newPath) navigate(newPath);
  }, [navigate, newPath]);

  const handleDelete = useCallback(async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete();
      navigate(backPath);
    } catch (error) {
      notify?.showError(t('form.error.delete', { entity: resolvedEntityLabel }), error);
    } finally {
      setIsDeleting(false);
    }
  }, [notify, onDelete, resolvedEntityLabel, navigate, backPath, t]);

  const handleToggleActive = useCallback(async (currentIsActive: boolean) => {
    if (!onToggleActive) return;
    try {
      setIsTogglingActive(true);
      const nextIsActive = !currentIsActive;
      await onToggleActive(nextIsActive);
      notify?.showToggleActive(nextIsActive, toggleLabels);
    } catch (error) {
      notify?.showError(t('form.error.update_status'), error);
    } finally {
      setIsTogglingActive(false);
    }
  }, [notify, onToggleActive, toggleLabels, t]);

  const handleDuplicate = useCallback(async () => {
    if (!onDuplicate) return;
    try {
      setIsDuplicating(true);
      await onDuplicate();
      notify?.showSuccess(t('form.success.duplicated', { entity: resolvedEntityLabel }));
    } catch (error) {
      notify?.showError(t('form.error.duplicate', { entity: resolvedEntityLabel }), error);
    } finally {
      setIsDuplicating(false);
    }
  }, [notify, onDuplicate, resolvedEntityLabel, t]);

  return {
    saveMode,
    setSaveMode,
    entityLabel: resolvedEntityLabel,
    handleBack,
    handleNew,
    handleDelete,
    handleToggleActive,
    handleDuplicate,
    isDeleting,
    isTogglingActive,
    isDuplicating,
  };
}
