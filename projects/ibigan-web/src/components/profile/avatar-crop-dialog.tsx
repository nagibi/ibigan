import { useCallback, useEffect, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Crop, LoaderCircle, RotateCw } from 'lucide-react';
import { DialogPanelTitle } from '@/components/common/panel-title';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { Slider, SliderThumb } from '@/components/ui/slider';
import {
  blobToFile,
  getCroppedImageBlob,
  resolveAvatarFileName,
  resolveAvatarMimeType,
} from '@/lib/crop-image';

type AvatarCropDialogProps = {
  open: boolean;
  imageSrc: string | null;
  sourceFile?: File | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (file: File, previewUrl: string) => void;
  isUploading?: boolean;
};

export function AvatarCropDialog({
  open,
  imageSrc,
  sourceFile,
  onOpenChange,
  onConfirm,
  isUploading = false,
}: AvatarCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!open) return;

    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setRotation(0);
    setCroppedAreaPixels(null);
    setIsProcessing(false);
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_croppedArea: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!imageSrc || !croppedAreaPixels || !sourceFile) return;

    setIsProcessing(true);

    try {
      const mimeType = resolveAvatarMimeType(sourceFile);
      const blob = await getCroppedImageBlob(imageSrc, croppedAreaPixels, mimeType, 0.9, rotation);
      const file = blobToFile(
        blob,
        resolveAvatarFileName(sourceFile.name, mimeType),
      );
      const previewUrl = URL.createObjectURL(blob);
      onConfirm(file, previewUrl);
    } finally {
      setIsProcessing(false);
    }
  };

  const isBusy = isProcessing || isUploading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogPanelTitle icon={Crop}>Ajustar foto</DialogPanelTitle>
        </DialogHeader>

        <div className="relative h-64 w-full overflow-hidden rounded-lg bg-muted">
          {imageSrc ? (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onCropComplete}
            />
          ) : null}
        </div>

        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground shrink-0 text-xs">Zoom</span>
            <Slider
              value={[zoom]}
              min={1}
              max={3}
              step={0.05}
              onValueChange={(value) => setZoom(value[0] ?? 1)}
            >
              <SliderThumb />
            </Slider>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground shrink-0 text-xs">Girar</span>
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={(value) => setRotation(value[0] ?? 0)}
            >
              <SliderThumb />
            </Slider>
            <Button
              type="button"
              variant="outline"
              mode="icon"
              size="sm"
              className="shrink-0"
              aria-label="Girar 90 graus"
              onClick={() => setRotation((current) => (current + 90) % 360)}
              disabled={isBusy}
            >
              <RotateCw className="size-4" />
            </Button>
          </div>
        </div>

        <DialogFooter className="gap-2.5">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
            disabled={isBusy}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => void handleConfirm()}
            disabled={!croppedAreaPixels || isBusy}
          >
            {isBusy ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : null}
            Salvar foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
