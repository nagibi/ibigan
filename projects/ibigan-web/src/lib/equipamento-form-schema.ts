import { z } from 'zod';
import { currencyDigitsToNumber } from '@/lib/brazilian-masks';
import { zRequiredId, zRequiredString } from '@/lib/zod-validators';

export const equipamentoFormSchema = z.object({
  patrimonio: zRequiredString('Patrimônio', 50),
  tipo_id: zRequiredId('Tipo'),
  fornecedor_id: zRequiredId('Fornecedor'),
  obra_id: zRequiredId('Obra'),
  valor_mensal: z
    .number({ invalid_type_error: 'Valor mensal é obrigatório.' })
    .min(0.01, 'Valor mensal é obrigatório.'),
  is_critico: z.boolean(),
});

export type EquipamentoFormValues = z.infer<typeof equipamentoFormSchema>;

export function parseEquipamentoValorMensal(digits: string): number {
  const amount = currencyDigitsToNumber(digits);
  return Number.isNaN(amount) ? 0 : amount;
}

export function buildEquipamentoFormValues(input: {
  patrimonio: string;
  tipoId: string;
  fornecedorId: string;
  obraId: string;
  valorMensalDigits: string;
  isCritico: boolean;
}): EquipamentoFormValues {
  return {
    patrimonio: input.patrimonio,
    tipo_id: Number(input.tipoId),
    fornecedor_id: Number(input.fornecedorId),
    obra_id: Number(input.obraId),
    valor_mensal: parseEquipamentoValorMensal(input.valorMensalDigits),
    is_critico: input.isCritico,
  };
}
