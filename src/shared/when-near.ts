// Heavy below-the-fold media must not compete with the first screen, but must
// still be ready before the visitor scrolls to it: scroll-driven intros wait
// for their images. So `load` runs once, whichever comes first:
//  - the first screen is done (window load, then an idle moment), or
//  - the element comes within `margin` of the viewport.
export function afterFirstScreen(run: () => void) {
  const idle = () => ('requestIdleCallback' in window ? requestIdleCallback(() => run(), {timeout: 1500}) : setTimeout(run, 300));
  if (document.readyState === 'complete') idle(); else window.addEventListener('load', idle, {once: true});
}

export function whenNear(element: Element, load: () => void, margin = '200% 0px') {
  let done = false;
  const once = () => { if (done) return; done = true; observer?.disconnect(); load(); };
  const observer = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) once();
  }, {rootMargin: margin});
  observer?.observe(element);
  afterFirstScreen(once);
}

// <img loading="lazy"> waits for the viewport; switch them to eager after the first screen.
export function eagerAfterFirstScreen(images: Iterable<HTMLImageElement>) {
  const list = [...images];
  afterFirstScreen(() => list.forEach(img => { img.loading = 'eager'; }));
}
