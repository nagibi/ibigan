import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Pencil, RefreshCw } from 'lucide-react';
import { useGridToasts } from '@/hooks/use-grid-toasts';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridFilters } from '@/hooks/use-grid-filters';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import {
  buildTranslationCatalog,
  type TranslationCatalogRow,
} from '@/lib/translation-catalog';
import { filterTranslationCatalog } from '@/lib/filter-translation-catalog';
import { getTranslationRowId, getTranslationRowKey } from '@/lib/translation-row-id';
import { useLanguage } from '@/providers/i18n-provider';
import { translationsService } from '@/services/translations.service';
import { useAuthStore } from '@/stores/auth.store';
import { PageBody } from '@/components/common/page-body';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { GridFiltersControl, type GridActiveFilter } from '@/components/grid/grid-filters-control';
import { GridPagination } from '@/components/grid/grid-pagination';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridQuickFilters } from '@/components/grid/grid-quick-filters';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridTable } from '@/components/grid/grid-table';
import {
  GridPanelToolbar,
  GridToolbarButton,
  StandardGridToolbar,
} from '@/components/grid/grid-toolbar';

const GRID_COLUMNS_KEY = 'grid-columns:translations';

type TranslationLocaleQuickFilter = 'all' | 'pt' | 'en';

