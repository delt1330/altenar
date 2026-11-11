// JetBrains Mono on both pages: Light 300 with 2% tracking.
// Rules for this face are spread over many stylesheets (often !important) and
// the Turnkey bundle, so every element that renders it gets inline !important
// values. Menus, form steps and split text mounted later are covered by the
// observer.
const MONO=/JetBrains Mono/i;

function apply(el:Element){
  if(!(el instanceof HTMLElement)||el.dataset.monoType)return;
  if(!MONO.test(getComputedStyle(el).fontFamily))return;
  el.style.setProperty('font-weight','300','important');
  el.style.setProperty('letter-spacing','0.02em','important');
  el.dataset.monoType='true';
}
const scan=(root:Element)=>{apply(root);root.querySelectorAll('*').forEach(apply);};

export function mountMonoType(){
  const pending=new Set<Element>();let frame=0;
  const flush=()=>{frame=0;pending.forEach(el=>{if(el.isConnected)scan(el);});pending.clear();};
  new MutationObserver(records=>{
    records.forEach(r=>r.addedNodes.forEach(n=>{if(n instanceof Element)pending.add(n);}));
    if(pending.size&&!frame)frame=requestAnimationFrame(flush);
  }).observe(document.body,{childList:true,subtree:true});
  scan(document.body);
}
