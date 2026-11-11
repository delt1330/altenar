import {gsap} from 'gsap';
import {$,all,reduced} from '../sections';

// The existing news-arrow shape and glyph are retained. This variant installs
// before the default rollover controller, which skips already-installed windows.
export function setupPremiumNewsControls(section:HTMLElement){
  const cleanup:(()=>void)[]=[];
  all('news-card-slant',section).forEach(card=>{
    const host=$('news-card__arrow',card)!,icon=$('button__icon',host),image=icon?.querySelector('img'),shape=host.querySelector<HTMLImageElement>(':scope>img');
    if(!image||!shape)return;
    card.classList.add('premium-news-card');host.classList.add('premium-news-arrow');
    host.style.setProperty('--arrow-shape',`url("${shape.getAttribute('src')}")`);shape.style.visibility='hidden';
    host.style.setProperty('--premium-news-arrow-paint','#FFFFFF');host.style.setProperty('--premium-news-arrow-scale','1');host.style.setProperty('--premium-news-glyph-paint','#0F1B22');host.style.setProperty('--arrow-glyph-color','var(--premium-news-glyph-paint)');
    const window=document.createElement('span');window.className='arrow-rollover-window';window.setAttribute('aria-hidden','true');
    const glyph=()=>{const span=document.createElement('span');span.className='rollover-glyph rollover-mask';span.style.maskImage=`url("${image.getAttribute('src')}")`;window.append(span);return span;};
    const front=glyph(),back=glyph();icon!.remove();host.append(window);host.dataset.rollover='next';gsap.set(back,{x:-51});
    const timeline=gsap.timeline({paused:true})
      .to(host,{'--premium-news-arrow-paint':'#FFFFFF','--premium-news-glyph-paint':'#141A22','--premium-news-arrow-scale':.92,duration:.28,ease:'power2.inOut'},0)
      .to(front,{x:51,duration:.4,ease:'power2.out'},0).to(back,{x:0,duration:.4,ease:'power2.out'},0);
    let hover=false,focus=false;
    const update=()=>{const on=(hover||focus)&&card.getAttribute('aria-disabled')!=='true';host.dataset.newsArrowHover=String(on);if(reduced())timeline.progress(on?1:0).pause();else if(on)timeline.play();else timeline.reverse();};
    const enter=()=>{hover=true;update();},leave=()=>{hover=false;update();},focusIn=()=>{focus=true;update();},focusOut=(event:FocusEvent)=>{if(event.relatedTarget instanceof Node&&card.contains(event.relatedTarget))return;focus=false;update();};
    card.addEventListener('pointerenter',enter);card.addEventListener('pointerleave',leave);card.addEventListener('focusin',focusIn);card.addEventListener('focusout',focusOut);
    cleanup.push(()=>{timeline.kill();card.removeEventListener('pointerenter',enter);card.removeEventListener('pointerleave',leave);card.removeEventListener('focusin',focusIn);card.removeEventListener('focusout',focusOut);});
  });
  return()=>cleanup.forEach(fn=>fn());
}
