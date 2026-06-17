import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export type EquipamentoFotoViewerImage = {
  id?: number;
  url: string;
};

type EquipamentoFotoViewerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  images?: EquipamentoFotoViewerImage[];
  imageUrl?: string | null;
  initialIndex?: number;
  title?: string;
  subtitle?: string | null;
};

export function EquipamentoFotoViewerDialog({
  open,
  onOpenChange,
  images,
  imageUrl,
  initialIndex = 0,
  title = 'Foto do equipamento',
  subtitle,
}: EquipamentoFotoViewerDialogProps) {
  const gallery =
    images && images.length > 0
      ? images
      : imageUrl
        ? [{ url: imageUrl }]
        : [];
  const hasMultiple = gallery.length > 1;
  const safeInitialIndex = Math.min(Math.max(initialIndex, 0), Math.max(gallery.length - 1, 0));
  const [currentIndex, setCurrentIndex] = useState(safeInitialIndex);

  useEffect(() => {
    if (!open) {
      return;
    }

    setCurrentIndex(safeInitialIndex);
  }, [open, safeInitialIndex]);

  const currentImage = gallery[currentIndex];

  const goToPrevious = () => {
    setCurrentIndex((index) => (index <= 0 ? gallery.length - 1 : index - 1));
  };

  const goToNext = () => {
    setCurrentIndex((index) => (index >= gallery.length - 1 ? 0 : index + 1));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          {hasMultiple ? (
            <p className="text-xs text-muted-foreground">
              {currentIndex + 1} de {gallery.length} fotos
            </p>
          ) : null}
        </DialogHeader>

        <div className="bg-muted/30 p-4">
          {currentImage ? (
            <div className="relative mx-auto w-full max-w-xl">
              <div className="flex items-center justify-center">
                <img
                  src={currentImage.url}
                  alt={`${title} — foto ${currentIndex + 1}`}
                  className="max-h-[65vh] w-full rounded-lg object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>

              {hasMultiple ? (
                <>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="absolute top-1/2 left-2 size-8 -translate-y-1/2 rounded-full border-border bg-background/90"
                    onClick={goToPrevious}
                    aria-label="Foto anterior"
                  >
                    <ChevronLeft className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    className="absolute top-1/2 right-2 size-8 -translate-y-1/2 rounded-full border-border bg-background/90"
                    onClick={goToNext}
                    aria-label="Próxima foto"
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}

          {hasMultiple ? (
            <div className="mt-4 flex justify-center gap-2 overflow-x-auto pb-1">
              {gallery.map((image, index) => (
                <button
                  key={image.id ?? `${image.url}-thumb-${index}`}
                  type="button"
                  onClick={() => setCurrentIndex(index)}
                  aria-label={`Ver foto ${index + 1}`}
                  className={cn(
                    'size-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                    currentIndex === index ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100',
                  )}
                >
                  <img
                    src={image.url}
                    alt=""
                    className="size-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
