import { GridRowActions, type GridRowAction } from '@/components/grid/grid-row-actions';

export function GridCardActions({ actions }: { actions: GridRowAction[] }) {
  return (
    <div
      className="mt-auto flex min-w-0 items-center"
      data-grid-no-row-select
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <GridRowActions actions={actions} />
    </div>
  );
}
