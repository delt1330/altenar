const colors = ['Blue', 'Orange', 'Yellow', 'Green'];
export function createWhiteLabel() {
  const root = document.createElement('div');
  root.className = 'solution-img glow-white-label'; root.dataset.panel = '2';
  root.setAttribute('aria-label', 'White Label colour variants');
  root.innerHTML = `<div class="white-label-stack">${colors.map((color, i) => `<img class="white-label-layer" data-index="${i}" src="/glow-media/white-label/${color}.png" alt="${color} White Label" draggable="false" style="--i:${i}">`).join('')}${colors.slice(1).map((color, i) => `<button type="button" class="white-label-hit" aria-label="${color} White Label" style="--i:${i}"></button>`).join('')}</div>`;
  return root;
}
export function setupWhiteLabel(container: HTMLElement) {
  const root = container.querySelector<HTMLElement>('.glow-white-label')!;
  const stack = root.querySelector<HTMLElement>('.white-label-stack')!;
  const hits = [...root.querySelectorAll<HTMLButtonElement>('.white-label-hit')];
  let timer = 0, selected = false;
  const clear = () => {root.classList.remove('is-open'); root.removeAttribute('data-selected');};
  const enter = () => {if (root.classList.contains('is-active')) root.classList.add('is-open');};
  const select = (index: number) => {enter(); root.dataset.selected = String(index + 1);};
  const bindings = hits.map((hit, index) => {
    const on = () => select(index), off = () => root.removeAttribute('data-selected');
    hit.addEventListener('pointerenter', on); hit.addEventListener('pointerleave', off);
    hit.addEventListener('focus', on); hit.addEventListener('blur', off);
    return () => {hit.removeEventListener('pointerenter', on);hit.removeEventListener('pointerleave', off);hit.removeEventListener('focus', on);hit.removeEventListener('blur', off);};
  });
  stack.addEventListener('pointerenter', enter); stack.addEventListener('pointerleave', clear);
  const observer = new MutationObserver(() => {
    const active = root.classList.contains('is-active');
    if (active === selected) return;
    selected = active;
    if (!active) {clear(); root.classList.remove('is-assembling'); clearTimeout(timer); return;}
    root.classList.remove('is-assembling'); void root.offsetWidth;
    root.classList.add('is-assembling'); timer = window.setTimeout(() => root.classList.remove('is-assembling'), 1800);
  });
  observer.observe(root, {attributes:true, attributeFilter:['class']});
  return () => {clearTimeout(timer); observer.disconnect();stack.removeEventListener('pointerenter', enter);stack.removeEventListener('pointerleave', clear);bindings.forEach(fn=>fn());};
}
