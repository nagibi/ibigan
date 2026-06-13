import { ChevronFirst } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useSettings } from '@/providers/settings-provider';
import { Button } from '@/components/ui/button';

export function SidebarCollapseToggle() {
  const { t } = useTranslation();
  const { settings, storeOption } = useSettings();
  const collapsed = settings.layouts.demo1.sidebarCollapse;
  const label = collapsed ? t('sidebar.tooltip.expand') : t('sidebar.tooltip.collapse');

  return (
    <Button
      onClick={() => storeOption('layouts.demo1.sidebarCollapse', !collapsed)}
      size="sm"
      mode="icon"
      variant="outline"
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'absolute start-full top-1/2 z-10 hidden size-7 -translate-x-1/2 -translate-y-1/2 lg:inline-flex rtl:translate-x-1/2',
        collapsed ? 'ltr:rotate-180' : 'rtl:rotate-180',
      )}
    >
      <ChevronFirst className="size-4!" />
    </Button>
  );
}
