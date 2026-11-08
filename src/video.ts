import media from '../media-manifest.json';
import {node,reduced} from './sections';
export type VideoKind=keyof typeof media;
export function connectVideo(video:HTMLVideoElement,kind:VideoKind,viewportOnly=false){
  const asset=media[kind];
  video.dataset.videoKind=kind;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.autoplay=!viewportOnly&&!reduced();
  video.preload=kind==='hero'?'auto':'metadata';video.poster=asset.poster;video.src=asset.src;video.setAttribute('aria-hidden','true');
  let visible=!viewportOnly,disposed=false,observer:IntersectionObserver|undefined,reported=false;
  const report=(reason:string)=>{video.dataset.videoState=reason;if(!reported){reported=true;console.warn(`Altenar ${kind} video: ${reason}; the supplied poster remains visible.`);}};
  const play=()=>{
    if(disposed||!visible||reduced())return;
    try{const attempt=video.play();attempt?.then(()=>{if(!disposed){if(visible)video.dataset.videoState='playing';else{video.pause();video.dataset.videoState='paused';}}}).catch(error=>{if(!disposed&&visible&&error?.name!=='AbortError')report(error?.name||'playback-blocked');});}
    catch(error){report(error instanceof Error?error.name:'playback-error');}
  };
  const ready=()=>{video.dataset.videoState='ready';video.closest<HTMLElement>('.morph-video')?.setAttribute('data-video-ready','true');play();};
  const failed=()=>{report(`media-error-${video.error?.code||'unknown'}`);};
  video.addEventListener('loadeddata',ready);video.addEventListener('canplay',play);video.addEventListener('error',failed);
  if(viewportOnly&&typeof IntersectionObserver!=='undefined'){
    observer=new IntersectionObserver(entries=>{for(const entry of entries){visible=entry.isIntersecting;if(visible)play();else{video.pause();video.dataset.videoState='paused';}}},{threshold:0});
    observer.observe(video);
  }else{visible=true;play();}
  if(reduced()){video.autoplay=false;video.pause();video.dataset.videoState='reduced-motion';}
  return ()=>{disposed=true;observer?.disconnect();video.removeEventListener('loadeddata',ready);video.removeEventListener('canplay',play);video.removeEventListener('error',failed);video.pause();video.removeAttribute('src');};
}
export function setupSectionVideos(){
  const cleanup:(()=>void)[]=[];
  const product=null;
  if(product){const video=document.createElement('video');video.className=product.className;video.classList.add('product-video');product.replaceWith(video);cleanup.push(connectVideo(video,'products',true));}
  const logo=node('I4011:36550;4001:112219'),image=logo?.querySelector('img');
  if(logo&&image){const video=document.createElement('video');video.className=image.className;video.classList.add('footer-logo-video');logo.classList.add('footer-video-logo');logo.setAttribute('role','img');logo.setAttribute('aria-label','Altenar');image.replaceWith(video);cleanup.push(connectVideo(video,'footer',true));}
  return ()=>cleanup.forEach(fn=>fn());
}
