import {turnkeyProductUrl} from './routes';
import {mountTextRoll} from './text-roll';
export function mountNavigation(){
  mountTextRoll();
  const nav=document.querySelector<HTMLElement>('[data-name="navbar--sketch-a"]');
  const trigger=Array.from(nav?.querySelectorAll<HTMLElement>('[data-name="navbar__link"]')||[]).find(el=>/^solutions$/i.test((el.textContent||'').trim()));
  if(!nav||!trigger)return()=>{};
  nav.dataset.sharedNavigation='true';
  const logo=nav.querySelector<HTMLElement>('[data-name="logo_main"]');
  const goHome=(e:Event)=>{e.preventDefault();e.stopImmediatePropagation();window.location.assign(import.meta.env.BASE_URL);};
  const logoKey=(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' ')goHome(e);};
  logo?.setAttribute('aria-label','Home');
  logo?.addEventListener('click',goHome,true);
  logo?.addEventListener('keydown',logoKey,true);
  const menu=document.createElement('div');menu.className='glow-mega-menu';menu.id='glow-solutions-menu';menu.hidden=true;
  const sports=`<div class="glow-mega-sports"><div class="glow-mega-label">Sportsbook</div><a href="${turnkeyProductUrl}"><strong>Turnkey Sportsbook</strong><span>Find the right way to launch or scale</span></a><button type="button"><strong>Retail</strong><span>Find the right way to launch</span></button><button type="button"><strong>White label</strong><span>Find the way to launch or scale</span></button><button type="button"><strong>Omni channel</strong><span>Find the right way to launch or scale</span></button></div>`;
  const services=`<div class="glow-mega-services"><div class="glow-mega-label">Managed services</div><button type="button">Integration</button><button type="button">Migration</button><button type="button">Implementation</button><button type="button">Business support</button><button type="button">Risk &amp; trading</button><button type="button">Client success</button></div>`;
  menu.innerHTML=`<div class="glow-mega-feature"><div class="glow-mega-label">Featured</div><img class="glow-mega-feature-art" src="/_turnkey/glow-media/mega-menu-featured.webp" alt=""><p>Find the right way to launch or scale your sportsbook. From API integration to</p></div>${sports}${services}`;
  document.body.append(menu);trigger.setAttribute('role','button');trigger.tabIndex=0;trigger.setAttribute('aria-controls',menu.id);trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-haspopup','true');
  // In the burger, Solutions expands in place under its row (an accordion), with the same items as the mega menu.
  const sub=document.createElement('div');sub.className='glow-nav-sub';sub.id='glow-solutions-sub';sub.inert=true;
  sub.innerHTML=`<div class="glow-nav-sub-inner">${sports}${services}</div>`;trigger.after(sub);
  const position=()=>{const rect=nav.getBoundingClientRect();menu.style.top=`${rect.bottom}px`;};
  const compactQuery=matchMedia(COMPACT),compact=()=>compactQuery.matches;
  const setSub=(open:boolean)=>{sub.classList.toggle('glow-nav-sub-open',open);sub.inert=!open;if(compact())trigger.setAttribute('aria-expanded',String(open));};
  trigger.dataset.navSubmenu='true';
  const burger=mountBurger(nav,()=>setSub(false));const hide=mountScrollHide(nav,()=>{setOpen(false);burger.close();});
  let timer=0;const setOpen=(open:boolean)=>{clearTimeout(timer);if(open)position();menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open));nav.classList.toggle('glow-menu-open',open);};
  const enter=()=>{if(!compact())setOpen(true);},leave=()=>{if(!compact())timer=window.setTimeout(()=>setOpen(false),180);};
  const toggle=(e:Event)=>{e.preventDefault();e.stopPropagation();if(compact())setSub(!sub.classList.contains('glow-nav-sub-open'));else setOpen(menu.hidden);};
  const click=(e:Event)=>{if(compact())return toggle(e);e.preventDefault();e.stopPropagation();setOpen(true);};
  const key=(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' ')toggle(e);else if(e.key==='Escape'&&!compact()){setOpen(false);trigger.focus();}};
  const menuKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){setOpen(false);trigger.focus();}};
  const outside=(e:PointerEvent)=>{if(!nav.contains(e.target as Node)&&!menu.contains(e.target as Node))setOpen(false);};
  // A pick from either list closes everything; non-link items lead to the Solutions section.
  const pickSolution=(e:Event)=>{const target=e.target as HTMLElement;
    if(target.closest('a[href]')){setOpen(false);burger.close();return;}
    if(!target.closest('button'))return;const fromBurger=burger.isOpen();setOpen(false);burger.close();if(fromBurger&&(e as MouseEvent).detail===0)burger.focus();
    document.querySelector<HTMLElement>('[data-name="section-solutions"]')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};
  const syncMode=()=>{setOpen(false);setSub(false);trigger.setAttribute('aria-controls',compact()?sub.id:menu.id);trigger.setAttribute('aria-expanded','false');if(compact())trigger.removeAttribute('aria-haspopup');else trigger.setAttribute('aria-haspopup','true');};
  trigger.addEventListener('pointerenter',enter);trigger.addEventListener('click',click);trigger.addEventListener('keydown',key);nav.addEventListener('pointerleave',leave);menu.addEventListener('pointerenter',enter);menu.addEventListener('pointerleave',leave);window.addEventListener('resize',position);window.addEventListener('scroll',position,{passive:true});menu.addEventListener('keydown',menuKey);menu.addEventListener('click',pickSolution);sub.addEventListener('click',pickSolution);document.addEventListener('pointerdown',outside);compactQuery.addEventListener('change',syncMode);syncMode();
  return()=>{burger.dispose();hide();compactQuery.removeEventListener('change',syncMode);delete trigger.dataset.navSubmenu;logo?.removeEventListener('click',goHome,true);logo?.removeEventListener('keydown',logoKey,true);delete nav.dataset.sharedNavigation;clearTimeout(timer);trigger.removeEventListener('pointerenter',enter);trigger.removeEventListener('click',click);trigger.removeEventListener('keydown',key);nav.removeEventListener('pointerleave',leave);menu.removeEventListener('pointerenter',enter);menu.removeEventListener('pointerleave',leave);window.removeEventListener('resize',position);window.removeEventListener('scroll',position);menu.removeEventListener('keydown',menuKey);menu.removeEventListener('click',pickSolution);sub.removeEventListener('click',pickSolution);document.removeEventListener('pointerdown',outside);menu.remove();sub.remove();nav.classList.remove('glow-menu-open');trigger.removeAttribute('aria-controls');trigger.removeAttribute('aria-expanded');trigger.removeAttribute('aria-haspopup');};
}

