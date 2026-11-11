import {whenNear} from './shared/when-near';
import {mountArrow} from './shared/arrows';
import {gsap} from 'gsap';
import assets from '../assets-map.json';
import hoverAssets from '../hover-assets-map.json';
import countrySource from '../country-popup-data.json';
import partners from './partners.json';
import cases from './cases.json';
import {transitionCase} from './case-motion';

export const $=(name:string,scope:ParentNode=document)=>scope.querySelector<HTMLElement>(`[data-name="${name}"]`);
export const all=(name:string,scope:ParentNode=document)=>Array.from(scope.querySelectorAll<HTMLElement>(`[data-name="${name}"]`));
export const node=(id:string)=>document.querySelector<HTMLElement>(`[data-node-id="${id}"]`);
export const source=(name:string)=>typeof assets[name]==='string'?assets[name]:assets[name]?.path;
export const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;

export function button(el:HTMLElement|null|undefined,action:()=>void,label?:string){
  if(!el)return;
  el.setAttribute('role','button');el.tabIndex=0;
  if(label)el.setAttribute('aria-label',label);
  el.classList.add('interactive');
  el.addEventListener('click',()=>{if(el.getAttribute('aria-disabled')!=='true')action();});
  el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}});
}

export function setupLayout(){
  const bar=$('navbar__bar'),actions=$('navbar-actions__pair');
  if(bar&&actions)bar.append(actions);
  const graphic=node('I4011:36550;3933:58759');
  if(graphic){
    graphic.classList.add('solution-art');
    const canvas=document.createElement('div');canvas.className='solution-canvas';
    while(graphic.firstChild)canvas.append(graphic.firstChild);graphic.append(canvas);
    const resize=()=>{const width=graphic.clientWidth||798;canvas.style.transform=`scale(${width/798})`;};
    resize();if(typeof ResizeObserver!=='undefined')new ResizeObserver(resize).observe(graphic);
  }
  const statement=$('section-statement');if(statement)statement.dataset.scrollSection='statement';
  const root=node('4011:36550');if(root)root.dataset.layout='fluid';
}

export function arrowStates(el:HTMLElement,index:number){
  return mountArrow(el,index===0?'prev':'next',source(index===0?'arrowPrevDefault':'arrowNextDefault'));
}

export function setupCarousels(){
  const carousel=(section:HTMLElement,track:HTMLElement,controls:HTMLElement,benefits:boolean)=>{
    let viewport=track;
    if(benefits){viewport=document.createElement('div');viewport.className='carousel-viewport';track.before(viewport);viewport.append(track);track.style.width='max-content';}
    else track.classList.add('carousel-viewport');
    viewport.tabIndex=0;viewport.setAttribute('aria-label',benefits?'Partner benefits carousel':'Company news carousel');
    const cards=Array.from(track.children) as HTMLElement[],arrows=Array.from(controls.children) as HTMLElement[];
    if(benefits)cards.forEach(card=>card.dataset.name='benefit-card');
    const painters=arrows.map(arrowStates),fill=$('pagination__progress',section);
    const step=()=>cards[1]?cards[1].offsetLeft-cards[0].offsetLeft || (benefits?408:444):(benefits?408:444);
    const update=()=>{
      const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth),fraction=max?Math.min(1,viewport.scrollLeft/max):0;
      if(fill){fill.style.inset='0 auto 0 0';fill.style.width=`${31+69*fraction}%`;}
      arrows.forEach((a,i)=>{const disabled=i===0?viewport.scrollLeft<1:viewport.scrollLeft>=max-1;a.setAttribute('aria-disabled',String(disabled));a.tabIndex=disabled?-1:0;painters[i]();});
      if(benefits){const first=Math.min(cards.length-1,Math.floor((viewport.scrollLeft+1)/step()));cards.forEach((card,i)=>{const active=i===first;const variant=active?'First':'Second';if(card.dataset.variant!==variant){card.dataset.variant=variant;card.dispatchEvent(new Event('benefitvariantchange'));const title=card.querySelector<HTMLElement>('p');if(title){title.style.minWidth='0';title.style.width=active?'336px':'295px';}}});}
    };
    arrows.forEach((a,i)=>button(a,()=>viewport.scrollTo({left:Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,viewport.scrollLeft+(i===0?-step():step()))),behavior:reduced()?'instant':'smooth'}),i===0?'Previous cards':'Next cards'));
    viewport.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update,{passive:true});update();
  };
  const benefits=$('section-benefits'),news=$('section-news');
  if(benefits)carousel(benefits,$('benefits__track',benefits)!,$('benefits__arrows',benefits)!,true);
  if(news)carousel(news,$('news-grid',news)!,$('news__arrows',news)!,false);
}

