import { useMemo, type ReactNode } from 'react';
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Columns3, GripVertical, Lock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type { GridColumnDef } from '@/hooks/use-grid-columns';
import { cn } from '@/lib/utils';

interface GridColumnsControlProps<T> {
  columns: GridColumnDef<T>[];
  order: string[];
  hidden: string[];
  visibleCount?: number;
  totalCount?: number;
  isCustomized?: boolean;
  onOrderChange: (order: string[]) => void;
  onSetVisibility: (columnId: string, visible: boolean) => void;
  canHideColumn?: (columnId: string) => boolean;
  onShowAll?: () => void;
  onHideAll?: () => void;
  onResetDefault?: () => void;
}

function ColumnItem({
  label,
  visible,
  locked,
  dragHandle,
  onSetVisibility,
}: {
  label: string;
  visible: boolean;
  locked?: boolean;
  dragHandle?: ReactNode;
  onSetVisibility: (visible: boolean) => void;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5',
        locked && 'bg-muted/30',
      )}
    >
      {locked ? (
        <span className="flex size-7 items-center justify-center text-muted-foreground">
          <Lock className="size-3.5" />
        </span>
      ) : (
        dragHandle
      )}
      <label
        className={cn(
          'flex flex-1 items-center gap-2 text-sm',
          locked ? 'cursor-default text-muted-foreground' : 'cursor-pointer',
        )}
      >
        <Checkbox
          checked={visible}
          disabled={locked}
          onCheckedChange={(checked) => onSetVisibility(checked === true)}
        />
        <span>{label || '(sem título)'}</span>
      </label>
    </div>
  );
}

function SortableColumnItem({
  id,
  label,
  visible,
  locked,
  onSetVisibility,
}: {
  id: string;
  label: string;
  visible: boolean;
  locked?: boolean;
  onSetVisibility: (visible: boolean) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: locked,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(isDragging && 'opacity-60')}
    >
      <ColumnItem
        label={label}
        visible={visible}
        locked={locked}
        onSetVisibility={onSetVisibility}
        dragHandle={
          <button
            type="button"
            className="flex size-7 cursor-grab items-center justify-center text-muted-foreground active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="size-4" />
          </button>
        }
      />
    </div>
  );
}

export function GridColumnsControl<T>({
  columns,
  order,
  hidden,
  visibleCount,
  totalCount,
  isCustomized = false,
  onOrderChange,
  onSetVisibility,
  canHideColumn,
  onShowAll,
  onHideAll,
  onResetDefault,
}: GridColumnsControlProps<T>) {
  const pinnedColumns = useMemo(
    () => columns.filter((column) => column.pinned === 'start'),
    [columns],
  );

  const manageableColumns = useMemo(
    () => columns.filter((column) => column.pinned !== 'start'),
    [columns],
  );

  const manageableIds = useMemo(
    () => manageableColumns.map((column) => column.id),
    [manageableColumns],
  );

  const orderedManageableIds = useMemo(() => {
    const idSet = new Set(manageableIds);
    const fromOrder = order.filter((id) => idSet.has(id));
    const missing = manageableIds.filter((id) => !fromOrder.includes(id));
    return [...fromOrder, ...missing];
  }, [manageableIds, order]);

  const columnMap = useMemo(
    () => new Map(columns.map((column) => [column.id, column])),
    [columns],
  );

  const resolvedVisibleCount = visibleCount ?? manageableColumns.filter((c) => !hidden.includes(c.id)).length;
  const resolvedTotalCount = totalCount ?? manageableColumns.length;
  const hasHiddenColumns = hidden.length > 0;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = orderedManageableIds.indexOf(String(active.id));
    const newIndex = orderedManageableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;

    const reorderedManageable = arrayMove(orderedManageableIds, oldIndex, newIndex);
    const pinned = order.filter((id) => !manageableIds.includes(id));
    onOrderChange([...pinned, ...reorderedManageable]);
  }

  function isColumnLocked(columnId: string) {
    if (canHideColumn) return !canHideColumn(columnId);
    const column = columnMap.get(columnId);
    return column?.hideable === false || Boolean(column?.pinned);
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'relative h-8 gap-1.5 px-2 text-xs font-medium',
            isCustomized && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
          )}
        >
          <Columns3 className="size-3.5 shrink-0" />
          Colunas
          {isCustomized && (
            <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-3">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-medium">Colunas</p>
            <p className="text-xs text-muted-foreground">
              {resolvedVisibleCount} de {resolvedTotalCount} visíveis
            </p>
          </div>
        </div>

        {(onShowAll || onHideAll) && (
          <div className="mb-3 grid grid-cols-2 gap-2">
            {onShowAll && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={!hasHiddenColumns}
                onClick={onShowAll}
              >
                Exibir todas
              </Button>
            )}
            {onHideAll && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8"
                disabled={resolvedVisibleCount <= 1}
                onClick={onHideAll}
              >
                Ocultar todas
              </Button>
            )}
          </div>
        )}

        {pinnedColumns.length > 0 && (
          <div className="mb-3 flex flex-col gap-2">
            {pinnedColumns.map((column) => (
              <ColumnItem
                key={column.id}
                label={column.label}
                visible
                locked
                onSetVisibility={() => undefined}
              />
            ))}
          </div>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orderedManageableIds} strategy={verticalListSortingStrategy}>
            <div className="flex max-h-72 flex-col gap-2 overflow-y-auto">
              {orderedManageableIds.map((columnId) => {
                const column = columnMap.get(columnId);
                if (!column) return null;

                return (
                  <SortableColumnItem
                    key={columnId}
                    id={columnId}
                    label={column.label}
                    visible={!hidden.includes(columnId)}
                    locked={isColumnLocked(columnId)}
                    onSetVisibility={(visible) => onSetVisibility(columnId, visible)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {onResetDefault && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            disabled={!isCustomized}
            onClick={onResetDefault}
          >
            <RotateCcw className="size-3.5" />
            Restaurar padrão
          </Button>
        )}
      </PopoverContent>
    </Popover>
  );
}
