import { LayoutTemplate } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ToolbarTooltip } from '@/components/grid/toolbar-tooltip';

interface GridResetControlProps {
  disabled?: boolean;
  onReset: () => void;
}

export function GridResetControl({ disabled, onReset }: GridResetControlProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  return (
    <ToolbarTooltip content={t('grid.tooltip.reset')}>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        mode={isMobile ? 'icon' : 'default'}
        aria-label={t('grid.reset')}
        className={cn(
          'shrink-0',
          isMobile ? 'size-8' : 'h-8 gap-1.5 px-2 text-xs font-medium',
        )}
        disabled={disabled}
        onClick={onReset}
      >
        <LayoutTemplate className="size-3.5 shrink-0" />
        {!isMobile && t('grid.reset')}
      </Button>
    </ToolbarTooltip>
  );
}