export function setupPartners(){
  const section=node('4011:42987'),viewport=$('partners / scroll viewport');if(!section||!viewport)return;
  section.dataset.name='section-partners';
  const names=partners.map(p=>p.name),old=Array.from(section.querySelectorAll<HTMLElement>('[data-name^="partner detail"]'));
  const detailBox=document.createElement('div');detailBox.className='partner-details';old[0].before(detailBox);old.forEach(d=>d.remove());
  const details=partners.map(partner=>{
    const card=document.createElement('div');card.className='partner-detail';card.dataset.partner=partner.name;card.setAttribute('aria-hidden','true');
    const logo=document.createElement('img');logo.className='partner-logo';logo.src=partner.logo;logo.alt=partner.name;
    const logoSlot=document.createElement('div');logoSlot.className='partner-logo-slot';logoSlot.append(logo);let logoCropped=false;const cropLogo=()=>{try{const w=logo.naturalWidth,h=logo.naturalHeight;if(!w||!h||logoCropped)return;logoCropped=true;const sample=document.createElement('canvas');sample.width=w;sample.height=h;const ctx=sample.getContext('2d',{willReadFrequently:true});if(!ctx)return;ctx.drawImage(logo,0,0);const data=ctx.getImageData(0,0,w,h).data;let x1=w,y1=h,x2=-1,y2=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>8){x1=Math.min(x1,x);y1=Math.min(y1,y);x2=Math.max(x2,x);y2=Math.max(y2,y);}if(x2<0)return;x1=Math.max(0,x1-1);y1=Math.max(0,y1-1);x2=Math.min(w-1,x2+1);y2=Math.min(h-1,y2+1);const cw=x2-x1+1,ch=y2-y1+1,source=logo.currentSrc||logo.src;fetch(source).then(r=>r.text()).then(xml=>{const doc=new DOMParser().parseFromString(xml,'image/svg+xml'),svg=doc.documentElement;if(svg.nodeName.toLowerCase()!=='svg')return;svg.setAttribute('viewBox',[x1,y1,cw,ch].join(' '));svg.setAttribute('width',String(cw));svg.setAttribute('height',String(ch));logo.style.width=Math.min(270,80*cw/ch)+'px';logo.style.height='auto';logo.src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(new XMLSerializer().serializeToString(svg));}).catch(()=>{});}catch{}};logo.addEventListener('load',cropLogo,{once:true});if(logo.complete)queueMicrotask(cropLogo);
    const description=document.createElement('p');description.className='partner-description';description.textContent=partner.description;
    card.append(logoSlot,description);detailBox.append(card);return card;
  });
  viewport.replaceChildren();viewport.classList.add('partner-scroll');viewport.tabIndex=0;viewport.setAttribute('role','listbox');viewport.setAttribute('aria-label','Explore partners. Scroll or use arrow keys.');
  const inner=document.createElement('div');inner.className='partner-scroll-inner';viewport.append(inner);
  const drum=document.createElement('div');drum.className='partner-drum';inner.append(drum);
  const range=document.createElement('div');range.className='partner-scroll-range';range.style.height=(names.length*70)+'px';inner.append(range);
  let wheelUntil=0,cycled=false;
  const rows=names.map((name,i)=>{const row=document.createElement('div');row.className='partner-row';row.setAttribute('role','option');row.dataset.partner=name;const p=document.createElement('span');p.textContent=name;row.append(p);drum.append(row);row.addEventListener('click',()=>viewport.scrollTo({top:i*70,behavior:reduced()?'instant':'smooth'}));row.addEventListener('pointerenter',()=>{if(performance.now()<wheelUntil||i===active)return;wheelUntil=performance.now()+450;cycled=true;viewport.scrollTo({top:i*70,behavior:reduced()?'instant':'smooth'});});return row;});
  const sizes=[40,30,26,22,17,13,9],alphas=[1,.94,.88,.82,.76,.7,.64],offsets=[0,68.7,132.7,187.65,229.8,260.75,285.25],heights=[69.9,67.5,60.5,49.4,34.9,27,22];
  const sample=(a:number[],distance:number)=>{const d=Math.min(a.length-1,Math.abs(distance)),lo=Math.floor(d),hi=Math.min(a.length-1,lo+1);return a[lo]+(a[hi]-a[lo])*(d-lo);};
  let active=-1,transition:gsap.core.Timeline|undefined;
  function activate(index:number){
    if(index===active)return;const previous=active;active=index;
    rows.forEach((row,i)=>{row.setAttribute('aria-selected',String(i===active));row.classList.toggle('partner-active',i===active);});
    details.forEach((card,i)=>card.setAttribute('aria-hidden',String(i!==active)));
    transition?.kill();gsap.killTweensOf(details);
    if(previous<0||reduced()){gsap.set(details,{autoAlpha:0,y:0});gsap.set(details[active],{autoAlpha:1});}
    else transition=gsap.timeline().to(details,{autoAlpha:0,y:-4,duration:.14,ease:'power1.out'}).set(details[active],{y:8}).to(details[active],{autoAlpha:1,y:0,duration:.24,ease:'power2.out'});
    viewport.dataset.activePartner=names[active];
  }
  const paint=()=>{
    const progress=viewport.scrollTop/70,center=(viewport.clientHeight||548.5)/2,index=((Math.round(progress)%names.length)+names.length)%names.length;
    rows.forEach((row,i)=>{const raw=i-progress,d=cycled?((raw+names.length/2+names.length)%names.length)-names.length/2:raw,h=sample(heights,d);row.style.top=(center+Math.sign(d)*sample(offsets,d)-h/2)+'px';row.style.height=h+'px';row.style.fontSize=sample(sizes,d)+'px';row.style.color=`rgba(20,26,34,${sample(alphas,d)})`;row.style.visibility=Math.abs(d)>6?'hidden':'visible';});
    activate(index);
  };
  gsap.set(details,{autoAlpha:0});viewport.addEventListener('scroll',paint,{passive:true});viewport.scrollTop=4*70;paint();
  viewport.addEventListener('wheel',e=>{wheelUntil=performance.now()+180;const delta=e.deltaY||e.deltaX;if(!delta)return;const maximum=(names.length-1)*70,current=viewport.scrollTop;e.preventDefault();cycled=true;const span=names.length*70,step=delta*(e.deltaMode===1?18:1);viewport.scrollTop=((current+step)%span+span)%span;paint();},{passive:false});
  viewport.addEventListener('keydown',e=>{const moves={ArrowDown:70,ArrowUp:-70,PageDown:210,PageUp:-210};if(e.key in moves){e.preventDefault();cycled=true;viewport.scrollTo({top:((viewport.scrollTop+moves[e.key]+names.length*70)%(names.length*70)),behavior:'instant'});}else if(e.key==='Home'||e.key==='End'){e.preventDefault();viewport.scrollTo({top:e.key==='Home'?0:(names.length-1)*70,behavior:'instant'});}});
  return paint;
}

