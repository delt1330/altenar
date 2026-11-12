import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import {$,all} from '../sections';
import './hero-motion.css';

gsap.registerPlugin(ScrollTrigger,SplitText);

// Home hero motion (reference: analogueagency.com).
// Load: the slogan appears letter by letter (each letter grows from 90% and
// fades in), the eyebrow wipes in, the menu drops in item by item, then the
// description and the button rise.
// Scroll: the slogan's two lines part to the left and right while the
// description and button move up and fade; under it the stats panel fades in.
// Runs before first paint (Design.tsx layout effect), so nothing flashes;
// the load sequence starts once fonts are ready. Off for reduced motion.
export function setupHeroMotion(){
  const hero=$('section-hero'),nav=$('navbar--sketch-a');
  const heading=hero?.querySelector<HTMLElement>('[data-node-id="4001:111760"]');
  const main=hero&&$('hero__main',hero),aside=hero&&$('hero__aside',hero);
  if(!hero||!nav||!heading||!main||!aside||matchMedia('(prefers-reduced-motion: reduce)').matches)return()=>{};

  const original=heading.innerHTML;
  const parts=original.split(/<br\s*\/?>/i);
  heading.innerHTML=parts.map(part=>`<span class="hero-line">${part}</span>`).join('<br>');
  const lines=Array.from(heading.querySelectorAll<HTMLElement>('.hero-line'));
  const splits=lines.map(line=>SplitText.create(line,{type:'words,chars',tag:'span',charsClass:'hero-char'}));
  const chars=splits.flatMap(split=>split.chars as HTMLElement[]);
  const eyebrow=main.querySelector<HTMLElement>(':scope>p:first-child');
  const asideItems=Array.from(aside.children) as HTMLElement[];
  const navItems=[$('logo_main',nav),...all('navbar__link',nav),$('language-trigger--slant',nav),$('navbar__cta',nav)].filter((el):el is HTMLElement=>!!el);

  // Hidden start state, set before paint.
  gsap.set(chars,{autoAlpha:0,scale:.9});
  if(eyebrow)gsap.set(eyebrow,{clipPath:'inset(0 100% 0 0)'});
  gsap.set(navItems,{autoAlpha:0,y:-16});
  gsap.set(asideItems,{autoAlpha:0,y:24});

  const intro=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
  if(eyebrow)intro.to(eyebrow,{clipPath:'inset(0 0% 0 0)',duration:.8,clearProps:'clipPath'},0);
  intro.to(chars,{autoAlpha:1,scale:1,duration:.55,stagger:.04},.15)
    .to(navItems,{autoAlpha:1,y:0,duration:.7,stagger:.05,clearProps:'transform,opacity,visibility'},.45)
    .to(asideItems,{autoAlpha:1,y:0,duration:.8,stagger:.12,clearProps:'transform,opacity,visibility'},.15+chars.length*.04-.1);
  let started=false;
  const start=()=>{if(!started){started=true;intro.play();}};
  Promise.resolve(document.fonts?.ready).then(start);
  const fallback=window.setTimeout(start,1500);

  // Scroll: lines part, description and button go up.
  const leave=gsap.timeline({scrollTrigger:{trigger:hero,start:'top top',end:'bottom 30%',scrub:1}});
  lines.forEach((line,index)=>leave.to(line,{x:()=>(index%2?1:-1)*innerWidth*.7,ease:'power1.in',duration:1},0));
  leave.to(lines,{opacity:0,duration:.35,ease:'none'},.65);
  if(eyebrow)leave.to(eyebrow,{opacity:0,duration:.4,ease:'none'},0);
  leave.to(aside,{y:-240,opacity:0,duration:.7,ease:'power1.in'},0);

  // Stats under the hero fade in from transparent as they scroll in.
  const panel=document.querySelector<HTMLElement>('.premium-stats-cards'),stats=$('section-stats');
  const fade=panel&&stats?gsap.fromTo(panel,{autoAlpha:0},{autoAlpha:1,ease:'none',scrollTrigger:{trigger:stats,start:'top bottom',end:'top 55%',scrub:1.2}}):null;

  return()=>{
    window.clearTimeout(fallback);intro.kill();leave.scrollTrigger?.kill();leave.kill();fade?.scrollTrigger?.kill();fade?.kill();if(panel)gsap.set(panel,{clearProps:'all'});
    gsap.set([...navItems,...asideItems,aside],{clearProps:'all'});if(eyebrow)gsap.set(eyebrow,{clearProps:'all'});
    splits.forEach(split=>split.revert());heading.innerHTML=original;
  };
}
