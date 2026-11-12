import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Panels rise from below as their block scrolls in (Home markets and stats,
// Turnkey local market). Each step says how far below a panel starts and at
// which viewport height (% from the top) the block top is when it lands, so
// panels can travel apart and meet at the end. Tied to scroll over a long
// range with a soft catch-up: slow, and it reverses on the way back. Off for
// reduced motion.
export type RiseStep={y:number;end:number};
const PAIR:RiseStep[]=[{y:260,end:30},{y:560,end:22}];
// Sections above mount and grow after this runs (Turnkey export, media), so
// re-measure the scroll positions whenever the page height settles.
let watching=false;
function watchPageHeight(){
  if(watching||!('ResizeObserver' in window))return;
  watching=true;
  let timer=0,height=document.documentElement.scrollHeight;
  new ResizeObserver(()=>{
    const next=document.documentElement.scrollHeight;if(next===height)return;height=next;
    clearTimeout(timer);timer=window.setTimeout(()=>ScrollTrigger.refresh(),200);
  }).observe(document.body);
}
export function risePanels(trigger:HTMLElement,panels:HTMLElement[],steps:RiseStep[]=PAIR){
  if(!panels.length||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  watchPageHeight();
  panels.forEach((panel,index)=>{
    const step=steps[Math.min(index,steps.length-1)];
    panel.style.transition='none';
    gsap.fromTo(panel,{y:step.y,autoAlpha:0},{
      y:0,autoAlpha:1,ease:'power1.out',
      scrollTrigger:{trigger,start:'top bottom',end:`top ${step.end}%`,scrub:1.8},
    });
  });
}
