import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

export type GridSelectOption = {
  label: string;
  value: string;
};

export function useActiveInactiveFilterOptions(): GridSelectOption[] {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { label: t('status.active'), value: 'active' },
      { label: t('status.inactive'), value: 'inactive' },
    ],
    [t],
  );
}

export function useReadUnreadFilterOptions(): GridSelectOption[] {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { label: t('notifications.status.read'), value: 'read' },
      { label: t('notifications.status.unread'), value: 'unread' },
    ],
    [t],
  );
}

export function useApprovalStatusFilterOptions(): GridSelectOption[] {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { label: t('approvals.status.pending'), value: 'pending' },
      { label: t('approvals.status.approved'), value: 'approved' },
      { label: t('approvals.status.rejected'), value: 'rejected' },
    ],
    [t],
  );
}

export function useCampaignStatusFilterOptions(): GridSelectOption[] {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { label: t('campaigns.status.draft'), value: 'draft' },
      { label: t('campaigns.status.scheduled'), value: 'scheduled' },
      { label: t('campaigns.status.sending'), value: 'sending' },
      { label: t('campaigns.status.sent'), value: 'sent' },
      { label: t('campaigns.status.cancelled'), value: 'cancelled' },
    ],
    [t],
  );
}

export function useInviteStatusFilterOptions(): GridSelectOption[] {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { label: t('invites.status.pending'), value: 'pending' },
      { label: t('invites.status.accepted'), value: 'accepted' },
      { label: t('invites.status.expired'), value: 'expired' },
    ],
    [t],
  );
}

export function useReportExecutionStatusFilterOptions(): GridSelectOption[] {
  const { t } = useTranslation();

  return useMemo(
    () => [
      { label: t('reports.execution_status.queued'), value: 'queued' },
      { label: t('reports.execution_status.running'), value: 'running' },
      { label: t('reports.execution_status.completed'), value: 'completed' },
      { label: t('reports.execution_status.failed'), value: 'failed' },
    ],
    [t],
  );
}
