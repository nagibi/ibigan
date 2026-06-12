import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToolbarTooltip } from '@/components/grid/toolbar-tooltip';
import { cn } from '@/lib/utils';

const SCROLL_CONTAINER_SELECTOR = '.page-content-scroll';
const VISIBILITY_OFFSET = 320;

export function ScrollToTopButton() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const scrollContainer = document.querySelector<HTMLElement>(SCROLL_CONTAINER_SELECTOR);
    if (!scrollContainer) {
      return undefined;
    }

    const handleScroll = () => {
      setVisible(scrollContainer.scrollTop > VISIBILITY_OFFSET);
    };

    handleScroll();
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, []);

  function scrollToTop() {
    document.querySelector<HTMLElement>(SCROLL_CONTAINER_SELECTOR)?.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  return (
    <ToolbarTooltip content={t('common.scroll_to_top')}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        mode="icon"
        aria-label={t('common.scroll_to_top')}
        onClick={scrollToTop}
        className={cn(
          'fixed end-5 bottom-5 z-40 size-10 rounded-full shadow-md transition-all duration-200',
          visible
            ? 'pointer-events-auto translate-y-0 opacity-100'
            : 'pointer-events-none translate-y-2 opacity-0',
        )}
      >
        <ArrowUp className="size-4" />
      </Button>
    </ToolbarTooltip>
  );
}
