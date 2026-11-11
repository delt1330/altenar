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
  menu.innerHTML=`<button type="button" class="glow-mega-back" aria-label="Back to menu"><span aria-hidden="true"></span>Solutions</button><div class="glow-mega-feature"><div class="glow-mega-label">Featured</div><img class="glow-mega-feature-art" src="/_turnkey/glow-media/mega-menu-featured.webp" alt=""><p>Find the right way to launch or scale your sportsbook. From API integration to</p></div><div class="glow-mega-sports"><div class="glow-mega-label">Sportsbook</div><a href="${turnkeyProductUrl}"><strong>Turnkey Sportsbook</strong><span>Find the right way to launch or scale</span></a><button type="button"><strong>Retail</strong><span>Find the right way to launch</span></button><button type="button"><strong>White label</strong><span>Find the way to launch or scale</span></button><button type="button"><strong>Omni channel</strong><span>Find the right way to launch or scale</span></button></div><div class="glow-mega-services"><div class="glow-mega-label">Managed services</div><button type="button">Integration</button><button type="button">Migration</button><button type="button">Implementation</button><button type="button">Business support</button><button type="button">Risk &amp; trading</button><button type="button">Client success</button></div>`;
  document.body.append(menu);trigger.setAttribute('role','button');trigger.tabIndex=0;trigger.setAttribute('aria-controls',menu.id);trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-haspopup','true');
  const back=menu.querySelector<HTMLButtonElement>('.glow-mega-back')!;
  // The compact mega menu sits under the island, so it needs the island's live box.
  const position=()=>{const rect=nav.getBoundingClientRect();menu.style.top=`${rect.bottom}px`;menu.style.left=`${rect.left}px`;menu.style.width=`${rect.width}px`;menu.style.setProperty('--glow-nav-left',`${rect.left}px`);menu.style.setProperty('--glow-nav-width',`${rect.width}px`);menu.style.setProperty('--glow-nav-bottom',`${rect.bottom}px`);};
  const compactQuery=matchMedia(COMPACT),compact=()=>compactQuery.matches;
  const burger=mountBurger(nav,menu);const hide=mountScrollHide(nav,()=>{setOpen(false);burger.close();});
  trigger.dataset.navSubmenu='true';
  let timer=0;const setOpen=(open:boolean)=>{clearTimeout(timer);if(open)position();menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open));nav.classList.toggle('glow-menu-open',open);};
  // Focus moves only for keyboard-initiated clicks (detail 0), so a tap leaves no focus highlight.
  const byKeyboard=(e:Event)=>(e as MouseEvent).detail===0;
  // In the burger, Solutions opens the mega menu as a second screen of the panel; Back returns to the links.
  const enter=()=>{if(!compact())setOpen(true);},leave=()=>{if(!compact())timer=window.setTimeout(()=>setOpen(false),180);};
  const click=(e:Event)=>{e.preventDefault();e.stopPropagation();if(compact()&&burger.isOpen()){setOpen(menu.hidden);if(!menu.hidden&&byKeyboard(e))back.focus();return;}burger.close();setOpen(true);};
  const key=(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setOpen(menu.hidden);if(compact()&&!menu.hidden)back.focus();}else if(e.key==='Escape'){setOpen(false);trigger.focus();}};
  // Escape inside the Solutions screen steps back one level; the burger's document listener must not also close the panel.
  const menuKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();setOpen(false);trigger.focus();}};
  const outside=(e:PointerEvent)=>{if(!nav.contains(e.target as Node)&&!menu.contains(e.target as Node))setOpen(false);};
  const menuClick=(e:Event)=>{const target=e.target as HTMLElement;
    if(target.closest('.glow-mega-back')){setOpen(false);if(byKeyboard(e))trigger.focus();return;}
    if(target.closest('a[href]')){setOpen(false);burger.close();return;}
    if(!target.closest('button'))return;const fromBurger=burger.isOpen();setOpen(false);burger.close();if(fromBurger&&byKeyboard(e))burger.focus();
    document.querySelector<HTMLElement>('[data-name="section-solutions"]')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};
  const syncMode=()=>{setOpen(false);menu.classList.toggle('glow-mega-compact',compact());};
  trigger.addEventListener('pointerenter',enter);trigger.addEventListener('click',click);trigger.addEventListener('keydown',key);nav.addEventListener('pointerleave',leave);menu.addEventListener('pointerenter',enter);menu.addEventListener('pointerleave',leave);window.addEventListener('resize',position);window.addEventListener('scroll',position,{passive:true});menu.addEventListener('keydown',menuKey);menu.addEventListener('click',menuClick);document.addEventListener('pointerdown',outside);compactQuery.addEventListener('change',syncMode);syncMode();
  return()=>{burger.dispose();hide();compactQuery.removeEventListener('change',syncMode);delete trigger.dataset.navSubmenu;logo?.removeEventListener('click',goHome,true);logo?.removeEventListener('keydown',logoKey,true);delete nav.dataset.sharedNavigation;clearTimeout(timer);trigger.removeEventListener('pointerenter',enter);trigger.removeEventListener('click',click);trigger.removeEventListener('keydown',key);nav.removeEventListener('pointerleave',leave);menu.removeEventListener('pointerenter',enter);menu.removeEventListener('pointerleave',leave);window.removeEventListener('resize',position);window.removeEventListener('scroll',position);menu.removeEventListener('keydown',menuKey);menu.removeEventListener('click',menuClick);document.removeEventListener('pointerdown',outside);menu.remove();nav.classList.remove('glow-menu-open');trigger.removeAttribute('aria-controls');trigger.removeAttribute('aria-expanded');trigger.removeAttribute('aria-haspopup');};
}

// Below this width the links collapse behind a burger: logo, language,
// Contact us and the burger stay in the bar (see navigation.css).
const COMPACT='(max-width: 1080px)';

function mountBurger(nav:HTMLElement,submenu:HTMLElement){
  const links=nav.querySelector<HTMLElement>('[data-name="navbar/nav"]'),actions=nav.querySelector<HTMLElement>('[data-name="navbar-actions__pair"]');
  if(!links||!actions)return{close:()=>{},isOpen:()=>false,focus:()=>{},dispose:()=>{}};
  links.id||=`glow-nav-links`;
  const button=document.createElement('button');button.type='button';button.className='glow-nav-burger';
  button.setAttribute('aria-label','Menu');button.setAttribute('aria-controls',links.id);button.setAttribute('aria-expanded','false');
  button.innerHTML='<span></span><span></span>';actions.append(button);
  const set=(open:boolean)=>{nav.classList.toggle('glow-burger-open',open);button.setAttribute('aria-expanded',String(open));};
  const toggle=()=>set(!nav.classList.contains('glow-burger-open'));
  const close=()=>set(false);
  const isOpen=()=>nav.classList.contains('glow-burger-open');
  // The Solutions screen lives in the body-level mega menu; taps there still belong to the burger.
  const outside=(e:PointerEvent)=>{if(!nav.contains(e.target as Node)&&!submenu.contains(e.target as Node))close();};
  const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&isOpen()&&submenu.hidden){close();button.focus();}};
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
