const media='/glow-media/retail/';
export function createRetail(){
 const root=document.createElement('div');root.className='solution-img glow-retail';root.dataset.panel='1';root.setAttribute('aria-label','Retail Back Office connected to cashier, terminal, content management and payments systems');
 const canvas=document.createElement('div');canvas.className='glow-retail-canvas';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('glow-retail-wires');svg.setAttribute('viewBox','0 0 1000 800');svg.setAttribute('aria-hidden','true');
 const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.innerHTML='<pattern id="glow-retail-braid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M-3 3 L3 -3 M0 10 L10 0 M7 13 L13 7" fill="none" stroke="rgba(170,244,255,.72)" stroke-width="2"/></pattern>';svg.append(defs);
 // Connections terminate at the middle of the facing rim of each platform.
 const paths=['M376 320 L300 270','M615 320 L700 270','M400 475 L320 531','M590 475 L680 535'];
 paths.forEach((d,i)=>{for(const kind of ['base','braid','pulse']){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);p.setAttribute('pathLength','1');p.setAttribute('class',`glow-retail-wire-${kind}`);p.style.setProperty('--wire-index',String(i));svg.append(p);}});
 const items=[['back-office','Retail Back Office','center','Management of retail locations, financial operations, and reporting.'],['cashier','Cashier Software','top-left','Tools for cashiers to accept bets, process transactions, and pay out winnings.'],['terminal','Terminal Software','top-right','Software for self-service terminals that customers use independently.'],['content','Content Management','bottom-left','Management of screen content, promotions, and visual branding.'],['payments','Payments & Tickets','bottom-right','Payment processing, ticket printing, and ticket validation.']];
 items.forEach(([file,name,position])=>{const img=document.createElement('img');img.className=`glow-retail-item glow-retail-${position}`;img.src=`${media}${file}.png`;img.alt=name;img.decoding='async';img.draggable=false;canvas.append(img);});
 canvas.append(svg);
 items.forEach(([,name,position,description])=>{const button=document.createElement('button');button.type='button';button.className=`glow-retail-hotspot glow-retail-hit-${position}`;button.setAttribute('aria-label',name);button.setAttribute('aria-describedby','retail-layer-tip');button.dataset.tipTitle=name;button.dataset.tipDescription=description;canvas.append(button);});
 const tooltip=document.createElement('div');tooltip.className='turnkey-tooltip glow-retail-tooltip';tooltip.id='retail-layer-tip';tooltip.setAttribute('role','tooltip');tooltip.innerHTML='<strong></strong><span></span>';canvas.append(tooltip);
 root.append(canvas);return root;
}
export function setupRetail(container:HTMLElement){
 const root=container.querySelector<HTMLElement>('.glow-retail');if(!root)return()=>{};
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let selected=false,inView=false,started=false,frame=0,timer=0;
 const canvas=root.querySelector<HTMLElement>('.glow-retail-canvas')!,tooltip=root.querySelector<HTMLElement>('.glow-retail-tooltip')!,hotspots=Array.from(root.querySelectorAll<HTMLButtonElement>('.glow-retail-hotspot'));
 const show=(button:HTMLButtonElement)=>{if(!root.classList.contains('is-active'))return;tooltip.querySelector('strong')!.textContent=button.dataset.tipTitle!;tooltip.querySelector('span')!.textContent=button.dataset.tipDescription!;const c=canvas.getBoundingClientRect(),b=button.getBoundingClientRect();const x=Math.max(142-c.left,Math.min(b.left+b.width/2-c.left,innerWidth-c.left-142));tooltip.style.left=`${x}px`;tooltip.style.top=`${Math.max(tooltip.offsetHeight+12-c.top,b.top-c.top+25)}px`;tooltip.classList.add('is-visible');};
 const hide=()=>tooltip.classList.remove('is-visible');
 const bindings=hotspots.map(button=>{const open=()=>show(button),close=()=>hide();button.addEventListener('pointerenter',open);button.addEventListener('pointerleave',close);button.addEventListener('focus',open);button.addEventListener('blur',close);return()=>{button.removeEventListener('pointerenter',open);button.removeEventListener('pointerleave',close);button.removeEventListener('focus',open);button.removeEventListener('blur',close);};});
 const reset=()=>{clearTimeout(timer);cancelAnimationFrame(frame);frame=0;started=false;root.classList.remove('is-playing','is-connected');};
 const start=()=>{if(!selected||!inView||started)return;started=true;root.dataset.retailState='assembling';
  frame=requestAnimationFrame(()=>{frame=0;root.classList.add('is-playing');const delay=reduced.matches?0:1900;timer=window.setTimeout(()=>{if(!selected)return;root.classList.add('is-connected');root.dataset.retailState='ready';},delay);});
 };
 const activate=()=>{const now=root.classList.contains('is-active');if(now===selected)return;selected=now;if(!selected){hide();reset();root.dataset.retailState='idle';}else start();};
 const selection=new MutationObserver(activate);selection.observe(root,{attributes:true,attributeFilter:['class']});
 const viewport=new IntersectionObserver(entries=>{inView=entries.some(entry=>entry.isIntersecting);start();},{threshold:.1});viewport.observe(root);
 const motion=()=>{if(reduced.matches&&selected&&started){clearTimeout(timer);root.classList.add('is-playing','is-connected');root.dataset.retailState='ready';}};reduced.addEventListener('change',motion);activate();
 return()=>{reset();bindings.forEach(dispose=>dispose());selection.disconnect();viewport.disconnect();reduced.removeEventListener('change',motion);};
}
