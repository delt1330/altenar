// Pill hover (form chips, Contact us) and split buttons: the label rolls up and a copy rolls in
// from below, like Gladia's "Book a demo". The copy is drawn by CSS from
// data-roll, so React-owned text nodes are never touched.
const HOSTS='[data-shared-contact] .choice-chip,[data-name="navbar__cta"],[data-premium-split] [data-name="button-split__label"]';
const prime=(root:ParentNode)=>root.querySelectorAll<HTMLElement>(`:is(${HOSTS})>p`).forEach(p=>{
  const text=p.textContent?.trim()??'';if(p.dataset.roll!==text)p.dataset.roll=text;
});
let mounted=false;
export function mountTextRoll(){
  if(mounted)return;mounted=true;prime(document);
  new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n instanceof Element){if(n.matches(`:is(${HOSTS})>p`))prime(n.parentElement!);else prime(n);}})
    .observe(document.body,{childList:true,subtree:true});
}
