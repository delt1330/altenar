import {gsap} from 'gsap';

// The exploded view contracts symmetrically around Trading.
// Timeline progress follows section entry; no timer or automatic playback.
export const assemblyTiming = {reveal: .8, pairStart: 1.5, pairStagger: .8, settle: .4};

export function createAssemblyTimeline(buttons: HTMLElement[], complete: () => void, canvas?: HTMLElement) {
  const timeline = gsap.timeline({paused: true, onComplete: complete});
  const center = Math.floor(buttons.length / 2);
  const height = canvas?.offsetHeight || canvas?.getBoundingClientRect().height || 480;
  const gap = height * .3;
  // Lower layers start below their slots; upper layers start above them.
  // The center is fixed, and the resting coordinates are never rewritten.
  gsap.set(buttons, {y: i => (center - i) * gap, scaleY: 1, opacity: 0});
  // Keep the final scale throughout; separated layers may overlap headings.
  if (canvas) gsap.set(canvas, {scale: 1, transformOrigin: '50% 50%'});
  timeline.to(buttons, {opacity: 1, duration: assemblyTiming.reveal, ease: 'power2.out', stagger: {each: .025, from: 'center'}}, 0);

  const pulses=buttons.map((button,i)=>{
    button.querySelector('.glow-assembly-pulse')?.remove();
    const img=button.querySelector<HTMLImageElement>('img')!,ns='http://www.w3.org/2000/svg';
    const svg=document.createElementNS(ns,'svg');svg.classList.add('glow-assembly-pulse');svg.setAttribute('viewBox','0 0 1276 1276');svg.setAttribute('aria-hidden','true');
    const unique=`glow-pulse-${i}-${Math.random().toString(36).slice(2)}`;
    svg.innerHTML=`<defs><filter id="${unique}-edge" x="-5%" y="-5%" width="110%" height="110%"><feMorphology in="SourceAlpha" operator="dilate" radius="8" result="expanded"/><feComposite in="expanded" in2="SourceAlpha" operator="out" result="edge"/><feFlood flood-color="#d6fbff" flood-opacity="1" result="color"/><feComposite in="color" in2="edge" operator="in" result="light"/><feGaussianBlur in="light" stdDeviation="4" result="glow"/><feMerge><feMergeNode in="glow"/><feMergeNode in="light"/></feMerge></filter><linearGradient id="${unique}-light" x1="-60%" y1="0%" x2="-20%" y2="0%"><stop offset="0" stop-color="black"/><stop offset=".5" stop-color="white"/><stop offset="1" stop-color="black"/></linearGradient><mask id="${unique}-mask" mask-type="luminance"><rect width="1276" height="1276" fill="url(#${unique}-light)"/></mask></defs><image width="1276" height="1276" href="${img.getAttribute('src')}" filter="url(#${unique}-edge)" mask="url(#${unique}-mask)"/>`;
    button.append(svg);return svg.querySelector('linearGradient')!;
  });
  const pulse=(pair:Element[],at:number)=>timeline.fromTo(pair,{attr:{x1:'-60%',x2:'-20%'}},{attr:{x1:'120%',x2:'160%'},duration:3.49,ease:'sine.inOut'},at);
  pulse([pulses[center]],.8);
  timeline.addLabel('exploded', .8);
  // A readable exploded hold before the first opposing pair starts closing.
  for (let distance = 1; distance <= center; distance++) {
    const start = assemblyTiming.pairStart + (distance - 1) * assemblyTiming.pairStagger;
    const duration = distance === 1 ? 2.8 : distance === 2 ? 2.9 : 3.0;
    const pair = [buttons[center - distance], buttons[center + distance]].filter(Boolean);
    timeline.addLabel(`pair-${distance}`, start);
    timeline.to(pair, {y: 0, duration, ease: 'power1.inOut'}, start);pulse([pulses[center-distance],pulses[center+distance]].filter(Boolean),start+duration-.12);
  }
  timeline.addLabel('assembled', 6.1);
  timeline.to({}, {duration: assemblyTiming.settle}, 'assembled');
  return timeline;
}

const layers = [
  ['glow-frontend-8e7da8de4df2', 'Frontend', 'The interface through which players interact with the product.', 242.5455, 1276.0000, 185.6204, 618.4545],
  ['glow-sports-content-5ae9b2466694', 'Sports Content', 'Sporting events and available betting options.', 204.4634, 1276.0000, 185.2003, 616.8795],
  ['glow-risk-management-5cfcf39eedb5', 'Risk Management', 'Control of risks, limits, and liabilities.', 168.8095, 1276.0000, 186.2405, 615.3124],
  ['trading-96f2811f88', 'Trading', 'Management of odds and betting markets.', 118.5513, 1276.0000, 185.1090, 618.9813],
  ['glow-operations-30b13353637b', '24/7 Operations', 'Round-the-clock operational support.', 84.8009, 1276.0000, 185.1319, 618.4545],
  ['glow-back-office-bd9ded9a6df0', 'Back Office & CMS', 'Tools for managing the product and its content.', 59.7219, 1276.0000, 184.5265, 621.0974],
  ['glow-altenar-7b3d78363793', 'Altenar', '', 18.6954, 1276.0000, 186.1089, 618.4545],
] as const;

