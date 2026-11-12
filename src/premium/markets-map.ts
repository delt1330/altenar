import {$,all} from '../sections';
import countrySource from '../../country-popup-data.json';
import {mountFanMap} from '../shared/fan-map/fan-map';
import {risePanels} from '../shared/panel-rise';
import './markets-map.css';

// Markets map on Home: 'globe' (Figma 545:6305 in Altenar — Competitive Edge) or
// 'fan' (rays from one origin, Figma 6405:13186). Both share the centred header
// and the floating list and card; only the map and its geometry differ.
// For a side-by-side check, ?map=globe or ?map=fan overrides MARKET_MAP.
const MARKET_MAP:'fan'|'globe'='globe';

export function marketMapVariant():'fan'|'globe'{
  const forced=new URLSearchParams(location.search).get('map');
  return forced==='globe'||forced==='fan'?forced:MARKET_MAP;
}

// One representative point per country in country-popup-data.json (by indexName).
const POINTS:Record<string,[number,number]>={
  UK:[53.5,-2],Malta:[35.9,14.4],Romania:[45.9,24.9],Italy:[42.8,12.5],Spain:[40.2,-3.7],Sweden:[62,15],
  Denmark:[56,9.5],Netherlands:[52.2,5.3],'DR Congo':[-2.9,23.6],'North Macedonia':[41.6,21.7],Estonia:[58.7,25.5],
  Belgium:[50.6,4.6],Germany:[51.2,10.4],Canada:[56,-100],Colombia:[4.6,-74.1],Mexico:[23.6,-102.5],
  Portugal:[39.6,-8],Ireland:[53.2,-8.2],Greece:[39.1,22],Cyprus:[35.1,33.4],Czechia:[49.8,15.5],
  Hungary:[47.2,19.5],France:[46.6,2.4],Chile:[-33.5,-70.7],
};

// Shared layout: variant flag for the CSS and the "Local market" eyebrow.
export function prepareMarketLayout(variant:'fan'|'globe'){
  const market=$('section-markets');if(!market)return;
  market.dataset.marketMap=variant;
  const heading=market.querySelector('.premium-heading');
  if(heading&&!heading.previousElementSibling?.matches('.market-eyebrow')){
    const eyebrow=document.createElement('p');eyebrow.className='market-eyebrow';eyebrow.dataset.uiType='eyebrow';eyebrow.textContent='Local market';
    heading.before(eyebrow);
  }
  risePanelsIn(market);
}

// List and card rise from below one after the other as the block scrolls in.
function risePanelsIn(market:HTMLElement){
  const body=$('markets__body',market);
  if(!body||body.dataset.panelsRise)return;
  body.dataset.panelsRise='on';
  risePanels(body,[$('markets__sidebar',market),$('markets/country-card',market)].filter((el):el is HTMLElement=>!!el));
}

// Runs after the Figma markets block is adapted (adaptMarkets) and before
// setupMarkets wires the list and the card; the fan talks to them only through
// the DOM, so the list, search and card logic stay shared with the globe.
export function mountMarketFan(){
  const market=$('section-markets');if(!market)return;
  const map=$('markets/map',market)!,body=$('markets__body',market)!,card=$('markets/country-card',market)!;
  const host=document.createElement('div');host.className='market-fan';map.replaceChildren(host);
  const names=countrySource.countries.map(c=>c.indexName.replace(/\u00a0/g,' '));
  const countries=names.flatMap((name,i)=>POINTS[name]?[{key:String(i),name:countrySource.countries[i].popupTitle||name,lat:POINTS[name][0],lon:POINTS[name][1]}]:[]);
  // A click on the fan selects the list row (which opens the card) and scrolls
  // the list so the row is in view, without moving the page.
  const pick=(key:string)=>{
    const row=all('country-index__row',market)[+key];if(!row)return;
    row.click();
    const list=row.closest<HTMLElement>("[data-name='country-index__viewport']");if(!list)return;
    const top=row.getBoundingClientRect().top-list.getBoundingClientRect().top+list.scrollTop;
    list.scrollTo({top:top-(list.clientHeight-row.offsetHeight)/2,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
  };
  const fan=mountFanMap(host,{countries,onSelect:pick,interactive:'countries'});
  // Mirror the card: highlight the open country on the fan, clear on close.
  const sync=()=>{
    const open=body.dataset.countryOpen!=='false'&&card.style.visibility!=='hidden';
    const index=names.indexOf((card.dataset.country||'').replace(/\u00a0/g,' '));
    fan.select(open&&index>=0?String(index):null);
  };
  new MutationObserver(sync).observe(card,{attributes:true,attributeFilter:['data-country','style']});
  new MutationObserver(sync).observe(body,{attributes:true,attributeFilter:['data-country-open']});
  sync();
}
