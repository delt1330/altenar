import {gsap} from 'gsap';
import geometry from './control-geometry.json';
import {interpolator} from './morph';
import {$,all,reduced} from './sections';
const NS='http://www.w3.org/2000/svg';
function shape(width:number,start:string,fill:string){
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox',`0 0 ${width} 44`);svg.setAttribute('width',String(width));svg.setAttribute('height','44');svg.setAttribute('aria-hidden','true');svg.classList.add('control-morph');
  const path=document.createElementNS(NS,'path');path.setAttribute('d',start);path.setAttribute('fill',fill);svg.append(path);return {svg,path};
}
export function setupControlMotion(){
  const cleanup:(()=>void)[]=[];
  document.querySelectorAll<HTMLElement>('.split-button:not([data-premium-split])').forEach(root=>{
    const label=$('button-split__label',root),arrow=$('button-split__arrow',root),cap=label&&$('button__cap',label)?.firstElementChild as HTMLElement;
    if(!cap||!arrow)return;
    cap.style.maskImage='none';cap.style.backgroundColor='transparent';cap.replaceChildren();
    const labelArt=shape(20,geometry.cap[0],'var(--button-label)'),arrowArt=shape(51,geometry.arrow[0],'var(--button-arrow)');
    cap.append(labelArt.svg);arrow.prepend(arrowArt.svg);arrow.classList.add('has-morph-background');
    const capMix=interpolator(...geometry.cap as [string,string]),arrowMix=interpolator(...geometry.arrow as [string,string]),progress={value:0};let tween:gsap.core.Tween;
    const paint=()=>{labelArt.path.setAttribute('d',capMix(progress.value));arrowArt.path.setAttribute('d',arrowMix(progress.value));};
    const enter=()=>{tween?.kill();tween=gsap.to(progress,{value:1,duration:reduced()?0:.28,ease:'power2.out',onUpdate:paint});};
    const leave=()=>{tween?.kill();tween=gsap.to(progress,{value:0,duration:reduced()?0:.28,ease:'power2.out',onUpdate:paint});};
    root.addEventListener('pointerenter',enter);root.addEventListener('pointerleave',leave);root.addEventListener('focusin',enter);root.addEventListener('focusout',leave);
    cleanup.push(()=>{tween?.kill();root.removeEventListener('pointerenter',enter);root.removeEventListener('pointerleave',leave);root.removeEventListener('focusin',enter);root.removeEventListener('focusout',leave);});
  });
  all('faq-item__header').filter(header=>!header.hasAttribute('data-faq-plain')).forEach(header=>{
    const toggle=$('faq-item__toggle',header)!;
    const initial=header.getAttribute('aria-expanded')==='true'?1:0;
    const {svg,path}=shape(51,geometry.faq[initial][0],'#EAF1F8');
    const icon=document.createElementNS(NS,'path');icon.setAttribute('d',geometry.faq[initial][1]);icon.setAttribute('fill','none');icon.setAttribute('stroke','#141A22');icon.setAttribute('stroke-opacity','.6');icon.setAttribute('stroke-width','1.5');icon.setAttribute('stroke-linecap','round');svg.append(icon);toggle.append(svg);toggle.classList.add('faq-morph-toggle');
    const panelMix=interpolator(geometry.faq[0][0],geometry.faq[1][0]),iconMix=interpolator(geometry.faq[0][1],geometry.faq[1][1]),progress={value:initial};let tween:gsap.core.Tween;
    const paint=()=>{path.setAttribute('d',panelMix(progress.value));icon.setAttribute('d',iconMix(progress.value));};
    const observer=new MutationObserver(()=>{tween?.kill();tween=gsap.to(progress,{value:header.getAttribute('aria-expanded')==='true'?1:0,duration:reduced()?0:.3,ease:'power2.inOut',onUpdate:paint});});
    observer.observe(header,{attributes:true,attributeFilter:['aria-expanded']});cleanup.push(()=>{observer.disconnect();tween?.kill();});
  });
  return ()=>cleanup.forEach(fn=>fn());
}
