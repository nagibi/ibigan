import { forwardRef, type ComponentProps } from 'react';
import { applyMask, digitsOnly } from '@/lib/brazilian-masks';
import { Input } from '@/components/ui/input';

const MAX_CURRENCY_DIGITS = 13;

type MaskType = 'phone' | 'cpf' | 'cnpj' | 'currency';

interface MaskedInputProps extends Omit<ComponentProps<typeof Input>, 'onChange' | 'value'> {
  mask: MaskType;
  value?: string;
  onChange?: (value: string) => void;
  storeDigits?: boolean;
}

export const MaskedInput = forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ mask, value = '', onChange, storeDigits = true, ...props }, ref) => {
    const displayValue = storeDigits ? applyMask(value, mask) : value;

    return (
      <Input
        ref={ref}
        {...props}
        value={displayValue}
        onChange={(event) => {
          const raw = event.target.value;
          if (mask === 'currency') {
            const digits = digitsOnly(raw).slice(0, MAX_CURRENCY_DIGITS);
            onChange?.(storeDigits ? digits : applyMask(raw, mask));
            return;
          }

          onChange?.(storeDigits ? digitsOnly(raw) : applyMask(raw, mask));
        }}
      />
    );
  },
);

MaskedInput.displayName = 'MaskedInput';