export function createTurnkeyStack() {
  const root = document.createElement('div');
  root.className = 'solution-img is-active turnkey-stack';
  root.dataset.panel = '0';
  root.setAttribute('aria-label', 'Explore the six components of Turnkey Sportsbook');
  root.innerHTML = `<div class="turnkey-stack-canvas">${layers.map(([file, title, , top, height, left, width], i) =>
    `<${i === layers.length - 1 ? 'div aria-hidden="true"' : 'button type="button" aria-label="' + title + '" aria-describedby="turnkey-layer-tip"'} class="turnkey-layer" data-layer="${i}" style="--layer:${i};left:${left / 998 * 100}%;top:${top / 994 * 100}%;width:${width / 998 * 100}%;aspect-ratio:1276/${height}"><img src="/premium-media/turnkey/${file}.png" alt="" width="1276" height="${Math.round(height)}" decoding="async" draggable="false"></${i === layers.length - 1 ? 'div' : 'button'}>`).join('')}
    <div class="turnkey-tooltip" id="turnkey-layer-tip" role="tooltip"><strong></strong><span></span></div></div>`;
  return root;
}

export function setupTurnkeyStack(container: HTMLElement, stage: HTMLElement) {
  const root = container.querySelector<HTMLElement>('.turnkey-stack')!;
  const canvas = root.querySelector<HTMLElement>('.turnkey-stack-canvas')!;
  const buttons = Array.from(root.querySelectorAll<HTMLElement>('.turnkey-layer'));
  const tooltip = root.querySelector<HTMLElement>('.turnkey-tooltip')!;
  const query = matchMedia('(prefers-reduced-motion: reduce)');
  const sectionStyle = container.getAttribute('style');
  const stageStyle = stage.getAttribute('style');
  const layout = () => {
    // Keep the illustration in view for the full 2.25 viewport scrub distance.
    container.style.height = query.matches ? '100svh' : '280svh';
    stage.style.position = query.matches ? 'relative' : 'sticky';
    stage.style.top = '0px';
  };
  layout();
  const masks: (ImageData | undefined)[] = [];
  let state: 'idle' | 'assembling' | 'ready' = 'idle', active = -1, disposed = false, pointerInside = false;
  let assembly: gsap.core.Timeline | undefined, frame = 0, loaded = false;
  const setActive = (index: number) => {
    // The decorative cap never shows a component tooltip.
    if (index === layers.length - 1) index = -1;
    if (state !== 'ready' || active === index) return;
    const switching = active >= 0 && index >= 0;
    const opacity = buttons.map(button => parseFloat(getComputedStyle(button).opacity));
    active = index;
    // Retain the current interpolated opacity when a fast pointer move
    // reverses the previous tween. CSS handles only lift and brightness.
    gsap.set(buttons, {opacity: i => opacity[i]});
    root.classList.toggle('has-active-layer', index >= 0);
    buttons.forEach((button, i) => button.classList.toggle('is-highlighted', i === index));
    gsap.to(buttons, {opacity: i => i === layers.length - 1 && root.classList.contains('is-exploring') ? 0 : index < 0 || i === index ? 1 : .5, duration: query.matches ? 0 : switching ? .225 : .3, ease: 'power2.out', overwrite: 'auto'});
    tooltip.classList.toggle('is-visible', index >= 0);
    if (index < 0) return;
    tooltip.querySelector('strong')!.textContent = layers[index][1];
    const description = tooltip.querySelector<HTMLElement>('span')!;
    description.textContent = layers[index][2];
    description.hidden = !layers[index][2];
    // Anchor to the exposed front face; keep the bubble within the viewport.
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(142 - rect.left, Math.min(rect.width / 2, innerWidth - rect.left - 142));
    const anchor = (Number(layers[index][3]) + Number(layers[index][4]) * Number(layers[index][6]) / 1276 - 115) / 994 * rect.height;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${Math.max(tooltip.offsetHeight + 12 - rect.top, anchor)}px`;
  };
  const finish = () => {
    assembly?.kill();
    state = 'ready'; root.dataset.assembly = state;
    gsap.set(buttons, {clearProps: 'transform,opacity'});
    gsap.set(canvas, {clearProps: 'transform,transformOrigin'});
    buttons.forEach(button => {if (button.tagName === 'BUTTON') button.tabIndex = 0;});
    if (pointerInside) enter();
  };
  buttons.forEach(button => {if (button.tagName === 'BUTTON') button.tabIndex = -1;});
  // Alpha masks make only the visible PNG surface interactive. Hit testing
  // uses the resting stack, so raising a selected layer cannot cause flicker.
  const loads = buttons.map(async (button, i) => {
    const img = button.querySelector('img')!;
    try {
      await img.decode();
      if (disposed) return;
      const sample = document.createElement('canvas'); sample.width = 256; sample.height = 256;
      const context = sample.getContext('2d', {willReadFrequently: true})!;
      context.drawImage(img, 0, 0, 256, 256); masks[i] = context.getImageData(0, 0, 256, 256);
    } catch { /* Keep the remaining layers and keyboard exploration available. */ }
  });
  // Reveal on entry, then assemble over 2.25 viewport heights. Scroll changes only this
  // assembly; product tabs remain click-only. Completed stacks stay assembled.
  const update = () => {
    frame = 0;
    if (disposed || !loaded || state === 'ready') return;
    if (query.matches) {finish(); return;}
    const top = container.getBoundingClientRect().top;
    const progress = Math.max(0, Math.min(1, (innerHeight * .65 - top) / (innerHeight * 2.25)));
    state = 'assembling'; root.dataset.assembly = state;
    assembly?.progress(progress);
  };
  const schedule = () => {if (!frame) frame = requestAnimationFrame(update);};
  const resize = () => {
    if (state !== 'ready' && loaded) {
      assembly?.kill();
      assembly = createAssemblyTimeline(buttons, finish, canvas);
    }
    schedule();
  };
  Promise.all(loads).then(() => {
    if (disposed || state === 'ready') return;
    loaded = true;
    root.classList.add('is-assembling');
    assembly = createAssemblyTimeline(buttons, finish, canvas);
    update();
  });
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', resize);
  const enter = () => {
    pointerInside = true;
    if (state !== 'ready' && root.classList.contains('is-active')) finish();
    if (state !== 'ready' || !root.classList.contains('is-active')) return;
    root.classList.add('is-exploring');
    gsap.to(buttons.at(-1)!, {opacity: 0, duration: query.matches ? 0 : .25, ease: 'power2.out', overwrite: 'auto'});
  };
  const move = (event: PointerEvent) => {
    if (state !== 'ready' || !root.classList.contains('is-active')) return;
    if (!root.classList.contains('is-exploring')) enter();
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width * 998;
    const y = (event.clientY - rect.top) / rect.height * 994;
    let hit = -1;
    for (let i = layers.length - 1; i >= 0; i--) {
      if (i === layers.length - 1) continue;
      const px = Math.floor((x - Number(layers[i][5])) / Number(layers[i][6]) * 256);
      const py = Math.floor((y - Number(layers[i][3])) / (Number(layers[i][4]) * Number(layers[i][6]) / 1276) * 256);
      if (px >= 0 && px < 256 && py >= 0 && py < 256 && (!masks[i] || masks[i]!.data[(py * 256 + px) * 4 + 3] > 80)) {hit = i; break;}
    }
    setActive(hit);
  };
  const leave = () => {
    pointerInside = false;
    if (root.classList.contains('is-exploring')) root.classList.remove('is-exploring');
    setActive(-1);
    if (state === 'ready') gsap.to(buttons.at(-1)!, {opacity: 1, duration: query.matches ? 0 : .3, ease: 'power2.out', overwrite: 'auto'});
  };
  const focus = (event: FocusEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-layer]');
    if (button?.tagName === 'BUTTON') {enter(); setActive(Number(button.dataset.layer));}
  };
  const blur = (event: FocusEvent) => {if (!root.contains(event.relatedTarget as Node)) leave();};
  const reduced = () => {layout(); if (query.matches) finish();};
  const selection = new MutationObserver(() => {if (!root.classList.contains('is-active')) {leave(); if (state === 'assembling') finish();}});
  selection.observe(root, {attributes: true, attributeFilter: ['class']});
  const pointerHit=(event:PointerEvent)=>{enter();move(event);};
  root.addEventListener('pointerenter', pointerHit); root.addEventListener('pointermove', move); root.addEventListener('pointerleave', leave);
  root.addEventListener('focusin', focus); root.addEventListener('focusout', blur); query.addEventListener('change', reduced);
  if (query.matches) finish();
  return () => {
    if (sectionStyle === null) container.removeAttribute('style'); else container.setAttribute('style', sectionStyle);
    if (stageStyle === null) stage.removeAttribute('style'); else stage.setAttribute('style', stageStyle);
    disposed = true; cancelAnimationFrame(frame); assembly?.kill(); gsap.killTweensOf(buttons); selection.disconnect();
    window.removeEventListener('scroll', schedule); window.removeEventListener('resize', resize);
    root.removeEventListener('pointerenter', pointerHit); root.removeEventListener('pointermove', move); root.removeEventListener('pointerleave', leave);
    root.removeEventListener('focusin', focus); root.removeEventListener('focusout', blur); query.removeEventListener('change', reduced);
  };
}
