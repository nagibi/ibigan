import type { ReactNode } from 'react';
import { GridCardActions } from '@/components/grid/grid-card-actions';
import type { GridRowAction } from '@/components/grid/grid-row-actions';
import { isGridStatusColumn } from '@/components/grid/grid-status-switch';
import type { GridColumnDef } from '@/hooks/use-grid-columns';
import { resolveGridColumnLabel } from '@/lib/grid-column-presets';

const CARD_SKIP_COLUMNS = new Set(['select']);

export function resolveGridCardTitleColumnId<T>(columns: GridColumnDef<T>[]) {
  const candidates = columns.filter((column) => !CARD_SKIP_COLUMNS.has(column.id) && column.id !== 'actions');

  const preferred = candidates.find((column) =>
    ['name', 'title', 'template_name', 'slug', 'subject', 'email'].includes(column.id),
  );

  if (preferred) return preferred.id;

  return candidates.find((column) => column.id !== 'id')?.id ?? candidates[0]?.id;
}

export function GridColumnCard<T>({
  row,
  columns,
  titleColumnId,
  actions,
}: {
  row: T;
  columns: GridColumnDef<T>[];
  titleColumnId?: string;
  actions?: GridRowAction[];
}) {
  const resolvedTitleId = titleColumnId ?? resolveGridCardTitleColumnId(columns);
  const statusColumn = columns.find((column) => isGridStatusColumn(column.id));
  const contentColumns = columns.filter(
    (column) =>
      !CARD_SKIP_COLUMNS.has(column.id)
      && column.id !== 'actions'
      && column.id !== resolvedTitleId
      && !isGridStatusColumn(column.id),
  );
  const actionsColumn = columns.find((column) => column.id === 'actions');
  const titleColumn = columns.find((column) => column.id === resolvedTitleId);
  const titleContent = titleColumn?.render(row);

  return (
    <div className="flex h-full flex-col gap-4 p-4 max-xl:gap-4">
      {titleContent || statusColumn ? (
        <div className="flex min-w-0 items-start gap-3">
          {titleContent ? (
            <div className="min-w-0 flex-1 leading-snug font-normal [&_*]:font-normal [&_*]:truncate">
              {titleContent as ReactNode}
            </div>
          ) : (
            <div className="min-w-0 flex-1" />
          )}
          {statusColumn ? (
            <div
              className="shrink-0"
              data-grid-no-row-select
              onClick={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              {statusColumn.render(row)}
            </div>
          ) : null}
        </div>
      ) : null}

      {contentColumns.length > 0 ? (
        <dl className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 max-xl:gap-y-4">
          {contentColumns.map((column) => (
            <div key={column.id} className="min-w-0 space-y-1">
              <dt className="text-xs text-muted-foreground">
                {resolveGridColumnLabel(column.id, column.label)}
              </dt>
              <dd className="break-words text-sm font-normal [&_*]:font-normal">{column.render(row)}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {actions?.length ? (
        <GridCardActions actions={actions} />
      ) : actionsColumn ? (
        <div
          className="mt-auto"
          data-grid-no-row-select
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          {actionsColumn.render(row)}
        </div>
      ) : null}
    </div>
  );
}
