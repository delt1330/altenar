import data from './motion-data.json';
import {$,all,node,reduced} from './sections';
import {gsap} from 'gsap';
import {connectVideo} from './video';
import {revealText} from './text-motion';
import cases from './cases.json';
import {registerCaseMorph} from './case-motion';

import {interpolator} from './shared/path-morph';
export {interpolator} from './shared/path-morph';
const NS='http://www.w3.org/2000/svg';
let sequence=0;
function svgNode(name:string,attrs:Record<string,string>={}){
  const el=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));return el;
}
function sourceArt(markup:string,prefix:string){
  const svg=new DOMParser().parseFromString(markup,'image/svg+xml').documentElement as unknown as SVGSVGElement;
  svg.querySelectorAll('[id]').forEach(el=>{
    const old=el.id,next=prefix+'-'+old;el.id=next;
    svg.querySelectorAll('*').forEach(n=>Array.from(n.attributes).forEach(a=>{
      if(a.value===`#${old}`)n.setAttributeNS(a.namespaceURI,a.name,`#${next}`);
      else if(a.value.includes(`url(#${old})`))n.setAttribute(a.name,a.value.replaceAll(`url(#${old})`,`url(#${next})`));
    }));
  });
  svg.classList.add('morph-art');svg.setAttribute('preserveAspectRatio','none');return svg;
}
function media(stage:HTMLElement,paths:SVGElement[],width:number,height:number,kind:'hero'|'contact'){
  const id=`${kind}-video-mask-${++sequence}`;
  // clipPath only accepts shape/text/use children, not <g>. The former group
  // produced an empty clip in browsers, hiding otherwise valid video playback.
  const defs=svgNode('svg',{'aria-hidden':'true',class:'morph-defs'}),d=svgNode('defs'),clip=svgNode('clipPath',{id,clipPathUnits:'objectBoundingBox'});
  const masks=paths.map(path=>{const p=svgNode('path',{d:path.getAttribute('d')!,transform:`scale(${1/width} ${1/height})`});clip.append(p);return p;});
  d.append(clip);defs.append(d);stage.prepend(defs);
  const layer=document.createElement('div');layer.className=`morph-video morph-video-${kind}`;layer.style.clipPath=`url(#${id})`;
  const video=document.createElement('video'),dispose=connectVideo(video,kind,kind==='contact');
  layer.append(video);if(kind==='contact'){const shade=document.createElement('div');shade.className='contact-video-shade';layer.append(shade);}
  stage.insertBefore(layer,stage.querySelector('.morph-art')?.nextSibling||stage.firstChild);
  return {video,layer,masks,defs,dispose};
}

