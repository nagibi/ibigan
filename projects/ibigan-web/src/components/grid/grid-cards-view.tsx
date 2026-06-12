import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { getGridRowClassName } from './grid-table';

export interface GridCardsViewProps<T> {
  data: T[];
  getRowKey: (row: T) => string;
  renderCard: (row: T) => ReactNode;
  isRowSelected?: (row: T) => boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function GridCardsView<T>({
  data,
  getRowKey,
  renderCard,
  isRowSelected,
  onRowClick,
  className,
}: GridCardsViewProps<T>) {
  return (
    <div
      className={cn(
        'flex min-w-0 w-full max-w-full flex-col divide-y divide-border overflow-x-hidden',
        'xl:grid xl:grid-cols-2 xl:divide-y-0 xl:border-t xl:border-s xl:border-border',
        '2xl:grid-cols-3',
        className,
      )}
    >
      {data.map((row) => (
        <div
          key={getRowKey(row)}
          role={onRowClick ? 'button' : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          onKeyDown={
            onRowClick
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }
              : undefined
          }
          className={getGridRowClassName({
            selected: isRowSelected?.(row),
            interactive: Boolean(onRowClick),
            extra: 'min-w-0 w-full max-w-full overflow-hidden xl:border-b xl:border-e xl:border-border',
          })}
        >
          {renderCard(row)}
        </div>
      ))}
    </div>
  );
}

export interface GridListViewProps<T> {
  data: T[];
  getRowKey: (row: T) => string;
  renderItem: (row: T) => ReactNode;
  isRowSelected?: (row: T) => boolean;
  onRowClick?: (row: T) => void;
  className?: string;
}

export function GridListView<T>({
  data,
  getRowKey,
  renderItem,
  isRowSelected,
  onRowClick,
  className,
}: GridListViewProps<T>) {
  return (
    <div className={cn('space-y-2 min-w-0 w-full max-w-full overflow-x-hidden', className)}>
      {data.map((row) => (
        <div
          key={getRowKey(row)}
          role={onRowClick ? 'button' : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          onKeyDown={
            onRowClick
              ? (event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onRowClick(row);
                  }
                }
              : undefined
          }
          className={getGridRowClassName({
            selected: isRowSelected?.(row),
            interactive: Boolean(onRowClick),
            extra: 'min-w-0 w-full max-w-full overflow-hidden rounded-lg border border-border p-3',
          })}
        >
          {renderItem(row)}
        </div>
      ))}
    </div>
  );
}
