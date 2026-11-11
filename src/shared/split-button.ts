import {gsap} from 'gsap';
import geometry from '../control-geometry.json';
import {interpolator} from './path-morph';
import {byName as $,reducedMotion as reduced} from './dom';
const NS='http://www.w3.org/2000/svg';let sequence=0;
function svg(width:number,className:string){const el=document.createElementNS(NS,'svg');el.setAttribute('width',String(width));el.setAttribute('height','44');el.setAttribute('viewBox',`0 0 ${width} 44`);el.setAttribute('aria-hidden','true');el.classList.add('control-morph',className);return el;}
function path(fill:string){const el=document.createElementNS(NS,'path');el.setAttribute('fill',fill);return el;}

export function mountSplitButtons(scope: ParentNode = document){
  const disposers:(()=>void)[]=[];
  scope.querySelectorAll<HTMLElement>('[data-premium-split]:not([data-shared-split])').forEach(root=>{
    const label=$('button-split__label',root)!,arrow=$('button-split__arrow',root)!,cap=$('button__cap',label)?.firstElementChild as HTMLElement,icon=$('button__icon',arrow),image=icon?.querySelector('img');if(!image||!cap)return;root.dataset.sharedSplit='true';
    const hero=root.dataset.splitVariant==='light',defaultFill=hero?'#FFFFFF':'#019CFC',defaultText=hero?'#1A2C42':'#FFFFFF',hoverGlyph=hero?'#1A2C42':'#FFFFFF';
    root.style.setProperty('--premium-label-paint',defaultFill);root.style.setProperty('--premium-arrow-paint',hero?'#08B4FF':'#FFFFFF');root.style.setProperty('--premium-glyph-paint','#1A2C42');
    root.style.setProperty('--button-label','var(--premium-label-paint)');root.style.setProperty('--button-arrow','var(--premium-arrow-paint)');root.style.setProperty('--arrow-glyph-color','var(--premium-glyph-paint)');root.style.setProperty('--ui-button-ink',defaultText);
    // Retain the original label plate, 20px cap and 51px arrow layout slot.
    // Both endpoints come from the approved component, including its curves.
    cap.style.maskImage='none';cap.style.backgroundColor='transparent';cap.replaceChildren();
    const labelArt=svg(20,'premium-label-panel'),labelPath=path('var(--button-label)');labelArt.append(labelPath);cap.append(labelArt);
    const arrowArt=svg(51,'premium-arrow-panel'),arrowPath=path('var(--button-arrow)');arrowArt.append(arrowPath);arrow.prepend(arrowArt);arrow.classList.add('has-morph-background');
    glassGradient(labelArt,labelPath,'--button-label',`glow-label-${sequence+1}`);glassGradient(arrowArt,arrowPath,'--button-arrow',`glow-arrow-${sequence+1}`);const clipId=`premium-split-clip-${++sequence}`,defs=document.createElementNS(NS,'defs'),clip=document.createElementNS(NS,'clipPath'),clipShape=path('#fff');clip.id=clipId;clip.setAttribute('clipPathUnits','objectBoundingBox');clip.append(clipShape);defs.append(clip);arrowArt.append(defs);
    const window=document.createElement('span');window.className='arrow-rollover-window premium-split-window';window.setAttribute('aria-hidden','true');window.style.clipPath=`url(#${clipId})`;
    const glyph=()=>{const el=document.createElement('span');el.className='rollover-glyph rollover-mask';el.style.maskImage=`url("${image.getAttribute('src')}")`;window.append(el);return el;};
    const front=glyph(),back=glyph();icon!.remove();arrow.append(window);
    const distance=root.dataset.direction==='prev'?-51:51;gsap.set(back,{x:-distance});
    const value={progress:0,scale:1},capMix=interpolator(...geometry.cap as [string,string]),arrowMix=interpolator(...geometry.arrow as [string,string]);
    const rim=continuousRim(label,cap,`glow-whole-rim-${sequence}`);
    const seam=accentSeam(root,label,labelArt,`ui-split-seam-${sequence}`);
    const paint=()=>{
      const p=value.progress,s=value.scale,d=arrowMix(p),cx=25.5,cy=22;
      labelPath.setAttribute('d',capMix(p));rim.draw(capMix(p));arrowPath.setAttribute('d',d);
      // Scale uniformly about the panel center, inside its unchanged slot.
      // The glyph follows its optical X center and stays 16px high.
      arrowPath.setAttribute('transform',`matrix(${s} 0 0 ${s} ${(1-s)*cx} ${(1-s)*cy})`);
      clipShape.setAttribute('d',d);clipShape.setAttribute('transform',`matrix(${s/51} 0 0 ${s/44} ${(1-s)*cx/51} ${(1-s)*cy/44})`);
      const left=`${cx+(28.1725-cx)*s-8}px`;front.style.left=left;back.style.left=left;root.dataset.splitProgress=String(p);root.dataset.arrowScale=String(s);
    };paint();
    // Native disabled buttons have no hover delivery in some browsers. A
    // same-size parent owns pointer hover; the actual disabled button and form
    // action remain untouched. This previews NEXT STEP without inventing steps.
    const disabledButton=root instanceof HTMLButtonElement&&root.disabled;
    const hitarea=disabledButton?document.createElement('span'):root;
    if(disabledButton){hitarea.className='premium-split-hitarea';root.before(hitarea);hitarea.append(root);}
    let hover=false,focus=false;
    const tl=gsap.timeline({paused:true,defaults:{ease:'power2.inOut'}})
      .to(root,{'--premium-label-paint':hero?'#08B4FF':'#FFFFFF',duration:.28},0)
      .to(root,{'--ui-button-ink':'#1A2C42',duration:.28},0)
      .to(value,{progress:1,scale:.92,duration:.28,onUpdate:paint},0)
      .to(front,{x:distance,duration:.4,ease:'power2.out'},0).to(back,{x:0,duration:.4,ease:'power2.out'},0);
    const update=()=>{const on=hover||focus;root.dataset.splitHover=String(on);if(reduced())tl.progress(on?1:0).pause();else if(on)tl.play();else tl.reverse();};
    const enter=()=>{hover=true;update();},leave=()=>{hover=false;update();},focusIn=()=>{focus=true;update();},focusOut=(e:FocusEvent)=>{if(e.relatedTarget instanceof Node&&root.contains(e.relatedTarget))return;focus=false;update();};
    hitarea.addEventListener('pointerenter',enter);hitarea.addEventListener('pointerleave',leave);root.addEventListener('focusin',focusIn);root.addEventListener('focusout',focusOut);root.dataset.rollover=distance<0?'prev':'next';
    disposers.push(()=>{rim.dispose();seam.dispose();tl.kill();hitarea.removeEventListener('pointerenter',enter);hitarea.removeEventListener('pointerleave',leave);root.removeEventListener('focusin',focusIn);root.removeEventListener('focusout',focusOut);if(disabledButton&&hitarea.isConnected)hitarea.replaceWith(root);});
  });return()=>disposers.forEach(fn=>fn());
}