export function setupMarkets(){
  const market=$('section-markets');if(!market)return;
  $('country-index__scrollbar',market)?.remove();
  const search=$('country-index__search',market),placeholder=search?.querySelector('p'),rows=all('country-index__row',market);
  rows.forEach(row=>{const wrapper=$('country-row__chevron',row)?.querySelector<HTMLElement>(':scope > div'),img=wrapper?.querySelector('img');if(wrapper&&img){wrapper.style.maskImage=`url("${source('imgCountryRowChevron')}")`;wrapper.style.maskSize='100% 100%';wrapper.style.backgroundColor='var(--country-chevron)';img.style.visibility='hidden';}});
  if(placeholder){const input=document.createElement('input');input.className='country-search';input.placeholder='Search country';input.setAttribute('aria-label','Search country');placeholder.replaceWith(input);input.addEventListener('input',()=>rows.forEach(row=>row.style.display=row.textContent!.toLowerCase().includes(input.value.toLowerCase())?'':'none'));}
  const card=$('markets/country-card',market);if(!card)return;
  card.setAttribute('aria-live','polite');
  const header=$('country-card__header',card)!,title=header.querySelector('p')!,flag=$('country-card__flag',card)!.querySelector('img')!;
  const statusRows=all('markets/status-row',card),cta=$('markets/country-cta',card)!;
  cta.classList.add('country-card-cta');
  const render=(index:number)=>{
    const data=countrySource.countries[index];
    title.textContent=data.popupTitle||data.indexName;flag.src=data.flagAsset;flag.alt=data.popupTitle||data.indexName;
    $('markets__body',market)!.dataset.countryOpen='true';card.style.visibility='visible';card.dataset.country=data.indexName;
    rows.forEach((row,i)=>{row.classList.toggle('country-selected',i===index);row.setAttribute('aria-selected',String(i===index));});
    statusRows.forEach((row,i)=>{
      const text=$('country-row__text',row)!,paras=text.querySelectorAll('p'),tag=$('country-row__status',row)!,status=tag.querySelector('p')!;
      const item=data.rows?.[i];paras[0].textContent=item?.title||countrySource.countries[0].rows[i].title;
      paras[1].textContent=item?.note||'';paras[1].style.display=item?'':'none';status.textContent=item?.status||'—';
      tag.dataset.status=item?.status||'unknown';
    });
    if(cta&&cta!==header&&cta!==$('country-card__list',card)){cta.style.visibility=data.ctaLabel?'visible':'hidden';const label=cta.querySelector('p');if(label&&data.ctaLabel)label.textContent=data.ctaLabel;}
  };
  rows.forEach((row,i)=>button(row,()=>render(i),`Show ${countrySource.countries[i].popupTitle||countrySource.countries[i].indexName}`));
  button($('country-card__close',card),()=>{card.style.visibility='hidden';$('markets__body',market)!.dataset.countryOpen='false';},'Close country details');render(0);
}

