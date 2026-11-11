import {createRetail,setupRetail} from './glow/retail';
import {createWhiteLabel,setupWhiteLabel} from './glow/white-label';
import prototype from './solutions-prototype.html?raw';
import {$} from '../sections';
import {createTurnkeyStack, setupTurnkeyStack} from './turnkey-stack';
import './turnkey-stack.css';
import {eagerAfterFirstScreen} from '../shared/when-near';

export function replaceSolutions(){
  const previous=$('section-solutions')!,template=$('button-split__label',previous)!.parentElement!;
  const section=new DOMParser().parseFromString(prototype,'text/html').querySelector<HTMLElement>('.solutions-scroll')!;
  section.dataset.name='section-solutions';section.dataset.nodeId='4324:44803';section.classList.add('premium-solutions');
  const title=section.querySelector('h1')!,heading=document.createElement('h2');heading.innerHTML=title.innerHTML;heading.className='premium-heading';heading.dataset.nodeId='4324:44808';title.replaceWith(heading);
  const gradient=heading.querySelector<HTMLElement>('.gradient')!;gradient.className='premium-gradient';gradient.dataset.gradientFilled='false';gradient.style.setProperty('--gradient-angle','87.7846deg');
  section.querySelectorAll<HTMLImageElement>('.solution-img').forEach(img=>{img.src='/premium-media/solutions/'+img.getAttribute('src')!.split('/').at(-1);img.removeAttribute('fetchpriority');img.decoding='async';});
  section.querySelector('.solution-img[data-panel="0"]')!.replaceWith(createTurnkeyStack());section.querySelector('.solution-img[data-panel="1"]')!.replaceWith(createRetail());section.querySelector('.solution-img[data-panel="2"]')!.replaceWith(createWhiteLabel());
  section.querySelectorAll<HTMLElement>('.solution-panel').forEach((panel,index)=>{
    const h2=panel.querySelector('h2')!,description=panel.querySelector('p')!,detail=panel.querySelector('.solution-detail')!,copy=document.createElement('div');copy.className='solution-panel-copy';copy.append(h2,description,detail);panel.prepend(copy);
    const placeholder=panel.querySelector('[data-placeholder-link]')!,cta=template.cloneNode(true) as HTMLElement;
    cta.querySelectorAll('[data-node-id],[id]').forEach(n=>{n.removeAttribute('data-node-id');n.removeAttribute('id');});cta.removeAttribute('data-node-id');
    // Only reuse the button internals. The old instance's root classes carried
    // position:absolute/top/left from the former illustration canvas.
    cta.className='premium-solution-cta premium-primary';cta.removeAttribute('style');
    cta.dataset.solutionLinkMissing='true';cta.dataset.premiumSplit='true';cta.setAttribute('aria-label',placeholder.getAttribute('aria-label')!);cta.setAttribute('aria-description','Solution destination has not been supplied.');cta.setAttribute('aria-disabled','true');cta.setAttribute('role','link');cta.tabIndex=0;
    $('button-split__label',cta)!.querySelector('p')!.textContent='SEE SOLUTION';placeholder.replaceWith(cta);panel.id=`solution-panel-${index}`;
    const nav=section.querySelector<HTMLElement>(`[data-target="${index}"]`)!;nav.setAttribute('aria-controls',panel.id);
  });
  previous.replaceWith(section);
  // Move the existing benefits carousel, preserving its nodes and handlers.
  section.after($('section-benefits')!);
}

// Product selection is click-only. Page scrolling never changes the active
// solution or seeks the independent Turnkey assembly timeline.
export function setupSolutions(){
  const container=$('section-solutions')!,stage=container.querySelector<HTMLElement>('.solutions-sticky')!;
  const disposeStack=setupTurnkeyStack(container,stage),disposeRetail=setupRetail(container),disposeWhiteLabel=setupWhiteLabel(container);
  // Illustrations are lazy so they skip the first screen; fetch them right after it (when-near.ts).
  eagerAfterFirstScreen(container.querySelectorAll<HTMLImageElement>('img[loading="lazy"]'));
  const nav=Array.from(container.querySelectorAll<HTMLElement>('.solution-nav-button')),art=Array.from(container.querySelectorAll<HTMLElement>('.solution-img')),panels=Array.from(container.querySelectorAll<HTMLElement>('.solution-panel')),indicator=container.querySelector<HTMLElement>('.solution-nav')!;
  let active=-1;
  function activate(index:number){
    index=Math.max(0,Math.min(2,index));if(index===active)return;active=index;container.dataset.solution=String(index+1);indicator.style.setProperty('--active-index',String(index));
    nav.forEach((item,i)=>{item.classList.toggle('is-active',i===index);if(i===index)item.setAttribute('aria-current','step');else item.removeAttribute('aria-current');});
    art.forEach((item,i)=>{item.classList.toggle('is-active',i===index);item.toggleAttribute('inert',i!==index);item.setAttribute('aria-hidden',String(i!==index));});panels.forEach((panel,i)=>{const shown=i===index;panel.classList.toggle('is-active',shown);panel.toggleAttribute('inert',!shown);panel.setAttribute('aria-hidden',String(!shown));});
  }
  const clicks=nav.map((button,index)=>{
    const choose=()=>activate(index);
    button.addEventListener('click',choose);return()=>button.removeEventListener('click',choose);
  });
  const gradient=container.querySelector<HTMLElement>('.premium-gradient')!;
  const observer=new IntersectionObserver(entries=>{if(!entries.some(e=>e.isIntersecting))return;gradient.dataset.gradientFilled='true';gradient.dispatchEvent(new Event('premium:gradient-state',{bubbles:true}));observer.disconnect();},{threshold:.12});observer.observe(stage);
  activate(0);
  return()=>{disposeWhiteLabel();disposeRetail();disposeStack();observer.disconnect();clicks.forEach(fn=>fn());};
}
