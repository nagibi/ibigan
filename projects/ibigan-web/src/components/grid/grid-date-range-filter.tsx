import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker } from 'antd';
import { GridAntdConfigProvider } from '@/components/grid/grid-antd-config-provider';
import { useGridAntdConfig } from '@/lib/antd-locale';
import {
  dayjsToIso,
  getDateRangePresetLastMonth,
  getDateRangePresetLastWeek,
  getDateRangePresetToday,
  getDateRangePresetYesterday,
  toDateRangeValue,
  type DateRangeValue,
} from '@/lib/grid-date-filter-utils';
import { cn } from '@/lib/utils';
import {
  getGridDatePickerActiveStyle,
  GRID_DATE_PICKER_ACTIVE_CLASS,
} from '@/lib/grid-date-picker-styles';

export { formatDateRangeFilterLabel } from '@/lib/grid-date-filter-utils';

const { RangePicker } = DatePicker;

interface GridDateRangeFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  placeholder?: string;
}

const gridDatePickerActiveClassName = GRID_DATE_PICKER_ACTIVE_CLASS;

function commitRange(
  range: DateRangeValue,
  onChange: (from: string, to: string) => void,
) {
  if (!range) {
    onChange('', '');
    return;
  }

  const [start, end] = range;
  onChange(dayjsToIso(start), dayjsToIso(end));
}

export function GridDateRangeFilter({
  from,
  to,
  onChange,
  placeholder,
}: GridDateRangeFilterProps) {
  const { t } = useTranslation();
  const { dateFormatMask } = useGridAntdConfig();
  const [draft, setDraft] = useState<DateRangeValue>(() => toDateRangeValue(from, to));
  const draftRef = useRef(draft);
  const isOpenRef = useRef(false);
  const hasCommittedValue = Boolean(from?.trim() || to?.trim());
  const hasDraftValue = Boolean(draft?.[0] || draft?.[1]);
  const isActive = hasCommittedValue || hasDraftValue;
  const resolvedPlaceholder = placeholder ?? t('grid.date_period');

  draftRef.current = draft;

  useEffect(() => {
    if (!isOpenRef.current) {
      setDraft(toDateRangeValue(from, to));
    }
  }, [from, to]);

  const presets = useMemo(
    () => [
      {
        label: t('grid.date_today'),
        value: getDateRangePresetToday(),
      },
      {
        label: t('grid.date_yesterday'),
        value: getDateRangePresetYesterday(),
      },
      {
        label: t('grid.date_last_week'),
        value: getDateRangePresetLastWeek(),
      },
      {
        label: t('grid.date_last_month'),
        value: getDateRangePresetLastMonth(),
      },
    ],
    [t],
  );

  function updateDraft(range: DateRangeValue) {
    draftRef.current = range;
    setDraft(range);
  }

  return (
    <GridAntdConfigProvider>
      <div
        className={cn(
          'w-fit max-w-full',
          isActive && 'grid-antd-picker-wrap-active',
        )}
      >
        <RangePicker
          size="middle"
          allowClear
          inputReadOnly={false}
          format={dateFormatMask}
          value={draft}
          presets={presets}
          placeholder={[resolvedPlaceholder, resolvedPlaceholder]}
          className={cn(
            'grid-antd-picker grid-antd-picker-range',
            isActive && gridDatePickerActiveClassName,
          )}
          style={getGridDatePickerActiveStyle(isActive)}
          getPopupContainer={() => document.body}
          onOpenChange={(nextOpen) => {
            isOpenRef.current = nextOpen;

            if (!nextOpen) {
              commitRange(draftRef.current, onChange);
            }
          }}
          onChange={(range) => {
            updateDraft(range);

            if (!range) {
              onChange('', '');
              return;
            }

            const [start, end] = range;
            if (start && end) {
              commitRange(range, onChange);
            }
          }}
        />
      </div>
    </GridAntdConfigProvider>
  );
}