export function setupTabs(){
  const tabs=$('solutions__tabs');if(!tabs)return;
  tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Solutions');
  const children=Array.from(tabs.children) as HTMLElement[];
  children.forEach((tab,i)=>{
    tab.classList.add('solution-tab');tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(i===0));tab.tabIndex=i===0?0:-1;
    // Reuse the exact active cap shape as a mask for all source state colors.
    all('tab__cap',tab).forEach((cap,j)=>{cap.replaceChildren();const img=document.createElement('img');img.src=source(j===0?'imgButtonCap3':'imgTabCap2');img.alt='';const mask=document.createElement('div');mask.className='tab-cap-fill';mask.style.maskImage=`url("${img.src}")`;if(j===0)mask.style.right='11.97%';else mask.style.left='11.97%';cap.append(mask);});
    const select=()=>children.forEach((t,j)=>{t.setAttribute('aria-selected',String(i===j));t.tabIndex=i===j?0:-1;});
    tab.addEventListener('click',select);tab.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();const next=children[(i+(e.key==='ArrowRight'?1:-1)+children.length)%children.length];next.click();next.focus();}else if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});
  });
}

export function setupCases(){
  const section=node('4011:41475'),slide=$('cases__slide');if(!section||!slide)return ()=>{};
  const viewport=document.createElement('div');viewport.className='cases-viewport';slide.before(viewport);
  const track=document.createElement('div');track.className='cases-track';viewport.append(track);track.append(slide);
  for(let i=1;i<cases.length;i++){const copy=slide.cloneNode(true) as HTMLElement;copy.removeAttribute('data-node-id');copy.querySelectorAll('[data-node-id],[id]').forEach(n=>{n.removeAttribute('data-node-id');n.removeAttribute('id');});track.append(copy);}
  const slides=Array.from(track.children) as HTMLElement[];
  slides.forEach((card,i)=>{const item=cases[i];card.dataset.caseSlug=item.slug;card.dataset.caseIndex=String(i);const photoWrap=document.createElement('div');photoWrap.className='glow-case-photo';photoWrap.setAttribute('aria-hidden','true');const caseImage=document.createElement('img');caseImage.decoding='async';whenNear(section,()=>{caseImage.src=item.photo;});caseImage.alt='';photoWrap.append(caseImage);card.append(photoWrap);
    const logoBox=$('case__logo',card)!;if(item.logo){const logo=logoBox.querySelector('img')!;logo.src=item.logo;logo.alt=item.name;}else{logoBox.replaceChildren();logoBox.textContent=item.name;logoBox.classList.add('case-wordmark-pending');card.dataset.missingLogo='true';}
    $('case__top',card)!.querySelector('p')!.textContent=item.heading;
    $('case__tag',card)!.querySelector('p')!.textContent=item.label;
    const metric=$('case__metric--media',card)!.querySelectorAll('p');metric[0].textContent=item.metric;metric[1].textContent=item.metricDescription;
    const cta=$('button-split__label',$('case__bottom',card)!)!;cta.querySelector('p')!.textContent='View cases';
    const root=cta.parentElement!;root.dataset.caseLinkMissing='true';root.setAttribute('role','link');root.setAttribute('aria-disabled','true');root.tabIndex=0;root.classList.add('interactive');
    root.setAttribute('aria-description','Case study destination has not been supplied.');
    root.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();root.click();}});
  });

  const controls=Array.from($('cases__arrows')!.children) as HTMLElement[],painters=controls.map(arrowStates);
  viewport.tabIndex=0;viewport.setAttribute('aria-label','Client cases carousel');
  const step=()=>slides[1] ? slides[1].offsetLeft-slides[0].offsetLeft : slides[0].offsetWidth;
  const update=()=>{
    const max=Math.max(0,viewport.scrollWidth-viewport.clientWidth),left=viewport.scrollLeft;
    const current=Math.max(0,Math.min(slides.length-1,Math.round(left/Math.max(1,step()))));
    const fill=$('pagination__progress',section);if(fill){fill.style.inset='0 auto 0 0';fill.style.width=`${(current+1)/slides.length*100}%`;}
    controls.forEach((el,i)=>{const disabled=i===0?left<1:left>=max-1;el.setAttribute('aria-disabled',String(disabled));el.tabIndex=disabled?-1:0;painters[i]();});
    section.dataset.case=String(current+1);section.dataset.caseTransition='idle';
  };
  controls.forEach((c,i)=>button(c,()=>viewport.scrollTo({left:Math.max(0,Math.min(viewport.scrollWidth-viewport.clientWidth,viewport.scrollLeft+(i===0?-step():step()))),behavior:reduced()?'instant':'smooth'}),i===0?'Previous case':'Next case'));
  viewport.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',update,{passive:true});update();
  return ()=>{viewport.removeEventListener('scroll',update);window.removeEventListener('resize',update);};
}

