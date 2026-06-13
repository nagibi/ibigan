import { useCallback, type MouseEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical } from 'lucide-react';
import { GridColumnFilter } from '@/components/grid/grid-column-filter';
import {
  dateRangeFilterFromKey,
  dateRangeFilterToKey,
  type GridColumnFilterDef,
} from '@/hooks/use-grid-filters';
import type { GridColumnDef } from '@/hooks/use-grid-columns';
import type { SortDirection } from '@/hooks/use-grid';
import { useIsMobile } from '@/hooks/use-mobile';
import { GridTableScroll } from '@/components/grid/grid-table-scroll';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getGridColumnCellClassName,
  isGridCenteredColumn,
  resolveGridColumnLabel,
} from '@/lib/grid-column-presets';
import { useGridRowClickHandler } from '@/lib/grid-row-interaction';
import { cn } from '@/lib/utils';
import i18n from '@/i18n/i18next';
import { ToolbarTooltip } from '@/components/grid/toolbar-tooltip';

export function getGridRowClassName(options?: {
  selected?: boolean;
  interactive?: boolean;
  extra?: string;
}) {
  const { selected = false, interactive = false, extra } = options ?? {};

  return cn(
    extra,
    interactive && 'cursor-pointer',
    selected
      ? 'bg-primary/10 [&:has(td):hover]:bg-primary/15 data-[state=selected]:bg-primary/10'
      : interactive && '[&:has(td):hover]:bg-muted/40',
  );
}

interface GridTableProps<T> {
  columns: GridColumnDef<T>[];
  data: T[];
  getRowKey: (row: T) => string | number;
  loading?: boolean;
  emptyMessage?: string;
  skeletonRows?: number;
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
  maxBodyHeight?: string;
}

function getSortTooltip(
  isActive: boolean,
  sortDir: SortDirection | undefined,
  t: (key: string) => string,
) {
  if (!isActive) return t('grid.tooltip.sort_inactive');
  return sortDir === 'asc'
    ? t('grid.tooltip.sort_asc')
    : t('grid.tooltip.sort_desc');
}

function SortableHeaderCell<T>({
  column,
  sort,
  sortDir,
  onSort,
  enableColumnReorder,
}: {
  column: GridColumnDef<T>;
  sort?: string | null;
  sortDir?: SortDirection;
  onSort?: (sortKey: string) => void;
  enableColumnReorder: boolean;
}) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
    disabled: !enableColumnReorder,
  });

  const sortKey = column.sortKey ?? column.id;
  const isActive = sort === sortKey;
  const SortIcon = isActive
    ? sortDir === 'asc'
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'overflow-visible whitespace-nowrap',
        getGridColumnCellClassName(column.id, column.className),
        enableColumnReorder && 'min-w-[6.5rem]',
        isDragging && 'opacity-60',
      )}
    >
      <div className={cn(
        'flex items-center gap-1',
        isGridCenteredColumn(column.id) && 'justify-center',
      )}>
        {enableColumnReorder ? (
          <ToolbarTooltip content={t('grid.tooltip.drag_column')}>
            <button
              type="button"
              className="shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing"
              {...attributes}
              {...listeners}
            >
              <GripVertical className="size-3.5" />
            </button>
          </ToolbarTooltip>
        ) : null}
        {column.sortable ? (
          <ToolbarTooltip content={getSortTooltip(isActive, sortDir, t)}>
            <button
              type="button"
              className="flex min-w-0 items-center gap-1 text-left text-xs font-medium hover:text-foreground"
              onClick={() => onSort?.(sortKey)}
            >
              {resolveGridColumnLabel(column.id, column.label)}
              <SortIcon className={cn('size-3.5 shrink-0', isActive ? 'text-foreground' : 'text-muted-foreground')} />
            </button>
          </ToolbarTooltip>
        ) : (
          <span className="text-xs font-medium">{resolveGridColumnLabel(column.id, column.label)}</span>
        )}
      </div>
    </TableHead>
  );
}

