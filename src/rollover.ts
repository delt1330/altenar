import {mountArrowRollover} from './shared/arrows';
import {$,all} from './sections';
export function setupArrowRollovers(){
  const cleanup:(()=>void)[]=[];
  const install=(...args:Parameters<typeof mountArrowRollover>)=>cleanup.push(mountArrowRollover(...args));
  document.querySelectorAll<HTMLElement>('.split-button:not([data-premium-split])').forEach(root=>{const arrow=$('button-split__arrow',root),icon=arrow&&$('button__icon',arrow);if(arrow&&icon)install(arrow,root,'next',icon);});
  document.querySelectorAll<HTMLElement>('.nav-arrow').forEach(root=>{const icon=$('button__icon',root);if(icon)install(root,root,root.dataset.direction==='prev'?'prev':'next',icon);});
  document.querySelectorAll<HTMLElement>('.slant-button').forEach(root=>{const icon=$('button__icon',root);if(icon)install(icon,root,'next',icon,false);});
  all('news-card__arrow').forEach(host=>{const icon=$('button__icon',host);if(icon)install(host,host.closest<HTMLElement>('[data-name="news-card-slant"]')!,'next',icon);});
  const country=$('markets/country-cta');if(country){const icon=country.lastElementChild as HTMLElement;if(icon)install(icon,country,'next',icon,false);}
  return ()=>cleanup.forEach(fn=>fn());
}
