import { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw } from 'lucide-react';
import { GRID_VIEW_ICON } from '@/lib/grid-view-action';
import { useGridToasts } from '@/hooks/use-grid-toasts';
import { usePageToolbar } from '@/hooks/use-page-toolbar';
import { useGrid } from '@/hooks/use-grid';
import { useGridColumns, type GridColumnDef } from '@/hooks/use-grid-columns';
import { useGridExport } from '@/hooks/use-grid-export';
import { useGridFilters } from '@/hooks/use-grid-filters';
import { useGridViewMode } from '@/hooks/use-grid-view-mode';
import { useTranslationAdminContext } from '@/hooks/use-translation-admin-context';
import { PageBody } from '@/components/common/page-body';
import { useClientGridInfiniteScroll } from '@/hooks/use-grid-infinite-scroll';
import { buildClientGridInfiniteScrollProps } from '@/lib/grid-infinite-scroll';
import { getColumnFilterDisplayValue } from '@/lib/grid-filter-display';
import { getApiErrorMessage } from '@/lib/get-api-error-message';
import {
  buildTranslationCatalog,
  type TranslationCatalogRow,
} from '@/lib/translation-catalog';
import { filterTranslationCatalog } from '@/lib/filter-translation-catalog';
import { getTranslationRowId, getTranslationRowKey } from '@/lib/translation-row-id';
import { useLanguage } from '@/providers/i18n-provider';
import { GridColumnDataView } from '@/components/grid/grid-column-data-view';
import { GridColumnsControl } from '@/components/grid/grid-columns-control';
import { getGridRecordCount } from '@/components/grid/grid-record-count';
import { type GridActiveFilter } from '@/components/grid/grid-filters-control';
import { isGridPerPageAll } from '@/lib/grid-pagination-config';
import { GridPagination } from '@/components/grid/grid-pagination';
import { GridPanel } from '@/components/grid/grid-panel';
import { GridQuickFilters } from '@/components/grid/grid-quick-filters';
import { GridResetControl } from '@/components/grid/grid-reset-control';
import { GridRowActions } from '@/components/grid/grid-row-actions';
import { GridViewModeControl } from '@/components/grid/grid-view-mode-control';
import {
  GridPanelToolbar,
  GridToolbarButton,
  StandardGridToolbar,
} from '@/components/grid/grid-toolbar';

const GRID_COLUMNS_KEY_FALLBACK = 'grid-columns:translations';

type TranslationLocaleQuickFilter = 'all' | 'pt' | 'en';

export function TranslationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const translationContext = useTranslationAdminContext();
  const {
    tenantId,
    listPath,
    newPath,
    getEditPath,
    translationsApi,
    canManage,
    gridColumnsKey,
    viewPreferenceKey,
  } = translationContext;
  const { reloadTranslations } = useLanguage();
  const gridToasts = useGridToasts();
  const { viewMode, setViewMode, infiniteScrollEnabled } = useGridViewMode(viewPreferenceKey);
  const grid = useGrid({ defaultPerPage: 25 });
  const columnFilters = useGridFilters(() => grid.setPage(1));

  const { data, isFetching, refetch, isError, error } = useQuery({
    queryKey: ['translations-manage', tenantId],
    queryFn: () => ('manage' in translationsApi
      ? translationsApi.manage({})
      : Promise.reject(new Error('unavailable'))),
    enabled: canManage,
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

  const meta = useMemo(() => {
    const pageSize = grid.slicePerPage(sortedCatalog.length);
    return {
      current_page: grid.page,
      last_page: Math.max(1, Math.ceil(sortedCatalog.length / pageSize)),
      per_page: isGridPerPageAll(grid.perPage) ? sortedCatalog.length : grid.perPage,
      total: sortedCatalog.length,
    };
  }, [grid.page, grid.perPage, grid.slicePerPage, sortedCatalog.length]);

  const paginatedCatalog = useMemo(() => {
    const pageSize = grid.slicePerPage(sortedCatalog.length);
    const start = (grid.page - 1) * pageSize;
    return sortedCatalog.slice(start, start + pageSize);
  }, [grid.page, grid.slicePerPage, sortedCatalog]);

  const clientInfinite = useClientGridInfiniteScroll({
    items: sortedCatalog,
    page: grid.page,
    perPage: grid.perPage,
    setPage: grid.setPage,
    enabled: infiniteScrollEnabled,
    resetDeps: [
      grid.debouncedSearch,
      columnFilters.debouncedFilters,
      localeQuickFilter,
      grid.sort,
      grid.sortDir,
    ],
  });

  const cardListCatalog = infiniteScrollEnabled ? clientInfinite.displayItems : paginatedCatalog;

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
    navigate(newPath);
  }, [navigate, newPath]);

  const openEdit = useCallback((row: TranslationCatalogRow) => {
    if (row.id) {
      navigate(getEditPath(row.id));
      return;
    }

    const params = new URLSearchParams({
      key: row.key,
      locale: row.locale,
    });
    navigate(`${newPath}?${params.toString()}`);
  }, [getEditPath, navigate, newPath]);

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
        label: t('columns.actions'),
        pinned: 'start',
        hideable: false,
        className: 'min-w-[100px] w-[100px]',
        render: (row) => (
          canManage ? (
            <GridRowActions
              actions={[
                {
                  label: t('common.view'),
                  tooltip: t('grid.tooltip.view'),
                  icon: GRID_VIEW_ICON,
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

  const gridColumns = useGridColumns(gridColumnsKey || GRID_COLUMNS_KEY_FALLBACK, columnDefinitions);

  const exportCatalog = infiniteScrollEnabled ? cardListCatalog : paginatedCatalog;

  const { handleExport, isExporting } = useGridExport({
    filename: 'traducoes',
    columns: gridColumns.visibleColumns,
    rows: exportCatalog,
  });

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

      const displayValue = getColumnFilterDisplayValue(column.filter, value);

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
        onExport={handleExport}
        isExporting={isExporting}
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
      handleExport,
      isExporting,
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
      { title: 'Plataforma' },
      { title: t('menu.translations'), path: '/admin/translations' },
      { title: t('settings.translations.title') },
    ],
  });

  const pagination = (
    <GridPagination
      meta={meta}
      perPage={grid.perPage}
      onPageChange={grid.setPage}
      onPerPageChange={grid.setPerPage}
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
            onExport={handleExport}
            isExporting={isExporting}
            search={grid.search}
            onSearch={grid.setSearch}
            filters={{
              active: activeFilters,
              onClearAll: hasActiveFilters ? handleClearFilters : undefined,
              columnFilters: {
                columns: gridColumns.visibleColumns,
                values: columnFilters.filters,
                onFilterChange: columnFilters.setFilter,
                onDateRangeChange: columnFilters.setDateRangeFilter,
                onFilterClear: columnFilters.clearColumnFilter,
              },
            }}
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
            viewModeControl={
              <GridViewModeControl viewMode={viewMode} onViewModeChange={setViewMode} />
            }
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
            recordCount={getGridRecordCount(meta.total, cardListCatalog.length, infiniteScrollEnabled)}
          />
        )}
        footer={!infiniteScrollEnabled ? pagination : undefined}
      >
        <GridColumnDataView
          viewMode={viewMode}
          columns={gridColumns.visibleColumns}
          data={paginatedCatalog}
          cardData={infiniteScrollEnabled ? cardListCatalog : undefined}
          getRowKey={(row) => getTranslationRowKey(row)}
          loading={false}
          emptyMessage={emptyMessage}
          infiniteScroll={buildClientGridInfiniteScrollProps({
            enabled: infiniteScrollEnabled,
            clientInfinite,
          })}
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
