import {gsap} from 'gsap';
import {CustomEase} from 'gsap/CustomEase';
import {reducedMotion as reduced} from './dom';
gsap.registerPlugin(CustomEase);
CustomEase.create('arrow-rollover','0.22,1,0.36,1');

export function mountArrow(el: HTMLElement, direction: 'prev'|'next', shape: string) {
  el.dataset.arrow='true';
  el.dataset.direction=direction;
  el.classList.add('nav-arrow');
  el.style.setProperty('--nav-shape',`url("${shape}")`);
  const image=el.querySelector<HTMLImageElement>(':scope > img');
  if(image)image.style.visibility='hidden';
  return ()=>{el.dataset.disabled=String(el.getAttribute('aria-disabled')==='true');};
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
