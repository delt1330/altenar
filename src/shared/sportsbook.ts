import {softenBorders} from './border-opacity';
import {mountFooter} from './footer';
import {createContactSection} from './contact';
import {createFaqItem} from './faq';
import {mountSplitButtons} from './split-button';
import './controls.css';
import {mountNavigation} from './navigation';
import './navigation.css';
import './typography.css';
import './responsive.css';
import {mountMonoType} from './mono-type';
import {mountCornerSmoothing} from './corner-smoothing';
import {mountReview} from '../review';
import {mountContactDock} from './contact-dock';
mountMonoType();mountCornerSmoothing();mountReview();
// The nav, Contact and Footer are mounted by the Turnkey bundle; the dock waits for them.
if(!mountContactDock()){const dockWait=new MutationObserver(()=>{if(mountContactDock())dockWait.disconnect();});dockWait.observe(document.body,{childList:true,subtree:true});}

window.AltenarUI = {mountNavigation,mountSplitButtons,createFaqItem,createContactSection,mountFooter};

// Load the portable export after shared component APIs are registered.
const turnkey = document.createElement('script');
turnkey.type = 'module';
turnkey.src = '/_turnkey/assets/turnkey-contained-art-20261104.js';
document.head.append(turnkey);

import './sportsbook-local-cards.css';
import {risePanels} from './panel-rise';
import './sportsbook-platform.css';
import './sportsbook-mobile.css';
// The export mounts asynchronously; attach once the requested section exists.
const mountLocalCards = () => {
  const list = document.querySelector<HTMLElement>('.tp-local-reference-card .tp-disclosure-list');
  if (!list) return false;
  const cards = Array.from(list.querySelectorAll<HTMLElement>('.tp-disclosure'));
  if (!cards.length) return false;
  list.style.setProperty('backdrop-filter', 'none', 'important');
  list.style.setProperty('-webkit-backdrop-filter', 'none', 'important');
  cards.forEach(card => {
    card.style.setProperty('backdrop-filter', 'blur(20px)', 'important');
    card.style.setProperty('-webkit-backdrop-filter', 'blur(20px)', 'important');
  });
  risePanels(list, cards);
  return true;
};
if (!mountLocalCards()) {
  const observer = new MutationObserver(() => {if (mountLocalCards()) observer.disconnect();});
  observer.observe(document.documentElement, {childList:true,subtree:true});
}

// Apply page-specific changes as soon as the portable export has mounted.
const applyTurnkeyChanges = () => {
  const hero = document.querySelector<HTMLImageElement>('.tp-hero-art img');
  const faq = document.querySelector<HTMLElement>('[data-name="section-faq"]');
  if (!hero || !faq) return false;
  hero.src = '/_turnkey/premium-media/turnkey/platform-user.webp';
  faq.remove();
  return true;
};
if (!applyTurnkeyChanges()) {
  const observer = new MutationObserver(() => {if (applyTurnkeyChanges()) observer.disconnect();});
  observer.observe(document.documentElement, {childList:true,subtree:true});
}

softenBorders();

// The portable page mounts asynchronously; keep the five Figma illustrations
// mounted so switching between platform steps is immediate.
const mountPlatformIllustrations = () => {
  const section = document.querySelector<HTMLElement>('.tp-platform');
  const placeholder = section?.querySelector<HTMLElement>('.rd-placeholder');
  const buttons = section?.querySelectorAll<HTMLButtonElement>('.tp-disclosure button[data-step]');
  if (!placeholder || !buttons || buttons.length !== 5) return false;
  placeholder.classList.add('tp-platform-illustrations');
  for (let i = 0; i < buttons.length; i++) {
    const img = document.createElement('img');
    img.src = `/_turnkey/premium-media/features/0${i + 1}.svg`;
    img.alt = '';
    img.loading = 'eager';
    img.decoding = 'async';
    img.hidden = true;
    placeholder.append(img);
  }
  const images = Array.from(placeholder.querySelectorAll<HTMLImageElement>('img'));
  const update = () => {
    const selected = Array.from(buttons).findIndex(button => button.getAttribute('aria-expanded') === 'true');
    images.forEach((image, index) => { image.hidden = index !== selected; });
  };
  const observer = new MutationObserver(update);
  buttons.forEach(button => observer.observe(button, {attributes:true,attributeFilter:['aria-expanded']}));
  update();
  return true;
};
if (!mountPlatformIllustrations()) {
  const observer = new MutationObserver(() => { if (mountPlatformIllustrations()) observer.disconnect(); });
  observer.observe(document.documentElement, {childList:true,subtree:true});
}

// Tools on tablets and phones (one column, see sportsbook-mobile.css): the
// pinned stage must fit the screen. Shrink the art first (down to 120px), then
// pin the stage by its bottom so only the title slides away.
const fitToolsStage = () => {
  const stage = document.querySelector<HTMLElement>('.rd-tools .rd-sticky');
  const art = stage?.querySelector<HTMLElement>('.rd-art');
  if (!stage || !art) return false;
  const narrow = matchMedia('(max-width: 1023px)');
  const fit = () => {
    if (!narrow.matches) {stage.style.removeProperty('--rd-art-h'); stage.style.removeProperty('--rd-pin'); return;}
    const max = innerWidth < 768 ? 200 : 280;
    stage.style.setProperty('--rd-art-h', `${max}px`);
    const rest = stage.offsetHeight - art.offsetHeight;
    stage.style.setProperty('--rd-art-h', `${Math.max(120, Math.min(max, innerHeight - rest))}px`);
    stage.style.setProperty('--rd-pin', `${Math.min(0, innerHeight - stage.offsetHeight)}px`);
  };
  let frame = 0;
  const schedule = () => {cancelAnimationFrame(frame); frame = requestAnimationFrame(fit);};
  addEventListener('resize', schedule);
  narrow.addEventListener('change', schedule);
  document.fonts?.ready.then(schedule);
  fit();
  return true;
};
if (!fitToolsStage()) {
  const observer = new MutationObserver(() => { if (fitToolsStage()) observer.disconnect(); });
  observer.observe(document.documentElement, {childList:true,subtree:true});
}
