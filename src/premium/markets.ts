import {$,all} from '../sections';
// Preserve the existing data, row references and open/close listeners. Only
// rearrange the card into the new third column and its new stacked header.
export function adaptMarkets(){
  const market=$('section-markets')!,body=$('markets__body',market)!,map=$('markets/map',market)!,card=$('markets/country-card',market)!;
  body.append(card);map.classList.add('premium-market-map');
  Array.from(card.children).filter(n=>n.hasAttribute('aria-hidden')).forEach(n=>n.remove());
  const header=$('country-card__header',card)!,flag=$('country-card__flag',card)!,title=header.querySelector('p')!,close=$('country-card__close',card)!;
  const identity=document.createElement('div');identity.className='premium-country-identity';identity.append(flag,title);header.replaceChildren(identity,close);
  all('markets/status-row',card).forEach(row=>{
    const text=$('country-row__text',row)!,tag=$('country-row__status',row)!;row.replaceChildren(text,tag);
  });
}