function PinnedHeaderCell<T>({
  column,
  sort,
  sortDir,
  onSort,
}: {
  column: GridColumnDef<T>;
  sort?: string | null;
  sortDir?: SortDirection;
  onSort?: (sortKey: string) => void;
}) {
  const { t } = useTranslation();
  const sortKey = column.sortKey ?? column.id;
  const isActive = sort === sortKey;
  const SortIcon = isActive
    ? sortDir === 'asc'
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead className={cn(
      'overflow-visible whitespace-nowrap',
      getGridColumnCellClassName(column.id, column.className),
      column.sortable && 'min-w-[4.5rem]',
    )}>
      {column.sortable ? (
        <ToolbarTooltip content={getSortTooltip(isActive, sortDir, t)}>
          <button
            type="button"
            className={cn(
              'flex items-center gap-1 text-xs font-medium hover:text-foreground',
              isGridCenteredColumn(column.id) ? 'justify-center w-full' : 'text-left',
            )}
            onClick={() => onSort?.(sortKey)}
          >
            {resolveGridColumnLabel(column.id, column.label)}
            <SortIcon className={cn('size-3.5', isActive ? 'text-foreground' : 'text-muted-foreground')} />
          </button>
        </ToolbarTooltip>
      ) : (
        <span className={cn(
          'text-xs font-medium',
          isGridCenteredColumn(column.id) && 'flex justify-center',
        )}
        >
          {resolveGridColumnLabel(column.id, column.label)}
        </span>
      )}
    </TableHead>
  );
}

export interface GridTableHeaderProps<T> {
  columns: GridColumnDef<T>[];
  sort?: string | null;
  sortDir?: SortDirection;
  onSort?: (sortKey: string) => void;
  enableColumnReorder?: boolean;
  columnFilters?: Record<string, string>;
  onColumnFilterChange?: (filterKey: string, value: string) => void;
  onDateRangeFilterChange?: (filterKey: string, from: string, to: string) => void;
  onColumnFilterClear?: (filter: GridColumnFilterDef) => void;
  className?: string;
}

export function GridTableHeader<T>({
  columns,
  sort,
  sortDir,
  onSort,
  enableColumnReorder = true,
  columnFilters = {},
  onColumnFilterChange,
  onDateRangeFilterChange,
  onColumnFilterClear,
  className,
}: GridTableHeaderProps<T>) {
  const isMobile = useIsMobile();
  const draggableColumns = columns.filter((column) => !column.pinned);
  const draggableIds = draggableColumns.map((column) => column.id);
  const hasFilterRow = columns.some((column) => column.filter);
  const showColumnReorder = enableColumnReorder && !isMobile;

  return (
    <TableHeader
      className={cn(
        'sticky top-0 z-10 bg-card',
        hasFilterRow
          ? '[&_tr]:border-0 [&_tr:last-child]:border-b'
          : 'shadow-[inset_0_-1px_0_0_var(--border)]',
        className,
      )}
    >
      <TableRow className="border-0 bg-card hover:bg-card [&_th]:bg-card">
        <SortableContext items={draggableIds} strategy={horizontalListSortingStrategy}>
          {columns.map((column) =>
            column.pinned ? (
              <PinnedHeaderCell
                key={column.id}
                column={column}
                sort={sort}
                sortDir={sortDir}
                onSort={onSort}
              />
            ) : (
              <SortableHeaderCell
                key={column.id}
                column={column}
                sort={sort}
                sortDir={sortDir}
                onSort={onSort}
                enableColumnReorder={showColumnReorder}
              />
            ),
          )}
        </SortableContext>
      </TableRow>
      {hasFilterRow && !isMobile && (
        <TableRow className="bg-muted hover:bg-muted [&_th]:bg-muted [&_th]:align-middle">
          {columns.map((column) => (
            <TableHead
              key={`filter-${column.id}`}
              className={cn(
                'overflow-visible bg-muted px-2 py-1.5',
                getGridColumnCellClassName(column.id, column.className),
              )}
            >
              {column.filter && (onColumnFilterChange || onDateRangeFilterChange) ? (
                <GridColumnFilter
                  filter={column.filter}
                  value={columnFilters[column.filter.filterKey] ?? ''}
                  onChange={(value) => onColumnFilterChange?.(column.filter!.filterKey, value)}
                  dateRangeFrom={columnFilters[dateRangeFilterFromKey(column.filter.filterKey)] ?? ''}
                  dateRangeTo={columnFilters[dateRangeFilterToKey(column.filter.filterKey)] ?? ''}
                  onDateRangeChange={(from, to) =>
                    onDateRangeFilterChange?.(column.filter!.filterKey, from, to)
                  }
                  onClear={() => onColumnFilterClear?.(column.filter!)}
                />
              ) : null}
            </TableHead>
          ))}
        </TableRow>
      )}
    </TableHeader>
  );
}

