import {mountNavigation} from '../../shared/navigation';
import {setupCenteredHero} from './hero';
import {setupPartnershipCards} from './partnership';
import {connectTurnkeySolution} from './links';
type Glow = {destroy():void; refreshSections():void};
declare global {interface Window {AltenarGlow:new(target:HTMLElement,options:Record<string,unknown>)=>Glow; altenarPrototypeGlow?:Glow; lenis?:unknown}}

// Integration only: the supplied v4 renderer is shipped byte-for-byte unchanged.
export function setupGlow(){
  window.altenarPrototypeGlow?.destroy();
  document.getElementById('glow-background')?.remove();
  const disposeMenu=mountNavigation();
  const html=document.documentElement;
  html.dataset.altenarGlow='true';
  const background=document.createElement('div');
  background.id='glow-background';background.setAttribute('aria-hidden','true');
  document.body.prepend(background);
  const sections=[
    ['section-hero','0.15,0.34'],
    ['section-stats','0.02,0.15'],
    ['section-solutions','0.2,0.5'],
    ['section-markets','0.04,0.12'],
    ['section-news','0.05,0.11'],
    ['footer--window','0.03,0.06'],
  ];
  const marked:HTMLElement[]=[];
  sections.forEach(([name,weights])=>{
    const section=document.querySelector<HTMLElement>(`[data-name="${name}"]`);
    if(section){section.dataset.glowWeights=weights;marked.push(section);}
  });
  const active=document.querySelector<HTMLElement>('[data-name="section-solutions"]');
  if(active)active.dataset.glowActive='';
  // Keep dark copy legible on the new dark background. Light cards retain their
  // original ink; only text with no opaque light surface behind it is adapted.
  const ink:HTMLElement[]=[];
  const root=document.querySelector<HTMLElement>('.premium-page')!;
  root.querySelectorAll<HTMLElement>('p,h1,h2,h3,h4,a,button,label,span,li').forEach(el=>{
    if(el.closest('.premium-gradient')||!Array.from(el.childNodes).some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent?.trim()))return;
    const color=getComputedStyle(el).color.match(/[\d.]+/g)?.map(Number);
    if(!color||Math.max(...color.slice(0,3))>155)return;
    let light=false;
    for(let parent:HTMLElement|null=el;parent&&parent!==root;parent=parent.parentElement){
      const bg=getComputedStyle(parent).backgroundColor.match(/[\d.]+/g)?.map(Number);
      if(bg&&(!bg[3]||bg[3]>.5)&&bg.slice(0,3).every(v=>v>180)&&getComputedStyle(parent).backgroundColor!=='rgba(0, 0, 0, 0)'){light=true;break;}
    }
    if(!light){el.classList.add('glow-light-copy');ink.push(el);}
  });
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const disposeHero=setupCenteredHero(background);
  setupPartnershipCards();
  connectTurnkeySolution();
  // Draw one continuous outline following each existing news-card silhouette.
  const newsOutlines:SVGSVGElement[]=[];
  const newsSizer=new ResizeObserver(entries=>entries.forEach(entry=>{
    const card=entry.target as HTMLElement,svg=card.querySelector<SVGSVGElement>(':scope > .glow-news-outline');if(!svg)return;
    const w=card.clientWidth||entry.contentRect.width,h=card.clientHeight||entry.contentRect.height;if(!w||!h)return;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    const r=24;svg.firstElementChild!.setAttribute('d',`M ${r} .5 H ${w-r} Q ${w-.5} .5 ${w-.5} ${r} V ${h-64} C ${w-.5} ${h-57.37} ${w-5.37} ${h-52} ${w-12} ${h-52} H ${w-38.74} C ${w-43.35} ${h-52} ${w-47.37} ${h-48.84} ${w-48.46} ${h-44.36} L ${w-57.38} ${h-7.64} C ${w-58.46} ${h-3.16} ${w-62.48} ${h-.5} ${w-67.09} ${h-.5} H ${r} Q .5 ${h-.5} .5 ${h-r} V ${r} Q .5 .5 ${r} .5 Z`);
  }));
  document.querySelectorAll<HTMLElement>('[data-name="news-card-slant"]').forEach(card=>{
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('glow-news-outline');svg.setAttribute('aria-hidden','true');
    const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('fill','rgba(0,0,0,.2)');path.setAttribute('stroke','rgba(255,255,255,.2)');path.setAttribute('stroke-width','1');path.setAttribute('vector-effect','non-scaling-stroke');svg.append(path);card.prepend(svg);newsOutlines.push(svg);newsSizer.observe(card);
  });
  // Controls can mount later than the background, so keep their paint server here.
  const ns='http://www.w3.org/2000/svg',glassSvg=document.createElementNS(ns,'svg'),defs=document.createElementNS(ns,'defs'),gradient=document.createElementNS(ns,'linearGradient');
  glassSvg.setAttribute('width','0');glassSvg.setAttribute('height','0');glassSvg.setAttribute('aria-hidden','true');
  gradient.id='glow-faq-glass';gradient.setAttribute('x1','0%');gradient.setAttribute('y1','0%');gradient.setAttribute('x2','100%');gradient.setAttribute('y2','100%');
  [['0%','0.28'],['50%','0.07'],['100%','0.16']].forEach(([offset,opacity])=>{const stop=document.createElementNS(ns,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color','#fff');stop.setAttribute('stop-opacity',opacity);gradient.append(stop);});
  defs.append(gradient);glassSvg.append(defs);background.append(glassSvg);
  // Sections omitted by the global entrance controller still get the same quiet reveal.
  const labelObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){const el=entry.target as HTMLElement;if(!motion.matches)el.animate([{opacity:0,clipPath:'inset(0 100% 0 0)'},{opacity:1,clipPath:'inset(0 0 0 0)'}],{duration:700,easing:'cubic-bezier(.22,1,.36,1)'});labelObserver.unobserve(el);}
  }),{threshold:.12});
  document.querySelectorAll<HTMLElement>('[data-name="statement__plate"]>p:first-child,.premium-solutions .eyebrow,[data-name="contact__lead"]>p:first-child').forEach(el=>labelObserver.observe(el));
  const glow=new window.AltenarGlow(background,{
    colors:['#018DFF','#00CDF1','#4EFF83'],background:'#03080E',
    scroll:true,smoothScroll:false,scrollEngine:window.lenis,motion:'auto',
  });
  window.altenarPrototypeGlow=glow;
  let disposed=false;
  document.fonts.ready.then(()=>{if(!disposed)glow.refreshSections();});
  return()=>{
    disposeMenu();disposed=true;labelObserver.disconnect();newsSizer.disconnect();newsOutlines.forEach(el=>el.remove());disposeHero();
    glow.destroy();background.remove();
    if(window.altenarPrototypeGlow===glow)delete window.altenarPrototypeGlow;
    delete html.dataset.altenarGlow;
    marked.forEach(el=>delete el.dataset.glowWeights);
    if(active)delete active.dataset.glowActive;
    ink.forEach(el=>el.classList.remove('glow-light-copy'));
  };
}

