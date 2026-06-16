import { useEffect, useState } from 'react';
import { Package, ZoomIn } from 'lucide-react';
import {
  getEquipamentoPicsumUrl,
  resolveEquipamentoFotoUrl,
} from '@/lib/equipamento-utils';
import { cn } from '@/lib/utils';
import { EquipamentoFotoViewerDialog } from '@/pages/equipamentos/components/equipamento-foto-viewer-dialog';

type EquipamentoThumbnailProps = {
  equipamento: {
    patrimonio: string;
    foto_url?: string | null;
    foto_path?: string | null;
    tipo?: { nome?: string | null } | null;
  };
  size?: 'sm' | 'md';
  className?: string;
  previewEnabled?: boolean;
};

const SIZE_CLASS = {
  sm: 'size-10',
  md: 'size-12',
} as const;

const ICON_CLASS = {
  sm: 'size-4',
  md: 'size-5',
} as const;

export function EquipamentoThumbnail({
  equipamento,
  size = 'md',
  className,
  previewEnabled = false,
}: EquipamentoThumbnailProps) {
  const primaryUrl = resolveEquipamentoFotoUrl(equipamento);
  const fallbackUrl = getEquipamentoPicsumUrl(`${equipamento.patrimonio}-fallback`);
  const [src, setSrc] = useState(primaryUrl);
  const [failed, setFailed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    setSrc(resolveEquipamentoFotoUrl(equipamento));
    setFailed(false);
  }, [equipamento.patrimonio, equipamento.foto_url, equipamento.foto_path]);

  const sizeClass = SIZE_CLASS[size];
  const iconClass = ICON_CLASS[size];
  const canPreview = previewEnabled && !failed;
  const title = equipamento.tipo?.nome ?? equipamento.patrimonio;

  if (failed) {
    return (
      <div
        className={cn(
          'flex shrink-0 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground',
          sizeClass,
          className,
        )}
        aria-hidden
      >
        <Package className={iconClass} />
      </div>
    );
  }

  const image = (
    <img
      src={src}
      alt={title}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => {
        if (src !== fallbackUrl) {
          setSrc(fallbackUrl);
          return;
        }

        setFailed(true);
      }}
      className={cn('object-cover', sizeClass, canPreview && 'transition-transform group-hover:scale-105')}
    />
  );

  return (
    <>
      {canPreview ? (
        <button
          type="button"
          onClick={() => setViewerOpen(true)}
          aria-label={`Ver foto de ${title}`}
          className={cn(
            'group relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted shadow-sm transition-colors hover:border-primary/40 hover:ring-2 hover:ring-primary/20',
            sizeClass,
            className,
          )}
        >
          {image}
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
            <ZoomIn className="size-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        </button>
      ) : (
        <div
          className={cn(
            'relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted shadow-sm',
            sizeClass,
            className,
          )}
        >
          {image}
        </div>
      )}

      <EquipamentoFotoViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        imageUrl={src}
        title={title}
        subtitle={equipamento.patrimonio}
      />
    </>
  );
}
