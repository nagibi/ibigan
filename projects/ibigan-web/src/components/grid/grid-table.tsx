import { useCallback, useRef, type MouseEvent, type ReactNode } from 'react';
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
} from '@/hooks/use-grid-filters';
import type { GridColumnDef } from '@/hooks/use-grid-columns';
import type { SortDirection } from '@/hooks/use-grid';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

const ROW_INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, label, [role="switch"], [role="checkbox"], [data-grid-no-row-select]';

const ROW_DOUBLE_CLICK_MS = 400;

function isRowInteractiveTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && Boolean(target.closest(ROW_INTERACTIVE_SELECTOR));
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
  columnFilters?: Record<string, string>;
  onColumnFilterChange?: (filterKey: string, value: string) => void;
  onDateRangeFilterChange?: (filterKey: string, from: string, to: string) => void;
  onRowClick?: (row: T, event: MouseEvent<HTMLTableRowElement>) => void;
  onRowDoubleClick?: (row: T, event: MouseEvent<HTMLTableRowElement>) => void;
}

function SortableHeaderCell<T>({
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
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
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
      className={cn(column.className, isDragging && 'opacity-60')}
    >
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="cursor-grab text-muted-foreground active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
        {column.sortable ? (
          <button
            type="button"
            className="flex items-center gap-1 text-left text-xs font-medium hover:text-foreground"
            onClick={() => onSort?.(sortKey)}
          >
            {column.label}
            <SortIcon className={cn('size-3.5', isActive ? 'text-foreground' : 'text-muted-foreground')} />
          </button>
        ) : (
          <span className="text-xs font-medium">{column.label}</span>
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
  const sortKey = column.sortKey ?? column.id;
  const isActive = sort === sortKey;
  const SortIcon = isActive
    ? sortDir === 'asc'
      ? ArrowUp
      : ArrowDown
    : ArrowUpDown;

  return (
    <TableHead className={column.className}>
      {column.sortable ? (
        <button
          type="button"
          className="flex items-center gap-1 text-left text-xs font-medium hover:text-foreground"
          onClick={() => onSort?.(sortKey)}
        >
          {column.label}
          <SortIcon className={cn('size-3.5', isActive ? 'text-foreground' : 'text-muted-foreground')} />
        </button>
      ) : (
        <span className="text-xs font-medium">{column.label}</span>
      )}
    </TableHead>
  );
}

export function GridTable<T>({
  columns,
  data,
  getRowKey,
  loading = false,
  emptyMessage = 'Nenhum registro encontrado.',
  skeletonRows = 5,
  sort,
  sortDir,
  onSort,
  onColumnOrderChange,
  getRowClassName,
  columnFilters = {},
  onColumnFilterChange,
  onDateRangeFilterChange,
  onRowClick,
  onRowDoubleClick,
}: GridTableProps<T>) {
  const isRowInteractive = Boolean(onRowClick || onRowDoubleClick);
  const lastClickRef = useRef<{ rowKey: string | number; time: number } | null>(null);

  const handleRowClick = useCallback(
    (row: T, event: MouseEvent<HTMLTableRowElement>) => {
      if (isRowInteractiveTarget(event.target)) return;
      if (!onRowClick && !onRowDoubleClick) return;

      const rowKey = getRowKey(row);
      const now = Date.now();
      const lastClick = lastClickRef.current;

      if (
        onRowDoubleClick &&
        lastClick &&
        lastClick.rowKey === rowKey &&
        now - lastClick.time <= ROW_DOUBLE_CLICK_MS
      ) {
        lastClickRef.current = null;
        onRowDoubleClick(row, event);
        return;
      }

      lastClickRef.current = { rowKey, time: now };
      onRowClick?.(row, event);
    },
    [getRowKey, onRowClick, onRowDoubleClick],
  );

  const draggableColumns = columns.filter((column) => !column.pinned);
  const draggableIds = draggableColumns.map((column) => column.id);
  const hasFilterRow = columns.some((column) => column.filter);

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

  let body: ReactNode;

  if (loading) {
    body = Array.from({ length: skeletonRows }).map((_, rowIndex) => (
      <TableRow key={`skeleton-${rowIndex}`}>
        {columns.map((column) => (
          <TableCell key={column.id} className={column.className}>
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
    body = data.map((row) => (
      <TableRow
        key={getRowKey(row)}
        className={cn(
          getRowClassName?.(row),
          isRowInteractive && 'cursor-pointer hover:bg-muted/40',
        )}
        onClick={(event) => handleRowClick(row, event)}
      >
        {columns.map((column) => (
          <TableCell key={column.id} className={column.className}>
            {column.render(row)}
          </TableCell>
        ))}
      </TableRow>
    ));
  }

  return (
    <div className="overflow-x-auto">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <Table>
          <TableHeader>
            <TableRow>
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
                    />
                  ),
                )}
              </SortableContext>
            </TableRow>
            {hasFilterRow && (
              <TableRow className="bg-muted/20 hover:bg-muted/20">
                {columns.map((column) => (
                  <TableHead key={`filter-${column.id}`} className="px-2 py-1 align-top">
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
                      />
                    ) : null}
                  </TableHead>
                ))}
              </TableRow>
            )}
          </TableHeader>
          <TableBody>{body}</TableBody>
        </Table>
      </DndContext>
    </div>
  );
}
