import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type EquipamentoFotoViewerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageUrl: string | null;
  title?: string;
  subtitle?: string | null;
};

export function EquipamentoFotoViewerDialog({
  open,
  onOpenChange,
  imageUrl,
  title = 'Foto do equipamento',
  subtitle,
}: EquipamentoFotoViewerDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b px-4 py-3">
          <DialogTitle className="text-base">{title}</DialogTitle>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </DialogHeader>
        <div className="flex items-center justify-center bg-muted/30 p-4">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="max-h-[70vh] w-full rounded-lg object-contain"
              referrerPolicy="no-referrer"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
