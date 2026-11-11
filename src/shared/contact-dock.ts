// Bottom "Contact us" island (Turnkey only). It takes over from the top nav:
// shown while the nav is hidden by scrolling down, past the hero, and away from
// the Contact section and Footer, so one CTA is on screen at a time.
import './contact-dock.css';

const NAV='.premium-page>[data-shared-navigation]';

export function mountContactDock(){
  const nav=document.querySelector<HTMLElement>(NAV),cta=nav?.querySelector<HTMLElement>("[data-name='navbar__cta']");
  const hero=document.querySelector<HTMLElement>("[data-name='section-hero']");
  const stops=[...document.querySelectorAll<HTMLElement>('[data-shared-contact],[data-shared-footer]')];
  if(document.querySelector('.glow-contact-dock'))return true;
  if(!nav||!cta||!hero||stops.length<2)return false;

  const dock=document.createElement('div');dock.className='glow-contact-dock';
  const label=document.createElement('p');label.className='glow-contact-dock__label';label.textContent="Ready to grow? Let's talk";
  // The clone keeps the nav CTA's look and text roll; clicks go to the real CTA.
  const button=cta.cloneNode(true) as HTMLElement;
  button.querySelectorAll('[data-node-id]').forEach(el=>el.removeAttribute('data-node-id'));button.removeAttribute('data-node-id');
  button.addEventListener('click',()=>cta.click());
  button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();cta.click();}});
  dock.append(label,button);document.body.append(dock);

  const near=new Set<Element>();
  const update=()=>{
    const pastHero=!hero||hero.getBoundingClientRect().bottom<0;
    const show=nav.classList.contains('glow-nav-hidden')&&pastHero&&!near.size;
    dock.classList.toggle('is-visible',show);dock.inert=!show;
  };
  new MutationObserver(update).observe(nav,{attributes:true,attributeFilter:['class']});
  const io=new IntersectionObserver(entries=>{entries.forEach(e=>e.isIntersecting?near.add(e.target):near.delete(e.target));update();});
  stops.forEach(el=>io.observe(el));
  window.addEventListener('scroll',update,{passive:true});
  update();
  return true;
}
