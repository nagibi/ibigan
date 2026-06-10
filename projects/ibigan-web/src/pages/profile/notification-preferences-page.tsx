import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationPreferencesSheet } from '@/providers/notification-preferences-sheet-provider';

export function NotificationPreferencesPage() {
  const navigate = useNavigate();
  const { open } = useNotificationPreferencesSheet();

  useEffect(() => {
    open();
    navigate('/notifications', { replace: true });
  }, [navigate, open]);

  return null;
}
