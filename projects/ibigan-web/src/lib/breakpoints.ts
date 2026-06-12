/** Viewports below this width use mobile layout (cards, icon toolbar, bottom sheets). */
export const MOBILE_BREAKPOINT_PX = 1280;

export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`;

export function getIsMobileViewport(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.matchMedia(MOBILE_MEDIA_QUERY).matches;
}
