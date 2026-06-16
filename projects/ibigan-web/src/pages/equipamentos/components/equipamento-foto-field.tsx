import { useEffect, useRef, useState } from 'react';
import { Camera, ZoomIn, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { EquipamentoThumbnail } from '@/pages/equipamentos/components/equipamento-thumbnail';
import { EquipamentoFotoCropDialog } from '@/pages/equipamentos/components/equipamento-foto-crop-dialog';
import { EquipamentoFotoViewerDialog } from '@/pages/equipamentos/components/equipamento-foto-viewer-dialog';

type EquipamentoFotoFieldProps = {
  label?: string;
  patrimonio: string;
  tipoNome?: string | null;
  currentFotoUrl?: string | null;
  value: File | null;
  onChange: (file: File | null) => void;
  className?: string;
};

export function EquipamentoFotoField({
  label = 'Foto do equipamento',
  patrimonio,
  tipoNome,
  currentFotoUrl,
  value,
  onChange,
  className,
}: EquipamentoFotoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);

  useEffect(() => {
    if (!value) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(value);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const displayUrl = previewUrl ?? currentFotoUrl ?? null;

  const resetCropState = () => {
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
    }
    setCropImageSrc(null);
    setPendingFile(null);
  };

  const handleCropDialogOpenChange = (open: boolean) => {
    setCropOpen(open);
    if (!open) {
      resetCropState();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';

    if (!file) {
      return;
    }

    resetCropState();
    setCropImageSrc(URL.createObjectURL(file));
    setPendingFile(file);
    setCropOpen(true);
  };

  const handleCropConfirm = (file: File) => {
    onChange(file);
    setCropOpen(false);
    resetCropState();
  };

  const handleRemove = () => {
    onChange(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Label>{label}</Label>
      <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 p-3">
        {displayUrl ? (
          <button
            type="button"
            onClick={() => setViewerOpen(true)}
            aria-label="Ver foto em tamanho maior"
            className="group relative size-16 shrink-0 overflow-hidden rounded-lg border border-border"
          >
            <img
              src={displayUrl}
              alt={tipoNome ?? patrimonio}
              className="size-16 object-cover transition-transform group-hover:scale-105"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/25">
              <ZoomIn className="size-4 text-white opacity-0 transition-opacity group-hover:opacity-100" />
            </span>
          </button>
        ) : (
          <EquipamentoThumbnail
            equipamento={{ patrimonio, tipo: { nome: tipoNome } }}
            size="md"
            className="size-16"
          />
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-xs text-muted-foreground">
            Tire uma foto no celular. Depois você pode dar zoom, girar e enquadrar.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              <Camera className="size-4" />
              {displayUrl ? 'Trocar foto' : 'Adicionar foto'}
            </Button>
            {value ? (
              <Button type="button" size="sm" variant="ghost" onClick={handleRemove}>
                <X className="size-4" />
                Remover
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <EquipamentoFotoCropDialog
        open={cropOpen}
        imageSrc={cropImageSrc}
        sourceFile={pendingFile}
        onOpenChange={handleCropDialogOpenChange}
        onConfirm={handleCropConfirm}
      />

      <EquipamentoFotoViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        imageUrl={displayUrl}
        title={tipoNome ?? patrimonio}
        subtitle={patrimonio}
      />
    </div>
  );
}

function buildEquipamentoFormData(
  fields: Record<string, string | number | boolean>,
  foto?: File | null,
): FormData {
  const formData = new FormData();

  Object.entries(fields).forEach(([key, value]) => {
    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0');
      return;
    }

    formData.append(key, String(value));
  });

  if (foto) {
    formData.append('foto', foto);
  }

  return formData;
}

export function buildEquipamentoStoreFormData(payload: {
  patrimonio: string;
  tipo_id: number;
  fornecedor_id: number;
  obra_id: number;
  valor_mensal: number;
  data_entrada: string;
  is_critico: boolean;
  foto?: File | null;
}): FormData {
  const { foto, ...fields } = payload;
  return buildEquipamentoFormData(fields, foto);
}

export function buildEquipamentoUpdateFormData(payload: {
  patrimonio: string;
  tipo_id: number;
  fornecedor_id: number;
  obra_id: number;
  valor_mensal: number;
  is_critico: boolean;
  foto?: File | null;
}): FormData {
  const { foto, ...fields } = payload;
  return buildEquipamentoFormData(fields, foto);
}
