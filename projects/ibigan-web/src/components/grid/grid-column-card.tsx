import type { ReactNode } from 'react';
import { GridCardActions } from '@/components/grid/grid-card-actions';
import type { GridRowAction } from '@/components/grid/grid-row-actions';
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
  const contentColumns = columns.filter(
    (column) => !CARD_SKIP_COLUMNS.has(column.id) && column.id !== 'actions' && column.id !== resolvedTitleId,
  );
  const actionsColumn = columns.find((column) => column.id === 'actions');
  const titleColumn = columns.find((column) => column.id === resolvedTitleId);
  const titleContent = titleColumn?.render(row);

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      {titleContent ? (
        <div className="min-w-0 font-medium [&_*]:truncate">{titleContent as ReactNode}</div>
      ) : null}

      {contentColumns.length > 0 ? (
        <dl className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          {contentColumns.map((column) => (
            <div key={column.id} className="min-w-0">
              <dt className="text-xs text-muted-foreground">
                {resolveGridColumnLabel(column.id, column.label)}
              </dt>
              <dd className="text-sm break-words">{column.render(row)}</dd>
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
