import { RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ToolbarTooltip } from '@/components/grid/toolbar-tooltip';

interface GridResetControlProps {
  disabled?: boolean;
  onReset: () => void;
}

export function GridResetControl({ disabled, onReset }: GridResetControlProps) {
  const { t } = useTranslation();

  return (
    <ToolbarTooltip content={t('grid.tooltip.reset')}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs font-medium"
        disabled={disabled}
        onClick={onReset}
      >
        <RotateCcw className="size-3.5 shrink-0" />
        {t('grid.reset')}
      </Button>
    </ToolbarTooltip>
  );
}
