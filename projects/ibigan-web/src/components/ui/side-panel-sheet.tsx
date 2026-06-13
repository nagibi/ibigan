import type { ComponentProps, ReactNode } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type SidePanelWidth = 420 | 520;

interface SidePanelSheetProps extends ComponentProps<typeof Sheet> {}

export function SidePanelSheet({ ...props }: SidePanelSheetProps) {
  return <Sheet {...props} />;
}

interface SidePanelSheetContentProps extends ComponentProps<typeof SheetContent> {
  width?: SidePanelWidth;
}

export function SidePanelSheetContent({
  className,
  width = 520,
  children,
  ...props
}: SidePanelSheetContentProps) {
  return (
    <SheetContent
      side="right"
      className={cn(
        'mobile-side-panel-sheet flex flex-col gap-0 overflow-hidden rounded-lg border bg-background p-0 shadow-lg',
        'max-sm:inset-4 max-sm:h-[calc(100dvh-2rem)] max-sm:max-h-[calc(100dvh-2rem)] max-sm:w-auto max-sm:max-w-[calc(100vw-2rem)]',
        'sm:inset-5 sm:start-auto sm:end-5 sm:left-auto sm:h-auto sm:max-h-[calc(100vh-2.5rem)] sm:max-w-none',
        width === 420 ? 'sm:w-[420px]' : 'sm:w-[520px]',
        '[&_[data-slot=sheet-close]]:end-5 [&_[data-slot=sheet-close]]:top-4.5',
        className,
      )}
      {...props}
    >
      {children}
    </SheetContent>
  );
}

export function SidePanelSheetHeader({ className, ...props }: ComponentProps<typeof SheetHeader>) {
  return <SheetHeader className={cn('mb-0 shrink-0 space-y-0', className)} {...props} />;
}

export function SidePanelSheetBody({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <SheetBody className={cn('mb-0 min-h-0 flex-1 overflow-hidden p-0', className)}>
      <ScrollArea className="h-full min-h-0">
        <div className="px-5 py-5 pb-4">{children}</div>
      </ScrollArea>
    </SheetBody>
  );
}

export function SidePanelSheetFooter({ className, ...props }: ComponentProps<typeof SheetFooter>) {
  return (
    <SheetFooter
      className={cn(
        'mb-0 shrink-0 border-t border-border bg-background p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:flex-col sm:space-x-0',
        className,
      )}
      {...props}
    />
  );
}

export function SidePanelSheetActions({ children }: { children: ReactNode }) {
  return <div className="grid w-full grid-cols-2 gap-2.5">{children}</div>;
}
