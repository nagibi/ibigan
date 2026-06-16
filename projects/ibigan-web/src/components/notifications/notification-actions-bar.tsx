import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/axios';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import { Button } from '@/components/ui/button';
import type { NotificationAction } from '@/types/notification-events';

interface NotificationActionsBarProps {
  actions: NotificationAction[];
  onActionComplete?: () => void;
  className?: string;
}

export function NotificationActionsBar({
  actions,
  onActionComplete,
  className,
}: NotificationActionsBarProps) {
  const navigate = useNavigate();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (actions.length === 0) return null;

  async function handleAction(action: NotificationAction) {
    if (action.type === 'navigate') {
      const path = action.payload.path;
      if (typeof path === 'string' && path.length > 0) {
        navigate(path);
        onActionComplete?.();
      }
      return;
    }

    if (action.type === 'api') {
      const url = action.payload.url;
      if (typeof url !== 'string' || url.length === 0) return;

      setPendingId(action.id);
      try {
        const method = String(action.payload.method ?? 'post').toLowerCase();
        const body = action.payload.body;

        if (method === 'patch') {
          await api.patch(url, body);
        } else if (method === 'put') {
          await api.put(url, body);
        } else {
          await api.post(url, body);
        }

        toast.success(String(action.payload.success_message ?? 'Ação realizada com sucesso.'));
        onActionComplete?.();
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Não foi possível executar a ação.'));
      } finally {
        setPendingId(null);
      }
      return;
    }

    toast.message('Ação disponível apenas no aplicativo completo.');
  }

  return (
    <div className={className}>
      <p className="mb-2 text-xs font-medium text-muted-foreground">Ações</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const isPending = pendingId === action.id;

          return (
            <Button
              key={action.id}
              type="button"
              size="sm"
              variant={action.primary ? 'primary' : 'outline'}
              disabled={Boolean(pendingId)}
              onClick={() => void handleAction(action)}
            >
              {isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : null}
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
