import type { MouseEvent } from 'react';
import type { ViewMode } from '@/types/view-mode';
import type { GridColumnDef } from '@/hooks/use-grid-columns';
import type { GridRowAction } from '@/components/grid/grid-row-actions';
import { DataView, type GridInfiniteScrollConfig } from '@/components/grid/data-view';
import { GridCardsView, GridListView } from '@/components/grid/grid-cards-view';
import { GridColumnCard } from '@/components/grid/grid-column-card';
import { GridTable } from '@/components/grid/grid-table';
import type { GridColumnFilterDef } from '@/hooks/use-grid-filters';
import type { SortDirection } from '@/hooks/use-grid';

type GridColumnDataViewProps<T> = {
  viewMode: ViewMode;
  columns: GridColumnDef<T>[];
  data: T[];
  cardData?: T[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  titleColumnId?: string;
  getRowActions?: (row: T) => GridRowAction[];
  infiniteScroll?: GridInfiniteScrollConfig;
  sort?: string | null;
  sortDir?: SortDirection;
  onSort?: (sortKey: string) => void;
  onColumnOrderChange?: (order: string[]) => void;
  getRowClassName?: (row: T) => string;
  isRowSelected?: (row: T) => boolean;
  columnFilters?: Record<string, string>;
  onColumnFilterChange?: (filterKey: string, value: string) => void;
  onDateRangeFilterChange?: (filterKey: string, from: string, to: string) => void;
  onColumnFilterClear?: (filter: GridColumnFilterDef) => void;
  onRowClick?: (row: T, event: MouseEvent<HTMLTableRowElement>) => void;
  onRowDoubleClick?: (row: T, event: MouseEvent<HTMLTableRowElement>) => void;
  skeletonRows?: number;
};

export function GridColumnDataView<T>({
  viewMode,
  columns,
  data,
  cardData,
  getRowKey,
  loading = false,
  isEmpty,
  emptyMessage,
  titleColumnId,
  getRowActions,
  infiniteScroll,
  sort,
  sortDir,
  onSort,
  onColumnOrderChange,
  getRowClassName,
  isRowSelected,
  columnFilters,
  onColumnFilterChange,
  onDateRangeFilterChange,
  onColumnFilterClear,
  onRowClick,
  onRowDoubleClick,
  skeletonRows,
}: GridColumnDataViewProps<T>) {
  const resolvedCardData = cardData ?? data;
  const resolvedEmpty = isEmpty ?? (!loading && data.length === 0);

  const renderCard = (row: T) => (
    <GridColumnCard
      row={row}
      columns={columns}
      titleColumnId={titleColumnId}
      actions={getRowActions?.(row)}
    />
  );

  return (
    <DataView
      viewMode={viewMode}
      loading={loading}
      isEmpty={resolvedEmpty}
      emptyMessage={emptyMessage}
      infiniteScroll={infiniteScroll}
      tableView={(
        <GridTable
          columns={columns}
          data={data}
          getRowKey={getRowKey}
          loading={loading}
          emptyMessage={emptyMessage}
          skeletonRows={skeletonRows}
          sort={sort}
          sortDir={sortDir}
          onSort={onSort}
          onColumnOrderChange={onColumnOrderChange}
          getRowClassName={getRowClassName}
          isRowSelected={isRowSelected}
          columnFilters={columnFilters}
          onColumnFilterChange={onColumnFilterChange}
          onDateRangeFilterChange={onDateRangeFilterChange}
          onColumnFilterClear={onColumnFilterClear}
          onRowClick={onRowClick}
          onRowDoubleClick={onRowDoubleClick}
        />
      )}
      listView={(
        <GridListView
          data={resolvedCardData}
          getRowKey={(row) => String(getRowKey(row))}
          isRowSelected={isRowSelected}
          onRowClick={onRowClick}
          onRowDoubleClick={onRowDoubleClick}
          renderItem={renderCard}
        />
      )}
      cardView={(
        <GridCardsView
          data={resolvedCardData}
          getRowKey={(row) => String(getRowKey(row))}
          isRowSelected={isRowSelected}
          onRowClick={onRowClick}
          onRowDoubleClick={onRowDoubleClick}
          renderCard={renderCard}
        />
      )}
    />
  );
}
