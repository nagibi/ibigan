import { Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { buildEquipamentoQrValue } from '@/lib/equipamento-qr';
import { showAppToast } from '@/lib/show-app-toast';
import type { Equipamento } from '@/types/equipamento';
import { EquipamentoThumbnail } from '@/pages/equipamentos/components/equipamento-thumbnail';

type EquipamentoQrModalProps = {
  equipamento: Equipamento | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EquipamentoQrModal({
  equipamento,
  open,
  onOpenChange,
}: EquipamentoQrModalProps) {
  if (!equipamento) {
    return null;
  }

  const qrValue = buildEquipamentoQrValue(equipamento.patrimonio);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(equipamento.patrimonio);
      showAppToast({ title: 'Patrimônio copiado.' });
    } catch {
      showAppToast({
        title: 'Não foi possível copiar o patrimônio.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>QR Code — {equipamento.patrimonio}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <EquipamentoThumbnail equipamento={equipamento} size="md" className="size-16" />
          <div>
            <p className="text-center text-sm font-semibold">
              {equipamento.tipo?.nome ?? 'Equipamento'}
            </p>
            <p className="text-center text-xs text-muted-foreground">{equipamento.patrimonio}</p>
          </div>

          <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
            <QRCodeSVG value={qrValue} size={192} level="M" includeMargin />
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Escaneie com o celular para localizar este equipamento no sistema.
          </p>

          <Button type="button" variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="size-4" />
            Copiar patrimônio
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
