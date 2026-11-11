const media='/glow-media/retail/';
export function createRetail(){
 const root=document.createElement('div');root.className='solution-img glow-retail';root.dataset.panel='1';root.setAttribute('aria-label','Altenar Platform connected to retail software, payments and content management');
 const canvas=document.createElement('div');canvas.className='glow-retail-canvas';
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.classList.add('glow-retail-wires');svg.setAttribute('viewBox','0 0 1000 800');svg.setAttribute('aria-hidden','true');
 const defs=document.createElementNS('http://www.w3.org/2000/svg','defs');defs.innerHTML='<pattern id="glow-retail-braid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M-3 3 L3 -3 M0 10 L10 0 M7 13 L13 7" fill="none" stroke="rgba(170,244,255,.72)" stroke-width="2"/></pattern>';svg.append(defs);
 // Connections terminate at the middle of the facing rim of each platform.
 const paths=['M376 320 L300 270','M615 320 L700 270','M400 475 L320 531','M590 475 L680 535'];
 paths.forEach((d,i)=>{for(const kind of ['base','braid','pulse']){const p=document.createElementNS('http://www.w3.org/2000/svg','path');p.setAttribute('d',d);p.setAttribute('pathLength','1');p.setAttribute('class',`glow-retail-wire-${kind}`);p.style.setProperty('--wire-index',String(i));svg.append(p);}});
 const items=[
  ['platform-v2','Altenar Platform','center','The central platform connecting sportsbook, terminal operations, balances and reporting.'],
  ['cashier-v2','Cashier Software','top-left','Tools for selling vouchers, paying out winnings and managing shop-level operations.'],
  ['terminal-v2','Terminal Software','top-right','Self-service sportsbook software for deposits, betting and ticket scanning.'],
  ['payments-v2','Payments & Tickets','bottom-right','Cash and voucher payments, printed betting coupons and ticket validation.'],
  ['back-office-v2','Retail Back Office','bottom-left','Manage terminal configurations, monitor device health and oversee retail operations.'],
  ['content-v2','Content Management','bottom-left-upper','Manage sportsbook content, themes and on-screen messages across terminals.']
 ];
 items.forEach(([file,name,position])=>{const img=document.createElement('img');img.className=`glow-retail-item glow-retail-${position}`;img.loading='lazy';img.src=`${media}${file}.webp`;img.alt=name;img.decoding='async';img.draggable=false;canvas.append(img);});
 canvas.append(svg);
 items.forEach(([,name,position,description])=>{const button=document.createElement('button');button.type='button';button.className=`glow-retail-hotspot glow-retail-hit-${position}`;button.setAttribute('aria-label',name);button.setAttribute('aria-describedby','retail-layer-tip');button.dataset.tipTitle=name;button.dataset.tipDescription=description;button.dataset.position=position;canvas.append(button);});
 const tooltip=document.createElement('div');tooltip.className='turnkey-tooltip glow-retail-tooltip';tooltip.id='retail-layer-tip';tooltip.setAttribute('role','tooltip');tooltip.innerHTML='<strong></strong><span></span>';canvas.append(tooltip);
 root.append(canvas);return root;
}
export function setupRetail(container:HTMLElement){
 const root=container.querySelector<HTMLElement>('.glow-retail')!;
 const canvas=root.querySelector<HTMLElement>('.glow-retail-canvas')!, tooltip=root.querySelector<HTMLElement>('.glow-retail-tooltip')!;
 const order=['bottom-left','bottom-left-upper','top-left','center','top-right','bottom-right'];
 const imgs=order.map(position=>canvas.querySelector<HTMLImageElement>(`.glow-retail-item.glow-retail-${position}`)!);
 const buttons=order.map(position=>canvas.querySelector<HTMLButtonElement>(`.glow-retail-hit-${position}`)!);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const masks:(ImageData|undefined)[]=Array(6), bottoms=Array(6).fill(.86), tops=Array(6).fill(.15);
 let selected=false,inView=false,started=false,timer=0,frame=0,active=-1,disposed=false;
 const sizes=[.82,.82,.82,1.122,.82,.82];
 const layout=()=>{const w=canvas.getBoundingClientRect().width;if(!w)return;
  imgs.forEach((img,i)=>{const size=w*sizes[i];const target=w*(.48+i*.155);img.style.width=`${size}px`;img.style.height=`${size}px`;img.style.left=`${(w-size)/2}px`;img.style.top=`${target-size*bottoms[i]}px`;img.style.setProperty('--retail-shift',String(i-2.5));});
 };
 Promise.all(imgs.map(async(img,i)=>{try{await img.decode();const c=document.createElement('canvas');c.width=128;c.height=128;const ctx=c.getContext('2d',{willReadFrequently:true})!;ctx.drawImage(img,0,0,128,128);const data=ctx.getImageData(0,0,128,128);masks[i]=data;let min=128,max=0;for(let j=3;j<data.data.length;j+=4)if(data.data[j]>80){const y=Math.floor((j-3)/512);min=Math.min(min,y);max=Math.max(max,y);}tops[i]=min/128;bottoms[i]=(max+1)/128;}catch{} })).then(()=>{if(!disposed)layout();});
 const hide=()=>{active=-1;root.classList.remove('has-active-layer');imgs.forEach(img=>img.classList.remove('is-highlighted'));tooltip.classList.remove('is-visible');};
 const show=(index:number)=>{if(root.dataset.retailState!=='ready'||!root.classList.contains('is-active'))return;if(index!==active){active=index;root.classList.add('has-active-layer');imgs.forEach((img,i)=>img.classList.toggle('is-highlighted',i===index));tooltip.querySelector('strong')!.textContent=buttons[index].dataset.tipTitle!;tooltip.querySelector('span')!.textContent=buttons[index].dataset.tipDescription!;tooltip.classList.add('is-visible');}
  const c=canvas.getBoundingClientRect(),r=imgs[index].getBoundingClientRect();tooltip.style.left=`${Math.max(142-c.left,Math.min(r.left+r.width/2-c.left,innerWidth-c.left-142))}px`;tooltip.style.top=`${r.top-c.top+r.height*tops[index]-20}px`;
 };
 const collapse=()=>{root.classList.remove('is-expanded');hide();};
 const move=(event:PointerEvent)=>{if(root.dataset.retailState!=='ready'||!root.classList.contains('is-active'))return;
  const c=canvas.getBoundingClientRect(),pad=c.width*.35;
  if(root.classList.contains('is-expanded')&&(event.clientX<c.left-pad||event.clientX>c.right+pad||event.clientY<c.top-pad||event.clientY>c.bottom+pad)){collapse();return;}
  let hit=-1;for(let i=0;i<imgs.length;i++){const r=imgs[i].getBoundingClientRect();const x=Math.floor((event.clientX-r.left)/r.width*128),y=Math.floor((event.clientY-r.top)/r.height*128);if(x>=0&&x<128&&y>=0&&y<128&&masks[i]&&masks[i]!.data[(y*128+x)*4+3]>80){hit=i;break;}}
  if(hit>=0){root.classList.add('is-expanded');show(hit);}else hide();
 };
 const bindings=buttons.map((button,i)=>{const focus=()=>{root.classList.add('is-expanded');show(i);},blur=(e:FocusEvent)=>{if(!root.contains(e.relatedTarget as Node))collapse();};button.addEventListener('focus',focus);button.addEventListener('blur',blur);return()=>{button.removeEventListener('focus',focus);button.removeEventListener('blur',blur);};});
 const reset=()=>{clearTimeout(timer);cancelAnimationFrame(frame);started=false;collapse();root.classList.remove('is-playing','is-connected');};
 const start=()=>{if(!selected||!inView||started)return;started=true;layout();root.dataset.retailState='assembling';frame=requestAnimationFrame(()=>{root.classList.add('is-playing');timer=window.setTimeout(()=>{if(selected){root.classList.add('is-connected');root.dataset.retailState='ready';}},reduced.matches?0:1600);});};
 const activate=()=>{const now=root.classList.contains('is-active');if(now===selected)return;selected=now;if(!selected){reset();root.dataset.retailState='idle';}else start();};
 const selection=new MutationObserver(activate);selection.observe(root,{attributes:true,attributeFilter:['class']});
 const viewport=new IntersectionObserver(entries=>{inView=entries.some(e=>e.isIntersecting);start();},{threshold:.1});viewport.observe(root);
 window.addEventListener('pointermove',move);document.addEventListener('pointerleave',collapse);window.addEventListener('resize',layout);activate();
 return()=>{disposed=true;reset();bindings.forEach(fn=>fn());selection.disconnect();viewport.disconnect();window.removeEventListener('pointermove',move);document.removeEventListener('pointerleave',collapse);window.removeEventListener('resize',layout);};
}
