import { addDays, differenceInDays, parseISO, startOfDay } from 'date-fns';
import { formatBrl } from '@/lib/brazilian-masks';
import { resolveStoragePublicUrl } from '@/lib/resolve-storage-url';
import type { Equipamento, EquipamentoEmprestimoAtivo } from '@/types/equipamento';

export function formatEquipamentoCurrency(value: number): string {
  return formatBrl(value);
}

export function getEquipamentoPicsumUrl(seedSource: string, size = 96): string {
  const seed =
    (Math.abs(
      [...seedSource].reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0),
    ) %
      1000) +
    1;

  return `https://picsum.photos/${size}/${size}?random=${seed}`;
}

export function resolveEquipamentoFotoUrl(equipamento: {
  patrimonio?: string;
  foto_url?: string | null;
  foto_path?: string | null;
}): string {
  const resolved = resolveStoragePublicUrl(equipamento.foto_url ?? equipamento.foto_path);
  if (resolved) {
    return resolved;
  }

  return getEquipamentoPicsumUrl(equipamento.patrimonio ?? 'equipamento');
}

export function getEquipamentoAlerta(
  equipamento: Equipamento,
): 'vencido' | 'proximo_vencimento' | null {
  if (equipamento.status !== 'em_utilizacao' || !equipamento.emprestimo_ativo) {
    return null;
  }

  const emprestimo = enrichEmprestimoAtivo(equipamento.emprestimo_ativo);
  if (emprestimo.is_vencido) return 'vencido';
  if (emprestimo.is_proximo_vencimento) return 'proximo_vencimento';
  return null;
}

export type EquipamentoTendenciaIcon = 'trending-up' | 'hourglass' | 'trending-down' | 'wrench';
export type EquipamentoTendenciaTone = 'default' | 'success' | 'warning' | 'danger';

export type EquipamentoTendencia = {
  icon: EquipamentoTendenciaIcon;
  label: string;
  tone: EquipamentoTendenciaTone;
};

export function getEquipamentoTendencia(equipamento: Equipamento): EquipamentoTendencia | null {
  const emprestimo = equipamento.emprestimo_ativo
    ? enrichEmprestimoAtivo(equipamento.emprestimo_ativo)
    : null;

  if (equipamento.status === 'em_utilizacao' && emprestimo) {
    if (emprestimo.is_vencido) {
      const dias = Math.abs(emprestimo.dias_ate_vencimento ?? 0);
      return {
        icon: 'hourglass',
        label: `Vencido há ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
        tone: 'danger',
      };
    }

    if (emprestimo.is_proximo_vencimento) {
      const dias = emprestimo.dias_ate_vencimento ?? 0;
      return {
        icon: 'hourglass',
        label: `Vence em ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
        tone: 'warning',
      };
    }

    const dias = emprestimo.dias_em_uso ?? 0;
    return {
      icon: 'trending-up',
      label: `Utilizado há ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
      tone: 'success',
    };
  }

  if (equipamento.status === 'em_estoque') {
    const dias = equipamento.tempo_em_estoque ?? 0;

    if (dias <= 0) {
      return {
        icon: 'trending-up',
        label: 'Disponível para empréstimo',
        tone: 'success',
      };
    }

    return {
      icon: 'trending-down',
      label: `Parado há ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
      tone: dias >= 30 ? 'danger' : 'warning',
    };
  }

  if (equipamento.status === 'em_manutencao') {
    const dias = equipamento.manutencao_ativa?.dias_em_manutencao ?? 0;
    return {
      icon: 'wrench',
      label: `Em manutenção há ${dias} ${dias === 1 ? 'dia' : 'dias'}`,
      tone: dias >= 7 ? 'warning' : 'default',
    };
  }

  return null;
}

export function enrichEmprestimoAtivo(
  emprestimo: EquipamentoEmprestimoAtivo,
): EquipamentoEmprestimoAtivo {
  const adicional =
    emprestimo.renovacoes?.reduce((sum, item) => sum + item.prazo_adicional_dias, 0) ?? 0;
  const prazoTotal = emprestimo.prazo_dias + adicional;
  const vencimento = addDays(parseISO(emprestimo.data_retirada), prazoTotal);
  const hoje = startOfDay(new Date());
  const diasAte = differenceInDays(vencimento, hoje);
  const diasEmUso = differenceInDays(hoje, parseISO(emprestimo.data_retirada));

  return {
    ...emprestimo,
    data_vencimento: vencimento.toISOString().slice(0, 10),
    dias_ate_vencimento: diasAte,
    dias_em_uso: Math.max(diasEmUso, 0),
    is_vencido: diasAte < 0,
    is_proximo_vencimento: diasAte >= 0 && diasAte <= 3,
  };
}

export function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function groupEquipamentosEstoque(items: Equipamento[]) {
  const criticos = items.filter((item) => item.is_critico);
  const parados = items.filter(
    (item) => !item.is_critico && (item.tempo_em_estoque ?? 0) >= 30,
  );
  const demais = items.filter(
    (item) => !item.is_critico && (item.tempo_em_estoque ?? 0) < 30,
  );

  return [
    { key: 'criticos', title: 'Equipamentos críticos', items: criticos },
    { key: 'parados', title: 'Sem uso há mais de 30 dias', items: parados },
    { key: 'demais', title: 'Demais equipamentos', items: demais },
  ].filter((section) => section.items.length > 0);
}

export function sumValorMensal(items: Equipamento[]): number {
  return items.reduce((sum, item) => sum + Number(item.valor_mensal), 0);
}

