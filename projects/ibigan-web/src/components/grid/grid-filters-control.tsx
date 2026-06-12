import { Filter, Search, X } from 'lucide-react';
import type { ComponentProps } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { GridFilterBadge } from '@/components/grid/grid-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { ToolbarTooltip } from '@/components/grid/toolbar-tooltip';
import {
  GridColumnFiltersPanel,
  type GridColumnFiltersConfig,
} from '@/components/grid/grid-column-filters-panel';

export interface GridActiveFilter {
  id: string;
  label: string;
  value: string;
  onRemove?: () => void;
}

export type { GridColumnFiltersConfig };

export interface GridFiltersControlProps {
  filters: GridActiveFilter[];
  onClearAll?: () => void;
  columnFilters?: GridColumnFiltersConfig;
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
}

function FiltersTriggerButton({
  hasFilters,
  isMobile,
  label,
  className,
  ...props
}: ComponentProps<typeof Button> & {
  hasFilters: boolean;
  isMobile: boolean;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      mode={isMobile ? 'icon' : 'default'}
      aria-label={label}
      className={cn(
        'relative shrink-0',
        isMobile ? 'size-8' : 'h-8 gap-1.5 px-2 text-xs font-medium',
        hasFilters && 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
        className,
      )}
      {...props}
    >
      <Filter className="size-3.5 shrink-0" />
      {!isMobile && label}
      {hasFilters && (
        <span className="absolute right-1 top-1 size-1.5 rounded-full bg-primary" />
      )}
    </Button>
  );
}

function MobileFiltersSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative w-full min-w-0">
      <Search className="pointer-events-none absolute left-2 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-9 w-full min-w-0 pl-7 text-sm"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          mode="icon"
          className="absolute right-0 top-1/2 size-7 -translate-y-1/2"
          onClick={() => onChange('')}
        >
          <X className="size-3" />
        </Button>
      )}
    </div>
  );
}

function AppliedFiltersSection({
  filters,
  onClearAll,
  showClearAll = true,
}: {
  filters: GridActiveFilter[];
  onClearAll?: () => void;
  showClearAll?: boolean;
}) {
  const { t } = useTranslation();
  const hasFilters = filters.length > 0;

  if (!hasFilters) {
    return (
      <p className="text-sm text-muted-foreground">{t('grid.no_filters')}</p>
    );
  }

  return (
    <section className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {t('grid.filters_applied')}
      </p>
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <GridFilterBadge
            key={filter.id}
            variant="primary"
            removeLabel={t('grid.remove_filter', { label: filter.label })}
            onRemove={filter.onRemove}
            className="max-w-full"
          >
            <span className="truncate">
              <span className="text-muted-foreground">{filter.label}:</span>{' '}
              {filter.value}
            </span>
          </GridFilterBadge>
        ))}
      </div>
      {showClearAll && onClearAll && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-full"
          onClick={onClearAll}
        >
          {t('grid.clear_filters')}
        </Button>
      )}
    </section>
  );
}

function AppliedFiltersPopoverContent({
  filters,
  onClearAll,
}: {
  filters: GridActiveFilter[];
  onClearAll?: () => void;
}) {
  const { t } = useTranslation();
  const hasFilters = filters.length > 0;

  return (
    <>
      <p className="mb-3 text-sm font-medium">{t('grid.filters_applied')}</p>

      {hasFilters ? (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <GridFilterBadge
                key={filter.id}
                variant="primary"
                removeLabel={t('grid.remove_filter', { label: filter.label })}
                onRemove={filter.onRemove}
                className="max-w-full"
              >
                <span className="truncate">
                  <span className="text-muted-foreground">{filter.label}:</span>{' '}
                  {filter.value}
                </span>
              </GridFilterBadge>
            ))}
          </div>

          {onClearAll && (
            <ToolbarTooltip
              content={t('grid.tooltip.clear_filters')}
              className="mt-1 flex w-full"
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full justify-center px-2"
                onClick={onClearAll}
              >
                {t('grid.clear_filters')}
              </Button>
            </ToolbarTooltip>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t('grid.no_filters')}</p>
      )}
    </>
  );
}

