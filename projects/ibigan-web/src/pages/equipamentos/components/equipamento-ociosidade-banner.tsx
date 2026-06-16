import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatEquipamentoCurrency } from '@/lib/equipamento-utils';

type EquipamentoOciosidadeBannerProps = {
  total: number;
  valorMensal: number;
};

export function EquipamentoOciosidadeBanner({
  total,
  valorMensal,
}: EquipamentoOciosidadeBannerProps) {
  if (total <= 0) return null;

  return (
    <Link
      to="/equipamentos/estoque?filtro=parados"
      className="flex items-center gap-3 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/15 to-orange-500/10 px-4 py-3.5 transition-colors hover:from-amber-500/20 hover:to-orange-500/15"
    >
      <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-amber-500/25 text-amber-700 dark:text-amber-400">
        <AlertTriangle className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold uppercase tracking-wide text-amber-900 dark:text-amber-100">
          Ociosidade
        </p>
        <p className="mt-0.5 text-sm font-semibold text-amber-950 dark:text-amber-50">
          {total} equipamento{total === 1 ? '' : 's'} sem uso
        </p>
        <p className="text-xs font-medium text-amber-800/90 dark:text-amber-200/90">
          {formatEquipamentoCurrency(valorMensal)}/mês em custo parado
        </p>
      </div>
      <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold text-amber-800 dark:text-amber-200">
        Ver detalhes
        <ChevronRight className="size-3.5" />
      </span>
    </Link>
  );
}
