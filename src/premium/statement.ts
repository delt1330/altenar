import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {SplitText} from 'gsap/SplitText';
import {$,node,reduced} from '../sections';
// Keep the same 1.08-second scrub sequence and the original scroll endpoints.
// A single live text layer paints grey over the unrevealed part of the accent.
export function setupPremiumStatement(){
  const section=$('section-statement'),text=node('I4011:36550;3933:58740');
  if(!section||!text)return()=>{};
  if(reduced()){
    const accent=text.querySelector<HTMLElement>('.premium-gradient')!;accent.style.setProperty('--gradient-reveal','100%');accent.dataset.gradientFilled='true';text.dataset.statementReady='true';return()=>{};
  }
  const split=SplitText.create(text,{type:'words,chars',wordsClass:'statement-word',charsClass:'statement-character'});
  const accent=text.querySelector<HTMLElement>('.premium-gradient')!,chars=split.chars as HTMLElement[];
  accent.classList.add('premium-statement-accent');accent.style.setProperty('--gradient-reveal','100%');accent.dataset.gradientFilled='true';
  const plain=chars.filter(c=>!c.closest('.premium-gradient'));gsap.set(plain,{color:'rgba(255,255,255,0.20)'});text.dataset.statementReady='true';
  const accentIndices=chars.flatMap((char,i)=>char.closest('.premium-gradient')?[i]:[]),step=1/Math.max(1,chars.length-1),duration=.08;
  let filled=false;
  const updateAccent=()=>{
    const next=parseFloat(accent.style.getPropertyValue('--gradient-reveal'))>=99.99;
    if(next!==filled){filled=next;accent.dataset.gradientFilled=String(next);accent.dispatchEvent(new Event('premium:gradient-state',{bubbles:true}));}
  };
  const timeline=gsap.timeline({scrollTrigger:{id:'statement-fill',trigger:section,start:'top top+=76',end:'bottom bottom',scrub:true,invalidateOnRefresh:true,onUpdate:self=>section.dataset.progress=String(self.progress)}});
  chars.forEach((char,i)=>{if(!char.closest('.premium-gradient'))timeline.to(char,{color:'#ffffff',duration,ease:'none'},i*step);});
  if(accentIndices.length)timeline.to(accent,{'--gradient-reveal':'100%',duration:duration+(accentIndices.length-1)*step,ease:'none',onUpdate:updateAccent},accentIndices[0]*step);
  ScrollTrigger.refresh();
  return()=>{timeline.scrollTrigger?.kill();timeline.kill();split.revert();};
}
