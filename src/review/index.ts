// Review comments: loaded on every visit once the page is idle, so the site
// itself renders first. The tool stays tucked behind the left edge (app.ts).
export function mountReview(){
  const load=()=>import('./app').then(m=>m.startReview()).catch(error=>console.warn('Review tool failed to load',error));
  const idle=()=>('requestIdleCallback' in window?requestIdleCallback(load,{timeout:3000}):setTimeout(load,1200));
  if(document.readyState==='complete')idle();else window.addEventListener('load',idle,{once:true});
}
