import {softenBorders} from './border-opacity';
import {mountFooter} from './footer';
import {createContactSection} from './contact';
import {createFaqItem} from './faq';
import {mountSplitButtons} from './split-button';
import './controls.css';
import {mountNavigation} from './navigation';
import './navigation.css';
import './typography.css';

window.AltenarUI = {mountNavigation,mountSplitButtons,createFaqItem,createContactSection,mountFooter};

// Load the portable export after shared component APIs are registered.
const turnkey = document.createElement('script');
turnkey.type = 'module';
turnkey.src = '/_turnkey/assets/turnkey-contained-art-20261104.js';
document.head.append(turnkey);

import './sportsbook-local-cards.css';
import './sportsbook-platform.css';
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
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  cards.forEach(card => card.classList.add('local-card-reveal','local-card-pending'));
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    cards.forEach((card, index) => window.setTimeout(() => card.classList.remove('local-card-pending'), index * 220));
  }, {threshold:.12});
  observer.observe(list);
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
  hero.src = '/_turnkey/premium-media/turnkey/platform-user.png';
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
