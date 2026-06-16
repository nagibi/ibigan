import { cn } from '@/lib/utils';
import {
  EQUIPAMENTO_ALERTA_STYLES,
  EQUIPAMENTO_STATUS_LABELS,
  EQUIPAMENTO_STATUS_STYLES,
  type EquipamentoAlerta,
} from '@/lib/equipamento-labels';
import type { EquipamentoStatus } from '@/types/equipamento';

type EquipamentoStatusBadgeProps = {
  status: EquipamentoStatus;
  label?: string;
  className?: string;
  size?: 'sm' | 'md';
  alerta?: EquipamentoAlerta | null;
  subdued?: boolean;
};

export function EquipamentoStatusBadge({
  status,
  label,
  className,
  size = 'md',
  alerta = null,
  subdued = false,
}: EquipamentoStatusBadgeProps) {
  const styles = alerta ? EQUIPAMENTO_ALERTA_STYLES[alerta] : EQUIPAMENTO_STATUS_STYLES[status];
  const displayLabel = alerta
    ? EQUIPAMENTO_ALERTA_STYLES[alerta].label
    : (label ?? EQUIPAMENTO_STATUS_LABELS[status]);

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border font-semibold uppercase tracking-wide',
        subdued
          ? 'border-border bg-muted/40 text-muted-foreground'
          : styles.badge,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs',
        alerta === 'vencido' && 'ring-2 ring-red-500/50',
        className,
      )}
    >
      {!subdued ? <span className="size-1.5 shrink-0 rounded-full bg-white/90" /> : null}
      {displayLabel}
    </span>
  );
}

export function EquipamentoStatusBar({
  status,
  alerta = null,
  subdued = false,
}: {
  status: EquipamentoStatus;
  alerta?: EquipamentoAlerta | null;
  subdued?: boolean;
}) {
  const styles = alerta ? EQUIPAMENTO_ALERTA_STYLES[alerta] : EQUIPAMENTO_STATUS_STYLES[status];

  return (
    <div
      className={cn('h-1.5 w-full', subdued ? 'bg-border' : styles.bar)}
      aria-hidden
    />
  );
}
