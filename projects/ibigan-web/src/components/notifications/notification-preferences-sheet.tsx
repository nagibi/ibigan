import { Bell, Settings2 } from 'lucide-react';
import { InfoHint } from '@/components/common/info-hint';
import { SheetPanelTitle } from '@/components/common/panel-title';
import { ToolbarTooltip } from '@/components/grid/toolbar-tooltip';
import { useApiMenuByPath } from '@/hooks/use-api-menu-by-path';
import { useCentralOnlySession } from '@/hooks/use-central-only-session';
import { NotificationPreferencesColumnHeader, NotificationPreferencesContent } from '@/components/notifications/notification-preferences-content';
import { useNotificationsSheet } from '@/providers/notifications-sheet-provider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
} from '@/components/ui/sheet';
import { NOTIFICATION_PREFERENCES_PATH, NOTIFICATION_PREFERENCES_TITLE } from '@/lib/notification-preferences-path';

import type { NotificationModule } from '@/types/notification-events';

interface NotificationPreferencesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  module?: NotificationModule;
}

export function NotificationPreferencesSheet({
  open,
  onOpenChange,
  module,
}: NotificationPreferencesSheetProps) {
  const { open: openNotificationsSheet } = useNotificationsSheet();
  const isCentralOnly = useCentralOnlySession();
  const notificationsMenu = useApiMenuByPath(NOTIFICATION_PREFERENCES_PATH);
  const notificationsPageMenu = useApiMenuByPath('/notifications');
  const notificationsLabel = notificationsPageMenu?.title ?? 'Notificações';

  function openNotifications() {
    onOpenChange(false);
    window.setTimeout(() => openNotificationsSheet(), 0);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="mobile-side-panel-sheet gap-0 rounded-lg p-0 sm:inset-5 sm:start-auto sm:h-auto sm:max-h-[calc(100vh-2.5rem)] sm:w-[640px] sm:max-w-none [&_[data-slot=sheet-close]]:end-5 [&_[data-slot=sheet-close]]:top-4.5">
        <SheetHeader className="relative mb-0 border-b px-4 py-4 pe-14 sm:px-5">
          <SheetPanelTitle icon={Settings2}>
            {notificationsMenu?.title ?? NOTIFICATION_PREFERENCES_TITLE}
            <InfoHint
              content="Configure como deseja ser notificado para cada tipo de evento."
              side="bottom"
            />
          </SheetPanelTitle>
          {!isCentralOnly ? (
            <ToolbarTooltip content={notificationsLabel}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                mode="icon"
                className="absolute end-12 top-3.5 shrink-0"
                aria-label={notificationsLabel}
                onClick={openNotifications}
              >
                <Bell className="size-4" />
              </Button>
            </ToolbarTooltip>
          ) : null}
        </SheetHeader>

        <SheetBody className="flex min-h-0 flex-1 flex-col p-0">
          <NotificationPreferencesColumnHeader className="hidden shrink-0 bg-background px-2.5 sm:flex sm:px-5" />
          <ScrollArea className="min-h-0 flex-1">
            <div className="px-2.5 py-4 pb-20 sm:px-5 sm:py-5 sm:pb-5">
              <NotificationPreferencesContent module={module} showColumnHeader={false} />
            </div>
          </ScrollArea>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
