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

// Same hover as the split-button arrow panel: the slant flips to the other
// side. The prev arrow is the mirrored shape, so it flips the same way.
const NS='http://www.w3.org/2000/svg';
function mountArrowMorph(el:HTMLElement,direction:'prev'|'next'){
  if(el.querySelector(':scope > .nav-arrow-shape'))return;
  const svg=document.createElementNS(NS,'svg'),path=document.createElementNS(NS,'path');
  svg.setAttribute('viewBox','0 0 51 44');svg.setAttribute('preserveAspectRatio','none');svg.setAttribute('aria-hidden','true');svg.classList.add('nav-arrow-shape');
  if(direction==='prev')svg.style.transform='scaleX(-1)';
  const mix=interpolator(...geometry.arrow as [string,string]),state={p:0};
  const paint=()=>path.setAttribute('d',mix(state.p));paint();svg.append(path);el.prepend(svg);el.dataset.morph='true';
  const to=(p:number)=>{if(reduced()){state.p=p;paint();return;}gsap.to(state,{p,duration:.28,ease:'power2.inOut',overwrite:true,onUpdate:paint});};
  const disabled=()=>el.getAttribute('aria-disabled')==='true'||(el instanceof HTMLButtonElement&&el.disabled);
  el.addEventListener('pointerenter',()=>{if(!disabled())to(1);});el.addEventListener('pointerleave',()=>to(0));
  el.addEventListener('focusin',()=>{if(!disabled()&&el.matches(':focus-visible'))to(1);});el.addEventListener('focusout',()=>to(0));
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
