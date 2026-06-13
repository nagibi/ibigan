import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DialogTitle } from '@/components/ui/dialog';
import { SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

const panelTitleClassName = 'flex items-center gap-2 p-0 text-start';

interface PanelTitleProps {
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}

export function SheetPanelTitle({ icon: Icon, children, className }: PanelTitleProps) {
  return (
    <SheetTitle className={cn(panelTitleClassName, 'pe-8', className)}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </SheetTitle>
  );
}

export function DialogPanelTitle({ icon: Icon, children, className }: PanelTitleProps) {
  return (
    <DialogTitle className={cn(panelTitleClassName, 'pe-8', className)}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </DialogTitle>
  );
}

export function AlertDialogPanelTitle({ icon: Icon, children, className }: PanelTitleProps) {
  return (
    <AlertDialogTitle className={cn(panelTitleClassName, className)}>
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </AlertDialogTitle>
  );
}
