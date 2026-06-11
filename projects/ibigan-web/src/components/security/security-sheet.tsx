import { Shield } from 'lucide-react';
import { useApiMenuByPath } from '@/hooks/use-api-menu-by-path';
import { SecurityContent } from '@/components/security/security-content';
import { SECURITY_PATH } from '@/lib/security-path';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface SecuritySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SecuritySheet({ open, onOpenChange }: SecuritySheetProps) {
  const securityMenu = useApiMenuByPath(SECURITY_PATH);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="inset-5 start-auto h-auto w-full gap-0 rounded-lg p-0 sm:max-w-none sm:w-[560px] [&_[data-slot=sheet-close]]:end-5 [&_[data-slot=sheet-close]]:top-4.5">
        <SheetHeader className="mb-0 border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 p-0">
            <Shield className="size-4 shrink-0" />
            {securityMenu?.title ?? 'Segurança'}
          </SheetTitle>
          <p className="text-sm text-muted-foreground">
            Gerencie a segurança da sua conta.
          </p>
        </SheetHeader>

        <SheetBody className="grow p-0">
          <ScrollArea className="h-[calc(100vh-11rem)]">
            <div className="px-5 py-5">
              <SecurityContent />
            </div>
          </ScrollArea>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
