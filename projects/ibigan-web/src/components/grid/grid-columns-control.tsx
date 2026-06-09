import { useMemo } from 'react';
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
import { Columns3, GripVertical, RotateCcw } from 'lucide-react';
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
  isCustomized?: boolean;
  onOrderChange: (order: string[]) => void;
  onToggleVisibility: (columnId: string) => void;
  onResetDefault?: () => void;
}

function SortableColumnItem({
  id,
  label,
  visible,
  onToggle,
}: {
  id: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-center gap-2 rounded-md border border-border bg-background px-2 py-1.5',
        isDragging && 'opacity-60',
      )}
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
        <Checkbox checked={visible} onCheckedChange={onToggle} />
        <span>{label}</span>
      </label>
    </div>
  );
}

export function GridColumnsControl<T>({
  columns,
  order,
  hidden,
  isCustomized = false,
  onOrderChange,
  onToggleVisibility,
  onResetDefault,
}: GridColumnsControlProps<T>) {
  const manageableIds = useMemo(
    () =>
      columns
        .filter((column) => column.pinned !== 'start' && column.hideable !== false)
        .map((column) => column.id),
    [columns],
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
      <PopoverContent align="start" className="w-64 p-3">
        <p className="mb-3 text-sm font-medium">Colunas</p>

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
                    onToggle={() => onToggleVisibility(columnId)}
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
