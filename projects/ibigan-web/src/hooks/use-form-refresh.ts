import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

type UseFormRefreshOptions = {
  isEditing: boolean;
  isDirty?: boolean;
  isFetching?: boolean;
  refetch?: () => Promise<unknown> | void;
  onReset?: () => void;
};

export function useFormRefresh({
  isEditing,
  isDirty = false,
  isFetching = false,
  refetch,
  onReset,
}: UseFormRefreshOptions) {
  const { t } = useTranslation();

  const handleRefresh = useCallback(() => {
    if (isDirty && !window.confirm(t('form.confirm_refresh'))) {
      return;
    }

    if (isEditing) {
      if (!refetch) return;
      void refetch();
      return;
    }

    onReset?.();
  }, [isDirty, isEditing, onReset, refetch, t]);

  const enabled = isEditing ? Boolean(refetch) : Boolean(onReset);

  return {
    onRefresh: enabled ? handleRefresh : undefined,
    isRefreshing: isFetching,
  };
}
