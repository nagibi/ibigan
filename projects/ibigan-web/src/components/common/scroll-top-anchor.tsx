/** Anchor for IntersectionObserver — when it leaves the scroll viewport, show scroll-to-top. */
export function ScrollTopAnchor() {
  return (
    <div
      data-scroll-top-anchor=""
      className="pointer-events-none h-px w-full shrink-0"
      aria-hidden
    />
  );
}