function glassGradient(svg:SVGSVGElement,shape:SVGPathElement,token:string,id:string){
      const defs=document.createElementNS(NS,'defs'),g=document.createElementNS(NS,'linearGradient');
      g.id=id;g.setAttribute('x1','0%');g.setAttribute('y1','0%');g.setAttribute('x2',token==='--button-label'?'0%':'100%');g.setAttribute('y2','100%');
      for(const [offset,color] of (token==='--button-label'?[['0%',`color-mix(in srgb,var(${token}) 86%,white)`],['45%',`var(${token})`],['100%',`color-mix(in srgb,var(${token}) 88%,#003d4b)`]]:[['0%',`color-mix(in srgb,var(${token}) 56%,white)`],['22%',`color-mix(in srgb,var(${token}) 85%,white)`],['65%',`var(${token})`],['100%',`color-mix(in srgb,var(${token}) 73%,#005c4a)`]])){const stop=document.createElementNS(NS,'stop');stop.setAttribute('offset',offset);stop.style.setProperty('stop-color',color);g.append(stop);}
      const rim=document.createElementNS(NS,'linearGradient');rim.id=id+'-rim';rim.setAttribute('x1','0%');rim.setAttribute('y1','0%');rim.setAttribute('x2','100%');rim.setAttribute('y2','100%');
      for(const [offset,opacity] of [['0%','.18'],['45%','.85'],['100%','.2']]){const stop=document.createElementNS(NS,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color','#fff');stop.setAttribute('stop-opacity',opacity);rim.append(stop);}
      const animate=document.createElementNS(NS,'animateTransform');animate.setAttribute('attributeName','gradientTransform');animate.setAttribute('type','rotate');animate.setAttribute('from','0 .5 .5');animate.setAttribute('to','360 .5 .5');animate.setAttribute('dur','4s');animate.setAttribute('repeatCount','indefinite');if(!reduced())rim.append(animate);defs.append(g,rim);svg.prepend(defs);shape.setAttribute('fill',`var(${token})`);
      if(token!=='--button-label'){shape.setAttribute('stroke','rgba(255,255,255,.45)');shape.setAttribute('stroke-width','1');}
    }
    function continuousRim(label:HTMLElement,cap:HTMLElement,id:string){
      const svg=document.createElementNS(NS,'svg'),defs=document.createElementNS(NS,'defs'),gradient=document.createElementNS(NS,'linearGradient'),line=document.createElementNS(NS,'path');
      svg.classList.add('glow-continuous-rim');svg.setAttribute('aria-hidden','true');gradient.id=id;
      gradient.setAttribute('x1','0%');gradient.setAttribute('y1','0%');gradient.setAttribute('x2','100%');gradient.setAttribute('y2','100%');
      for(const [offset,opacity] of [['0%','.38'],['50%','.62'],['100%','.38']]){const stop=document.createElementNS(NS,'stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color','#fff');stop.setAttribute('stop-opacity',opacity);gradient.append(stop);}
      if(!reduced()){const animation=document.createElementNS(NS,'animateTransform');animation.setAttribute('attributeName','gradientTransform');animation.setAttribute('type','rotate');animation.setAttribute('from','0 .5 .5');animation.setAttribute('to','360 .5 .5');animation.setAttribute('dur','4s');animation.setAttribute('repeatCount','indefinite');gradient.append(animation);}
      defs.append(gradient);line.setAttribute('fill','none');line.setAttribute('stroke','rgba(255,255,255,.45)');line.setAttribute('stroke-width','1');line.setAttribute('vector-effect','non-scaling-stroke');svg.append(defs,line);label.append(svg);
      let last='';
      const draw=(path:string)=>{last=path;const labelRect=label.getBoundingClientRect(),capRect=cap.getBoundingClientRect(),width=labelRect.width,offset=capRect.left-labelRect.left;if(!width)return;svg.setAttribute('viewBox',`0 0 ${width} 44`);
        const contour=path.replace(/^M0(?:\.0)? 0(?:\.0)?/,'').replace(/L0(?:\.0)? 0(?:\.0)?Z$/,'');
        const shifted=contour.replace(/([LC])([^LC]*)/g,(_match:string,command:string,values:string)=>{const numbers=values.trim().split(/[ ,]+/).map(Number);return command+numbers.map((v,i)=>i%2===0?v+offset:v).join(' ');});
        line.setAttribute('d',`M10 0 H${offset} ${shifted} H10 Q0 44 0 34 V10 Q0 0 10 0 Z`);
      };
      const observer=new ResizeObserver(()=>{if(last)draw(last)});observer.observe(label);
      return {draw,dispose:()=>{observer.disconnect();svg.remove();}};
    }

// One accent gradient across the label plate and its slanted cap. The plate
// paints "to bottom right" over the plate+cap box; the cap SVG repeats the
// same gradient line in its own user space, so the seam stays invisible.
function accentSeam(root:HTMLElement,label:HTMLElement,art:SVGSVGElement,id:string){
  const gradient=document.createElementNS(NS,'linearGradient'),defs=document.createElementNS(NS,'defs');
  gradient.id=id;gradient.setAttribute('gradientUnits','userSpaceOnUse');
  ['--ui-accent-start','--ui-accent-end'].forEach((token,i)=>{const stop=document.createElementNS(NS,'stop');stop.setAttribute('offset',String(i));stop.style.stopColor=`var(${token})`;gradient.append(stop);});
  defs.append(gradient);art.prepend(defs);root.style.setProperty('--ui-split-cap-fill',`url(#${id})`);
  const fit=()=>{
    const plate=label.querySelector<HTMLElement>('[data-name="button__plate"]');if(!plate)return;
    const p=plate.getBoundingClientRect(),c=art.getBoundingClientRect();if(!p.width||!c.width)return;
    const scale=c.width/20,offset=(c.left-p.left)/scale,width=offset+20,height=44,n=width*width+height*height;
    const dx=width*height*height/n,dy=width*width*height/n;
    gradient.setAttribute('x1',String(width/2-dx-offset));gradient.setAttribute('y1',String(height/2-dy));
    gradient.setAttribute('x2',String(width/2+dx-offset));gradient.setAttribute('y2',String(height/2+dy));
    root.style.setProperty('--ui-split-gradient-size',`${width}px`);
  };
  fit();const observer=new ResizeObserver(fit);observer.observe(label);
  return {dispose:()=>{observer.disconnect();defs.remove();}};
}
