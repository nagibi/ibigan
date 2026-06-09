import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface GridResetControlProps {
  disabled?: boolean;
  onReset: () => void;
}

export function GridResetControl({ disabled, onReset }: GridResetControlProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 px-2 text-xs font-medium"
      disabled={disabled}
      onClick={onReset}
      title="Restaurar grid ao padrão"
    >
      <RotateCcw className="size-3.5 shrink-0" />
      Restaurar
    </Button>
  );
}
