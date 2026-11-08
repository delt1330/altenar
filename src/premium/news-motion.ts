import {gsap} from 'gsap';
import {$,all,reduced} from '../sections';
import {setupPremiumNewsControls} from './news-controls';
export function setupPremiumNews(){
  const section=$('section-news');if(!section)return()=>{};
  const row=$('news-grid',section)!,cards=all('news-card-slant',section),quiet=reduced(),disposeControls=setupPremiumNewsControls(section);
  // Later slides are ready immediately; only visible cards get an entrance.
  const visible=cards.slice(0,4);let played=false,tween:gsap.core.Tween|undefined;
  if(quiet)return disposeControls;
  gsap.set(visible,{autoAlpha:0,y:16});
  const finish=()=>{tween?.kill();gsap.set(cards,{clearProps:'transform,opacity,visibility'});};
  const observer=new IntersectionObserver(entries=>{
    if(played||!entries.some(e=>e.isIntersecting))return;
    played=true;section.dataset.newsReveal='played';observer.disconnect();
    tween=gsap.to(visible,{autoAlpha:1,y:0,duration:.48,stagger:.12,ease:'power2.out',clearProps:'transform,opacity,visibility'});
  },{threshold:0,rootMargin:`0px 0px -${Math.round(window.innerHeight*.2)}px 0px`});observer.observe(row);
  const navigation=()=>{if(!played||row.scrollLeft>1){played=true;observer.disconnect();finish();}};
  row.addEventListener('scroll',navigation,{passive:true});
  return()=>{observer.disconnect();row.removeEventListener('scroll',navigation);finish();disposeControls();};
}