export function setupAwards(){
  all('awards__row').forEach(row=>{
    const labels=row.querySelectorAll(':scope > p'),event=labels[2]?.textContent?.trim();
    row.dataset.awardEvent=event?.toLowerCase().replace(/\s+/g,'-');
    const asset=hoverAssets.awards.find(a=>a.name===event)||hoverAssets.awards[0];
    const preview=document.createElement('div');preview.className='award-preview';preview.setAttribute('aria-hidden','true');const img=document.createElement('img');img.src=asset.path;img.alt=event||'';img.width=231;img.height=143;preview.append(img);row.append(preview);row.tabIndex=0;
  });
}

export function setupButtonStates(){
  all('button-split__label').forEach(label=>{
    const root=label.parentElement!,plate=$('button__plate',label),cap=$('button__cap',label)?.querySelector<HTMLElement>(':scope > div'),arrow=$('button-split__arrow',root);
    const original=plate?getComputedStyle(plate).backgroundColor:'';
    root.classList.add('split-button');root.dataset.premiumSplit='true';root.dataset.buttonStyle=original==='rgb(255, 255, 255)'?'white':original==='rgb(26, 44, 66)'?'navy':'secondary';
    if(plate)plate.style.backgroundColor='var(--button-label)';
    const img=cap?.querySelector('img');if(cap&&img){cap.style.maskImage=`url("${img.getAttribute('src')}")`;cap.style.maskSize='100% 100%';cap.style.backgroundColor='var(--button-label)';img.style.visibility='hidden';}
    const arrowShape=arrow?.querySelector<HTMLImageElement>(':scope > img');if(arrow&&arrowShape){arrow.style.setProperty('--arrow-shape',`url("${arrowShape.getAttribute('src')}")`);arrowShape.style.visibility='hidden';}
  });
  all('button__plate').forEach(plate=>{if(plate.closest('[data-name="button-split__label"]'))return;const root=plate.parentElement!;root.classList.add('slant-button');plate.style.backgroundColor='var(--slant-bg)';root.setAttribute('role','button');root.tabIndex=0;const cap=$('button__cap',root)?.firstElementChild as HTMLElement,img=cap?.querySelector('img');if(cap&&img){cap.style.maskImage=`url("${img.getAttribute('src')}")`;cap.style.maskSize='100% 100%';cap.style.backgroundColor='var(--slant-bg)';img.style.visibility='hidden';}});
  all('news-card__arrow').forEach(arrow=>{const img=arrow.querySelector<HTMLImageElement>(':scope > img');if(img){arrow.style.setProperty('--arrow-shape',`url("${img.getAttribute('src')}")`);img.style.visibility='hidden';}});
}
