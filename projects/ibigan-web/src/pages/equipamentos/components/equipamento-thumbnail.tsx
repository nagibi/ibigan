import { useEffect, useMemo, useState } from 'react';
import { Package, ZoomIn } from 'lucide-react';
import {
  getEquipamentoFotoGallery,
  getEquipamentoPicsumUrl,
  resolveEquipamentoFotoUrl,
} from '@/lib/equipamento-utils';
import { cn } from '@/lib/utils';
import type { EquipamentoFoto } from '@/types/equipamento';
import { EquipamentoFotoViewerDialog } from '@/pages/equipamentos/components/equipamento-foto-viewer-dialog';

type EquipamentoThumbnailProps = {
  equipamento: {
    patrimonio: string;
    foto_url?: string | null;
    foto_path?: string | null;
    fotos?: EquipamentoFoto[];
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
  const gallery = useMemo(() => getEquipamentoFotoGallery(equipamento), [equipamento]);
  const primaryUrl = resolveEquipamentoFotoUrl(equipamento);
  const fallbackUrl = getEquipamentoPicsumUrl(`${equipamento.patrimonio}-fallback`);
  const [src, setSrc] = useState(primaryUrl);
  const [failed, setFailed] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    setSrc(resolveEquipamentoFotoUrl(equipamento));
    setFailed(false);
  }, [equipamento]);

  const sizeClass = SIZE_CLASS[size];
  const iconClass = ICON_CLASS[size];
  const canPreview = previewEnabled && !failed && gallery.length > 0;
  const title = equipamento.tipo?.nome ?? equipamento.patrimonio;
  const extraPhotos = gallery.length - 1;

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
          aria-label={
            gallery.length > 1
              ? `Ver ${gallery.length} fotos de ${title}`
              : `Ver foto de ${title}`
          }
          className={cn(
            'group relative shrink-0 overflow-hidden rounded-lg border border-border bg-muted shadow-sm transition-colors hover:border-primary/40 hover:ring-2 hover:ring-primary/20',
            sizeClass,
            className,
          )}
        >
          {image}
          {extraPhotos > 0 ? (
            <span className="absolute bottom-0 right-0 rounded-tl-md bg-black/70 px-1 text-[10px] font-medium text-white">
              +{extraPhotos}
            </span>
          ) : null}
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
        images={gallery}
        title={title}
        subtitle={equipamento.patrimonio}
      />
    </>
  );
}
