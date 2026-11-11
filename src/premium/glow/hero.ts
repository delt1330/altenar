import './hero.css';

// The Turnkey product's texture, line positions and timing, reused for the homepage.
export function setupCenteredHero(glowLayer:HTMLElement){
  const hero=document.querySelector<HTMLElement>('[data-name="section-hero"]')!;
  const stage=hero.querySelector<HTMLElement>('[data-name="hero__stage"]')!;
  const media=stage.querySelector<HTMLElement>('.premium-hero-background')!;
  const main=stage.querySelector<HTMLElement>('[data-name="hero__main"]')!;
  const aside=stage.querySelector<HTMLElement>('[data-name="hero__aside"]')!;
  const heading=main.querySelector<HTMLElement>('[data-node-id="4001:111760"]')!;
  const originalTitle=heading.innerHTML;
  heading.innerHTML='Stability meets<br>flexibility';
  const copy=document.createElement('div');copy.className='glow-centered-hero-copy';
  stage.append(copy);copy.append(main,aside);
  // The texture follows the hero, but the shared Glow canvas always stays fixed
  // under the whole page. No section can crop or resize the dynamic field.
  const underlay=document.createElement('div');underlay.className='glow-hero-underlay';
  underlay.setAttribute('aria-hidden','true');glowLayer.before(underlay);underlay.append(media);
  media.innerHTML='<img class="glow-hero-reference" src="/glow-media/hero-blue-gradient.webp" alt="" fetchpriority="high">';
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let frame=0;
  const update=()=>{
    frame=0;
    const rect=hero.getBoundingClientRect(),height=Math.max(1,rect.height);
    const visible=rect.bottom>0&&rect.top<innerHeight;
    underlay.style.height=`${height}px`;
    underlay.style.transform=`translate3d(0,${rect.top}px,0)`;
    underlay.style.visibility=visible?'visible':'hidden';
    if(visible)glowLayer.dataset.heroOverlay='true';else delete glowLayer.dataset.heroOverlay;
    const p=Math.max(0,Math.min(1,(-rect.top/height-.15)/.65));
    media.style.opacity=String(1-p*p*(3-2*p));
    media.classList.toggle('is-active',rect.bottom>0&&rect.top<innerHeight&&!document.hidden&&!motion.matches);
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const observer=new IntersectionObserver(schedule,{threshold:0});observer.observe(hero);
  window.addEventListener('scroll',schedule,{passive:true});window.addEventListener('resize',schedule);
  document.addEventListener('visibilitychange',schedule);motion.addEventListener('change',schedule);update();
  const layoutTimers = [window.setTimeout(schedule, 1600), window.setTimeout(schedule, 3200)];
  return()=>{
    layoutTimers.forEach(clearTimeout);cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);
    document.removeEventListener('visibilitychange',schedule);motion.removeEventListener('change',schedule);
    media.replaceChildren();media.style.removeProperty('opacity');media.classList.remove('is-active');
    delete glowLayer.dataset.heroOverlay;stage.prepend(media);underlay.remove();
    stage.append(main,aside);copy.remove();heading.innerHTML=originalTitle;
  };
}
