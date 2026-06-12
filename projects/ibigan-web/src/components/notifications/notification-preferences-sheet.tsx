import { Settings2 } from 'lucide-react';
import { useApiMenuByPath } from '@/hooks/use-api-menu-by-path';
import { NotificationPreferencesContent } from '@/components/notifications/notification-preferences-content';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { NOTIFICATION_PREFERENCES_PATH } from '@/lib/notification-preferences-path';

interface NotificationPreferencesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationPreferencesSheet({
  open,
  onOpenChange,
}: NotificationPreferencesSheetProps) {
  const notificationsMenu = useApiMenuByPath(NOTIFICATION_PREFERENCES_PATH);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="mobile-side-panel-sheet gap-0 rounded-lg p-0 sm:inset-5 sm:start-auto sm:h-auto sm:max-h-[calc(100vh-2.5rem)] sm:w-[520px] sm:max-w-none [&_[data-slot=sheet-close]]:end-5 [&_[data-slot=sheet-close]]:top-4.5">
        <SheetHeader className="mb-0 border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 p-0">
            <Settings2 className="size-4 shrink-0" />
            {notificationsMenu?.title ?? 'Preferências de Notificação'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Configure como deseja ser notificado para cada tipo de evento.
          </p>
        </SheetHeader>

        <SheetBody className="min-h-0 grow p-0">
          <ScrollArea className="h-[calc(100dvh-12rem)] sm:h-[calc(100vh-11rem)]">
            <div className="px-5 py-5">
              <NotificationPreferencesContent />
            </div>
          </ScrollArea>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
