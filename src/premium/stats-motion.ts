import {gsap} from 'gsap';
import {$,reduced} from '../sections';

export function prepareStats(){
  const section=$('section-stats')!;
  section.querySelectorAll<HTMLElement>('p').forEach(el=>{if(/^(50\+|39|900\+)$/.test(el.textContent!.trim())){el.classList.add('premium-metric');if(!reduced())el.style.visibility='hidden';}});
  const title=section.querySelector<HTMLElement>('.premium-heading')!;title.classList.add('premium-stats-title');if(!reduced())title.querySelector<HTMLElement>('.premium-gradient')!.style.visibility='hidden';
}

export function setupStatsMotion(){
  const title=document.querySelector<HTMLElement>('.premium-stats-title')!,accent=title.querySelector<HTMLElement>('.premium-gradient')!;
  const metrics=Array.from(document.querySelectorAll<HTMLElement>('.premium-metric'));
  if(reduced())return()=>{};
  const observers:IntersectionObserver[]=[],timelines:gsap.core.Timeline[]=[];
  const original=accent.textContent!;accent.setAttribute('aria-label',original);accent.dataset.gradientFilled='false';
  const chars=Array.from(original).map(char=>{const span=document.createElement('span');span.textContent=char;span.className='premium-typed-character';span.setAttribute('aria-hidden','true');accent.append(span);return span;});
  // Remove only the original text node; inline characters reserve the same line.
  Array.from(accent.childNodes).filter(n=>n.nodeType===Node.TEXT_NODE).forEach(n=>n.remove());
  gsap.set(chars,{opacity:0});accent.style.visibility='';
  const titleObserver=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;titleObserver.disconnect();
    const tl=gsap.timeline({onComplete:()=>{accent.dataset.gradientFilled='true';accent.dispatchEvent(new Event('premium:gradient-state',{bubbles:true}));}});
    tl.to(chars,{opacity:1,duration:.045,stagger:.755/Math.max(1,chars.length-1),ease:'none'});timelines.push(tl);
  },{threshold:.15});titleObserver.observe(title);observers.push(titleObserver);
  const reels=metrics.map((metric,metricIndex)=>{
    const value=metric.textContent!.trim();metric.setAttribute('aria-label',value);metric.replaceChildren();
    return Array.from(value).filter(char=>{
      if(char==='+'){const plus=document.createElement('span');plus.textContent='+';plus.setAttribute('aria-hidden','true');metric.append(plus);return false;}return true;
    }).map((char,digitIndex)=>{
      const digit=document.createElement('span');digit.className='premium-digit';digit.setAttribute('aria-hidden','true');
      const sizer=document.createElement('span');sizer.className='premium-digit-sizer';sizer.textContent=char;
      const track=document.createElement('span');track.className='premium-digit-track';
      const seed=metricIndex*3+digitIndex+2,stop=40+(Number(char)-seed%10+10)%10;
      for(let i=0;i<=stop;i++){const cell=document.createElement('span');cell.textContent=String((i+seed)%10);track.append(cell);}
      digit.append(sizer,track);
      // Keep the stationary plus sign after all digit reels.
      metric.insertBefore(digit,metric.querySelector(':scope>span:not(.premium-digit)'));
      return{track,stop};
    });
  });
  metrics.forEach(metric=>{metric.style.visibility='';metric.setAttribute('role','img');});
  let played=false;
  const numberObserver=new IntersectionObserver(entries=>{if(played||!entries.some(e=>e.isIntersecting))return;played=true;numberObserver.disconnect();
    const tl=gsap.timeline();metrics.forEach((metric,i)=>{metric.dataset.reelState='rolling';reels[i].forEach(({track,stop})=>tl.to(track,{yPercent:-100*stop/(stop+1),duration:[1.5,1.95,2.4][i],ease:'power3.out'},0));tl.call(()=>metric.dataset.reelState='settled',[],[1.5,1.95,2.4][i]);});timelines.push(tl);
  },{threshold:.1});numberObserver.observe(metrics[0].closest('[data-name="Jim Collins, PhD"]')||metrics[0]);observers.push(numberObserver);
  return()=>{observers.forEach(o=>o.disconnect());timelines.forEach(t=>t.kill());};
}
