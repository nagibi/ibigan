import {
  currencyDigitsToNumericString,
  formatBrl,
  numericStringToCurrencyDigits,
} from '@/lib/brazilian-masks';
import { MaskedInput } from '@/components/ui/masked-input';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface GridNumberRangeFilterProps {
  from: string;
  to: string;
  onChange: (from: string, to: string) => void;
  placeholderFrom?: string;
  placeholderTo?: string;
  fullWidth?: boolean;
  variant?: 'default' | 'currency';
}

export function formatNumberRangeFilterLabel(
  from: string,
  to: string,
  options?: { variant?: 'default' | 'currency' },
): string {
  const formatValue = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (options?.variant === 'currency') {
      const amount = Number(trimmed);
      return Number.isNaN(amount) ? trimmed : formatBrl(amount);
    }

    return trimmed;
  };

  const parts: string[] = [];

  const fromLabel = formatValue(from);
  if (fromLabel) {
    parts.push(`≥ ${fromLabel}`);
  }

  const toLabel = formatValue(to);
  if (toLabel) {
    parts.push(`≤ ${toLabel}`);
  }

  return parts.join(' · ');
}

export function GridNumberRangeFilter({
  from,
  to,
  onChange,
  placeholderFrom = 'Mín',
  placeholderTo = 'Máx',
  fullWidth = false,
  variant = 'default',
}: GridNumberRangeFilterProps) {
  const isActive = Boolean(from.trim() || to.trim());
  const inputClassName = cn(
    'h-7 min-w-0 text-xs tabular-nums px-1.5 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
    fullWidth ? 'flex-1' : 'w-[3.25rem] shrink-0',
    isActive && 'border-primary/60 bg-primary/5',
    variant === 'currency' && (fullWidth ? 'flex-1' : 'w-[5.5rem] shrink-0'),
  );

  if (variant === 'currency') {
    return (
      <div
        className={cn(
          'flex min-w-0 items-center gap-1',
          fullWidth ? 'w-full' : 'w-fit max-w-full',
        )}
      >
        <MaskedInput
          mask="currency"
          value={numericStringToCurrencyDigits(from)}
          onChange={(digits) => onChange(currencyDigitsToNumericString(digits), to)}
          placeholder={placeholderFrom}
          variant="sm"
          className={inputClassName}
        />
        <span className="shrink-0 px-0.5 text-[10px] text-muted-foreground">—</span>
        <MaskedInput
          mask="currency"
          value={numericStringToCurrencyDigits(to)}
          onChange={(digits) => onChange(from, currencyDigitsToNumericString(digits))}
          placeholder={placeholderTo}
          variant="sm"
          className={inputClassName}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex min-w-0 items-center gap-1',
        fullWidth ? 'w-full' : 'w-fit max-w-full',
      )}
    >
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={from}
        onChange={(event) => onChange(event.target.value, to)}
        placeholder={placeholderFrom}
        className={inputClassName}
      />
      <span className="shrink-0 px-0.5 text-[10px] text-muted-foreground">—</span>
      <Input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={to}
        onChange={(event) => onChange(from, event.target.value)}
        placeholder={placeholderTo}
        className={inputClassName}
      />
    </div>
  );
}
