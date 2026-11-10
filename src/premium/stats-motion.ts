import {gsap} from 'gsap';
import {$,reduced} from '../sections';

export function prepareStats(){
  const section=$('section-stats')!;
  section.innerHTML = `<div class="premium-stats-cards">
    <article class="premium-stats-card"><div class="premium-stats-value"><p class="premium-metric">50+</p><p>Countries</p></div><p class="premium-stats-description">Built for complex regulatory environments</p></article>
    <article class="premium-stats-card"><div class="premium-stats-value"><p class="premium-metric">39</p><p>Licences and certificates</p></div><p class="premium-stats-description">Fast-track market entry in strict jurisdictions.</p></article>
    <article class="premium-stats-card"><div class="premium-stats-value"><p class="premium-metric">900+</p><p>Experts</p></div><p class="premium-stats-description">24/7 dedicated support across<br>6 global hubs.</p></article>
  </div>`;
  if (!reduced()) section.querySelectorAll<HTMLElement>('.premium-metric').forEach(el=>el.style.visibility='hidden');
}

export function setupStatsMotion(){
  const metrics=Array.from(document.querySelectorAll<HTMLElement>('.premium-metric'));
  if(reduced())return()=>{};
  const observers:IntersectionObserver[]=[],timelines:gsap.core.Timeline[]=[];
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
  const alignMetricGradients=()=>metrics.forEach(metric=>{
    const width=metric.getBoundingClientRect().width;
    metric.querySelectorAll<HTMLElement>(':scope > span').forEach(part=>{
      part.style.setProperty('--metric-gradient-width', `${width}px`);
      part.style.setProperty('--metric-gradient-x', `${-part.offsetLeft}px`);
    });
  });
  alignMetricGradients();window.addEventListener('resize',alignMetricGradients);
  let played=false;
  const numberObserver=new IntersectionObserver(entries=>{if(played||!entries.some(e=>e.isIntersecting))return;played=true;numberObserver.disconnect();
    const tl=gsap.timeline();metrics.forEach((metric,i)=>{metric.dataset.reelState='rolling';reels[i].forEach(({track,stop})=>tl.to(track,{yPercent:-100*stop/(stop+1),duration:[1.5,1.95,2.4][i],ease:'power3.out'},0));tl.call(()=>metric.dataset.reelState='settled',[],[1.5,1.95,2.4][i]);});timelines.push(tl);
  },{threshold:.1});numberObserver.observe(metrics[0].closest('[data-name="Jim Collins, PhD"]')||metrics[0]);observers.push(numberObserver);
  return()=>{window.removeEventListener('resize',alignMetricGradients);observers.forEach(o=>o.disconnect());timelines.forEach(t=>t.kill());};
}
