export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
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

export function formatBrl(value: number): string {
  return value.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function applyMask(
  value: string,
  mask: 'phone' | 'cpf' | 'cnpj',
): string {
  switch (mask) {
    case 'phone':
      return formatPhone(value);
    case 'cpf':
      return formatCpf(value);
    case 'cnpj':
      return formatCnpj(value);
  }
}