export function setupMorphSections(){
  const disposers:(()=>void)[]=[];
  let disposed=false;
  type SectionData={width:number;height:number;start:string[];end:string[];svg?:string;matrices?:string[]};
  const mount=(kind:keyof typeof data,stage:HTMLElement,contents:HTMLElement[],delays:number[],duration:number)=>{
    const spec=data[kind] as SectionData,prefix=`altenar-${kind}-${++sequence}`;
    stage.dataset.morphSection=kind;
    let art:SVGSVGElement,paths:SVGElement[];
    if(kind==='hero'){
      node('4001:111757')?.remove();
      art=svgNode('svg',{viewBox:`0 0 ${spec.width} ${spec.height}`,'aria-hidden':'true',class:'morph-art hero-fallback-art',preserveAspectRatio:'none'}) as SVGSVGElement;
      paths=spec.start.map(d=>{const p=svgNode('path',{d,fill:'#063365'});art.append(p);return p;});
    }else{
      if(kind==='positioning'){node('4001:111741')?.remove();$('positioning__media',stage)?.remove();}
      if(kind==='cases')$('case__shapes',stage)?.remove();
      if(kind==='contact')Array.from(stage.children).filter(el=>!el.matches('[data-name="contact__lead"],[data-name="contact__form"]')).forEach(el=>el.remove());
      art=sourceArt(spec.svg!,prefix);paths=Array.from(art.querySelectorAll('[data-morph-path]')) as SVGElement[];
      if(kind==='positioning'){
        // Keep the supplied animated crop matrices and anchor. Fit the new
        // photograph into the original image frame without stretching it.
        art.querySelector('image')!.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href','/photographs/positioning.webp');
        art.querySelector('image')!.setAttribute('preserveAspectRatio','xMidYMid slice');
      }
      if(kind==='cases'){
        const item=cases[Number(stage.dataset.caseIndex)||0];
        if(item.photo){
          const [width,height]=item.photoSize,boxWidth=458.833,boxHeight=614.498,scale=Math.max(boxWidth/width,boxHeight/height);
          art.querySelectorAll('image').forEach(image=>{image.setAttribute('width',String(width));image.setAttribute('height',String(height));image.setAttributeNS('http://www.w3.org/1999/xlink','xlink:href',item.photo!);});
          art.querySelectorAll('pattern use').forEach(use=>use.setAttribute('transform',`matrix(${scale/boxWidth} 0 0 ${scale/boxHeight} ${(1-width*scale/boxWidth)/2} ${(1-height*scale/boxHeight)/2})`));
        }
      }
    }
    let caseShade:SVGElement|undefined,casePhoto:SVGElement|undefined;
    if(kind==='cases'){
      // This is the exact animated photograph contour, above both photo fills
      // and below the separate HTML copy, logos, metrics and buttons.
      caseShade=svgNode('path',{d:paths[2].getAttribute('d')!,fill:'#000000','fill-opacity':'.25',class:'case-photo-shade'});
      paths[2].after(caseShade);
      casePhoto=svgNode('g',{class:'case-photo-layer'});paths[1].before(casePhoto);casePhoto.append(paths[1],paths[2],caseShade);
    }
    stage.prepend(art);
    const video=kind==='hero'?media(stage,kind==='hero'?paths:[paths[0]],spec.width,spec.height,kind):null;
    const mixes=spec.start.map((start,i)=>interpolator(start,spec.end[i]));
    const crop=kind==='positioning'?art.querySelector('pattern use'):null;
    const cropMix=spec.matrices?interpolator(spec.matrices[0],spec.matrices[1]):null;
    let progress=0;
    const draw=(t:number)=>{
      progress=t;
      paths.forEach((path,i)=>path.setAttribute('d',mixes[i](t)));
      caseShade?.setAttribute('d',paths[2].getAttribute('d')!);
      if(crop&&cropMix)crop.setAttribute('transform',cropMix(t));
      video?.masks.forEach((p,i)=>p.setAttribute('d',paths[kind==='hero'?i:0].getAttribute('d')!));
    };
    let raf=0,timer:ReturnType<typeof setTimeout>,fallback:ReturnType<typeof setTimeout>,observer:IntersectionObserver|undefined,started=false;
    let cardEntrance:gsap.core.Tween|undefined;
    const inactiveCase=kind==='cases'&&stage.dataset.caseIndex!=='0';
    contents=contents.filter(Boolean);
    if(!reduced()&&!inactiveCase)contents.forEach(el=>el.style.visibility='hidden');
    draw(reduced()||inactiveCase?1:0);
    const run=()=>{
      if(started||disposed)return;started=true;stage.dataset.morphStarted='true';
      contents.forEach(el=>el.style.visibility='');
      if(reduced()||inactiveCase){draw(1);stage.dataset.morphComplete='true';return;}
      contents.forEach((el,i)=>revealText(el,delays[i]/1000));
      if(kind==='cases')cardEntrance=gsap.from(stage,{y:16,opacity:0,duration:.52,ease:'power2.out',clearProps:'transform,opacity'});
      const morph=()=>{let began:number|undefined;const frame=(now:number)=>{
        began??=now;const p=Math.min((now-began)/(kind==='cases'?700:550),1);draw(1-(1-p)**3);
        if(p<1)raf=requestAnimationFrame(frame);else stage.dataset.morphComplete='true';
      };raf=requestAnimationFrame(frame);};
      if(kind==='hero')timer=setTimeout(morph,120);else morph();
    };
    const begin=()=>{Promise.resolve(document.fonts?.ready).then(()=>{if(!disposed)run();});};
    if(kind==='cases')disposers.push(registerCaseMorph(stage,{
      draw,progress:()=>progress,content:contents,photo:(stage.querySelector('.glow-case-photo') as unknown as SVGElement)||casePhoto!,
      stopEntrance:()=>{started=true;cancelAnimationFrame(raf);observer?.disconnect();}
    }));
    if(reduced()||inactiveCase)run();
    else if(kind==='hero'&&video){
      video.video.addEventListener('loadeddata',begin,{once:true});video.video.addEventListener('error',begin,{once:true});
      if(video.video.readyState>=2)begin();fallback=setTimeout(begin,1500);
    }
    else if(typeof IntersectionObserver!=='undefined'){
      observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.3)){begin();observer!.disconnect();}},{threshold:.3});observer.observe(stage);
    }else begin();
    disposers.push(()=>{cancelAnimationFrame(raf);clearTimeout(timer);clearTimeout(fallback);observer?.disconnect();cardEntrance?.kill();video?.video.removeEventListener('loadeddata',begin);video?.video.removeEventListener('error',begin);if(video){video.dispose();video.layer.remove();video.defs.remove();}art.remove();contents.forEach(el=>el.style.visibility='');});
  };
  const hero=null;if(hero)mount('hero',hero,[$('hero__main',hero)!.children[0] as HTMLElement,node('4001:111760')!,$('hero__aside',hero)!.children[0] as HTMLElement,$('button-split__label',$('hero__aside',hero)!)!.parentElement!],[120,180,360,420],320);
  const positioning=null;if(positioning)mount('positioning',positioning,[$('positioning__content',positioning)!],[160],360);
  all('cases__slide').forEach(slide=>mount('cases',slide,[$('case__content',slide)!,$('case__tag',slide)!,$('case__metric--media',slide)!],[160,240,320],320));
  const contact=$('contact__panel');if(contact)mount('contact',contact,[$('contact__lead',contact)!,$('contact__form',contact)!.children[0] as HTMLElement,...all('contact__group',contact),$('contact__actions',contact)!],[120,170,220,270,320,370],300);
  return ()=>{disposed=true;disposers.forEach(fn=>fn());};
}