function MobileFiltersSheetContent({
  filters,
  onClearAll,
  columnFilters,
  hasColumnFilterInputs,
  search,
  onSearch,
  searchPlaceholder,
}: {
  filters: GridActiveFilter[];
  onClearAll?: () => void;
  columnFilters?: GridColumnFiltersConfig;
  hasColumnFilterInputs: boolean;
  search?: string;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
}) {
  const { t } = useTranslation();
  const hasAnyFilters = filters.length > 0 || Boolean(search?.trim());

  return (
    <div className="flex flex-col gap-5">
      {onSearch && (
        <section className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t('grid.global_search')}
          </p>
          <MobileFiltersSearch
            value={search ?? ''}
            onChange={onSearch}
            placeholder={searchPlaceholder ?? t('grid.search_placeholder')}
          />
        </section>
      )}

      {hasColumnFilterInputs && columnFilters ? (
        <GridColumnFiltersPanel
          columnFilters={columnFilters}
          appliedFilters={filters}
          onClearAll={onClearAll}
          showAppliedClearAll={false}
        />
      ) : (
        <AppliedFiltersSection
          filters={filters}
          onClearAll={onClearAll}
          showClearAll={false}
        />
      )}

      {hasAnyFilters && onClearAll && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full"
          onClick={onClearAll}
        >
          {t('grid.clear_filters')}
        </Button>
      )}
    </div>
  );
}

export function GridFiltersControl({
  filters,
  onClearAll,
  columnFilters,
  search,
  onSearch,
  searchPlaceholder,
}: GridFiltersControlProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const hasColumnFilterInputs = useMemo(
    () => Boolean(columnFilters?.columns.some((column) => column.filter)),
    [columnFilters?.columns],
  );

  const hasAnyFilters = filters.length > 0 || Boolean(search?.trim());
  const showMobileSheet = isMobile && (
    hasColumnFilterInputs
    || Boolean(onSearch)
    || Boolean(columnFilters)
  );

  if (showMobileSheet) {
    return (
      <Sheet>
        <ToolbarTooltip content={t('grid.tooltip.filters')}>
          <SheetTrigger asChild>
            <FiltersTriggerButton
              hasFilters={hasAnyFilters}
              isMobile={isMobile}
              label={t('grid.filters')}
            />
          </SheetTrigger>
        </ToolbarTooltip>
        <SheetContent
          side="bottom"
          className="grid-filters-sheet rounded-t-2xl border-t"
        >
          <SheetHeader className="grid-filters-sheet-header border-b border-border px-4 py-3 pe-12 text-start">
            <SheetTitle>{t('grid.filters')}</SheetTitle>
          </SheetHeader>
          <SheetBody className="grid-filters-sheet-body px-4 py-4">
            <MobileFiltersSheetContent
              filters={filters}
              onClearAll={onClearAll}
              columnFilters={columnFilters}
              hasColumnFilterInputs={hasColumnFilterInputs}
              search={search}
              onSearch={onSearch}
              searchPlaceholder={searchPlaceholder}
            />
          </SheetBody>
          <SheetFooter className="grid-filters-sheet-footer border-t border-border px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <SheetClose asChild>
              <Button type="button" variant="primary" className="w-full">
                {t('grid.apply')}
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <ToolbarTooltip content={t('grid.tooltip.filters')}>
        <PopoverTrigger asChild>
          <FiltersTriggerButton
            hasFilters={hasAnyFilters}
            isMobile={isMobile}
            label={t('grid.filters')}
          />
        </PopoverTrigger>
      </ToolbarTooltip>
      <PopoverContent align="start" className="w-72 p-3">
        <AppliedFiltersPopoverContent filters={filters} onClearAll={onClearAll} />
      </PopoverContent>
    </Popover>
  );
}
