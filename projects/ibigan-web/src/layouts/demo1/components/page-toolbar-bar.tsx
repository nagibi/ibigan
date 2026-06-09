import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { usePageToolbarConfig } from '@/providers/page-toolbar-provider';
import { Container } from '@/components/common/container';

export function PageToolbarBar() {
  const config = usePageToolbarConfig();
  const hasActions = Boolean(config?.actions);

  useEffect(() => {
    document.body.classList.toggle('toolbar-visible', hasActions);
    return () => document.body.classList.remove('toolbar-visible');
  }, [hasActions]);

  if (!hasActions) {
    return null;
  }

  return (
    <div
      className={cn(
        'page-toolbar fixed z-[9] flex shrink-0 border-b border-border bg-background end-0 start-0',
        'top-[var(--header-height)] min-h-[var(--toolbar-height)]',
      )}
    >
      <Container className="flex w-full items-center justify-end gap-2 py-2">
        {config?.actions}
      </Container>
    </div>
  );
}
