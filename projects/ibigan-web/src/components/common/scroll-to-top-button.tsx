import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="primary"
          size="sm"
          mode="icon"
          shape="circle"
          aria-label={t('common.scroll_to_top')}
          onClick={scrollToTop}
          className={cn(
            'fixed end-4 bottom-4 z-40 size-8 shadow-md ring-1 ring-primary/25',
            'transition-all duration-200 hover:shadow-lg active:scale-95',
            visible
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-2 opacity-0',
          )}
        >
          <ArrowUp className="size-3.5" strokeWidth={2.25} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" variant="light" sideOffset={8}>
        {t('common.scroll_to_top')}
      </TooltipContent>
    </Tooltip>
  );
}
