import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Html5Qrcode } from 'html5-qrcode';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { getEquipamentoRoute, parseEquipamentoQrValue } from '@/lib/equipamento-qr';
import { showAppToast } from '@/lib/show-app-toast';
import { equipamentosService } from '@/services/equipamentos.service';

type EquipamentoQrScannerModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EquipamentoQrScannerModal({
  open,
  onOpenChange,
}: EquipamentoQrScannerModalProps) {
  const navigate = useNavigate();
  const readerId = useId().replace(/:/g, '');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handlingRef = useRef(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;

    if (!scanner) {
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // ignore cleanup errors
    }

    try {
      scanner.clear();
    } catch {
      // ignore cleanup errors
    }
  }, []);

  const handleDecoded = useCallback(
    async (rawValue: string) => {
      if (handlingRef.current) {
        return;
      }

      const patrimonio = parseEquipamentoQrValue(rawValue);
      if (!patrimonio) {
        return;
      }

      handlingRef.current = true;

      try {
        const result = await equipamentosService.globalSearch(patrimonio, 1);
        const equipamento = result.data[0];

        if (!equipamento) {
          showAppToast({
            title: 'Equipamento não encontrado.',
            description: `Nenhum resultado para ${patrimonio}.`,
            variant: 'destructive',
          });
          handlingRef.current = false;
          return;
        }

        await stopScanner();
        onOpenChange(false);
        navigate(`${getEquipamentoRoute(equipamento)}?q=${encodeURIComponent(equipamento.patrimonio)}`);
        showAppToast({
          title: equipamento.patrimonio,
          description: equipamento.tipo?.nome ?? 'Equipamento localizado.',
        });
      } catch {
        showAppToast({
          title: 'Erro ao buscar equipamento.',
          variant: 'destructive',
        });
        handlingRef.current = false;
      }
    },
    [navigate, onOpenChange, stopScanner],
  );

  useEffect(() => {
    if (!open) {
      handlingRef.current = false;
      setError(null);
      void stopScanner();
      return;
    }

    let cancelled = false;

    const startScanner = async () => {
      setStarting(true);
      setError(null);
      handlingRef.current = false;

      await stopScanner();

      if (cancelled) {
        return;
      }

      const { Html5Qrcode: Html5QrcodeCtor } = await import('html5-qrcode');
      const scanner = new Html5QrcodeCtor(readerId);
      scannerRef.current = scanner;

      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 240, height: 240 },
            aspectRatio: 1,
          },
          (decoded) => {
            void handleDecoded(decoded);
          },
          () => {},
        );
      } catch {
        if (!cancelled) {
          setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
        }
      } finally {
        if (!cancelled) {
          setStarting(false);
        }
      }
    };

    void startScanner();

    return () => {
      cancelled = true;
      void stopScanner();
    };
  }, [open, readerId, handleDecoded, stopScanner]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          void stopScanner();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Escanear QR Code</DialogTitle>
        </DialogHeader>

        <div className="relative bg-black">
          <div id={readerId} className="min-h-[280px] w-full [&>video]:object-cover" />

          {starting ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <Loader2 className="size-8 animate-spin text-white" />
            </div>
          ) : null}
        </div>

        <p className="px-4 py-3 text-center text-xs text-muted-foreground">
          Aponte a câmera para o QR Code do equipamento.
        </p>

        {error ? (
          <p className="px-4 pb-4 text-center text-xs text-destructive">{error}</p>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
