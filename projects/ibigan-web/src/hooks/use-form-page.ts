import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ApiToolbarNotify } from '@/hooks/use-api-toolbar-alert';
import type { FormSaveMode } from '@/lib/resolve-form-save-path';
import { toggleActiveLabelsFromEntity } from '@/lib/toggle-active-alert';

export type { FormSaveMode };

export interface UseFormPageOptions {
  backPath: string;
  newPath?: string;
  entityLabel?: string;
  onDelete?: () => Promise<void>;
  onToggleActive?: (isActive: boolean) => Promise<void>;
  onDuplicate?: () => Promise<void>;
  notify?: ApiToolbarNotify;
}

export function useFormPage({
  backPath,
  newPath,
  entityLabel = 'registro',
  onDelete,
  onToggleActive,
  onDuplicate,
  notify,
}: UseFormPageOptions) {
  const navigate = useNavigate();
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
      notify?.showError(`Erro ao excluir ${entityLabel}.`, error);
    } finally {
      setIsDeleting(false);
    }
  }, [notify, onDelete, entityLabel, navigate, backPath]);

  const handleToggleActive = useCallback(async (currentIsActive: boolean) => {
    if (!onToggleActive) return;
    try {
      setIsTogglingActive(true);
      const nextIsActive = !currentIsActive;
      await onToggleActive(nextIsActive);
      notify?.showToggleActive(nextIsActive, toggleActiveLabelsFromEntity(entityLabel));
    } catch (error) {
      notify?.showError('Erro ao atualizar status.', error);
    } finally {
      setIsTogglingActive(false);
    }
  }, [notify, onToggleActive, entityLabel]);

  const handleDuplicate = useCallback(async () => {
    if (!onDuplicate) return;
    try {
      setIsDuplicating(true);
      await onDuplicate();
      notify?.showSuccess(`${entityLabel} duplicado com sucesso.`);
    } catch (error) {
      notify?.showError(`Erro ao duplicar ${entityLabel}.`, error);
    } finally {
      setIsDuplicating(false);
    }
  }, [notify, onDuplicate, entityLabel]);

  return {
    saveMode,
    setSaveMode,
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
