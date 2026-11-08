/** Progressive content entrances: opacity + a short, eased lift; no layout movement. */
export function setupContentEntrance(main) {
 if(main.dataset.contentEntrance) return ()=>{};
 main.dataset.contentEntrance='ready';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const groups=new Map(),animations=new Set(),owned=new WeakSet(),imageAnimations=new WeakMap();
 let stopped=false;
 // Retire the earlier reveal effect so that elements never receive two entrances.
 main.querySelectorAll('.tp-reveal').forEach(el=>el.classList.remove('tp-reveal'));
 const style=document.createElement('style');style.dataset.productEntrance='true';
 style.textContent=`.tp-main [data-entrance-state='waiting'],.premium-foreground>[data-entrance-state='waiting']{opacity:0}
 @media(prefers-reduced-motion:reduce){[data-entrance-state='waiting']{opacity:1!important}}`;
 document.head.append(style);
 const easing='cubic-bezier(.22,1,.36,1)';
 function motion(el,{delay=0,lift=30,duration=850,media=false}={}) {
  if(stopped||reduced.matches||!el.animate){el.dataset.entranceState='shown';return;}
  el.dataset.entranceState='entering';
  const frames=media?[{opacity:0,translate:'0px 16px',scale:'.985'},{opacity:1,translate:'0px 0px',scale:'1'}]:lift?[{opacity:0,translate:`0px ${lift}px`},{opacity:1,translate:'0px 0px'}]:[{opacity:0},{opacity:1}];
  const animation=el.animate(frames,{duration,delay,easing,fill:'both'});animations.add(animation);
  animation.finished.then(()=>{el.dataset.entranceState='shown';animation.cancel();animations.delete(animation);},()=>animations.delete(animation));
  return animation;
 }
 function imageEntrance(img,delay=120){
  if(!img)return;
  const run=()=>{
   imageAnimations.get(img)?.cancel();
   const animation=motion(img,{delay,duration:1100,media:true});if(animation)imageAnimations.set(img,animation);
  };
  if(img.complete)run();else{img.addEventListener('load',run,{once:true});img.addEventListener('error',()=>img.dataset.entranceState='shown',{once:true});}
 }
 function show(group,instant=false){
  if(group.done)return;group.done=true;observer.unobserve(group.container);group.container.dataset.entranceGroup='shown';
  group.items.forEach((item,i)=>{
   if(instant||reduced.matches)item.el.dataset.entranceState='shown';
   else motion(item.el,{delay:(group.delay||0)+i*(group.stagger??100),duration:group.duration||850,lift:item.lift??group.lift??30});
  });
  if(!instant&&!reduced.matches)group.images?.forEach((img,i)=>imageEntrance(img,120+i*60));
 }
 const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{if(entry.isIntersecting){const group=groups.get(entry.target);if(group)show(group);}});
 },{rootMargin:'0px 0px -10% 0px',threshold:0});
 function register(container,items,options={}){
  if(!container)return;
  const rows=items.filter(Boolean).map(item=>item.el?item:{el:item}).filter(item=>{if(owned.has(item.el))return false;owned.add(item.el);return true;});
  const group={container,items:rows,...options,done:false};groups.set(container,group);
  if(reduced.matches||container.getBoundingClientRect().bottom<0){show(group,true);return;}
  container.dataset.entranceGroup='waiting';rows.forEach(item=>item.el.dataset.entranceState='waiting');observer.observe(container);
 }
 const hero=main.querySelector('.tp-hero'),heroCopy=hero.querySelector('.tp-hero-copy');
 const heroItems=[...heroCopy.children];
 if(reduced.matches||hero.getBoundingClientRect().bottom<0){heroItems.forEach(el=>el.dataset.entranceState='shown');}
 else{
  heroItems.forEach(el=>{el.dataset.entranceState='waiting';owned.add(el);});
  Promise.race([document.fonts?.ready||Promise.resolve(),new Promise(resolve=>setTimeout(resolve,800))]).then(()=>{
   if(stopped)return;
   heroItems.forEach((el,i)=>motion(el,{delay:i*110,duration:900,lift:30}));
   if(scrollY<innerHeight*.6)main.querySelectorAll('.tp-travel-layer>img').forEach((img,i)=>imageEntrance(img,200+i*55));
  });
 }
 main.querySelectorAll('.tp-section-head').forEach(head=>register(head,[...head.children],{stagger:110}));
 const proof=main.querySelector('.tp-proof');register(proof,[{el:proof,lift:0}],{duration:1000,images:[]});
 main.querySelectorAll('.tp-intro-components,.tp-local-reference-card,.tp-component-row,.tp-pair-card').forEach(card=>{
  const copy=card.querySelector('.tp-component-copy,.tp-pair-copy');
  const content=copy?[...copy.children]:[...card.querySelectorAll('.tp-disclosure')];
  const images=[...card.querySelectorAll('.tp-local-reference-art img,.tp-pair-art>img')];
  card.querySelectorAll('[data-layer-destination]').forEach(slot=>{
   const img=main.querySelector(`[data-story-layer='${slot.dataset.layerDestination}']>img`);if(img)images.push(img);
  });
  register(card,[{el:card,lift:0},...content.map(el=>({el,lift:22}))],{stagger:85,duration:950,images});
 });
 const features=main.querySelector('.tp-features'),shell=features.querySelector('.tp-feature-shell'),tabs=features.querySelector('.tp-feature-tabs');
 const featureItems=()=>[...features.querySelectorAll('.tp-feature-panel:not([hidden]) .tp-feature-tile')];
 register(features,[{el:shell,lift:0},...features.querySelectorAll('.tp-feature-header .tp-eyebrow,.tp-feature-header h2'),{el:tabs,lift:18},...featureItems().map(el=>({el,lift:22}))],{stagger:85,duration:850});
 let selected=features.querySelector('[aria-selected=true]')?.id;
 function tabChange(){queueMicrotask(()=>{
  const current=features.querySelector('[aria-selected=true]')?.id;if(current===selected)return;selected=current;
  featureItems().forEach((el,i)=>motion(el,{delay:i*65,duration:600,lift:18}));
 });}
 tabs.addEventListener('click',tabChange);tabs.addEventListener('keydown',tabChange);
 const faq=document.querySelector('[data-name="section-faq"]'),contact=document.querySelector('.premium-contact');
 register(faq,[{el:faq,lift:0}],{duration:1000});register(contact,[{el:contact,lift:0}],{duration:1000});
 function focus(event){groups.forEach(group=>{if(!group.done&&group.container.contains(event.target))show(group,true);});}
 function preference(){if(reduced.matches){animations.forEach(a=>a.cancel());groups.forEach(group=>show(group,true));document.querySelectorAll('[data-entrance-state]').forEach(el=>el.dataset.entranceState='shown');}}
 function visibility(){animations.forEach(a=>{if(document.hidden)a.pause();else a.play();});}
 document.addEventListener('focusin',focus);document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',preference);
 return()=>{stopped=true;observer.disconnect();animations.forEach(a=>a.cancel());style.remove();document.removeEventListener('focusin',focus);document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',preference);document.querySelectorAll('[data-entrance-state]').forEach(el=>el.removeAttribute('data-entrance-state'));};
}
// Also runs as a standalone module in the compiled private preview snapshot.
function bootstrap(){
 const main=document.querySelector('.tp-main');
 if(!main?.querySelector('.tp-paired-section')||!main?.querySelector('.tp-local-reference-card'))return false;
 setupContentEntrance(main);return true;
}
if(!bootstrap()){
 const mountObserver=new MutationObserver(()=>{if(bootstrap())mountObserver.disconnect();});
 mountObserver.observe(document.documentElement,{childList:true,subtree:true});
}
