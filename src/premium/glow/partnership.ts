import paths from './partnership-icons.json';
import './partnership.css';

// Reuse the Phosphor regular SVG geometry and soft badge from the Turnkey page.
const icons=['operations','globe','trading','support','control','protect','growth'] as const;
export function setupPartnershipCards(){
  const track=document.querySelector<HTMLElement>('[data-name="benefits__track"]');
  if(!track)return;
  Array.from(track.children).forEach((element,index)=>{
    const card=element as HTMLElement,key=icons[index%icons.length];
    card.classList.add('glow-partnership-card');
    card.querySelectorAll(':scope > img,:scope > .benefit-morph,:scope > .glow-partnership-icon').forEach(el=>el.remove());
    const icon=document.createElementNS('http://www.w3.org/2000/svg','svg'),id=`partnership-icon-${index}`;
    icon.classList.add('glow-partnership-icon');icon.setAttribute('viewBox','0 0 256 256');
    icon.setAttribute('aria-hidden','true');icon.dataset.iconLibrary='phosphor-regular';icon.dataset.iconName=key;
    icon.innerHTML=`<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#018DFF"/><stop offset="1" stop-color="#0BDAFF"/></linearGradient></defs><rect x="4" y="4" width="248" height="248" rx="56" fill="white" fill-opacity=".045"/><g transform="translate(82.2857 82.2857) scale(.35714286)" fill="url(#${id})" stroke="none">${paths[key]}</g>`;
    card.prepend(icon);
    const copy=document.createElement('div');copy.className='glow-partnership-copy';
    card.querySelectorAll(':scope > p').forEach(p=>copy.append(p));
    card.append(copy);
  });
}
