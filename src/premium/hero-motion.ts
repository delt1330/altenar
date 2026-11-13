import gsap from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import {$,all} from '../sections';
import './hero-motion.css';

gsap.registerPlugin(ScrollTrigger,SplitText);

// Home hero motion (reference: analogueagency.com).
// First load (reference: roomandpillar.com): the page is covered, the menu bar
// appears in the middle of the screen collapsed to the logo, opens out to its
// full width with the items, then rises to its place; the cover fades and
// the hero intro below plays.
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
  const logo=$('logo_main',nav);
  const navItems=[...all('navbar__link',nav),$('language-trigger--slant',nav),$('navbar__cta',nav),nav.querySelector<HTMLElement>('.glow-nav-burger')].filter((el):el is HTMLElement=>!!el);

  // Hidden start state, set before paint.
  gsap.set(chars,{autoAlpha:0,scale:.9});
  if(eyebrow)gsap.set(eyebrow,{clipPath:'inset(0 100% 0 0)'});
  gsap.set(navItems,{autoAlpha:0});
  // Opacity, not visibility: the logo carries its own visibility and would show through.
  // Hold: no CSS transitions on the bar while the entrance drives it.
  nav.classList.add('hero-load-hold');gsap.set(nav,{opacity:0});
  // The island is its own layer with the bar's frame, fill and blur, so its
  // rounded ends stay whole while it opens (made at start, see dress()).
  const island=document.createElement('div');island.className='hero-load-island';
  const sides=['top','right','bottom','left'].map(side=>`border-${side}-color`),frame:[string,string,string][]=[];
  // Taken at start, once the bar has its final (softened) frame: the island
  // copies it and the bar's own frame is hidden until the entrance ends.
  const dress=()=>{
    const look=getComputedStyle(nav);
    island.style.cssText=`border-color:${look.borderTopColor};background:${look.backgroundColor};backdrop-filter:${look.backdropFilter};-webkit-backdrop-filter:${look.backdropFilter};corner-shape:${look.getPropertyValue('corner-shape')||'round'}`;
    sides.forEach(prop=>{frame.push([prop,nav.style.getPropertyValue(prop),nav.style.getPropertyPriority(prop)]);nav.style.setProperty(prop,'transparent','important');});
    nav.prepend(island);nav.classList.add('hero-load-nav');
  };
  // In the bar's own stacking context (the app root), right under it.
  const cover=document.createElement('div');cover.className='hero-load-cover';(nav.parentElement?.parentElement||document.body).append(cover);
  gsap.set(asideItems,{autoAlpha:0,y:24});

  const intro=gsap.timeline({paused:true,defaults:{ease:'power2.out'}});
  if(eyebrow)intro.to(eyebrow,{clipPath:'inset(0 0% 0 0)',duration:.8,clearProps:'clipPath'},0);
  intro.to(chars,{autoAlpha:1,scale:1,duration:.55,stagger:.04},.15)
    .to(asideItems,{autoAlpha:1,y:0,duration:.8,stagger:.12,clearProps:'transform,opacity,visibility'},.15+chars.length*.04-.1);
  let started=false;
  let entrance:gsap.core.Timeline|undefined;
  const settle=()=>{watch.disconnect();island.remove();frame.forEach(([prop,value,priority])=>value?nav.style.setProperty(prop,value,priority):nav.style.removeProperty(prop));nav.classList.remove('hero-load-nav','hero-load-hold');gsap.set(nav,{clearProps:'--intro-y,--intro-logo,--intro-side,--intro-round,opacity'});cover.remove();};
  // Measures the bar in place, parks it centred on the screen as an island just
  // around the logo, and builds the entrance from that point in time (0 at
  // start, the current time again when the screen size changes mid-way).
  // The island opens evenly from its centre while the logo slides to its place.
  const build=(at:number)=>{
    entrance?.kill();gsap.set(nav,{'--intro-y':'0px','--intro-logo':'0px','--intro-side':'0px'});
    // Screen size from the fixed cover, the box the bar is fixed to.
    const box=nav.getBoundingClientRect(),mark=(logo||nav).getBoundingClientRect(),screen=cover.getBoundingClientRect();
    const pad=mark.left-box.left,side=Math.max(0,(box.width-mark.width-pad*2)/2);
    nav.style.setProperty('--intro-round',getComputedStyle(nav).borderTopLeftRadius);
    const slide=box.left+box.width/2-(mark.left+mark.width/2);
    const lift=screen.height/2-(box.top-screen.top)-box.height/2;
    // The shared nav pins transform to none, so the bar and the logo move by
    // translate; the island is a clip-path inset. All three are CSS vars
    // (hero-motion.css), so GSAP tweens plain numbers.
    entrance=gsap.timeline({defaults:{ease:'power3.inOut'},onComplete:settle})
      .fromTo(nav,{opacity:0,'--intro-y':`${lift}px`,'--intro-logo':`${slide}px`,'--intro-side':`${side}px`},{opacity:1,duration:.5,ease:'power1.out'})
      .to(nav,{'--intro-logo':'0px','--intro-side':'0px',duration:1},'+=.25')
      .fromTo(navItems,{autoAlpha:0},{autoAlpha:1,duration:.5,stagger:.04,ease:'power1.out',clearProps:'opacity,visibility'},'<.35')
      .to(nav,{'--intro-y':'0px',duration:.9},'+=.1')
      .fromTo(cover,{autoAlpha:1},{autoAlpha:0,duration:.8,ease:'power1.out'},'-=.25')
      .add(()=>{intro.play();},'<.1');
    if(at)entrance.time(at);
  };
  let fit=0;
  // The cover is the screen: refit when it changes size (rotation, a phone settling its viewport).
  const watch=new ResizeObserver(()=>refit());
  function refit(){cancelAnimationFrame(fit);fit=requestAnimationFrame(()=>{if(entrance&&entrance.isActive())build(entrance.time());});}
  const start=()=>{
    if(started)return;started=true;
    dress();build(0);watch.observe(cover);
  };
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
    window.clearTimeout(fallback);entrance?.kill();intro.kill();settle();cancelAnimationFrame(fit);leave.scrollTrigger?.kill();leave.kill();fade?.scrollTrigger?.kill();fade?.kill();if(panel)gsap.set(panel,{clearProps:'all'});
    gsap.set([...navItems,...asideItems,aside],{clearProps:'all'});if(eyebrow)gsap.set(eyebrow,{clearProps:'all'});
    splits.forEach(split=>split.revert());heading.innerHTML=original;
  };
}