export function GridTableColumnDndContext<T>({
  columns,
  onColumnOrderChange,
  children,
}: {
  columns: GridColumnDef<T>[];
  onColumnOrderChange?: (order: string[]) => void;
  children: ReactNode;
}) {
  const draggableColumns = columns.filter((column) => !column.pinned);
  const draggableIds = draggableColumns.map((column) => column.id);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !onColumnOrderChange) return;

    const oldIndex = draggableIds.indexOf(String(active.id));
    const newIndex = draggableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(draggableIds, oldIndex, newIndex);
    const pinned = columns.filter((column) => column.pinned).map((column) => column.id);
    onColumnOrderChange([...pinned, ...reordered]);
  }

  if (!onColumnOrderChange) {
    return children;
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {children}
    </DndContext>
  );
}

export function GridTable<T>({
  columns,
  data,
  getRowKey,
  loading = false,
  emptyMessage = i18n.t('grid.empty'),
  skeletonRows = 5,
  sort,
  sortDir,
  onSort,
  onColumnOrderChange,
  getRowClassName,
  isRowSelected,
  columnFilters = {},
  onColumnFilterChange,
  onDateRangeFilterChange,
  onColumnFilterClear,
  onRowClick,
  onRowDoubleClick,
  maxBodyHeight,
}: GridTableProps<T>) {
  const isRowInteractive = Boolean(onRowClick || onRowDoubleClick);
  const handleRowClick = useGridRowClickHandler({
    getRowKey,
    onRowClick,
    onRowDoubleClick,
  });

  let body: ReactNode;

  if (loading) {
    body = Array.from({ length: skeletonRows }).map((_, rowIndex) => (
      <TableRow key={`skeleton-${rowIndex}`}>
        {columns.map((column) => (
          <TableCell key={column.id} className={getGridColumnCellClassName(column.id, column.className)}>
            <div className="h-4 animate-pulse rounded bg-muted" />
          </TableCell>
        ))}
      </TableRow>
    ));
  } else if (data.length === 0) {
    body = (
      <TableRow>
        <TableCell colSpan={columns.length} className="py-8 text-center text-muted-foreground">
          {emptyMessage}
        </TableCell>
      </TableRow>
    );
  } else {
    body = data.map((row) => {
      const selected = isRowSelected?.(row) ?? false;

      return (
      <TableRow
        key={getRowKey(row)}
        data-state={selected ? 'selected' : undefined}
        className={getGridRowClassName({
          selected,
          interactive: isRowInteractive,
          extra: getRowClassName?.(row),
        })}
        onClick={(event) => handleRowClick(row, event)}
      >
        {columns.map((column) => (
          <TableCell
            key={column.id}
            className={cn('whitespace-nowrap', getGridColumnCellClassName(column.id, column.className))}
          >
            {isGridCenteredColumn(column.id) ? (
              <div className="flex justify-center">{column.render(row)}</div>
            ) : (
              column.render(row)
            )}
          </TableCell>
        ))}
      </TableRow>
      );
    });
  }

  return (
    <GridTableScroll maxHeight={maxBodyHeight}>
      <GridTableColumnDndContext columns={columns} onColumnOrderChange={onColumnOrderChange}>
        <table className="w-full min-w-full table-fixed caption-bottom text-sm text-foreground">
          <GridTableHeader
            columns={columns}
            sort={sort}
            sortDir={sortDir}
            onSort={onSort}
            enableColumnReorder={Boolean(onColumnOrderChange)}
            columnFilters={columnFilters}
            onColumnFilterChange={onColumnFilterChange}
            onDateRangeFilterChange={onDateRangeFilterChange}
            onColumnFilterClear={onColumnFilterClear}
          />
          <TableBody>{body}</TableBody>
        </table>
      </GridTableColumnDndContext>
    </GridTableScroll>
  );
}
