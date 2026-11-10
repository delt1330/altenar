// Preserve each existing border colour and lower only its alpha.
export function softenBorders() {
  const seen = new WeakSet<Element>();
  const apply = (root: ParentNode) => {
    const elements = root instanceof Element ? [root, ...root.querySelectorAll('*')] : [...root.querySelectorAll('*')];
    for (const el of elements) {
      if (!(el instanceof HTMLElement) || seen.has(el)) continue;
      seen.add(el);
      const style = getComputedStyle(el);
      for (const side of ['top','right','bottom','left'] as const) {
        if (style.getPropertyValue(`border-${side}-style`) === 'none' || parseFloat(style.getPropertyValue(`border-${side}-width`)) === 0) continue;
        const color = style.getPropertyValue(`border-${side}-color`);
        if (color === 'transparent' || color === 'rgba(0, 0, 0, 0)') continue;
        el.style.setProperty(`border-${side}-color`, `color-mix(in srgb, ${color} 80%, transparent)`, 'important');
      }
    }
  };
  const start = () => {apply(document.body);const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {if (node instanceof Element) apply(node);})));observer.observe(document.body,{childList:true,subtree:true});};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
}
