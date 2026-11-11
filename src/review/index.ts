// Review comments: loaded on every visit once the DOM is ready and the main
// thread is idle (not on window load: Home's media keeps that ~8 s away).
// The tool stays tucked behind the left edge (app.ts).
export function mountReview(){
  const load=()=>import('./app').then(m=>m.startReview()).catch(error=>console.warn('Review tool failed to load',error));
  const idle=()=>('requestIdleCallback' in window?requestIdleCallback(load,{timeout:2000}):setTimeout(load,800));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',idle,{once:true});else idle();
}
