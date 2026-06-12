import * as React from 'react';
import { getIsMobileViewport, MOBILE_MEDIA_QUERY } from '@/lib/breakpoints';

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(getIsMobileViewport);

  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => {
      setIsMobile(mql.matches);
    };

    mql.addEventListener('change', onChange);
    setIsMobile(mql.matches);

    return () => mql.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
