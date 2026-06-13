import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const GRID_COLUMNS_CLASS = {
  2: 'xl:grid-cols-2',
  3: 'xl:grid-cols-3',
  4: 'xl:grid-cols-4',
} as const;

export function FormFieldGrid({
  children,
  className,
  columns = 4,
}: {
  children: ReactNode;
  className?: string;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-4 sm:grid-cols-2',
        GRID_COLUMNS_CLASS[columns],
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormFieldGridItem({
  children,
  className,
  span = 1,
  columns = 4,
}: {
  children: ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4;
  columns?: 2 | 3 | 4;
}) {
  const spanClass = {
    1: '',
    2: columns === 3 ? 'sm:col-span-2 xl:col-span-2' : 'sm:col-span-2 xl:col-span-2',
    3: columns === 3 ? 'sm:col-span-2 xl:col-span-3' : 'sm:col-span-2 xl:col-span-3',
    4: 'sm:col-span-2 xl:col-span-4',
  }[span];

  return (
    <div className={cn('max-xl:col-span-1', spanClass, className)}>
      {children}
    </div>
  );
}

/** Linha dinâmica de formulário (ex.: parâmetros/colunas de relatório) — empilha no mobile. */
export function FormRepeatableRow({
  children,
  className,
  variant = '5-col',
}: {
  children: ReactNode;
  className?: string;
  variant?: '4-col' | '5-col';
}) {
  const variantClass =
    variant === '5-col'
      ? 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]'
      : 'xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]';

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-3 rounded-lg border border-border p-3 sm:grid-cols-2 xl:items-end xl:gap-2 xl:border-0 xl:p-0',
        variantClass,
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Ação de remover em linhas repetíveis — alinhada à direita no mobile. */
export function FormRepeatableRowAction({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex justify-end sm:col-span-2 xl:col-span-1 xl:justify-start', className)}>
      {children}
    </div>
  );
}

/** Linha inline de campos (ex.: destinatários) — coluna no mobile, linha no sm+. */
export function FormInlineRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-start', className)}>
      {children}
    </div>
  );
}
