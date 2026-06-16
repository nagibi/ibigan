import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export const EQUIPAMENTO_PAGE_GAP = 'gap-4';

export function EquipamentoPageStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col pt-3', EQUIPAMENTO_PAGE_GAP, className)}>
      {children}
    </div>
  );
}
