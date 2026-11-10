import {mountFooter} from '../shared/footer';
import {$,node} from '../sections';
import benefits from './benefits.json';
import {adaptMarkets} from './markets';
import {prepareStats} from './stats-motion';
import {replaceSolutions} from './solutions';
const gradient=(text:string,angle=89)=>`<span class="premium-gradient" data-gradient-filled="false" style="--gradient-angle:${angle}deg">${text}</span>`;
function heading(id:string,html:string){const el=node(id);if(!el)return;el.innerHTML=html;el.classList.add('premium-heading');}

export function adaptDesign(){
  const root=node('4011:36550')!,hero=node('4011:38373')!,stats=$('section-stats')!;
  root.classList.add('premium-page');hero.dataset.name='section-hero';
  node('4011:41471')?.remove();
  // Natural document height: no spacer, scroll pin or artificial scroll range.
  const intro=document.createElement('div');intro.className='premium-intro';hero.before(intro);intro.append(hero,stats);
  node('4001:111757')?.remove();hero.querySelectorAll('[data-hero-state]').forEach(n=>n.remove());
  const stage=$('hero__stage',hero)!;
  const media=document.createElement('div');media.className='premium-hero-background';media.setAttribute('aria-hidden','true');
  stage.prepend(media);
  const track=$('benefits__track')!,cards=Array.from(track.children) as HTMLElement[];
  const ordered=benefits.map(item=>{
    let card=cards.find(c=>c.querySelector('p')?.textContent?.trim()===item.title);
    if(!card){card=cards[1].cloneNode(true) as HTMLElement;card.querySelectorAll('[data-node-id]').forEach(n=>n.removeAttribute('data-node-id'));card.removeAttribute('data-node-id');}
    const copy=card.querySelectorAll('p');copy[0].textContent=item.title;copy[1].textContent=item.body;return card;
  });
  track.replaceChildren(...ordered);
  const statement=$('section-statement')!,partners=node('4011:42987')!;partners.before(statement);
  heading('I4011:36550;3969:146003',`Global scale.<br>${gradient('Local expertise',88.9493)}`);
  heading('I4011:36550;3933:58740',`Technology designed to provide a&nbsp;${gradient('competitive advantage',88.3737)} by&nbsp;maximising profits, not just revenue.`);
  const statementText=node('I4011:36550;3933:58740')!;statementText.dataset.statementReady='false';const accent=statementText.querySelector<HTMLElement>('.premium-gradient')!;accent.classList.add('premium-statement-accent');accent.dataset.gradientFilled='false';
  heading('4011:42398',`Trusted<br>${gradient('to deliver',89.4113)}`);
  heading('I4011:36550;3933:58948',`Partnership ${gradient('that performs',89.0949)}`);
  heading('I4011:36550;3933:80292',`Supporting sportsbook<br>growth ${gradient('across 50+ countries',87.7802)}`);
  heading('4001:111692',`Client ${gradient('cases',89.2538)}`);
  heading('I4011:36550;3933:59146',`Industry ${gradient('recognition',70.2479)}`);
  heading('I4011:36550;3933:59158',`Company ${gradient('news',89.3157)}`);
  heading('I4011:36550;3933:59177',`Frequently<br>asked ${gradient('questions',88.9404)}`);
  // Figma wraps Contact over the full-background footer by 40px.
  const contact=node('4011:41478')!;
  const footer=$('footer--window')!;
  const foreground=document.createElement('div');foreground.className='premium-foreground';
  const navigation=$('navbar--sketch-a')!;
  // The original Figma header has anonymous glass and inset-shadow layers.
  // Remove the decorative nodes; clearing named wrappers cannot clear them.
  $('navbar',navigation)?.querySelectorAll(':scope > div:not([data-name])').forEach(el=>el.remove());
  const sections=Array.from(root.children).filter(el=>el!==navigation&&el!==footer);
  root.prepend(foreground);foreground.append(...sections);
  mountFooter(footer);
  replaceSolutions();
  const globe=$('markets__map-world')!;globe.classList.add('premium-globe');globe.dataset.uiGlobe='';globe.replaceChildren();
  adaptMarkets();prepareStats();
  document.querySelectorAll<HTMLElement>('[data-name="button-split__label"]').forEach(label=>label.parentElement!.dataset.premiumSplit='true');
  node('I4011:36550;4001:112219')?.remove();
  for(const scope of [partners,$('section-solutions')!,contact])scope.querySelectorAll<HTMLElement>('[data-name="button-split__label"]').forEach(label=>label.parentElement!.classList.add('premium-primary'));
  const logo=$('logo_main')?.querySelector('img');if(logo){logo.dataset.originalSrc=logo.getAttribute('src')!;const dark=logo.cloneNode(true) as HTMLImageElement;dark.classList.add('premium-logo-dark');dark.alt='';dark.setAttribute('aria-hidden','true');logo.after(dark);logo.classList.add('premium-logo-light');logo.src='/premium-media/logo-on-dark.svg';}
}
