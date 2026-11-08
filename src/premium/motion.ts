import {gsap} from 'gsap';
import {$} from '../sections';
import {setupPremiumNews} from './news-motion';
import {setupFooterUnderlay} from './footer';
import {setupHeroVideo} from './hero-video';
import {setupStatsMotion} from './stats-motion';
import {setupSolutions} from './solutions';

export function setupPremiumMotion(){
  const hero=$('section-hero')!,media=hero.querySelector<HTMLElement>('.premium-hero-background')!,nav=$('navbar--sketch-a')!;
  const query=matchMedia('(prefers-reduced-motion: reduce)'),footerLayout=setupFooterUnderlay(),disposeNews=setupPremiumNews(),heroPlayer={sync:(_active:boolean)=>{},dispose:()=>{}},disposeSolutions=setupSolutions();
  let heroStart=window.scrollY+hero.parentElement!.getBoundingClientRect().top,headerInitial=true;
  let raf=0,gradientRaf=0,disposed=false,disposeStats=()=>{},scrolled=false;
  let headerTween:gsap.core.Tween|undefined;
  const gradients=new Map<HTMLElement,boolean>(),phase={value:0};
  const eligible=(el:HTMLElement)=>gradients.get(el)&&!document.hidden&&!query.matches&&el.dataset.gradientFilled!=='false';
  const paintGradients=()=>gradients.forEach((visible,el)=>{if(eligible(el))el.style.setProperty('--premium-gradient-phase',`${phase.value}%`);});
  const clock=gsap.to(phase,{value:200,duration:4,repeat:-1,ease:'none',paused:true,onUpdate:paintGradients});
  const syncGradients=()=>{let any=false;gradients.forEach((visible,el)=>{const active=!!eligible(el);el.dataset.gradientActive=String(active);any ||= active;if(query.matches)el.style.setProperty('--premium-gradient-phase','0%');});clock.paused(!any);};
  const draw=()=>{raf=0;if(disposed)return;const h=hero.clientHeight||window.innerHeight,y=window.scrollY;
    // Hysteresis prevents tiny scroll changes from flickering the header.
    const boundary=heroStart+h-37,next=scrolled?y>=boundary-2:y>=boundary+2;
    if(headerInitial||next!==scrolled){scrolled=next;nav.classList.toggle('premium-nav-on-light',scrolled);headerTween?.kill();
      headerTween=gsap.to(nav,{backgroundColor:scrolled?'#ffffff':'rgba(255,255,255,0)','--premium-header-ink':scrolled?'#141a22':'#ffffff','--premium-header-progress':scrolled?1:0,borderBottomLeftRadius:scrolled?'24px':'0px',borderBottomRightRadius:scrolled?'24px':'0px',duration:query.matches||headerInitial?0:.35,ease:'power2.inOut'});
    }
    headerInitial=false;
    media.style.transform=query.matches?'none':`translate3d(0,${Math.min(y,h)*.075}px,0)`;
    footerLayout.draw();heroPlayer.sync(y<h-37);syncGradients();
  };
  const update=()=>{if(!raf)raf=requestAnimationFrame(draw);};
  const resize=()=>{heroStart=window.scrollY+hero.parentElement!.getBoundingClientRect().top;footerLayout.resize();update();};
  window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',update);query.addEventListener('change',resize);draw();
  const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>gradients.set(entry.target as HTMLElement,entry.isIntersecting));syncGradients();},{rootMargin:'80px'});
  const registerGradients=()=>{
    gradients.forEach((_,el)=>{if(!el.isConnected){observer.unobserve(el);gradients.delete(el);}});
    document.querySelectorAll<HTMLElement>('.premium-gradient').forEach(el=>{if(!gradients.has(el)){el.style.setProperty('--premium-gradient-phase',`${phase.value}%`);gradients.set(el,false);observer.observe(el);}});syncGradients();
  };
  const accentChanged=()=>syncGradients();document.addEventListener('premium:gradient-state',accentChanged);document.addEventListener('premium:gradients-refresh',registerGradients);
  Promise.resolve(document.fonts.ready).then(()=>{if(!disposed)gradientRaf=requestAnimationFrame(()=>{if(disposed)return;disposeStats=setupStatsMotion();registerGradients();footerLayout.resize();});});
  return()=>{disposed=true;cancelAnimationFrame(raf);cancelAnimationFrame(gradientRaf);observer.disconnect();clock.kill();headerTween?.kill();heroPlayer.dispose();footerLayout.dispose();disposeNews();disposeStats();disposeSolutions();window.removeEventListener('scroll',update);window.removeEventListener('resize',resize);document.removeEventListener('visibilitychange',update);document.removeEventListener('premium:gradient-state',accentChanged);document.removeEventListener('premium:gradients-refresh',registerGradients);query.removeEventListener('change',resize);};
}
