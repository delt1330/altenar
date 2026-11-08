import {gsap} from 'gsap';

type CaseMorph={
  draw:(progress:number)=>void;
  progress:()=>number;
  stopEntrance:()=>void;
  content:HTMLElement[];
  photo:SVGElement;
};
const morphs=new WeakMap<HTMLElement,CaseMorph>();

// Register the existing SVG renderer; navigation never rebuilds card geometry.
export function registerCaseMorph(stage:HTMLElement,morph:CaseMorph){
  morphs.set(stage,morph);
  return ()=>{morphs.delete(stage);};
}

export function transitionCase(outgoing:HTMLElement,incoming:HTMLElement,activate:()=>void,complete:()=>void){
  const from=morphs.get(outgoing),to=morphs.get(incoming);
  if(!from||!to)return;
  from.stopEntrance();to.stopEntrance();
  const fold={value:from.progress()},unfold={value:0};
  // Reset only the offscreen card. At activation both cards have identical
  // rectangular boundaries and no visible photo/copy, so no layout jumps.
  to.draw(0);incoming.dataset.morphComplete='false';outgoing.dataset.morphComplete='false';
  to.content.forEach(el=>el.style.visibility='');
  gsap.set(to.content,{opacity:0,y:16});gsap.set(to.photo,{opacity:0});
  return gsap.timeline({id:'case-transition',onComplete:()=>{
    to.draw(1);incoming.dataset.morphComplete='true';
    gsap.set(to.content,{clearProps:'transform,opacity'});gsap.set(to.photo,{clearProps:'opacity'});
    complete();
  }})
    // power2.out is the same cubic 1-(1-t)^3 used by the original 700ms entry.
    .to(fold,{value:0,duration:.7,ease:'power2.out',onUpdate:()=>from.draw(fold.value)},0)
    .to(from.content,{opacity:0,y:-12,duration:.28,stagger:.04,ease:'power2.in'},0)
    .to(from.photo,{opacity:0,duration:.7,ease:'power2.in'},0)
    .call(activate,[],.7)
    .to(unfold,{value:1,duration:.7,ease:'power2.out',onUpdate:()=>to.draw(unfold.value)},.7)
    .to(to.photo,{opacity:1,duration:.7,ease:'power2.out'},.7)
    .to(to.content,{opacity:1,y:0,duration:.52,stagger:.08,ease:'power2.out'},.86);
}
