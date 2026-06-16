export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

const MAX_CURRENCY_DIGITS = 13;

export function formatBrl(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function parseCurrencyValue(value: string | number | null | undefined): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const normalized = Number(value.replace(',', '.').trim());
    return normalized;
  }

  return Number.NaN;
}

export function numberToCurrencyDigits(value: string | number | null | undefined): string {
  const numericValue = parseCurrencyValue(value);
  if (!Number.isFinite(numericValue) || numericValue < 0) return '';
  return String(Math.round(numericValue * 100));
}

export function currencyDigitsToNumber(digits: string): number {
  const normalized = digitsOnly(digits);
  if (!normalized) return NaN;
  return Number(normalized) / 100;
}

export function formatCurrencyInput(value?: string | number | null): string {
  const digits =
    typeof value === 'number'
      ? numberToCurrencyDigits(value)
      : digitsOnly(value ?? '').slice(0, MAX_CURRENCY_DIGITS);

  if (!digits) return '';

  return formatBrl(Number(digits) / 100);
}

export function numericStringToCurrencyDigits(value: string): string {
  const parsed = Number(value.replace(',', '.'));
  if (!value.trim() || Number.isNaN(parsed)) return '';
  return numberToCurrencyDigits(parsed);
}

export function currencyDigitsToNumericString(digits: string): string {
  const amount = currencyDigitsToNumber(digits);
  if (Number.isNaN(amount)) return '';
  return String(amount);
}

export function formatPhone(value?: string | null): string {
  const digits = digitsOnly(value ?? '');
  if (!digits) return '';

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  if (rest.length <= 8) return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
}

export function formatCpf(value?: string | null): string {
  const digits = digitsOnly(value ?? '').slice(0, 11);
  if (!digits) return '';

  const part1 = digits.slice(0, 3);
  const part2 = digits.slice(3, 6);
  const part3 = digits.slice(6, 9);
  const part4 = digits.slice(9, 11);

  if (digits.length <= 3) return part1;
  if (digits.length <= 6) return `${part1}.${part2}`;
  if (digits.length <= 9) return `${part1}.${part2}.${part3}`;
  return `${part1}.${part2}.${part3}-${part4}`;
}

export function formatCnpj(value?: string | null): string {
  const digits = digitsOnly(value ?? '').slice(0, 14);
  if (!digits) return '';

  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 8);
  const part4 = digits.slice(8, 12);
  const part5 = digits.slice(12, 14);

  if (digits.length <= 2) return part1;
  if (digits.length <= 5) return `${part1}.${part2}`;
  if (digits.length <= 8) return `${part1}.${part2}.${part3}`;
  if (digits.length <= 12) return `${part1}.${part2}.${part3}/${part4}`;
  return `${part1}.${part2}.${part3}/${part4}-${part5}`;
}

export function applyMask(
  value: string,
  mask: 'phone' | 'cpf' | 'cnpj' | 'currency',
): string {
  switch (mask) {
    case 'phone':
      return formatPhone(value);
    case 'cpf':
      return formatCpf(value);
    case 'cnpj':
      return formatCnpj(value);
    case 'currency':
      return formatCurrencyInput(value);
  }
}
