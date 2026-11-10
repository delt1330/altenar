import {softenBorders} from './shared/border-opacity';
import {turnkeyProductUrl} from './shared/routes';
import {setupPremiumStatement} from './premium/statement';
import {mountSplitButtons} from './shared/split-button';
import React,{useLayoutEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import Design from './premium/Design.tsx';
import {$,all,node,reduced,button,setupLayout,setupPartners,setupCarousels,setupMarkets,setupTabs,setupCases,setupAwards,setupButtonStates} from './sections';
import './base.css';
import './design.css';
import './layout.css';
import './interactions.css';
import './morph.css';
import {setupMorphSections} from './morph';
import {setupControlMotion} from './control-motion';
import {setupSectionVideos} from './video';
import {setupGlobalText} from './text-motion';
import {setupArrowRollovers} from './rollover';
import {setupBenefitMorph} from './benefit-motion';
import './refinements.css';
gsap.registerPlugin(ScrollTrigger,SplitText);
function setupNavigation(){
  const targetFor=(text:string)=>/contact|talk/i.test(text)?node('4011:41478'):/case|client/i.test(text)?node('4011:41475'):/news|blog|events/i.test(text)?$('section-news'):/award/i.test(text)?$('section-awards'):/market|coverage|licen/i.test(text)?$('section-markets'):/product|solution|api|widget|retail|white label/i.test(text)?$('section-solutions'):/company|about/i.test(text)?$('section-statement'):null;
  const scroll=(target:HTMLElement|null)=>target?.scrollIntoView({behavior:reduced()?'instant':'smooth',block:'start'});
  const heroSolution=document.querySelector<HTMLElement>('[data-name="section-hero"] #node-3962_24892');
  button(heroSolution,()=>window.location.assign(turnkeyProductUrl));
  all('button-split__label').forEach(label=>{const parent=label.parentElement!;if(parent===heroSolution||parent.closest('[data-name="contact__form"]')||parent.dataset.caseLinkMissing||parent.dataset.solutionLinkMissing||parent.matches('a[href]'))return;button(parent,()=>{if(parent.closest('[data-name="section-hero"]') && /see solution/i.test(label.textContent||'')) window.location.assign(turnkeyProductUrl); else scroll(targetFor(label.textContent||''));});});
  document.querySelectorAll<HTMLElement>('.slant-button').forEach(el=>button(el,()=>scroll(targetFor(el.textContent||''))));
  all('navbar__cta').forEach(el=>button(el,()=>scroll(node('4011:41478'))));
  all('navbar__link').filter(el=>!/^solutions$/i.test((el.textContent||'').trim())).forEach(el=>button(el,()=>scroll(targetFor(el.textContent||''))));
  all('logo_main').forEach(el=>button(el,()=>window.location.assign('/'),'Home'));
  const footer=$('footer--window');if(footer)all('footer__links',footer).forEach(group=>Array.from(group.children).forEach((el:HTMLElement)=>{const target=targetFor(el.textContent||'');if(target)button(el,()=>scroll(target));}));
}
function setupMotion(){return setupPremiumStatement();}
function App(){
  useLayoutEffect(()=>{
    let alive=true;
    const heroNav=(event:MouseEvent)=>{if((event.target as Element).closest('[data-name="section-hero"] #node-3962_24892')){event.preventDefault();event.stopImmediatePropagation();window.location.assign(turnkeyProductUrl);}};
    document.addEventListener('click',heroNav,true);
    setupLayout();setupPartners();const disposeCases=setupCases();setupTabs();setupAwards();
    const disposeMorph=setupMorphSections();const disposeVideos=setupSectionVideos();let disposeControls=()=>{},disposeText=()=>{},disposeArrows=()=>{},disposeBenefits=()=>{},disposeStatement=()=>{};
    Promise.resolve(document.fonts.ready).then(()=>{
      if(!alive)return;setupCarousels();setupButtonStates();const disposeDefaultControls=setupControlMotion(),disposeSplitControls=mountSplitButtons();disposeControls=()=>{disposeDefaultControls();disposeSplitControls();};disposeBenefits=()=>{};setupNavigation();setupMarkets();disposeArrows=setupArrowRollovers();disposeText=setupGlobalText();disposeStatement=setupMotion();document.documentElement.classList.add('ready');
    });
    return()=>{document.removeEventListener('click',heroNav,true);alive=false;disposeCases();disposeMorph();disposeVideos();disposeControls();disposeText();disposeArrows();disposeBenefits();disposeStatement();ScrollTrigger.getAll().forEach(t=>t.kill());};
  },[]);
  return <Design/>;
}
createRoot(document.getElementById('root')!).render(<App/>);

softenBorders();
