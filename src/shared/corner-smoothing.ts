// Figma "corner smoothing 60%" on every rounded box of both pages.
// Figma keeps the circular apex of an r-radius corner but starts the curve 1.6·r
// along each edge. CSS match: radius × 1.6 with corner-shape superellipse(K),
// K chosen so the 45° apex stays where the plain circle puts it:
//   1.6·(1 − 2^(−1/2^K)) = 1 − 1/√2  →  K ≈ 1.78.
// Radii live in many stylesheets and the Turnkey bundle, so rounded elements get
// inline !important values, recomputed when their size changes. Pills and
// circles stay as they are (smoothing does nothing there in Figma either), and
// browsers without corner-shape keep plain radii.
const CORNERS=['top-left','top-right','bottom-right','bottom-left'] as const;
const SCALE=1.6,SHAPE='superellipse(1.78)';
const prop=(c:typeof CORNERS[number])=>`border-${c}-radius`;

function radii(el:HTMLElement){
  const cs=getComputedStyle(el);
  // Elliptical or percentage radii (e.g. "50%" circles) are left alone.
  return CORNERS.map(c=>{const v=cs.getPropertyValue(prop(c)).trim();return /^[\d.]+px$/.test(v)?parseFloat(v):NaN;});
}
function reset(el:HTMLElement){CORNERS.forEach(c=>el.style.removeProperty(prop(c)));el.style.removeProperty('corner-shape');}
function smooth(el:HTMLElement){
  if(el.dataset.smooth==='on')reset(el);
  const r=radii(el),w=el.offsetWidth,h=el.offsetHeight,cap=Math.min(w,h)/2;
  if(r.some(Number.isNaN)||r.every(v=>!v)){el.dataset.smooth='off';return;}
  if(!w||!h){el.dataset.smooth='pending';return;}
  if(r.some(v=>v>=cap-.5)){el.dataset.smooth='off';return;}
  r.forEach((v,i)=>{if(v)el.style.setProperty(prop(CORNERS[i]),`${Math.min(v*SCALE,cap)}px`,'important');});
  el.style.setProperty('corner-shape',SHAPE,'important');
  el.dataset.smooth='on';
}

export function mountCornerSmoothing(){
  if(!CSS.supports('corner-shape','superellipse(2)'))return;
  const seen=new WeakSet<Element>();
  const ro=new ResizeObserver(entries=>entries.forEach(e=>smooth(e.target as HTMLElement)));
  const visit=(el:Element)=>{
    if(!(el instanceof HTMLElement)||seen.has(el))return;
    // Radii the page sets inline (animations, scripts) are not ours to rewrite.
    if(CORNERS.some(c=>el.style.getPropertyValue(prop(c))))return;
    const r=radii(el);if(r.some(Number.isNaN)||r.every(v=>!v))return;
    seen.add(el);ro.observe(el);
  };
  const scan=(root:Element)=>{visit(root);root.querySelectorAll('*').forEach(visit);};
  const pending=new Set<Element>();let frame=0;
  const flush=()=>{frame=0;pending.forEach(el=>{if(el.isConnected)scan(el);});pending.clear();};
  new MutationObserver(records=>{
    records.forEach(r=>r.addedNodes.forEach(n=>{if(n instanceof Element)pending.add(n);}));
    if(pending.size&&!frame)frame=requestAnimationFrame(flush);
  }).observe(document.body,{childList:true,subtree:true});
  scan(document.body);
}
