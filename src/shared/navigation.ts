import {turnkeyProductUrl} from './routes';
export function mountNavigation(){
  const nav=document.querySelector<HTMLElement>('[data-name="navbar--sketch-a"]');
  const trigger=Array.from(nav?.querySelectorAll<HTMLElement>('[data-name="navbar__link"]')||[]).find(el=>/^solutions$/i.test((el.textContent||'').trim()));
  if(!nav||!trigger)return()=>{};
  nav.dataset.sharedNavigation='true';
  const logo=nav.querySelector<HTMLElement>('[data-name="logo_main"]');
  const goHome=(e:Event)=>{e.preventDefault();e.stopImmediatePropagation();window.location.assign('/');};
  const logoKey=(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' ')goHome(e);};
  logo?.setAttribute('aria-label','Home');
  logo?.addEventListener('click',goHome,true);
  logo?.addEventListener('keydown',logoKey,true);
  const menu=document.createElement('div');menu.className='glow-mega-menu';menu.id='glow-solutions-menu';menu.hidden=true;
  menu.innerHTML=`<div class="glow-mega-feature"><div class="glow-mega-label">Featured</div><img class="glow-mega-feature-art" src="/_turnkey/glow-media/mega-menu-featured.png" alt=""><p>Find the right way to launch or scale your sportsbook. From API integration to</p></div><div class="glow-mega-sports"><div class="glow-mega-label">Sportsbook</div><a href="${turnkeyProductUrl}"><strong>Turnkey Sportsbook</strong><span>Find the right way to launch or scale</span></a><button type="button"><strong>Retail</strong><span>Find the right way to launch</span></button><button type="button"><strong>White label</strong><span>Find the way to launch or scale</span></button><button type="button"><strong>Omni channel</strong><span>Find the right way to launch or scale</span></button></div><div class="glow-mega-services"><div class="glow-mega-label">Managed services</div><button type="button">Integration</button><button type="button">Migration</button><button type="button">Implementation</button><button type="button">Business support</button><button type="button">Risk &amp; trading</button><button type="button">Client success</button></div>`;
  document.body.append(menu);trigger.setAttribute('role','button');trigger.tabIndex=0;trigger.setAttribute('aria-controls',menu.id);trigger.setAttribute('aria-expanded','false');trigger.setAttribute('aria-haspopup','true');
  const position=()=>{const rect=nav.getBoundingClientRect();menu.style.top=`${rect.bottom}px`;menu.style.left=`${rect.left}px`;menu.style.width=`${rect.width}px`;};
  let timer=0;const setOpen=(open:boolean)=>{clearTimeout(timer);if(open)position();menu.hidden=!open;trigger.setAttribute('aria-expanded',String(open));nav.classList.toggle('glow-menu-open',open);};
  const enter=()=>setOpen(true),leave=()=>{timer=window.setTimeout(()=>setOpen(false),180);};
  const click=(e:Event)=>{e.preventDefault();e.stopPropagation();setOpen(true);};
  const key=(e:KeyboardEvent)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();setOpen(menu.hidden);}else if(e.key==='Escape'){setOpen(false);trigger.focus();}};
  const menuKey=(e:KeyboardEvent)=>{if(e.key==='Escape'){e.preventDefault();setOpen(false);trigger.focus();}};
  const outside=(e:PointerEvent)=>{if(!nav.contains(e.target as Node)&&!menu.contains(e.target as Node))setOpen(false);};
  const menuClick=(e:Event)=>{if(!(e.target as HTMLElement).closest('button'))return;setOpen(false);document.querySelector<HTMLElement>('[data-name="section-solutions"]')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});};
  trigger.addEventListener('pointerenter',enter);trigger.addEventListener('click',click);trigger.addEventListener('keydown',key);nav.addEventListener('pointerleave',leave);menu.addEventListener('pointerenter',enter);menu.addEventListener('pointerleave',leave);window.addEventListener('resize',position);window.addEventListener('scroll',position,{passive:true});menu.addEventListener('keydown',menuKey);menu.addEventListener('click',menuClick);document.addEventListener('pointerdown',outside);
  return()=>{logo?.removeEventListener('click',goHome,true);logo?.removeEventListener('keydown',logoKey,true);delete nav.dataset.sharedNavigation;clearTimeout(timer);trigger.removeEventListener('pointerenter',enter);trigger.removeEventListener('click',click);trigger.removeEventListener('keydown',key);nav.removeEventListener('pointerleave',leave);menu.removeEventListener('pointerenter',enter);menu.removeEventListener('pointerleave',leave);window.removeEventListener('resize',position);window.removeEventListener('scroll',position);menu.removeEventListener('keydown',menuKey);menu.removeEventListener('click',menuClick);document.removeEventListener('pointerdown',outside);menu.remove();nav.classList.remove('glow-menu-open');trigger.removeAttribute('aria-controls');trigger.removeAttribute('aria-expanded');trigger.removeAttribute('aria-haspopup');};
}
