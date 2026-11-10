import {gsap} from 'gsap';

// The seven layers contract symmetrically around Promotions & Bonuses.
// Timeline progress follows section entry; no timer or automatic playback.
export const assemblyTiming = {reveal: .8, pairStart: 1.5, pairStagger: .8, settle: .4};

export function createAssemblyTimeline(buttons: HTMLElement[], complete: () => void, canvas?: HTMLElement) {
  const timeline = gsap.timeline({paused: true, onComplete: complete});
  const center = Math.floor(buttons.length / 2);
  const height = canvas?.offsetHeight || canvas?.getBoundingClientRect().height || 480;
  const gap = height * .3;
  // Lower layers start below their slots; upper layers start above them.
  // The center is fixed, and the resting coordinates are never rewritten.
  gsap.set(buttons, {y: i => (i - center) * gap, scaleY: 1, opacity: 0});
  // Keep the center fixed so both halves move towards it.
  if (canvas) gsap.set(canvas, {scale: 1, y: 0, transformOrigin: '50% 50%'});
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

// Top-to-bottom order follows the supplied product sequence.
const layers = [
  ['sports-content-v2', 'Sports Content', 'Fixtures, markets, live data and results mapped into one sports hierarchy.', -40],
  ['trading-v2', 'Trading', 'Management of odds, margins, market rules and betting limits.', 16],
  ['risk-management-v2', 'Risk Management', 'Bet acceptance, stake limits and open liability monitoring.', 45],
  ['promotions-bonuses-v2', 'Promotions & Bonuses', 'Tools for boosts, bonus campaigns, bet cards and rewards.', 100],
  ['frontend-v2', 'Frontend', 'Player-facing sportsbook widgets configured for each brand.', 175],
  ['back-office-v2', 'Back Office', 'Operator tools for configuring content, themes, trading, risk and promotions.', 263],
  ['operations-v2', '24/7 Operations', 'Round-the-clock feed monitoring, settlement and bet operations.', 290],
] as const;

const layerWidth = 1120;
const layerLeft = (998 - layerWidth) / 2;

export function createTurnkeyStack() {
  const root = document.createElement('div');
  root.className = 'solution-img is-active turnkey-stack';
  root.dataset.panel = '0';
  root.setAttribute('aria-label', 'Explore the seven components of Turnkey Sportsbook');
  root.innerHTML = `<div class="turnkey-stack-canvas">${layers.map(([file, title, , top], i) =>
    `<button type="button" aria-label="${title}" aria-describedby="turnkey-layer-tip" class="turnkey-layer" data-layer="${i}" style="--layer:${layers.length - 1 - i};--offset:${i - 3};left:${layerLeft / 998 * 100}%;top:${top / 994 * 100}%;width:${layerWidth / 998 * 100}%;aspect-ratio:1"><img src="/premium-media/turnkey/${file}.png" alt="" width="4096" height="4096" decoding="async" draggable="false"></button>`).join('')}
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
  let state: 'idle' | 'assembling' | 'ready' = 'idle', active = -1, disposed = false;
  let assembly: gsap.core.Timeline | undefined, frame = 0, loaded = false;
  let restoreAnimation: gsap.core.Tween | undefined;
  let initialPositionApplied = false;
  const setExpanded = (expanded: boolean) => root.classList.toggle('is-expanded', expanded);
  const setActive = (index: number) => {
    if (state !== 'ready' || active === index) return;
    const switching = active >= 0 && index >= 0;
    const opacity = buttons.map(button => parseFloat(getComputedStyle(button).opacity));
    active = index;
    // Retain the current interpolated opacity when a fast pointer move
    // reverses the previous tween. CSS handles only lift and brightness.
    gsap.set(buttons, {opacity: i => opacity[i]});
    root.classList.toggle('has-active-layer', index >= 0);
    buttons.forEach((button, i) => button.classList.toggle('is-highlighted', i === index));
    gsap.to(buttons, {opacity: i => index < 0 || i === index ? 1 : .5, duration: query.matches ? 0 : switching ? .225 : .3, ease: 'power2.out', overwrite: 'auto'});
    tooltip.classList.toggle('is-visible', index >= 0);
    if (index < 0) return;
    tooltip.querySelector('strong')!.textContent = layers[index][1];
    const description = tooltip.querySelector<HTMLElement>('span')!;
    description.textContent = layers[index][2];
    description.hidden = !layers[index][2];
    // Anchor to the exposed front face; keep the bubble within the viewport.
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(142 - rect.left, Math.min(rect.width / 2, innerWidth - rect.left - 142));
    const layerRect = buttons[index].getBoundingClientRect();
    const mask = masks[index];
    let firstRow = 0;
    if (mask) {
      for (let offset = 3; offset < mask.data.length; offset += 4) {
        if (mask.data[offset] > 80) {firstRow = Math.floor((offset - 3) / 1024); break;}
      }
    }
    const anchor = layerRect.top - rect.top + layerRect.height * firstRow / 256 - 20;
    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${anchor}px`;
  };
  const finish = () => {
    restoreAnimation?.kill(); restoreAnimation = undefined;
    assembly?.kill();
    state = 'ready'; root.dataset.assembly = state;
    gsap.set(buttons, {clearProps: 'transform,opacity'});
    gsap.set(canvas, {clearProps: 'transform,transformOrigin'});
    buttons.forEach(button => {if (button.tagName === 'BUTTON') button.tabIndex = 0;});
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
    if (restoreAnimation) return;
    if (!initialPositionApplied) {
      initialPositionApplied = true;
      if (progress > 0 && container.getBoundingClientRect().bottom > 0) {
        // Replay assembly at a restored scroll position without moving the page.
        state = 'assembling';
        root.dataset.assembly = state;
        restoreAnimation = gsap.to(assembly!, {
          progress, duration: 2.4, ease: 'none',
          onComplete: () => {restoreAnimation = undefined; update();},
        });
        return;
      }
    }
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
  const move = (event: PointerEvent) => {
    if (state !== 'ready' || !root.classList.contains('is-active')) return;
    const rect = canvas.getBoundingClientRect();
    const expanded = root.classList.contains('is-expanded');
    // A generous envelope keeps the layers open while the pointer crosses gaps.
    const pad = rect.width * .28;
    if (expanded && (event.clientX < rect.left - pad || event.clientX > rect.right + pad ||
        event.clientY < rect.top - pad || event.clientY > rect.bottom + pad * 2)) {
      setExpanded(false);
      setActive(-1);
      return;
    }
    let hit = -1;
    for (let i = 0; i < layers.length; i++) {
      const layerRect = buttons[i].getBoundingClientRect();
      const px = Math.floor((event.clientX - layerRect.left) / layerRect.width * 256);
      const py = Math.floor((event.clientY - layerRect.top) / layerRect.height * 256);
      if (px >= 0 && px < 256 && py >= 0 && py < 256 && (!masks[i] || masks[i]!.data[(py * 256 + px) * 4 + 3] > 80)) {hit = i; break;}
    }
    if (hit >= 0) setExpanded(true);
    setActive(hit);
  };
  const leave = () => {
    setExpanded(false);
    setActive(-1);
  };
  const focus = (event: FocusEvent) => {
    const button = (event.target as HTMLElement).closest<HTMLElement>('[data-layer]');
    if (button?.tagName === 'BUTTON') {setExpanded(true); setActive(Number(button.dataset.layer));}
  };
  const blur = (event: FocusEvent) => {if (!root.contains(event.relatedTarget as Node)) leave();};
  const reduced = () => {layout(); if (query.matches) finish();};
  const selection = new MutationObserver(() => {if (!root.classList.contains('is-active')) {leave(); if (state === 'assembling') finish();}});
  selection.observe(root, {attributes: true, attributeFilter: ['class']});
  window.addEventListener('pointermove', move); document.addEventListener('pointerleave', leave);
  root.addEventListener('focusin', focus); root.addEventListener('focusout', blur); query.addEventListener('change', reduced);
  if (query.matches) finish();
  return () => {
    if (sectionStyle === null) container.removeAttribute('style'); else container.setAttribute('style', sectionStyle);
    if (stageStyle === null) stage.removeAttribute('style'); else stage.setAttribute('style', stageStyle);
    disposed = true; cancelAnimationFrame(frame); restoreAnimation?.kill(); assembly?.kill(); gsap.killTweensOf(buttons); selection.disconnect();
    window.removeEventListener('scroll', schedule); window.removeEventListener('resize', resize);
    window.removeEventListener('pointermove', move); document.removeEventListener('pointerleave', leave);
    root.removeEventListener('focusin', focus); root.removeEventListener('focusout', blur); query.removeEventListener('change', reduced);
  };
}
