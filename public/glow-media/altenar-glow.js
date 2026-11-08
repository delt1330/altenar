/* Altenar Glow v4. Independent renderer with reference-calibrated motion. */
(function (global) {
  'use strict';
  const DEFAULT_COLORS = ['#018DFF', '#00CDF1', '#4EFF83'];
  const PROFILES = [[0.15, 0.34], [0.02, 0.15], [0.2, 0.5], [0.04, 0.12], [0.05, 0.11], [0.03, 0.06]];
  const VERTEX = `
    attribute vec2 point;
    varying vec2 scene;
    void main() { scene = point; gl_Position = vec4(point, 0.0, 1.0); }
  `;
  const FRAGMENT = `
    precision highp float;
    varying vec2 scene;
    uniform vec2 size;
    uniform float phase;
    uniform float seed;
    uniform float lens;
    uniform float pulse;
    uniform float softness;
    uniform float waveRate;
    uniform float intensity;
    uniform vec2 weights;
    uniform vec3 blue;
    uniform vec3 cyan;
    uniform vec3 green;
    uniform vec3 background;

    vec2 spin(vec2 p, float theta) {
      return vec2(p.x*cos(theta)-p.y*sin(theta), p.x*sin(theta)+p.y*cos(theta));
    }
    vec2 gradientAt(vec2 cell) {
      vec2 a = vec2(2127.1,81.17) + seed*vec2(13.37,7.31);
      vec2 b = vec2(1269.5,283.37) + seed*vec2(11.13,5.79);
      vec2 h = sin(vec2(dot(cell,a),dot(cell,b))) * (43758.5453+seed*1.618);
      return 2.0*fract(h)-1.0;
    }
    float driftNoise(vec2 p) {
      vec2 cell=floor(p), d=fract(p), e=d*d*(3.0-2.0*d);
      float lo=mix(dot(gradientAt(cell),d),dot(gradientAt(cell+vec2(1.0,0.0)),d-vec2(1.0,0.0)),e.x);
      float hi=mix(dot(gradientAt(cell+vec2(0.0,1.0)),d-vec2(0.0,1.0)),dot(gradientAt(cell+vec2(1.0,1.0)),d-vec2(1.0,1.0)),e.x);
      return 0.5+0.5*mix(lo,hi,e.y);
    }
    float feather(float distanceValue, float radius, float width) {
      return 1.0-smoothstep(radius-width,radius+width,distanceValue);
    }
    vec2 bend(vec2 p, float timeValue) {
      vec2 q=spin(p,-radians(-98.0+sin(seed*2.73)*30.0));
      float kx=0.2*(1.0+0.5*sin(seed*3.17+0.2));
      float ky=4.3*(1.0+0.5*sin(seed*3.17+4.3));
      float advance=timeValue*waveRate*0.2;
      float offsetA=fract(sin(seed*7.19)*437.58)*6.2832;
      float offsetB=fract(cos(seed*3.41)*291.37)*6.2832;
      float wave=ky*q.y-sin(q.x*kx+q.y-advance+offsetA);
      wave+=0.5*sin(seed*1.23)*sin(q.x*kx*2.0+q.y*0.5+advance*0.7+offsetB);
      float angle=smoothstep(cos(wave)*softness,sin(wave)*softness+3.0,cos(wave-ky*q.y)-sin(wave-kx*q.x));
      return spin(p,angle*3.34*(1.0+lens*0.35));
    }
    vec3 illuminate(vec2 p, vec2 first, vec2 second) {
      float d=length(p-second);
      vec4 masks=pow(vec4(
        feather(d,weights.y,0.45),
        feather(d,weights.y*0.75,0.23),
        feather(d,weights.y*0.55,0.23),
        1.0-smoothstep(0.0,weights.y*0.3+0.33,d)
      ),vec4(1.28));
      vec3 light=blue*masks.x;
      light=mix(light,cyan,masks.y);
      light=mix(light,green,masks.z);
      light=mix(light,green,masks.w*0.85);
      float firstMask=pow(feather(length(p-first),weights.x,0.38),1.28);
      return mix(light,blue,firstMask);
    }
    void main() {
      float timeValue=phase*0.4;
      vec2 uv=scene*0.5;
      uv*=1.0-0.15*sin(pulse*3.14159);
      uv*=1.0-lens*0.35*dot(uv,uv);
      float aspect=size.x/size.y;
      vec2 shift=100.0*vec2(sin(seed*4.37),cos(seed*5.91));
      float angle=(driftNoise(vec2(timeValue*waveRate*0.1,uv.x*uv.y)+shift)-0.5)*720.0+180.0;
      vec2 rotated=spin(uv/vec2(1.0,aspect),radians(angle))*vec2(1.0,aspect);
      vec2 warped=uv*size*4.0/(size.x+size.y);
      warped=spin(warped,fract(sin(seed*5.63)*173.29)*6.2832);
      vec2 field=mix(rotated,bend(warped,timeValue)*0.5,0.34);
      vec2 first=spin(vec2(-0.4,0.4),sin(seed*1.83)+timeValue*0.2);
      vec2 second=spin(vec2(0.4,-0.4),cos(seed*2.47)+timeValue*0.16);
      float separation=lens*0.018;
      vec3 light=vec3(
        illuminate(field-vec2(separation,0.0),first,second).r,
        illuminate(field,first,second).g,
        illuminate(field+vec2(separation,0.0),first,second).b
      );
      light=mix(light,light*light+0.5*sqrt(light),0.3+lens*0.15);
      gl_FragColor=vec4(max(background,light*intensity),1.0);
    }
  `;

  const clip = (x, a, b) => Math.max(a, Math.min(b, x));
  const mix = (a, b, t) => a+(b-a)*t;
  function hex(value) {
    if (typeof value!=='string' || !/^#[0-9a-f]{6}$/i.test(value)) throw new TypeError('Expected a color such as #018DFF.');
    return value.toUpperCase();
  }
  function palette(value) {
    if (!Array.isArray(value) || value.length!==3) throw new TypeError('Provide three colors.');
    return value.map(hex);
  }
  const rgb = value => [1,3,5].map(i=>parseInt(value.slice(i,i+2),16)/255);

  /* CPU renderer uses the same field equations when WebGL is unavailable. */
  const fract = value => value-Math.floor(value);
  const smooth = (a,b,x) => {const t=clip((x-a)/(b-a),0,1);return t*t*(3-2*t);};
  const spin = (x,y,a) => {const c=Math.cos(a),s=Math.sin(a);return [x*c-y*s,x*s+y*c];};
  const gradient = (x,y) => [
    2*fract(Math.sin(x*(2127.1+42*13.37)+y*(81.17+42*7.31))*(43758.5453+42*1.618))-1,
    2*fract(Math.sin(x*(1269.5+42*11.13)+y*(283.37+42*5.79))*(43758.5453+42*1.618))-1
  ];
  function noise(x,y) {
    const ix=Math.floor(x),iy=Math.floor(y),dx=x-ix,dy=y-iy;
    const ex=dx*dx*(3-2*dx),ey=dy*dy*(3-2*dy);
    const a=gradient(ix,iy),b=gradient(ix+1,iy),c=gradient(ix,iy+1),d=gradient(ix+1,iy+1);
    return .5+.5*mix(mix(a[0]*dx+a[1]*dy,b[0]*(dx-1)+b[1]*dy,ex),mix(c[0]*dx+c[1]*(dy-1),d[0]*(dx-1)+d[1]*(dy-1),ex),ey);
  }
  function softwareFrame(image, state) {
    const {width:w,height:h,data}=image;
    const t=state.phase*.4,aspect=w/h;
    const first=spin(-.4,.4,Math.sin(42*1.83)+t*.2);
    const second=spin(.4,-.4,Math.cos(42*2.47)+t*.16);
    const pre=fract(Math.sin(42*5.63)*173.29)*6.2832;
    const direction=-(-98+Math.sin(42*2.73)*30)*Math.PI/180;
    const kx=.2*(1+.5*Math.sin(42*3.17+.2)),ky=4.3*(1+.5*Math.sin(42*3.17+4.3));
    const offsetA=fract(Math.sin(42*7.19)*437.58)*6.2832,offsetB=fract(Math.cos(42*3.41)*291.37)*6.2832;
    const travel=t*state.waveRate*.2, harmonic=.5*Math.sin(42*1.23);
    const shiftX=100*Math.sin(42*4.37),shiftY=100*Math.cos(42*5.91);
    const nx=t*state.waveRate*.1+shiftX,ix=Math.floor(nx),dx=nx-ix,ex=dx*dx*(3-2*dx),cells=new Map();
    const timeNoise=y=>{
      const iy=Math.floor(y),dy=y-iy,ey=dy*dy*(3-2*dy);
      let g=cells.get(iy);
      if(!g){g=[gradient(ix,iy),gradient(ix+1,iy),gradient(ix,iy+1),gradient(ix+1,iy+1)];cells.set(iy,g);}
      return .5+.5*mix(mix(g[0][0]*dx+g[0][1]*dy,g[1][0]*(dx-1)+g[1][1]*dy,ex),mix(g[2][0]*dx+g[2][1]*(dy-1),g[3][0]*(dx-1)+g[3][1]*(dy-1),ex),ey);
    };
    const preC=Math.cos(pre),preS=Math.sin(pre),dirC=Math.cos(direction),dirS=Math.sin(direction);
    const feather=(d,r,s)=>1-smooth(r-s,r+s,d);
    const colors=state.colors.map(rgb),base=rgb(state.background);
    const tone=.3+state.lens*.15,zoom=1-.15*Math.sin(state.pulse*3.14159);
    const mask=(x,y)=>{
      const sx=x-second[0],sy=y-second[1],cx=x-first[0],cy=y-first[1];
      const d=Math.sqrt(sx*sx+sy*sy);
      const a=Math.pow(feather(d,state.weights[1],.45),1.28);
      const b=Math.pow(feather(d,state.weights[1]*.75,.23),1.28);
      const c=Math.pow(feather(d,state.weights[1]*.55,.23),1.28);
      const hot=Math.pow(1-smooth(0,state.weights[1]*.3+.33,d),1.28)*.85;
      const cold=Math.pow(feather(Math.sqrt(cx*cx+cy*cy),state.weights[0],.38),1.28);
      return [a,b,c,hot,cold];
    };
    const channel=(m,index)=>{
      const [a,b,c,hot,cold]=m;
      let light=colors[0][index]*a;
      light=mix(light,colors[1][index],b);light=mix(light,colors[2][index],c);
      light=mix(light,colors[2][index],hot);light=mix(light,colors[0][index],cold);
      light=mix(light,light*light+.5*Math.sqrt(light),tone);
      return Math.round(255*clip(Math.max(base[index],light*state.intensity),0,1));
    };
    for(let y=0;y<h;y++)for(let x=0;x<w;x++) {
      let ux=((x+.5)/w-.5)*zoom,uy=(.5-(y+.5)/h)*zoom;
      const curvature=1-state.lens*.35*(ux*ux+uy*uy);ux*=curvature;uy*=curvature;
      const angle=((timeNoise(ux*uy+shiftY)-.5)*720+180)*Math.PI/180,ac=Math.cos(angle),as=Math.sin(angle);
      const rx=ux*ac-uy/aspect*as,ry=(ux*as+uy/aspect*ac)*aspect;
      const vx=ux*w*4/(w+h),vy=uy*h*4/(w+h),px=vx*preC-vy*preS,py=vx*preS+vy*preC;
      const qx=px*dirC-py*dirS,qy=px*dirS+py*dirC;
      let wave=ky*qy-Math.sin(qx*kx+qy-travel+offsetA);
      wave+=harmonic*Math.sin(qx*kx*2+qy*.5+travel*.7+offsetB);
      const turn=smooth(Math.cos(wave)*state.softness,Math.sin(wave)*state.softness+3,Math.cos(wave-ky*qy)-Math.sin(wave-kx*qx))*3.34*(1+state.lens*.35),bc=Math.cos(turn),bs=Math.sin(turn);
      const fx=mix(rx,(px*bc-py*bs)*.5,.34),fy=mix(ry,(px*bs+py*bc)*.5,.34),offset=state.lens*.018;
      const i=(y*w+x)*4;
      if(offset===0){const m=mask(fx,fy);data[i]=channel(m,0);data[i+1]=channel(m,1);data[i+2]=channel(m,2);}
      else {data[i]=channel(mask(fx-offset,fy),0);data[i+1]=channel(mask(fx,fy),1);data[i+2]=channel(mask(fx+offset,fy),2);}
      data[i+3]=255;
    }
  }

  /*! Lenis 1.3.25
The MIT License

Copyright (c) 2024 darkroom.engineering

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
  */
  const BundledLenis = (function(){var e=`1.3.25`;function t(e,t,n){return Math.max(e,Math.min(t,n))}function n(e,t,n){return(1-n)*e+n*t}function r(e,t,r,i){return n(e,t,1-Math.exp(-r*i))}function i(e,t){return(e%t+t)%t}var a=class{isRunning=!1;value=0;from=0;to=0;currentTime=0;lerp;duration;easing;onUpdate;advance(e){if(!this.isRunning)return;let n=!1;if(this.duration&&this.easing){this.currentTime+=e;let r=t(0,this.currentTime/this.duration,1);n=r>=1;let i=n?1:this.easing(r);this.value=this.from+(this.to-this.from)*i}else this.lerp?(this.value=r(this.value,this.to,this.lerp*60,e),Math.round(this.value)===Math.round(this.to)&&(this.value=this.to,n=!0)):(this.value=this.to,n=!0);n&&this.stop(),this.onUpdate?.(this.value,n)}stop(){this.isRunning=!1}fromTo(e,t,{lerp:n,duration:r,easing:i,onStart:a,onUpdate:o}){this.from=this.value=e,this.to=t,this.lerp=n,this.duration=r,this.easing=i,this.currentTime=0,this.isRunning=!0,a?.(),this.onUpdate=o}};function o(e,t){let n;return function(...r){clearTimeout(n),n=setTimeout(()=>{n=void 0,e.apply(this,r)},t)}}var s=class{width=0;height=0;scrollHeight=0;scrollWidth=0;debouncedResize;wrapperResizeObserver;contentResizeObserver;constructor(e,t,{autoResize:n=!0,debounce:r=250}={}){this.wrapper=e,this.content=t,n&&(this.debouncedResize=o(this.resize,r),this.wrapper instanceof Window?window.addEventListener(`resize`,this.debouncedResize):(this.wrapperResizeObserver=new ResizeObserver(this.debouncedResize),this.wrapperResizeObserver.observe(this.wrapper)),this.contentResizeObserver=new ResizeObserver(this.debouncedResize),this.contentResizeObserver.observe(this.content)),this.resize()}destroy(){this.wrapperResizeObserver?.disconnect(),this.contentResizeObserver?.disconnect(),this.wrapper===window&&this.debouncedResize&&window.removeEventListener(`resize`,this.debouncedResize)}resize=()=>{this.onWrapperResize(),this.onContentResize()};onWrapperResize=()=>{this.wrapper instanceof Window?(this.width=window.innerWidth,this.height=window.innerHeight):(this.width=this.wrapper.clientWidth,this.height=this.wrapper.clientHeight)};onContentResize=()=>{this.wrapper instanceof Window?(this.scrollHeight=this.content.scrollHeight,this.scrollWidth=this.content.scrollWidth):(this.scrollHeight=this.wrapper.scrollHeight,this.scrollWidth=this.wrapper.scrollWidth)};get limit(){return{x:this.scrollWidth-this.width,y:this.scrollHeight-this.height}}},c=class{events={};emit(e,...t){let n=this.events[e]||[];for(let e=0,r=n.length;e<r;e++)n[e]?.(...t)}on(e,t){return this.events[e]?this.events[e].push(t):this.events[e]=[t],()=>{this.events[e]=this.events[e]?.filter(e=>t!==e)}}off(e,t){this.events[e]=this.events[e]?.filter(e=>t!==e)}destroy(){this.events={}}};let l={passive:!1};function u(e,t){return e===1?16.666666666666668:e===2?t:1}var d=class{touchStart={x:0,y:0};lastDelta={x:0,y:0};window={width:0,height:0};emitter=new c;constructor(e,t={wheelMultiplier:1,touchMultiplier:1}){this.element=e,this.options=t,window.addEventListener(`resize`,this.onWindowResize),this.onWindowResize(),this.element.addEventListener(`wheel`,this.onWheel,l),this.element.addEventListener(`touchstart`,this.onTouchStart,l),this.element.addEventListener(`touchmove`,this.onTouchMove,l),this.element.addEventListener(`touchend`,this.onTouchEnd,l)}on(e,t){return this.emitter.on(e,t)}destroy(){this.emitter.destroy(),window.removeEventListener(`resize`,this.onWindowResize),this.element.removeEventListener(`wheel`,this.onWheel,l),this.element.removeEventListener(`touchstart`,this.onTouchStart,l),this.element.removeEventListener(`touchmove`,this.onTouchMove,l),this.element.removeEventListener(`touchend`,this.onTouchEnd,l)}onTouchStart=e=>{let{clientX:t,clientY:n}=e.targetTouches?e.targetTouches[0]:e;this.touchStart.x=t,this.touchStart.y=n,this.lastDelta={x:0,y:0},this.emitter.emit(`scroll`,{deltaX:0,deltaY:0,event:e})};onTouchMove=e=>{let{clientX:t,clientY:n}=e.targetTouches?e.targetTouches[0]:e,r=-(t-this.touchStart.x)*this.options.touchMultiplier,i=-(n-this.touchStart.y)*this.options.touchMultiplier;this.touchStart.x=t,this.touchStart.y=n,this.lastDelta={x:r,y:i},this.emitter.emit(`scroll`,{deltaX:r,deltaY:i,event:e})};onTouchEnd=e=>{this.emitter.emit(`scroll`,{deltaX:this.lastDelta.x,deltaY:this.lastDelta.y,event:e})};onWheel=e=>{let{deltaX:t,deltaY:n,deltaMode:r}=e,i=u(r,this.window.width),a=u(r,this.window.height);t*=i,n*=a,t*=this.options.wheelMultiplier,n*=this.options.wheelMultiplier,this.emitter.emit(`scroll`,{deltaX:t,deltaY:n,event:e})};onWindowResize=()=>{this.window={width:window.innerWidth,height:window.innerHeight}}};let f=e=>Math.min(1,1.001-2**(-10*e));var p=class{_isScrolling=!1;_isStopped=!1;_isLocked=!1;_preventNextNativeScrollEvent=!1;_resetVelocityTimeout=null;_rafId=null;_isDraggingSelection=!1;isTouching;isIos;time=0;userData={};lastVelocity=0;velocity=0;direction=0;options;targetScroll;animatedScroll;animate=new a;emitter=new c;dimensions;virtualScroll;constructor({wrapper:t=window,content:n=document.documentElement,eventsTarget:r=t,smoothWheel:i=!0,syncTouch:a=!1,syncTouchLerp:o=.075,touchInertiaExponent:c=1.7,duration:l,easing:u,lerp:p=.1,infinite:m=!1,orientation:h=`vertical`,gestureOrientation:g=h===`horizontal`?`both`:`vertical`,touchMultiplier:_=1,wheelMultiplier:v=1,autoResize:y=!0,prevent:b,virtualScroll:x,overscroll:S=!0,autoRaf:C=!1,anchors:w=!1,autoToggle:T=!1,allowNestedScroll:E=!1,__experimental__naiveDimensions:D=!1,naiveDimensions:O=D,stopInertiaOnNavigate:k=!1}={}){window.lenisVersion=e,window.lenis||(window.lenis={}),window.lenis.version=e,h===`horizontal`&&(window.lenis.horizontal=!0),a===!0&&(window.lenis.touch=!0),this.isIos=/(iPad|iPhone|iPod)/g.test(navigator.userAgent),(!t||t===document.documentElement)&&(t=window),typeof l==`number`&&typeof u!=`function`?u=f:typeof u==`function`&&typeof l!=`number`&&(l=1),this.options={wrapper:t,content:n,eventsTarget:r,smoothWheel:i,syncTouch:a,syncTouchLerp:o,touchInertiaExponent:c,duration:l,easing:u,lerp:p,infinite:m,gestureOrientation:g,orientation:h,touchMultiplier:_,wheelMultiplier:v,autoResize:y,prevent:b,virtualScroll:x,overscroll:S,autoRaf:C,anchors:w,autoToggle:T,allowNestedScroll:E,naiveDimensions:O,stopInertiaOnNavigate:k},this.dimensions=new s(t,n,{autoResize:y}),this.updateClassName(),this.targetScroll=this.animatedScroll=this.actualScroll,this.options.wrapper.addEventListener(`scroll`,this.onNativeScroll),this.options.wrapper.addEventListener(`scrollend`,this.onScrollEnd,{capture:!0}),(this.options.anchors||this.options.stopInertiaOnNavigate)&&this.options.wrapper.addEventListener(`click`,this.onClick),this.options.wrapper.addEventListener(`pointerdown`,this.onPointerDown),this.virtualScroll=new d(r,{touchMultiplier:_,wheelMultiplier:v}),this.virtualScroll.on(`scroll`,this.onVirtualScroll),this.options.autoToggle&&(this.checkOverflow(),this.rootElement.addEventListener(`transitionend`,this.onTransitionEnd)),this.options.autoRaf&&(this._rafId=requestAnimationFrame(this.raf))}destroy(){this.emitter.destroy(),this.options.wrapper.removeEventListener(`scroll`,this.onNativeScroll),this.options.wrapper.removeEventListener(`scrollend`,this.onScrollEnd,{capture:!0}),this.options.wrapper.removeEventListener(`pointerdown`,this.onPointerDown),(this.options.anchors||this.options.stopInertiaOnNavigate)&&this.options.wrapper.removeEventListener(`click`,this.onClick),this.virtualScroll.destroy(),this.dimensions.destroy(),this.cleanUpClassName(),this._rafId&&cancelAnimationFrame(this._rafId)}on(e,t){return this.emitter.on(e,t)}off(e,t){return this.emitter.off(e,t)}onScrollEnd=e=>{e instanceof CustomEvent||(this.isScrolling===`smooth`||this.isScrolling===!1)&&e.stopPropagation()};dispatchScrollendEvent=()=>{this.options.wrapper.dispatchEvent(new CustomEvent(`scrollend`,{bubbles:this.options.wrapper===window,detail:{lenisScrollEnd:!0}}))};get overflow(){let e=this.isHorizontal?`overflow-x`:`overflow-y`;return getComputedStyle(this.rootElement)[e]}checkOverflow(){[`hidden`,`clip`].includes(this.overflow)?this.internalStop():this.internalStart()}onTransitionEnd=e=>{e.propertyName?.includes(`overflow`)&&e.target===this.rootElement&&this.checkOverflow()};setScroll(e){this.isHorizontal?this.options.wrapper.scrollTo({left:e,behavior:`instant`}):this.options.wrapper.scrollTo({top:e,behavior:`instant`})}onClick=e=>{let t=e.composedPath().filter(e=>e instanceof HTMLAnchorElement&&e.href).map(e=>new URL(e.href)),n=new URL(window.location.href);if(this.options.anchors){let e=t.find(e=>n.host===e.host&&n.pathname===e.pathname&&e.hash);if(e){let t=typeof this.options.anchors==`object`&&this.options.anchors?this.options.anchors:void 0,n=decodeURIComponent(e.hash);this.scrollTo(n,t);return}}if(this.options.stopInertiaOnNavigate&&t.some(e=>n.host===e.host&&n.pathname!==e.pathname)){this.reset();return}};onPointerDown=e=>{e.button===1&&this.reset()};isTouchOnSelectionHandle(e){let t=window.getSelection();if(!t||t.isCollapsed||t.rangeCount===0)return!1;let n=e.targetTouches[0]??e.changedTouches[0];if(!n)return!1;let r=t.getRangeAt(0).getClientRects();if(r.length===0)return!1;let i=r[0],a=r[r.length-1],o=Math.hypot(n.clientX-i.left,n.clientY-i.top)<=40,s=Math.hypot(n.clientX-a.right,n.clientY-a.bottom)<=40;return o||s}onVirtualScroll=e=>{if(typeof this.options.virtualScroll==`function`&&this.options.virtualScroll(e)===!1)return;let{deltaX:t,deltaY:n,event:r}=e;if(this.emitter.emit(`virtual-scroll`,{deltaX:t,deltaY:n,event:r}),r.ctrlKey||r.lenisStopPropagation)return;let i=r.type.includes(`touch`),a=r.type.includes(`wheel`);if(i&&this.isIos&&(r.type===`touchstart`&&(this._isDraggingSelection=this.isTouchOnSelectionHandle(r)),this._isDraggingSelection)){r.type===`touchend`&&(this._isDraggingSelection=!1);return}this.isTouching=r.type===`touchstart`||r.type===`touchmove`;let o=t===0&&n===0;if(this.options.syncTouch&&i&&r.type===`touchstart`&&o&&!this.isStopped&&!this.isLocked){this.reset();return}let s=this.options.gestureOrientation===`vertical`&&n===0||this.options.gestureOrientation===`horizontal`&&t===0;if(o||s)return;let c=r.composedPath();c=c.slice(0,c.indexOf(this.rootElement));let l=this.options.prevent,u=Math.abs(t)>=Math.abs(n)?`horizontal`:`vertical`;if(c.find(e=>e instanceof HTMLElement&&(typeof l==`function`&&l?.(e)||e.hasAttribute?.(`data-lenis-prevent`)||u===`vertical`&&e.hasAttribute?.(`data-lenis-prevent-vertical`)||u===`horizontal`&&e.hasAttribute?.(`data-lenis-prevent-horizontal`)||i&&e.hasAttribute?.(`data-lenis-prevent-touch`)||a&&e.hasAttribute?.(`data-lenis-prevent-wheel`)||this.options.allowNestedScroll&&this.hasNestedScroll(e,{deltaX:t,deltaY:n}))))return;if(this.isStopped||this.isLocked){r.cancelable&&r.preventDefault();return}if(!(this.options.syncTouch&&i||this.options.smoothWheel&&a)){this.isScrolling=`native`,this.animate.stop(),r.lenisStopPropagation=!0;return}let d=n;this.options.gestureOrientation===`both`?d=Math.abs(n)>Math.abs(t)?n:t:this.options.gestureOrientation===`horizontal`&&(d=t),(!this.options.overscroll||this.options.infinite||this.options.wrapper!==window&&this.limit>0&&(this.animatedScroll>0&&this.animatedScroll<this.limit||this.animatedScroll===0&&n>0||this.animatedScroll===this.limit&&n<0))&&(r.lenisStopPropagation=!0),r.cancelable&&r.preventDefault();let f=i&&this.options.syncTouch,p=i&&r.type===`touchend`;p&&(d=Math.sign(d)*Math.abs(this.velocity)**this.options.touchInertiaExponent),this.scrollTo(this.targetScroll+d,{programmatic:!1,...f?{lerp:p?this.options.syncTouchLerp:1}:{lerp:this.options.lerp,duration:this.options.duration,easing:this.options.easing}})};resize(){this.dimensions.resize(),this.animatedScroll=this.targetScroll=this.actualScroll,this.emit()}emit(){this.emitter.emit(`scroll`,this)}onNativeScroll=()=>{if(this._resetVelocityTimeout!==null&&(clearTimeout(this._resetVelocityTimeout),this._resetVelocityTimeout=null),this._preventNextNativeScrollEvent){this._preventNextNativeScrollEvent=!1;return}if(this.isScrolling===!1||this.isScrolling===`native`){let e=this.animatedScroll;this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity,this.velocity=this.animatedScroll-e,this.direction=Math.sign(this.animatedScroll-e),this.isStopped||(this.isScrolling=`native`),this.emit(),this.velocity!==0&&(this._resetVelocityTimeout=setTimeout(()=>{this.lastVelocity=this.velocity,this.velocity=0,this.isScrolling=!1,this.emit()},400))}};reset(){this.isLocked=!1,this.isScrolling=!1,this.animatedScroll=this.targetScroll=this.actualScroll,this.lastVelocity=this.velocity=0,this.animate.stop()}start(){if(this.isStopped){if(this.options.autoToggle){this.rootElement.style.removeProperty(`overflow`);return}this.internalStart()}}internalStart(){this.isStopped&&(this.reset(),this.isStopped=!1,this.emit())}stop(){if(!this.isStopped){if(this.options.autoToggle){this.rootElement.style.setProperty(`overflow`,`clip`);return}this.internalStop()}}internalStop(){this.isStopped||(this.reset(),this.isStopped=!0,this.emit())}raf=e=>{let t=e-(this.time||e);this.time=e,this.animate.advance(t*.001),this.options.autoRaf&&(this._rafId=requestAnimationFrame(this.raf))};scrollTo(e,{offset:n=0,immediate:r=!1,lock:i=!1,programmatic:a=!0,lerp:o=a?this.options.lerp:void 0,duration:s=a?this.options.duration:void 0,easing:c=a?this.options.easing:void 0,onStart:l,onComplete:u,force:d=!1,userData:p}={}){if((this.isStopped||this.isLocked)&&!d)return;let m=e,h=n;if(typeof m==`string`&&[`top`,`left`,`start`,`#`].includes(m))m=0;else if(typeof m==`string`&&[`bottom`,`right`,`end`].includes(m))m=this.limit;else{let e=null;if(typeof m==`string`?(e=m.startsWith(`#`)?document.getElementById(m.slice(1)):document.querySelector(m),e||(m===`#top`?m=0:console.warn(`Lenis: Target not found`,m))):m instanceof HTMLElement&&m?.nodeType&&(e=m),e){if(this.options.wrapper!==window){let e=this.rootElement.getBoundingClientRect();h-=this.isHorizontal?e.left:e.top}let t=e.getBoundingClientRect(),n=getComputedStyle(e),r=this.isHorizontal?Number.parseFloat(n.scrollMarginLeft):Number.parseFloat(n.scrollMarginTop),i=getComputedStyle(this.rootElement),a=this.isHorizontal?Number.parseFloat(i.scrollPaddingLeft):Number.parseFloat(i.scrollPaddingTop);m=(this.isHorizontal?t.left:t.top)+this.animatedScroll-(Number.isNaN(r)?0:r)-(Number.isNaN(a)?0:a)}}if(typeof m==`number`){if(m+=h,this.options.infinite){if(a){this.targetScroll=this.animatedScroll=this.scroll;let e=m-this.animatedScroll;e>this.limit/2?m-=this.limit:e<-this.limit/2&&(m+=this.limit)}}else m=t(0,m,this.limit);if(m===this.targetScroll){l?.(this),u?.(this);return}if(this.userData=p??{},r){this.animatedScroll=this.targetScroll=m,this.setScroll(this.scroll),this.reset(),this.preventNextNativeScrollEvent(),this.emit(),u?.(this),this.userData={},requestAnimationFrame(()=>{this.dispatchScrollendEvent()});return}a||(this.targetScroll=m),typeof s==`number`&&typeof c!=`function`?c=f:typeof c==`function`&&typeof s!=`number`&&(s=1),this.animate.fromTo(this.animatedScroll,m,{duration:s,easing:c,lerp:o,onStart:()=>{i&&(this.isLocked=!0),this.isScrolling=`smooth`,l?.(this)},onUpdate:(e,t)=>{this.isScrolling=`smooth`,this.lastVelocity=this.velocity,this.velocity=e-this.animatedScroll,this.direction=Math.sign(this.velocity),this.animatedScroll=e,this.setScroll(this.scroll),a&&(this.targetScroll=e),t||this.emit(),t&&(this.reset(),this.emit(),u?.(this),this.userData={},requestAnimationFrame(()=>{this.dispatchScrollendEvent()}),this.preventNextNativeScrollEvent())}})}}preventNextNativeScrollEvent(){this._preventNextNativeScrollEvent=!0,requestAnimationFrame(()=>{this._preventNextNativeScrollEvent=!1})}hasNestedScroll(e,{deltaX:t,deltaY:n}){let r=Date.now();e._lenis||={};let i=e._lenis,a,o,s,c,l,u,d,f,p,m;if(r-(i.time??0)>2e3){i.time=Date.now();let t=window.getComputedStyle(e);if(i.computedStyle=t,a=[`auto`,`overlay`,`scroll`].includes(t.overflowX),o=[`auto`,`overlay`,`scroll`].includes(t.overflowY),l=[`auto`].includes(t.overscrollBehaviorX),u=[`auto`].includes(t.overscrollBehaviorY),i.hasOverflowX=a,i.hasOverflowY=o,!(a||o))return!1;d=e.scrollWidth,f=e.scrollHeight,p=e.clientWidth,m=e.clientHeight,s=d>p,c=f>m,i.isScrollableX=s,i.isScrollableY=c,i.scrollWidth=d,i.scrollHeight=f,i.clientWidth=p,i.clientHeight=m,i.hasOverscrollBehaviorX=l,i.hasOverscrollBehaviorY=u}else s=i.isScrollableX,c=i.isScrollableY,a=i.hasOverflowX,o=i.hasOverflowY,d=i.scrollWidth,f=i.scrollHeight,p=i.clientWidth,m=i.clientHeight,l=i.hasOverscrollBehaviorX,u=i.hasOverscrollBehaviorY;if(!(a&&s||o&&c))return!1;let h=Math.abs(t)>=Math.abs(n)?`horizontal`:`vertical`,g,_,v,y,b,x;if(h===`horizontal`)g=Math.round(e.scrollLeft),_=d-p,v=t,y=a,b=s,x=l;else if(h===`vertical`)g=Math.round(e.scrollTop),_=f-m,v=n,y=o,b=c,x=u;else return!1;return!x&&(g>=_||g<=0)?!0:(v>0?g<_:g>0)&&y&&b}get rootElement(){return this.options.wrapper===window?document.documentElement:this.options.wrapper}get limit(){return this.options.naiveDimensions?this.isHorizontal?this.rootElement.scrollWidth-this.rootElement.clientWidth:this.rootElement.scrollHeight-this.rootElement.clientHeight:this.dimensions.limit[this.isHorizontal?`x`:`y`]}get isHorizontal(){return this.options.orientation===`horizontal`}get actualScroll(){let e=this.options.wrapper;return this.isHorizontal?e.scrollX??e.scrollLeft:e.scrollY??e.scrollTop}get scroll(){return this.options.infinite?i(this.animatedScroll,this.limit):this.animatedScroll}get progress(){return this.limit===0?1:this.scroll/this.limit}get isScrolling(){return this._isScrolling}set isScrolling(e){this._isScrolling!==e&&(this._isScrolling=e,this.updateClassName())}get isStopped(){return this._isStopped}set isStopped(e){this._isStopped!==e&&(this._isStopped=e,this.updateClassName())}get isLocked(){return this._isLocked}set isLocked(e){this._isLocked!==e&&(this._isLocked=e,this.updateClassName())}get isSmooth(){return this.isScrolling===`smooth`}get className(){let e=`lenis`;return this.options.autoToggle&&(e+=` lenis-autoToggle`),this.isStopped&&(e+=` lenis-stopped`),this.isLocked&&(e+=` lenis-locked`),this.isScrolling&&(e+=` lenis-scrolling`),this.isScrolling===`smooth`&&(e+=` lenis-smooth`),e}updateClassName(){this.cleanUpClassName(),this.className.split(` `).forEach(e=>{this.rootElement.classList.add(e)})}cleanUpClassName(){for(let e of Array.from(this.rootElement.classList))(e===`lenis`||e.startsWith(`lenis-`))&&this.rootElement.classList.remove(e)}};return p})();

  class AltenarGlow {
    constructor(target, options={}) {
      this.target=typeof target==='string'?document.querySelector(target):target;
      if(!this.target)throw new Error('Background container not found.');
      this.options=options;
      this.colors=palette(options.colors||DEFAULT_COLORS);
      this.background=hex(options.background||'#03080E');
      this.intensity=Number.isFinite(options.intensity)?clip(options.intensity,0,1):1;
      this.speed=Number.isFinite(options.speed)?clip(options.speed,0,5):1;
      this.pixelRatio=Number.isFinite(options.pixelRatio)?clip(options.pixelRatio,.5,2):1.5;
      this.listenScroll=options.scroll!==false;
      this.motion=['auto','on','off'].includes(options.motion)?options.motion:'auto';
      this.phase=0;this.seed=42;this.weights=[...PROFILES[0]];this.targetWeights=[...this.weights];
      this.lens=0;this.targetLens=0;this.pulse=1;this.lensTween=null;
      this.softness=.74;this.waveRate=4.57;this.waveTween=null;
      this.progress=this.targetProgress=0;this.pendingDistance=0;this.velocity=0;
      this.lastScroll=global.scrollY||0;this.previousTime=0;this.lastDraw=0;
      this.visible=true;this.paused=false;this.destroyed=false;this.frame=0;this.scrollFrame=0;
      this.media=global.matchMedia('(prefers-reduced-motion: reduce)');
      this.oldPosition=this.target.style.position;
      if(getComputedStyle(this.target).position==='static')this.target.style.position='relative';
      this.canvas=this.makeCanvas();
      try {this.gl=this.canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power'});if(this.gl)this.initGL();}
      catch(error){this.releaseGL();this.gl=null;}
      if(!this.gl)this.initSoftware();
      this.tick=this.tick.bind(this);
      this.onResize=()=>{this.refreshSections();this.draw(true);this.wake();};
      this.onVisibility=()=>this.wake();
      this.onMotion=()=>{this.configureScroll();this.draw(true);this.wake();};
      this.onNativeScroll=()=>{
        if(this.scrollEngine)return;
        const y=global.scrollY||0;
        this.pendingDistance+=Math.abs(y-this.lastScroll);this.lastScroll=y;
        this.updateProfile(y);this.wake();
      };
      this.onEngineScroll=event=>{
        this.velocity=Math.abs(event.velocity||0);
        this.lastScroll=event.scroll??event.animatedScroll??global.scrollY??0;
        this.updateProfile(this.lastScroll);this.wake();
      };
      this.onContextLost=event=>{
        event.preventDefault();this.releaseGL();this.gl=null;this.initSoftware();this.draw(true);this.wake();
      };
      this.canvas.addEventListener('webglcontextlost',this.onContextLost);
      this.onSpeedShift=event=>this.tweenRate(event.detail?.speed??8,event.detail?.duration??1.5,false);
      this.onSpeedReset=event=>this.tweenRate(4.57,event.detail?.duration??2,true);
      this.resizeObserver=new ResizeObserver(this.onResize);this.resizeObserver.observe(this.target);
      this.contentObserver=new ResizeObserver(()=>this.refreshSections());this.contentObserver.observe(document.documentElement);
      this.intersectionObserver=new IntersectionObserver(entries=>{this.visible=entries[0].isIntersecting;this.wake();});
      this.intersectionObserver.observe(this.target);
      document.addEventListener('visibilitychange',this.onVisibility);
      this.media.addEventListener('change',this.onMotion);
      global.addEventListener('resize',this.onResize,{passive:true});
      if(this.listenScroll)global.addEventListener('scroll',this.onNativeScroll,{passive:true});
      global.addEventListener('bg-speed-shift',this.onSpeedShift);
      global.addEventListener('bg-speed-reset',this.onSpeedReset);
      this.refreshSections();this.configureScroll();this.draw(true);this.wake();
    }

    makeCanvas() {
      const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');
      canvas.style.cssText='position:absolute;inset:0;display:block;width:100%;height:100%;pointer-events:none;';
      this.target.appendChild(canvas);return canvas;
    }
    initGL() {
      const gl=this.gl;
      const compile=(kind,text)=>{
        const shader=gl.createShader(kind);gl.shaderSource(shader,text);gl.compileShader(shader);
        if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const message=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(message);}
        return shader;
      };
      const vs=compile(gl.VERTEX_SHADER,VERTEX),fs=compile(gl.FRAGMENT_SHADER,FRAGMENT),program=gl.createProgram();
      gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS)){const message=gl.getProgramInfoLog(program);gl.deleteProgram(program);throw new Error(message);}
      this.program=program;gl.useProgram(program);
      this.buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.buffer);
      gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
      const location=gl.getAttribLocation(program,'point');gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,2,gl.FLOAT,false,0,0);
      this.uniforms=Object.fromEntries(['size','seed','phase','lens','pulse','softness','waveRate','intensity','weights','blue','cyan','green','background'].map(name=>[name,gl.getUniformLocation(program,name)]));
    }
    initSoftware() {
      this.canvas?.removeEventListener('webglcontextlost',this.onContextLost);
      this.canvas?.remove();this.canvas=this.makeCanvas();
      this.context=this.canvas.getContext('2d',{alpha:false});this.image=null;
      if(!this.context)this.canvas.style.background=`radial-gradient(ellipse at 30% 40%,${this.colors[0]},transparent),${this.background}`;
    }
    configureScroll() {
      const permitted=this.motion==='on'||(this.motion==='auto'&&!this.media.matches);
      if(!this.listenScroll||!permitted){this.detachEngine();return;}
      if(this.scrollEngine)return;
      const shared=this.options.scrollEngine||(global.lenis&&typeof global.lenis.on==='function'?global.lenis:null);
      if(shared){this.scrollEngine=shared;this.ownsEngine=false;}
      else if(this.options.smoothScroll!==false&&typeof BundledLenis!=='undefined'){
        this.previousEngine=global.lenis;
        this.scrollEngine=new BundledLenis({duration:1.2,easing:t=>Math.min(1,1.001-Math.pow(2,-10*t))});
        this.ownsEngine=true;global.lenis=this.scrollEngine;
        this.scrollStyle=document.createElement('style');
        this.scrollStyle.textContent='html.lenis,html.lenis body{height:auto}.lenis.lenis-smooth{scroll-behavior:auto!important}.lenis.lenis-stopped{overflow:hidden}.lenis.lenis-smooth [data-lenis-prevent]{overscroll-behavior:contain}';
        document.head.appendChild(this.scrollStyle);
        const drive=now=>{if(this.destroyed||!this.ownsEngine)return;this.scrollEngine.raf(now);this.scrollFrame=requestAnimationFrame(drive);};
        this.scrollFrame=requestAnimationFrame(drive);
      }
      this.scrollEngine?.on('scroll',this.onEngineScroll);
    }
    detachEngine() {
      this.scrollEngine?.off('scroll',this.onEngineScroll);
      if(this.ownsEngine){
        cancelAnimationFrame(this.scrollFrame);this.scrollEngine.destroy();this.scrollStyle?.remove();
        if(global.lenis===this.scrollEngine){if(this.previousEngine===undefined)delete global.lenis;else global.lenis=this.previousEngine;}
      }
      this.scrollEngine=null;this.ownsEngine=false;this.velocity=0;
    }
    refreshSections() {
      const y=global.scrollY||0;
      this.maxScroll=Math.max(0,document.documentElement.scrollHeight-global.innerHeight);
      const elements=[...document.querySelectorAll(this.options.sectionSelector||'[data-glow-weights]')];
      this.sections=elements.map((element,index)=>{
        const raw=(element.getAttribute('data-glow-weights')||'').split(/[ ,]+/).map(Number);
        const values=raw.length===2&&raw.every(Number.isFinite)?raw:PROFILES[Math.min(index,PROFILES.length-1)];
        const box=element.getBoundingClientRect();return {element,top:box.top+y,bottom:box.bottom+y,weights:values.map(v=>clip(v,0,2))};
      }).sort((a,b)=>a.top-b.top);
      this.activeAreas=[...document.querySelectorAll(this.options.activeSelector||'[data-glow-active]')].map(element=>{
        const box=element.getBoundingClientRect();return {top:box.top+y,bottom:box.bottom+y};
      });
      if(this.listenScroll)this.updateProfile(y);
    }
    profileAt(y) {
      if(this.sections.length<2)return this.normalizedProfile(this.maxScroll?y/this.maxScroll:0);
      let result=[...this.sections[0].weights];
      for(let i=1;i<this.sections.length;i++){
        const start=this.sections[i-1].top,end=i===this.sections.length-1?this.maxScroll:this.sections[i-1].bottom;
        if(y<start)break;
        const fraction=clip((y-start)/Math.max(1,end-start),0,1);
        result=this.sections[i-1].weights.map((value,j)=>mix(value,this.sections[i].weights[j],fraction));
        if(fraction<1)break;
      }
      return result;
    }
    normalizedProfile(progress) {
      const position=clip(progress,0,1)*(PROFILES.length-1),i=Math.min(PROFILES.length-2,Math.floor(position));
      return PROFILES[i].map((value,j)=>mix(value,PROFILES[i+1][j],position-i));
    }
    updateProfile(y) {
      this.targetProgress=this.maxScroll?clip(y/this.maxScroll,0,1):0;
      this.targetWeights=this.profileAt(y);
      const active=this.activeAreas.some(area=>y>=area.top&&y<area.bottom);
      this.setActive(active);
    }
    setActive(active) {
      const target=active?1:0;
      if(target===this.targetLens)return;
      this.targetLens=target;this.lensTween={start:this.lens,end:target,elapsed:0,duration:1.2};
      if(active)this.pulse=0;
    }
    tweenRate(value,duration,inOut) {
      if(!Number.isFinite(value))return;
      this.waveTween={start:this.waveRate,end:clip(value,0,20),elapsed:0,duration:Math.max(.001,duration),inOut};
      this.wake();
    }
    draw(force=false) {
      if(this.destroyed)return;
      const width=this.target.clientWidth,height=this.target.clientHeight;if(!width||!height)return;
      if(this.gl){
        const gl=this.gl,u=this.uniforms,ratio=Math.min(global.devicePixelRatio||1,this.pixelRatio);
        const w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));
        if(this.canvas.width!==w||this.canvas.height!==h){this.canvas.width=w;this.canvas.height=h;}
        gl.useProgram(this.program);gl.viewport(0,0,w,h);gl.uniform2f(u.size,w,h);
        for(const name of ['seed','phase','lens','pulse','softness','waveRate','intensity'])gl.uniform1f(u[name],this[name]);
        gl.uniform2f(u.weights,...this.weights);
        ['blue','cyan','green'].forEach((name,i)=>gl.uniform3fv(u[name],rgb(this.colors[i])));
        gl.uniform3fv(u.background,rgb(this.background));gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
      }else if(this.context){
        const now=performance.now();if(!force&&now-this.lastDraw<50)return;this.lastDraw=now;
        const factor=Math.min(1,160/Math.max(width,height));
        const w=Math.max(1,Math.round(width*factor)),h=Math.max(1,Math.round(height*factor));
        if(!this.image||this.image.width!==w||this.image.height!==h){this.canvas.width=w;this.canvas.height=h;this.image=this.context.createImageData(w,h);}
        softwareFrame(this.image,this);this.context.putImageData(this.image,0,0);
      }
    }
    running() {return !this.destroyed&&this.visible&&!document.hidden&&!this.paused&&this.motion!=='off'&&(this.motion==='on'||!this.media.matches);}
    wake() {
      if(!this.running()){cancelAnimationFrame(this.frame);this.frame=0;this.previousTime=0;return;}
      if(!this.frame)this.frame=requestAnimationFrame(this.tick);
    }
    tick(now) {
      this.frame=0;
      if(this.destroyed||!this.target.isConnected){this.destroy();return;}
      const dt=this.previousTime?clip((now-this.previousTime)/1000,0,.1):0;this.previousTime=now;
      let distance=0,velocity=this.velocity;
      if(this.scrollEngine)distance=velocity;
      else {distance=this.pendingDistance*(1-Math.exp(-dt*(10*Math.LN2/1.2)));this.pendingDistance-=distance;velocity=dt?distance/(dt*60):0;}
      this.phase+=(dt+distance*.0015)*this.speed;
      this.softness=.74+Math.min(Math.abs(velocity)*.05,.3);
      const settle=1-Math.exp(-dt*5);
      this.weights=this.weights.map((value,i)=>mix(value,this.targetWeights[i],settle));
      this.progress=mix(this.progress,this.targetProgress,settle);
      if(this.lensTween){const tween=this.lensTween;tween.elapsed+=dt;const f=clip(tween.elapsed/tween.duration,0,1);this.lens=mix(tween.start,tween.end,1-Math.pow(1-f,3));if(f===1)this.lensTween=null;}
      this.pulse=Math.min(1,this.pulse+dt*.65);
      if(this.waveTween){const tween=this.waveTween;tween.elapsed+=dt;const f=clip(tween.elapsed/tween.duration,0,1);const eased=tween.inOut?(f<.5?2*f*f:1-Math.pow(-2*f+2,2)/2):1-(1-f)*(1-f);this.waveRate=mix(tween.start,tween.end,eased);if(f===1)this.waveTween=null;}
      this.draw();this.wake();
    }
    setColors(value){this.colors=palette(value);this.draw(true);return this;}
    setProgress(value){
      if(!Number.isFinite(value))throw new TypeError('Progress must be a number.');
      const next=clip(value,0,1);this.pendingDistance+=Math.abs(next-this.targetProgress)*Math.max(this.maxScroll,global.innerHeight*8);
      this.targetProgress=next;this.targetWeights=this.normalizedProfile(next);this.setActive(next>.08&&next<.32);
      if(!this.running()){this.weights=[...this.targetWeights];this.lens=this.targetLens;this.progress=next;}
      this.draw(true);this.wake();return this;
    }
    pause(){this.paused=true;this.wake();return this;}
    resume(){this.paused=false;this.wake();return this;}
    setMotion(value){if(!['auto','on','off'].includes(value))throw new TypeError('Motion must be auto, on or off.');this.motion=value;this.configureScroll();this.draw(true);this.wake();return this;}
    releaseGL(){if(this.gl){if(this.buffer)this.gl.deleteBuffer(this.buffer);if(this.program)this.gl.deleteProgram(this.program);}}
    destroy(){
      if(this.destroyed)return;this.destroyed=true;cancelAnimationFrame(this.frame);this.frame=0;this.detachEngine();
      this.resizeObserver?.disconnect();this.contentObserver?.disconnect();this.intersectionObserver?.disconnect();
      document.removeEventListener('visibilitychange',this.onVisibility);this.media.removeEventListener('change',this.onMotion);
      global.removeEventListener('resize',this.onResize);global.removeEventListener('scroll',this.onNativeScroll);
      global.removeEventListener('bg-speed-shift',this.onSpeedShift);global.removeEventListener('bg-speed-reset',this.onSpeedReset);
      this.canvas.removeEventListener('webglcontextlost',this.onContextLost);this.releaseGL();this.canvas.remove();this.target.style.position=this.oldPosition;
    }
  }
  global.AltenarGlow=AltenarGlow;
})(window);