// Below this width the links collapse behind a burger: logo, language,
// Contact us and the burger stay in the bar (see navigation.css).
const COMPACT='(max-width: 1080px)';

function mountBurger(nav:HTMLElement,onClose:()=>void){
  const links=nav.querySelector<HTMLElement>('[data-name="navbar/nav"]'),actions=nav.querySelector<HTMLElement>('[data-name="navbar-actions__pair"]');
  if(!links||!actions)return{close:()=>{},isOpen:()=>false,focus:()=>{},dispose:()=>{}};
  links.id||=`glow-nav-links`;
  const button=document.createElement('button');button.type='button';button.className='glow-nav-burger';
  button.setAttribute('aria-label','Menu');button.setAttribute('aria-controls',links.id);button.setAttribute('aria-expanded','false');
  button.innerHTML='<span></span><span></span>';actions.append(button);
  const set=(open:boolean)=>{nav.classList.toggle('glow-burger-open',open);button.setAttribute('aria-expanded',String(open));if(!open)onClose();};
  const toggle=()=>set(!nav.classList.contains('glow-burger-open'));
  const close=()=>set(false);
  const isOpen=()=>nav.classList.contains('glow-burger-open');
  const outside=(e:PointerEvent)=>{if(!nav.contains(e.target as Node))close();};
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&isOpen()){close();button.focus();}};
  // Keyboard users get focus back on the burger instead of losing it inside the hidden panel.
  const pick=(e:Event)=>{if((e.target as HTMLElement).closest('[data-name="navbar__link"]:not([data-nav-submenu])')){close();if((e as MouseEvent).detail===0)button.focus({preventScroll:true});}};
  const resize=()=>{if(!matchMedia(COMPACT).matches)close();};
  button.addEventListener('click',toggle);links.addEventListener('click',pick);document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);window.addEventListener('resize',resize);
  return{close,isOpen,focus:()=>button.focus({preventScroll:true}),dispose:()=>{close();button.remove();links.removeEventListener('click',pick);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);window.removeEventListener('resize',resize);}};
}

// Scrolling down slides the island away; any upward scroll brings it back.
// It stays visible near the top, while focused, and while a menu is open
// (opening one is an explicit request to see it).
function mountScrollHide(nav:HTMLElement,onHide:()=>void){
  let last=window.scrollY,hidden=false,frame=0;
  const set=(hide:boolean)=>{if(hide===hidden)return;hidden=hide;nav.classList.toggle('glow-nav-hidden',hide);if(hide)onHide();};
  const update=()=>{
    frame=0;const y=Math.max(0,window.scrollY),delta=y-last;
    if(y<120||nav.contains(document.activeElement))set(false);
    else if(delta>6)set(true);
    else if(delta<-6)set(false);
    if(Math.abs(delta)>6||y<120)last=y;
  };
  const scroll=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const focus=()=>set(false);
  window.addEventListener('scroll',scroll,{passive:true});nav.addEventListener('focusin',focus);
  return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',scroll);nav.removeEventListener('focusin',focus);nav.classList.remove('glow-nav-hidden');};
}
