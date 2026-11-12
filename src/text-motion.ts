import {gsap} from 'gsap';
import {SplitText} from 'gsap/SplitText';
import {$,node,reduced} from './sections';
gsap.registerPlugin(SplitText);
const seen=new WeakSet<HTMLElement>();
const pending=new Set<gsap.core.Tween>();
const splits=new Set<ReturnType<typeof SplitText.create>>();
// Blocks with their own entrance (premium/hero-motion.ts): no text or control reveal here.
const owned='[data-name="section-hero"],[data-name="section-stats"]';
const exclude=owned+',.glow-faq-answer,[data-name="news-card-slant"],[data-name="footer--window"],[data-name="section-solutions"],.premium-stats-title,.premium-metric,[data-name="button-split__label"],[data-name="button__icon"],.slant-button,.choice-chip,.partner-scroll,.partner-details,.solution-canvas,[data-name="country-index__row"],[data-name="markets/country-card"],[data-name="section-statement"]';
function fontSize(el:HTMLElement){
  const css=getComputedStyle(el);let size=parseFloat(css.fontSize);
  if(css.fontSize.includes('--h'))return 64;
  if(!size){for(const child of el.querySelectorAll<HTMLElement>('span')){const value=getComputedStyle(child).fontSize;size=Math.max(size||0,value.includes('--h')?64:parseFloat(value)||0);}}
  if(!size)size=parseFloat(getComputedStyle(el.parentElement!).fontSize);
  return size||16;
}
function play(el:HTMLElement,type:'heading'|'body'|'label'|'control',delay:number){
  if(seen.has(el))return;seen.add(el);el.style.visibility='';
  if(reduced())return;
  let tween:gsap.core.Tween;
  if(type==='label'){tween=gsap.from(el,{clipPath:'inset(0 100% 0 0)',opacity:0,duration:.7,delay,ease:'power2.out',clearProps:'clipPath,opacity',onComplete:()=>pending.delete(tween)});}else if(type==='heading'&&(el.dataset.nodeId==='I4011:36550;3933:58747'||el.querySelector('.premium-gradient'))){
    // This Figma heading paints its clipped gradient on the parent and its
    // type on direct child spans. Animate that single painted unit: splitting
    // its children separates the background/text layers and changes their CSS.
    tween=gsap.from(el,{y:26,opacity:0,duration:.74,delay,ease:'power3.out',clearProps:'transform,opacity',onComplete:()=>{pending.delete(tween);el.querySelectorAll<HTMLElement>('.premium-gradient').forEach(g=>{g.dataset.gradientFilled='true';g.dispatchEvent(new Event('premium:gradient-state',{bubbles:true}));});}});
  }else if(type==='heading'){
    const split=SplitText.create(el,{type:'lines',mask:'lines',linesClass:'entrance-line'});splits.add(split);
    tween=gsap.from(split.lines,{y:26,opacity:0,duration:.74,stagger:.045,delay,ease:'power3.out',onComplete:()=>{split.revert();splits.delete(split);pending.delete(tween);}});
  }else{
    tween=gsap.from(el,{opacity:0,y:type==='label'?0:14,duration:type==='label'?.35:.52,delay,ease:type==='label'?'power1.out':'power2.out',clearProps:'transform,opacity',onComplete:()=>pending.delete(tween)});
  }
  pending.add(tween);el.dataset.textEntrance=type;
}
export function revealText(scope:HTMLElement,delay=0){
  const caseContent=scope.matches('[data-name="case__content"]');
  const candidates=Array.from(scope.querySelectorAll<HTMLElement>('p'));
  if(scope.matches('p'))candidates.unshift(scope);
  let order=0;
  candidates.forEach(el=>{
    if(el.closest(exclude)||seen.has(el))return;
    const style=getComputedStyle(el),size=fontSize(el),label=style.textTransform==='uppercase'&&size<=20;
    if(label){el.classList.add('motion-eyebrow');el.parentElement?.classList.add('motion-label-container');}
    play(el,label?'label':size>=28?'heading':'body',delay+(caseContent?.08:0)+Math.min(order++*.035,.14));
  });
  scope.querySelectorAll<HTMLElement>('.split-button,.choice-chip,[data-name="case__logo"]').forEach(el=>!el.closest(owned)&&play(el,'control',delay+(caseContent?(el.matches('.split-button')?.18:0):.08)));
  if(scope.matches('.split-button,.choice-chip,[data-name="case__logo"]'))play(scope,'control',delay);
}
export function setupGlobalText(){
  const root=node('4011:36550');if(!root||reduced())return ()=>{};
  const observers:IntersectionObserver[]=[];
  const prepared:HTMLElement[]=[];
  Array.from(root.querySelectorAll(':scope > .premium-foreground > .premium-intro > *, :scope > .premium-foreground > :not(.premium-intro), :scope > :not(.premium-foreground):not(.premium-footer-underlay)')).forEach((section:HTMLElement)=>{
    if(section.matches('[data-name="navbar--sketch-a"]'))return;
    const cases=section.querySelector('[data-name="cases__slide"]');
    if(section.querySelector('[data-morph-section]')&&!cases)return;
    const scope=cases?$('cases__header',section)!:section.matches('[data-name="section-partners"]')?$('section-clients__intro',section)!:section;
    scope.querySelectorAll<HTMLElement>('p,.split-button,.choice-chip,[data-name="case__logo"]').forEach(el=>{if(!el.closest(exclude)){el.style.visibility='hidden';prepared.push(el);}});
    const run=()=>revealText(scope);
    if(typeof IntersectionObserver!=='undefined'){
      const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.12)){run();observer.disconnect();}},{threshold:.12});observer.observe(section);observers.push(observer);
    }else run();
  });
  return ()=>{observers.forEach(o=>o.disconnect());pending.forEach(t=>t.kill());splits.forEach(s=>s.revert());prepared.forEach(el=>el.style.visibility='');pending.clear();splits.clear();};
}
