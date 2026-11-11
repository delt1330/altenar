import {gsap} from 'gsap';
import {CustomEase} from 'gsap/CustomEase';
import {reducedMotion as reduced} from './dom';
import geometry from '../control-geometry.json';
import {interpolator} from './path-morph';
gsap.registerPlugin(CustomEase);
CustomEase.create('arrow-rollover','0.22,1,0.36,1');

export function mountArrow(el: HTMLElement, direction: 'prev'|'next', shape: string) {
  el.dataset.arrow='true';
  el.dataset.direction=direction;
  el.classList.add('nav-arrow');
  el.style.setProperty('--nav-shape',`url("${shape}")`);
  const image=el.querySelector<HTMLImageElement>(':scope > img');
  if(image)image.style.visibility='hidden';
  mountArrowMorph(el,direction);
  return ()=>{el.dataset.disabled=String(el.getAttribute('aria-disabled')==='true');};
}

// Prev/next arrows move as a pair, so their slants always stay parallel. The
// prev plate is the next plate rotated 180°.
// - Rest: both slants "/".
// - Next hovered: both slants flip to "\", the next plate shrinks to .92.
// - Prev hovered: slants stay "/", the prev plate shrinks to .92 and the next
//   plate shifts left so the diagonal gap keeps its width.
// A shrinking plate keeps its left edge; glyphs keep their 16px size and follow
// the plate centre. A disabled arrow never shrinks (disabled next still flips).
const NS='http://www.w3.org/2000/svg',SHRINK=.92,W=51,CX=25.5,CY=22;
type PairArrow={el:HTMLElement;direction:'prev'|'next';state:{p:number;s:number;x:number};paint:()=>void};
type Pair={arrows:PairArrow[];hover?:PairArrow};
const pairs=new WeakMap<HTMLElement,Pair>();
const enabled=(el:HTMLElement)=>el.getAttribute('aria-disabled')!=='true';
function settle(pair:Pair){
  const hover=pair.hover,flip=hover?.direction==='next',active=!!hover&&enabled(hover.el);
  pair.arrows.forEach(arrow=>{
    const s=active&&arrow===hover?SHRINK:1;
    const x=active&&hover!.direction==='prev'&&arrow.direction==='next'?-W*(1-SHRINK):0;
    const target={p:flip?1:0,s,x};
    if(reduced()){Object.assign(arrow.state,target);arrow.paint();return;}
    gsap.to(arrow.state,{...target,duration:.28,ease:'power2.inOut',overwrite:true,onUpdate:arrow.paint});
  });
}
function mountArrowMorph(el:HTMLElement,direction:'prev'|'next'){
  if(el.querySelector(':scope > .nav-arrow-shape'))return;
  const svg=document.createElementNS(NS,'svg'),path=document.createElementNS(NS,'path');
  svg.setAttribute('viewBox',`0 0 ${W} 44`);svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.classList.add('nav-arrow-shape');
  if(direction==='prev')svg.style.transform='rotate(180deg)';
  const mix=interpolator(...geometry.arrow as [string,string]),state={p:0,s:1,x:0};
  const paint=()=>{
    const {p,s,x}=state;path.setAttribute('d',mix(p));
    // Screen-space left edge anchored at x; the prev SVG is rotated, so its local X runs the other way.
    const tx=direction==='prev'?(1-s)*W-x:x;
    path.setAttribute('transform',`matrix(${s} 0 0 ${s} ${tx} ${(1-s)*CY})`);
    const window=el.querySelector<HTMLElement>(':scope > .arrow-rollover-window');
    if(window)window.style.translate=`${x-(1-s)*CX}px 0`;
  };
  paint();svg.append(path);el.prepend(svg);el.dataset.morph='true';
  const host=el.parentElement??el;let pair=pairs.get(host);if(!pair){pair={arrows:[]};pairs.set(host,pair);}
  const self:PairArrow={el,direction,state,paint};pair.arrows.push(self);const own=pair;
  const enter=()=>{own.hover=self;settle(own);},leave=()=>{if(own.hover===self){own.hover=undefined;settle(own);}};
  el.addEventListener('pointerenter',enter);el.addEventListener('pointerleave',leave);
  el.addEventListener('focusin',()=>{if(el.matches(':focus-visible'))enter();});el.addEventListener('focusout',leave);
  new MutationObserver(()=>{if(own.hover)settle(own);}).observe(el,{attributes:true,attributeFilter:['aria-disabled']});
}

export function mountArrowRollover(host:HTMLElement,trigger:HTMLElement,direction:'prev'|'next',icon:HTMLElement,wide=true){
    if(host.querySelector('.arrow-rollover-window'))return ()=>{};
    const img=icon.querySelector<HTMLImageElement>('img');
    const window=document.createElement('span');window.className='arrow-rollover-window';window.setAttribute('aria-hidden','true');
    if(!wide)window.classList.add('arrow-window-small');
    const glyph=()=>{const span=document.createElement('span');span.className='rollover-glyph';if(img){span.style.maskImage=`url("${img.getAttribute('src')}")`;span.classList.add('rollover-mask');}else span.textContent=icon.textContent;return span;};
    let front=glyph(),back=glyph();window.append(front,back);
    if(host===icon){icon.replaceChildren(window);icon.style.width='16px';icon.style.height='16px';icon.style.flexShrink='0';}else{icon.remove();host.append(window);}
    const distance=(wide?51:20)*(direction==='next'?1:-1);gsap.set(back,{x:-distance});
    let timeline:gsap.core.Timeline|undefined,busy=false;
    const run=()=>{
      if(busy||reduced()||(trigger.getAttribute('aria-disabled')==='true'&&!trigger.dataset.caseLinkMissing)||(trigger instanceof HTMLButtonElement&&trigger.disabled))return;
      busy=true;host.dataset.arrowBusy='true';
      timeline=gsap.timeline({onComplete:()=>{const old=front;front=back;back=old;gsap.set(back,{x:-distance});busy=false;host.dataset.arrowBusy='false';}})
        .to(front,{x:distance,duration:.46,ease:'arrow-rollover'},0)
        .to(back,{x:0,duration:.46,ease:'arrow-rollover'},0);
    };
    trigger.addEventListener('pointerenter',run);trigger.addEventListener('focusin',run);trigger.addEventListener('click',run,true);
    host.dataset.rollover=direction;
    return ()=>{timeline?.kill();trigger.removeEventListener('pointerenter',run);trigger.removeEventListener('focusin',run);trigger.removeEventListener('click',run,true);};
  }
