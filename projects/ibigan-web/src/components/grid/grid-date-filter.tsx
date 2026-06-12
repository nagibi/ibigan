import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker } from 'antd';
import type { Dayjs } from 'dayjs';
import { GridAntdConfigProvider } from '@/components/grid/grid-antd-config-provider';
import { useGridAntdConfig } from '@/lib/antd-locale';
import {
  dayjsToIso,
  parseFilterDayjs,
} from '@/lib/grid-date-filter-utils';
import { cn } from '@/lib/utils';
import {
  getGridDatePickerActiveStyle,
  GRID_DATE_PICKER_ACTIVE_CLASS,
} from '@/lib/grid-date-picker-styles';

const gridDatePickerActiveClassName = GRID_DATE_PICKER_ACTIVE_CLASS;

interface GridDateFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function GridDateFilter({
  value,
  onChange,
  placeholder,
}: GridDateFilterProps) {
  const { t } = useTranslation();
  const { dateFormatMask } = useGridAntdConfig();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Dayjs | null>(() => parseFilterDayjs(value));
  const hasCommittedValue = Boolean(value?.trim());
  const hasDraftValue = Boolean(draft);
  const isActive = hasCommittedValue || hasDraftValue;

  useEffect(() => {
    if (!open) {
      setDraft(parseFilterDayjs(value));
    }
  }, [value, open]);

  return (
    <GridAntdConfigProvider>
      <div
        className={cn(
          'grid-antd-picker-single-wrap w-full min-w-0',
          isActive && 'grid-antd-picker-wrap-active',
        )}
      >
        <DatePicker
          size="middle"
          allowClear
          inputReadOnly={false}
          format={dateFormatMask}
          value={draft}
          open={open}
          placeholder={placeholder ?? t('grid.date_period')}
          className={cn(
            'grid-antd-picker grid-antd-picker-single',
            isActive && gridDatePickerActiveClassName,
          )}
          style={getGridDatePickerActiveStyle(isActive)}
          getPopupContainer={() => document.body}
          onOpenChange={(nextOpen) => {
            if (!nextOpen) {
              onChange(dayjsToIso(draft));
            }
            setOpen(nextOpen);
          }}
          onChange={(date) => {
            setDraft(date);
            if (!date || date.isValid()) {
              onChange(dayjsToIso(date));
            }
          }}
        />
      </div>
    </GridAntdConfigProvider>
  );
}
