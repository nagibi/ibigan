import type { ReactNode } from 'react';
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const CONTENT_CLASS = 'gap-0 overflow-hidden p-0';
const HEADER_CLASS = 'mb-0 shrink-0 border-b border-border px-6 py-4 pe-12';
const BODY_CLASS = 'px-6 py-4 [-webkit-overflow-scrolling:touch]';
const FOOTER_CLASS = 'shrink-0 border-t border-border bg-background px-6 py-4 pt-3';

type EquipamentoDialogShellProps = {
  header: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  bodyClassName?: string;
};

export function EquipamentoDialogShell({
  header,
  children,
  footer,
  className,
  bodyClassName,
}: EquipamentoDialogShellProps) {
  return (
    <DialogContent className={cn('max-w-md', CONTENT_CLASS, className)}>
      <DialogHeader className={HEADER_CLASS}>{header}</DialogHeader>
      <DialogBody className={cn(BODY_CLASS, bodyClassName)}>{children}</DialogBody>
      {footer ? <DialogFooter className={FOOTER_CLASS}>{footer}</DialogFooter> : null}
    </DialogContent>
  );
}