export function TranslationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reloadTranslations } = useLanguage();
  const gridToasts = useGridToasts();
  const canManage = useAuthStore((state) => state.hasPermission('configuracao-gerenciar'));
  const grid = useGrid({ defaultPerPage: 25 });
  const columnFilters = useGridFilters(() => grid.setPage(1));

  const { data, isFetching, refetch, isError, error } = useQuery({
    queryKey: ['translations-manage'],
    queryFn: () => translationsService.manage({}),
  });

  const overrides = data?.data.result ?? [];

  const catalog = useMemo(
    () => buildTranslationCatalog('all', grid.debouncedSearch, overrides),
    [grid.debouncedSearch, overrides],
  );

  const localeQuickFilter = useMemo<TranslationLocaleQuickFilter>(() => {
    const locale = columnFilters.filters.locale?.trim();
    if (locale === 'pt' || locale === 'en') return locale;
    return 'all';
  }, [columnFilters.filters.locale]);

  const localeQuickFilterCounts = useMemo(() => ({
    all: catalog.length,
    pt: catalog.filter((row) => row.locale === 'pt').length,
    en: catalog.filter((row) => row.locale === 'en').length,
  }), [catalog]);

  const handleLocaleQuickFilterChange = useCallback((value: TranslationLocaleQuickFilter) => {
    if (value === 'all') {
      columnFilters.clearFilter('locale');
    } else {
      columnFilters.setFilter('locale', value);
    }
    grid.clearSelection();
    grid.setPage(1);
  }, [columnFilters, grid]);

  const filteredCatalog = useMemo(
    () => filterTranslationCatalog(catalog, columnFilters.debouncedFilters),
    [catalog, columnFilters.debouncedFilters],
  );

  const sortedCatalog = useMemo(() => {
    if (!grid.sort) return filteredCatalog;

    const direction = grid.sortDir === 'asc' ? 1 : -1;

    return [...filteredCatalog].sort((left, right) => {
      const leftValue = String(left[grid.sort as keyof TranslationCatalogRow] ?? '');
      const rightValue = String(right[grid.sort as keyof TranslationCatalogRow] ?? '');
      return leftValue.localeCompare(rightValue) * direction;
    });
  }, [filteredCatalog, grid.sort, grid.sortDir]);

  const meta = useMemo(() => ({
    current_page: grid.page,
    last_page: Math.max(1, Math.ceil(sortedCatalog.length / grid.perPage)),
    per_page: grid.perPage,
    total: sortedCatalog.length,
  }), [grid.page, grid.perPage, sortedCatalog.length]);

  const paginatedCatalog = useMemo(() => {
    const start = (grid.page - 1) * grid.perPage;
    return sortedCatalog.slice(start, start + grid.perPage);
  }, [grid.page, grid.perPage, sortedCatalog]);

  const rowIds = useMemo(
    () => paginatedCatalog.map((row) => getTranslationRowId(row)),
    [paginatedCatalog],
  );

  const selectedRow = useMemo(() => {
    if (!grid.singleSelection) return null;
    const selectedId = grid.selected[0];
    return paginatedCatalog.find((row) => getTranslationRowId(row) === selectedId) ?? null;
  }, [grid.selected, grid.singleSelection, paginatedCatalog]);

  useEffect(() => {
    grid.setPage(1);
  }, [grid.debouncedSearch, columnFilters.debouncedFilters, grid.setPage]);

  const openCreate = useCallback(() => {
    navigate('/settings/translations/new');
  }, [navigate]);

  const openEdit = useCallback((row: TranslationCatalogRow) => {
    if (row.id) {
      navigate(`/settings/translations/${row.id}`);
      return;
    }

    const params = new URLSearchParams({
      key: row.key,
      locale: row.locale,
    });
    navigate(`/settings/translations/new?${params.toString()}`);
  }, [navigate]);

  const handleEditSelected = useCallback(() => {
    if (!selectedRow) return;
    openEdit(selectedRow);
  }, [openEdit, selectedRow]);

  const localeFilterOptions = useMemo(
    () => [
      { label: 'pt', value: 'pt' },
      { label: 'en', value: 'en' },
    ],
    [],
  );

  const columnDefinitions = useMemo<GridColumnDef<TranslationCatalogRow>[]>(
    () => [
      {
        id: 'key',
        label: t('settings.translations.column_key'),
        sortable: true,
        sortKey: 'key',
        filter: {
          type: 'text',
          filterKey: 'key',
          placeholder: t('settings.translations.column_key'),
        },
        className: 'min-w-[220px]',
        render: (row) => row.key,
      },
      {
        id: 'locale',
        label: t('settings.translations.column_locale'),
        sortable: true,
        sortKey: 'locale',
        filter: {
          type: 'select',
          filterKey: 'locale',
          placeholder: t('common.all'),
          options: localeFilterOptions,
        },
        className: 'min-w-[100px]',
        render: (row) => row.locale,
      },
      {
        id: 'defaultValue',
        label: t('settings.translations.column_default'),
        filter: {
          type: 'text',
          filterKey: 'defaultValue',
          placeholder: t('settings.translations.column_default'),
        },
        className: 'min-w-[220px]',
        render: (row) => (
          <span className="text-muted-foreground">{row.defaultValue}</span>
        ),
      },
      {
        id: 'value',
        label: t('settings.translations.column_value'),
        filter: {
          type: 'text',
          filterKey: 'value',
          placeholder: t('settings.translations.column_value'),
        },
        className: 'min-w-[220px]',
        render: (row) => (
          row.hasOverride
            ? row.value
            : <span className="text-muted-foreground">—</span>
        ),
      },
      {
        id: 'actions',
        label: '',
        pinned: 'start',
        hideable: false,
        className: 'w-[56px]',
        render: (row) => (
          canManage ? (
            <GridRowActions
              actions={[
                {
                  label: t('common.edit'),
                  tooltip: t('grid.tooltip.edit'),
                  icon: Pencil,
                  onClick: () => openEdit(row),
                },
              ]}
            />
          ) : null
        ),
      },
    ],
    [canManage, localeFilterOptions, openEdit, t],
  );

  const gridColumns = useGridColumns(GRID_COLUMNS_KEY, columnDefinitions);

  const activeFilters = useMemo<GridActiveFilter[]>(() => {
    const items: GridActiveFilter[] = [];

    if (grid.search.trim()) {
      items.push({
        id: 'search',
        label: t('common.search'),
        value: grid.search.trim(),
        onRemove: grid.clearSearch,
      });
    }

    for (const column of columnDefinitions) {
      if (!column.filter) continue;

      const value = columnFilters.filters[column.filter.filterKey]?.trim();
      if (!value) continue;

      const displayValue =
        column.filter.type === 'select'
          ? column.filter.options?.find((option) => option.value === value)?.label ?? value
          : value;

      items.push({
        id: column.filter.filterKey,
        label: column.label,
        value: displayValue,
        onRemove: () => columnFilters.clearFilter(column.filter!.filterKey),
      });
    }

    return items;
  }, [
    columnDefinitions,
    columnFilters.clearFilter,
    columnFilters.filters,
    grid.clearSearch,
    grid.search,
    t,
  ]);

  const hasActiveFilters = grid.hasFilters || columnFilters.hasFilters;
  const isGridCustomized = hasActiveFilters || grid.isCustomized || gridColumns.isCustomized;

  function handleClearFilters() {
    grid.clearSearch();
    columnFilters.clearAllFilters();
    gridToasts.filtersCleared();
  }

  function handleResetGrid() {
    gridColumns.resetColumns();
    grid.clearSearch();
    columnFilters.clearAllFilters();
    grid.resetSettings();
    gridToasts.gridRestored();
  }

  const emptyMessage = useMemo(() => {
    if (isError) {
      return getApiErrorMessage(error);
    }

    if (hasActiveFilters) {
      return t('settings.translations.empty_search');
    }

    return t('settings.translations.empty');
  }, [error, hasActiveFilters, isError, t]);

  const toolbarActions = useMemo(
    () => (
      <StandardGridToolbar
        onNew={canManage ? openCreate : undefined}
        onEdit={canManage ? handleEditSelected : undefined}
        singleSelection={canManage && grid.singleSelection}
        onRefresh={() => void refetch()}
        isRefreshing={isFetching}
        extra={(
          <GridToolbarButton
            label={t('settings.translations.reload')}
            icon={RefreshCw}
            onClick={() => void reloadTranslations()}
          />
        )}
      />
    ),
    [
      canManage,
      grid.singleSelection,
      handleEditSelected,
      isFetching,
      openCreate,
      refetch,
      reloadTranslations,
      t,
    ],
  );

  usePageToolbar({
    title: t('settings.translations.title'),
    description: t('settings.translations.description'),
    actions: toolbarActions,
    breadcrumbs: [
      { title: t('menu.settings') },
      { title: t('menu.languages') },
      { title: t('menu.translations') },
    ],
  });

  const pagination = (
    <GridPagination
      meta={meta}
      onPageChange={grid.setPage}
      onPerPageChange={grid.setPerPage}
      perPageOptions={[15, 25, 50, 100]}
    />
  );

  return (
    <PageBody>
      <GridPanel
        toolbar={(
          <GridPanelToolbar
            onSelectAll={canManage ? () => grid.toggleSelectAll(rowIds) : undefined}
            isAllSelected={grid.isAllSelected(rowIds.length)}
            selectedCount={grid.selected.length}
            onClearSelection={grid.clearSelection}
            onRefresh={() => void refetch()}
            isRefreshing={isFetching}
            search={grid.search}
            onSearch={grid.setSearch}
            searchPlaceholder={t('settings.translations.search_placeholder')}
            filtersControl={(
              <GridFiltersControl
                filters={activeFilters}
                onClearAll={hasActiveFilters ? handleClearFilters : undefined}
              />
            )}
            columnsControl={(
              <GridColumnsControl
                columns={columnDefinitions}
                order={gridColumns.order}
                hidden={gridColumns.hidden}
                visibleCount={gridColumns.visibleCount}
                totalCount={gridColumns.totalCount}
                isCustomized={gridColumns.isCustomized}
                onOrderChange={gridColumns.setColumnOrder}
                onSetVisibility={gridColumns.setColumnVisibility}
                canHideColumn={gridColumns.canHideColumn}
                onShowAll={gridColumns.showAllColumns}
                onHideAll={gridColumns.hideAllColumns}
                onResetDefault={() => {
                  gridColumns.resetColumns();
                  gridToasts.columnsRestored();
                }}
              />
            )}
            resetControl={(
              <GridResetControl
                disabled={!isGridCustomized}
                onReset={handleResetGrid}
              />
            )}
            quickFiltersControl={(
              <GridQuickFilters
                value={localeQuickFilter}
                onChange={handleLocaleQuickFilterChange}
                defaultValue="all"
                options={[
                  {
                    value: 'all',
                    label: t('settings.translations.quick_all'),
                    count: localeQuickFilterCounts.all,
                  },
                  {
                    value: 'pt',
                    label: t('settings.translations.quick_pt'),
                    count: localeQuickFilterCounts.pt,
                  },
                  {
                    value: 'en',
                    label: t('settings.translations.quick_en'),
                    count: localeQuickFilterCounts.en,
                  },
                ]}
              />
            )}
          />
        )}
        footer={pagination}
      >
        <GridTable
          columns={gridColumns.visibleColumns}
          data={paginatedCatalog}
          getRowKey={(row) => getTranslationRowKey(row)}
          loading={false}
          emptyMessage={emptyMessage}
          sort={grid.sort}
          sortDir={grid.sortDir}
          onSort={grid.toggleSort}
          onColumnOrderChange={gridColumns.reorderDraggableColumns}
          columnFilters={columnFilters.filters}
          onColumnFilterChange={columnFilters.setFilter}
          onColumnFilterClear={columnFilters.clearColumnFilter}
          isRowSelected={(row) => grid.selected.includes(getTranslationRowId(row))}
          onRowClick={(row, event) => {
            if (!canManage) {
              openEdit(row);
              return;
            }

            grid.selectRow(getTranslationRowId(row), {
              shift: event.shiftKey,
              rangeOrder: rowIds,
            });
          }}
          onRowDoubleClick={(row) => openEdit(row)}
        />
      </GridPanel>
    </PageBody>
  );
}
