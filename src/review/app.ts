// Figma-style review comments on the live page, stored in Supabase
// (schema and access rules: supabase/review-comments.sql).
// - C toggles comment mode: drag to mark an area or click a point, then write.
// - Pins sit on the commented block and follow it while the page moves.
// - Anyone with the link reads, comments and replies; signed-in admins resolve.
// The UI lives in a shadow root so the site's global styles and observers
// (mono type, corner smoothing) never touch it.
import {createClient, type RealtimeChannel} from '@supabase/supabase-js';
import css from './review.css?inline';

const SUPABASE_URL='https://xraxhrxqaoueebvhfvcb.supabase.co';
const SUPABASE_KEY='sb_publishable_8O71wnlUeqq8y6vG4dH-EA_jsOgQNo_'; // public key; access is limited by RLS
const NAME_KEY='altenar-review-name';
const PIN=32;

type Comment={
  id:string;page:string;parent_id:string|null;anchor:string|null;
  rx:number|null;ry:number|null;rw:number|null;rh:number|null;
  px:number;py:number;pw:number;ph:number;vw:number|null;
  author:string;body:string;resolved:boolean;resolved_at:string|null;created_at:string;
};
type Box={x:number;y:number;w:number;h:number};
type Draft={box:Box;anchor:string|null;rel:Box|null};

const sb=createClient(SUPABASE_URL,SUPABASE_KEY);

function pageKey(){
  const base=import.meta.env.BASE_URL||'/';
  let path=location.pathname.startsWith(base)?'/'+location.pathname.slice(base.length):location.pathname;
  path=path.replace(/index\.html$/,'');
  return path.endsWith('/')?path:path+'/';
}

// ---------- helpers ----------
const h=<K extends keyof HTMLElementTagNameMap>(tag:K,cls?:string,text?:string)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;};
const storage={get:(k:string)=>{try{return localStorage.getItem(k)}catch{return null}},set:(k:string,v:string)=>{try{localStorage.setItem(k,v)}catch{/* ignore */}}};
const rtf=new Intl.RelativeTimeFormat('en',{numeric:'auto'});
function ago(iso:string){
  const s=(Date.parse(iso)-Date.now())/1000,a=Math.abs(s);
  if(a<45)return 'just now';
  if(a<3600)return rtf.format(Math.round(s/60),'minute');
  if(a<86400)return rtf.format(Math.round(s/3600),'hour');
  if(a<2592000)return rtf.format(Math.round(s/86400),'day');
  return new Date(iso).toLocaleDateString('en',{day:'numeric',month:'short'});
}
const initials=(name:string)=>name.trim().split(/\s+/).slice(0,2).map(p=>p[0]?.toUpperCase()??'').join('')||'?';
const hue=(name:string)=>[...name].reduce((a,c)=>(a*31+c.charCodeAt(0))%360,7);
function avatar(name:string,size='md'){const el=h('span',`avatar avatar--${size}`,initials(name));el.style.setProperty('--hue',String(hue(name)));return el;}
const editable=(el:Element|null)=>!!el&&(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||(el as HTMLElement).isContentEditable);

// CSS path from body to the element: ids stop the walk, data-name keeps it readable.
function cssPath(el:Element):string|null{
  const parts:string[]=[];
  for(let node:Element|null=el;node&&node!==document.body&&node!==document.documentElement;node=node.parentElement){
    if(node.id&&/^[A-Za-z][\w-]*$/.test(node.id)){parts.unshift(`#${node.id}`);break;}
    const tag=node.tagName.toLowerCase(),parent:Element|null=node.parentElement;
    let part=tag;const name=node.getAttribute('data-name');
    if(name&&!/["\\\n]/.test(name))part+=`[data-name="${name}"]`;
    if(parent){const same=[...parent.children].filter(c=>c.tagName===node!.tagName);if(same.length>1)part+=`:nth-of-type(${same.indexOf(node)+1})`;}
    parts.unshift(part);
  }
  return parts.length?(parts[0].startsWith('#')?'':'body>')+parts.join('>'):null;
}

export function startReview(){
  if(document.getElementById('altenar-review'))return;
  const page=pageKey();
  const host=document.createElement('div');host.id='altenar-review';
  const root=host.attachShadow({mode:'open'});
  const style=document.createElement('style');style.textContent=css;root.append(style);
  document.documentElement.append(host);

  // ---------- state ----------
  let comments:Comment[]=[];let mode=false,panelOpen=false,tab:'open'|'resolved'='open';
  let admin=false,email:string|null=null;let openId:string|null=null,hoverId:string|null=null;
  let draft:Draft|null=null;let drag:{x:number;y:number}|null=null;let signingIn=false;
  const anchors=new Map<string,Element|null>();

  // ---------- layout ----------
  const overlay=h('div','overlay');const outline=h('div','outline');const pins=h('div','pins');
  const card=h('div','card');const preview=h('div','card card--preview');
  const toolbar=h('div','toolbar');const panel=h('aside','panel');const toast=h('div','toast');
  root.append(overlay,outline,pins,preview,card,toolbar,panel,toast);

  const roots=()=>comments.filter(c=>!c.parent_id);
  const visibleRoots=()=>roots().filter(c=>!c.resolved);
  const replies=(id:string)=>comments.filter(c=>c.parent_id===id);
  const number=(c:Comment)=>roots().indexOf(c)+1;
  function flash(text:string){toast.textContent=text;toast.classList.add('is-on');clearTimeout((toast as any)._t);(toast as any)._t=setTimeout(()=>toast.classList.remove('is-on'),2600);}

  function anchorOf(c:Comment){
    if(!c.anchor)return null;let el=anchors.get(c.id);
    if(el===undefined||(el&&!el.isConnected)){try{el=document.querySelector(c.anchor);}catch{el=null;}anchors.set(c.id,el);}
    return el;
  }
  function areaOf(c:Comment):Box{
    const el=anchorOf(c);
    if(el&&c.rx!==null){const r=el.getBoundingClientRect();if(r.width||r.height)return {x:r.left+c.rx*r.width,y:r.top+(c.ry??0)*r.height,w:(c.rw??0)*r.width,h:(c.rh??0)*r.height};}
    return {x:c.px-scrollX,y:c.py-scrollY,w:c.pw,h:c.ph};
  }
  // The pin's tail points at the bottom-right corner of the area (or the clicked point).
  const tip=(b:Box)=>({x:b.x+b.w,y:b.y+b.h});

  // ---------- toolbar ----------
  const toolBtn=h('button','tool');toolBtn.type='button';toolBtn.title='Comment (C)';toolBtn.innerHTML='<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 20V8a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v5a4 4 0 0 1-4 4H8l-4 3Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
  const listBtn=h('button','tool tool--count');listBtn.type='button';listBtn.title='All comments';
  // The toolbar island hides behind the left edge with only its grip showing.
  // Hover slides it out; 3 s after the pointer leaves it tucks away again,
  // unless comment work is in progress (mode, list, open thread or draft).
  // The grip also hides it on demand; it stays tucked until the next hover or C.
  const grip=h('button','toolbar__grip');grip.type='button';grip.title='Hide';
  grip.innerHTML='<span class="grip__bars"></span><svg class="grip__chevron" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m14 6-6 6 6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  toolbar.append(toolBtn,listBtn,grip);
  toolBtn.addEventListener('click',()=>setMode(!mode));
  listBtn.addEventListener('click',()=>{panelOpen=!panelOpen;renderPanel();sync();});
  const HIDE_AFTER=3000;let hovered=false,hideTimer=0,tucked=false,leftSinceTuck=false;
  const busy=()=>mode||panelOpen||!!openId||!!draft;
  function reveal(){clearTimeout(hideTimer);hideTimer=0;if(!tucked)toolbar.classList.add('is-out');grip.title='Hide';}
  function tuck(){clearTimeout(hideTimer);hideTimer=0;tucked=true;leftSinceTuck=!hovered;toolbar.classList.remove('is-out');grip.title='Show';(root.activeElement as HTMLElement|null)?.blur();}
  grip.addEventListener('click',e=>{e.stopPropagation();if(toolbar.classList.contains('is-out'))tuck();else{tucked=false;reveal();}});
  function scheduleHide(){
    clearTimeout(hideTimer);
    hideTimer=window.setTimeout(()=>{hideTimer=0;if(!hovered&&!busy()&&!toolbar.contains(root.activeElement))toolbar.classList.remove('is-out');},HIDE_AFTER);
  }
  // A tucked island stays away (even mid-work) until the pointer leaves and hovers it again.
  toolbar.addEventListener('pointerenter',()=>{hovered=true;if(tucked&&leftSinceTuck)tucked=false;if(!tucked)reveal();});
  toolbar.addEventListener('pointerleave',()=>{hovered=false;if(tucked){leftSinceTuck=true;return;}if(!busy())scheduleHide();});
  toolbar.addEventListener('focusin',reveal);
  toolbar.addEventListener('focusout',()=>{if(!hovered&&!busy())scheduleHide();});
  let wasBusy=false;
  function renderToolbar(){
    toolBtn.classList.toggle('is-active',mode);
    listBtn.textContent=String(visibleRoots().length);listBtn.classList.toggle('is-active',panelOpen);
    const now=busy();
    if(now)reveal();else if(wasBusy&&!hovered)scheduleHide();
    wasBusy=now;
  }

  function setMode(on:boolean){
    mode=on;if(on){tucked=false;reveal();}if(!on){draft=null;drag=null;if(card.dataset.kind==='draft')closeCard();}
    overlay.classList.toggle('is-on',on);host.classList.toggle('is-mode',on);sync();
  }

  // ---------- drawing ----------
  overlay.addEventListener('pointerdown',e=>{
    if(e.button!==0)return;e.preventDefault();
    if(card.dataset.kind==='draft'){closeCard();return;}
    closeCard();drag={x:e.clientX,y:e.clientY};try{overlay.setPointerCapture(e.pointerId);}catch{/* synthetic pointer */}
    showOutline({x:e.clientX,y:e.clientY,w:0,h:0});
  });
  overlay.addEventListener('pointermove',e=>{
    if(!drag)return;
    showOutline({x:Math.min(drag.x,e.clientX),y:Math.min(drag.y,e.clientY),w:Math.abs(e.clientX-drag.x),h:Math.abs(e.clientY-drag.y)});
  });
  overlay.addEventListener('pointerup',e=>{
    if(!drag)return;
    let box={x:Math.min(drag.x,e.clientX),y:Math.min(drag.y,e.clientY),w:Math.abs(e.clientX-drag.x),h:Math.abs(e.clientY-drag.y)};
    drag=null;if(box.w<6&&box.h<6)box={x:e.clientX,y:e.clientY,w:0,h:0};
    startDraft(box);
  });
  function showOutline(b:Box|null,point=false){
    outline.classList.toggle('is-on',!!b);if(!b)return;
    outline.classList.toggle('is-point',point||(!b.w&&!b.h));
    Object.assign(outline.style,{left:`${b.x}px`,top:`${b.y}px`,width:`${b.w}px`,height:`${b.h}px`});
  }
  function startDraft(box:Box){
    // Anchor = smallest element that holds the whole area, so the pin follows layout changes.
    host.style.display='none';
    let el=document.elementFromPoint(box.x+box.w/2,box.y+box.h/2);
    host.style.display='';
    while(el&&el!==document.body){const r=el.getBoundingClientRect();if(r.width>0&&r.left<=box.x+1&&r.top<=box.y+1&&r.right>=box.x+box.w-1&&r.bottom>=box.y+box.h-1)break;el=el.parentElement;}
    const anchor=el&&el!==document.body?cssPath(el):null;let rel:Box|null=null;
    if(anchor&&el){const r=el.getBoundingClientRect();rel={x:(box.x-r.left)/r.width,y:(box.y-r.top)/(r.height||1),w:box.w/r.width,h:box.h/(r.height||1)};}
    draft={box:{x:box.x+scrollX,y:box.y+scrollY,w:box.w,h:box.h},anchor,rel};
    if(anchor&&el)anchors.set('draft',el);
    renderDraftCard();sync();
  }
  function draftArea():Box|null{
    if(!draft)return null;const el=anchors.get('draft');
    if(el&&el.isConnected&&draft.rel){const r=el.getBoundingClientRect();return {x:r.left+draft.rel.x*r.width,y:r.top+draft.rel.y*r.height,w:draft.rel.w*r.width,h:draft.rel.h*r.height};}
    return {x:draft.box.x-scrollX,y:draft.box.y-scrollY,w:draft.box.w,h:draft.box.h};
  }

  // ---------- cards ----------
  function closeCard(){card.className='card';card.replaceChildren();delete card.dataset.kind;delete card.dataset.id;openId=null;draft=null;sync();}

  function composer(placeholder:string,onSend:(text:string,name:string)=>Promise<boolean>){
    const form=h('form','composer');const needName=!storage.get(NAME_KEY);
    const name=h('input','field field--name');name.placeholder='Your name';name.maxLength=60;name.autocomplete='name';
    const text=h('textarea','field field--text');text.placeholder=placeholder;text.rows=1;text.maxLength=4000;
    const send=h('button','send');send.type='submit';send.title='Send';send.disabled=true;
    send.innerHTML='<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 19V5m0 0-6 6m6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    const ready=()=>{send.disabled=!text.value.trim()||(needName&&!name.value.trim());};
    const grow=()=>{text.style.height='auto';text.style.height=`${Math.min(text.scrollHeight,200)}px`;};
    text.addEventListener('input',()=>{ready();grow();});name.addEventListener('input',ready);
    text.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();form.requestSubmit();}});
    form.addEventListener('submit',async e=>{
      e.preventDefault();if(send.disabled)return;
      const who=(needName?name.value.trim():storage.get(NAME_KEY))||'';
      if(needName)storage.set(NAME_KEY,who);
      send.disabled=true;form.classList.add('is-busy');
      const ok=await onSend(text.value.trim(),who);
      form.classList.remove('is-busy');if(ok){text.value='';grow();}ready();
    });
    if(needName)form.append(name);
    const row=h('div','composer__row');row.append(text,send);form.append(row);
    queueMicrotask(()=>(needName?name:text).focus());
    return form;
  }

  function renderDraftCard(){
    card.className='card card--draft is-on';card.dataset.kind='draft';card.replaceChildren();
    card.append(composer('Add a comment',async(body,author)=>{
      if(!draft)return false;
      const row={page,parent_id:null,anchor:draft.anchor,rx:draft.rel?.x??null,ry:draft.rel?.y??null,rw:draft.rel?.w??null,rh:draft.rel?.h??null,
        px:draft.box.x,py:draft.box.y,pw:draft.box.w,ph:draft.box.h,vw:innerWidth,author,body};
      const {data,error}=await sb.from('review_comments').insert(row).select().single();
      if(error){flash(`Couldn't save: ${error.message}`);return false;}
      upsert(data as Comment);anchors.set((data as Comment).id,anchors.get('draft')??null);
      draft=null;openThread((data as Comment).id);return true;
    }));
  }

  function message(c:Comment){
    const item=h('div','msg');const head=h('div','msg__head');
    head.append(avatar(c.author,'sm'),h('span','msg__author',c.author),h('span','msg__time',ago(c.created_at)));
    item.append(head,h('p','msg__body',c.body));return item;
  }

  function fillThread(list:HTMLElement,c:Comment){list.replaceChildren(...[c,...replies(c.id)].map(message));}

  function openThread(id:string){
    const c=comments.find(x=>x.id===id);if(!c){closeCard();return;}
    openId=id;card.className='card card--thread is-on';card.dataset.kind='thread';card.dataset.id=id;card.replaceChildren();
    const head=h('div','card__head');head.append(h('span','card__title',`Comment #${number(c)}`));
    const actions=h('div','card__actions');
    if(admin){
      const resolve=h('button','icon-btn');resolve.type='button';resolve.title=c.resolved?'Reopen':'Resolve';
      resolve.innerHTML=c.resolved?'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M4 12a8 8 0 1 0 2.3-5.6M4 4v4h4" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>':'<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="m8 12.5 2.7 2.7L16 9.8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      resolve.addEventListener('click',()=>setResolved(c,!c.resolved));actions.append(resolve);
      const del=h('button','icon-btn');del.type='button';del.title='Delete';
      del.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2m-7 0 1 12h8l1-12" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      del.addEventListener('click',()=>remove(c));actions.append(del);
    }
    const close=h('button','icon-btn');close.type='button';close.title='Close';
    close.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    close.addEventListener('click',closeCard);actions.append(close);head.append(actions);
    const list=h('div','thread');fillThread(list,c);
    card.append(head,list);
    if(c.resolved)card.append(h('p','card__note','Resolved'));
    else card.append(composer('Reply',async(body,author)=>{
      const {data,error}=await sb.from('review_comments').insert({page,parent_id:c.id,px:c.px,py:c.py,pw:0,ph:0,author,body}).select().single();
      if(error){flash(`Couldn't send: ${error.message}`);return false;}
      upsert(data as Comment);return true;
    }));
    queueMicrotask(()=>{list.scrollTop=list.scrollHeight;});
    sync();
  }

  async function setResolved(c:Comment,resolved:boolean){
    const {data,error}=await sb.from('review_comments').update({resolved,resolved_at:resolved?new Date().toISOString():null}).eq('id',c.id).select().single();
    if(error||!data){flash(error?`Couldn't update: ${error.message}`:'Only admins can resolve');return;}
    upsert(data as Comment);if(resolved){closeCard();flash(`Comment #${number(c)} resolved`);}else openThread(c.id);
  }
  async function remove(c:Comment){
    if(!confirm('Delete this comment and its replies? This cannot be undone.'))return;
    const {error}=await sb.from('review_comments').delete().eq('id',c.id);
    if(error){flash(`Couldn't delete: ${error.message}`);return;}
    comments=comments.filter(x=>x.id!==c.id&&x.parent_id!==c.id);closeCard();render();
  }

  // ---------- pins ----------
  function renderPins(){
    const list=mode||panelOpen||openId?visibleRoots():[];
    const keep=new Set(list.map(c=>c.id));
    [...pins.children].forEach(p=>{if(!keep.has((p as HTMLElement).dataset.id!))p.remove();});
    list.forEach(c=>{
      let pin=pins.querySelector<HTMLElement>(`[data-id="${c.id}"]`);
      if(!pin){
        pin=Object.assign(h('button','pin'),{type:'button' as const});pin.dataset.id=c.id;
        pin.addEventListener('click',e=>{e.stopPropagation();if(openId===c.id)closeCard();else openThread(c.id);});
        pin.addEventListener('pointerenter',()=>{hoverId=c.id;renderPreview();});
        pin.addEventListener('pointerleave',()=>{if(hoverId===c.id){hoverId=null;renderPreview();}});
        pins.append(pin);
      }
      pin.replaceChildren(avatar(c.author,'pin'));
      const count=replies(c.id).length;if(count)pin.append(h('span','pin__count',String(count+1)));
      pin.title=`#${number(c)} · ${c.author}`;
    });
  }
  function renderPreview(){
    const c=hoverId&&hoverId!==openId?comments.find(x=>x.id===hoverId):null;
    preview.classList.toggle('is-on',!!c);preview.replaceChildren();if(!c)return;
    preview.append(message(c));const n=replies(c.id).length;if(n)preview.append(h('p','card__note',`${n} ${n===1?'reply':'replies'}`));
    sync();
  }

  // ---------- panel ----------
  function renderPanel(){
    panel.classList.toggle('is-on',panelOpen);if(!panelOpen){panel.replaceChildren();return;}
    panel.replaceChildren();
    const head=h('div','panel__head');head.append(h('span','panel__title','Comments'));
    const close=h('button','icon-btn');close.type='button';close.title='Close';
    close.innerHTML='<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>';
    close.addEventListener('click',()=>{panelOpen=false;renderPanel();sync();});head.append(close);panel.append(head);
    const open=visibleRoots(),done=roots().filter(c=>c.resolved);
    if(admin){
      const tabs=h('div','tabs');
      ([['open',`Open ${open.length}`],['resolved',`Resolved ${done.length}`]] as const).forEach(([key,label])=>{
        const b=h('button','tab',label);b.type='button';b.classList.toggle('is-active',tab===key);
        b.addEventListener('click',()=>{tab=key;renderPanel();});tabs.append(b);
      });panel.append(tabs);
    }else tab='open';
    const items=(tab==='open'?open:done).slice().reverse();
    const list=h('div','panel__list');
    if(!items.length)list.append(h('p','panel__empty',tab==='open'?'No open comments on this page. Press C to add one.':'Nothing resolved yet.'));
    items.forEach(c=>{
      const item=h('button','item');item.type='button';item.classList.toggle('is-active',openId===c.id);
      const top=h('div','item__top');top.append(avatar(c.author,'sm'),h('span','item__meta',`#${number(c)} · ${c.author} · ${ago(c.created_at)}`));
      item.append(top,h('p','item__body',c.body));
      const n=replies(c.id).length;if(n)item.append(h('span','item__replies',`${n} ${n===1?'reply':'replies'}`));
      item.addEventListener('click',()=>focusComment(c));list.append(item);
    });
    panel.append(list,renderAccount());
  }
  function focusComment(c:Comment){
    const b=areaOf(c);const top=b.y+scrollY-innerHeight/2+b.h/2;
    window.scrollTo({top:Math.max(0,top),behavior:'smooth'});
    if(c.resolved){openThread(c.id);return;}
    openThread(c.id);
  }
  function renderAccount(){
    const foot=h('div','account');
    if(admin){
      foot.append(h('span','account__who',`Signed in as admin${email?` · ${email}`:''}`));
      const out=h('button','link','Sign out');out.type='button';out.addEventListener('click',async()=>{await sb.auth.signOut();});foot.append(out);
      return foot;
    }
    if(!signingIn){
      const b=h('button','link','Sign in to resolve');b.type='button';b.addEventListener('click',()=>{signingIn=true;renderPanel();});foot.append(b);return foot;
    }
    const form=h('form','signin');
    const mail=h('input','field');mail.type='email';mail.placeholder='Email';mail.autocomplete='username';mail.required=true;
    const pass=h('input','field');pass.type='password';pass.placeholder='Password';pass.autocomplete='current-password';pass.required=true;
    const go=h('button','button','Sign in');go.type='submit';
    const cancel=h('button','link','Cancel');cancel.type='button';cancel.addEventListener('click',()=>{signingIn=false;renderPanel();});
    form.addEventListener('submit',async e=>{
      e.preventDefault();go.disabled=true;
      const {error}=await sb.auth.signInWithPassword({email:mail.value.trim(),password:pass.value});
      go.disabled=false;if(error){flash(error.message);return;}
      signingIn=false;
    });
    const row=h('div','signin__row');row.append(go,cancel);form.append(mail,pass,row);foot.append(form);
    queueMicrotask(()=>mail.focus());return foot;
  }

  // ---------- frame sync: pins, outline and cards follow the page ----------
  let frame=0;
  function sync(){if(!frame)frame=requestAnimationFrame(place);}
  function place(){
    frame=0;renderToolbar();
    const show=mode||panelOpen||!!openId;
    pins.classList.toggle('is-on',show);
    pins.querySelectorAll<HTMLElement>('.pin').forEach(pin=>{
      const c=comments.find(x=>x.id===pin.dataset.id);if(!c)return;const t=tip(areaOf(c));
      pin.style.transform=`translate(${Math.round(t.x)}px,${Math.round(t.y-PIN)}px)`;
      pin.classList.toggle('is-active',openId===c.id||hoverId===c.id);
    });
    const focus=draft?draftArea():(openId||hoverId)?(()=>{const c=comments.find(x=>x.id===(openId??hoverId));return c?areaOf(c):null;})():null;
    if(!drag)showOutline(focus);
    const anchorBox=focus;
    [[card,openId||draft?anchorBox:null],[preview,hoverId&&hoverId!==openId?anchorBox:null]].forEach(([el,b])=>{
      const node=el as HTMLElement,box=b as Box|null;if(!box||!node.classList.contains('is-on'))return;
      const t=tip(box);const w=node.offsetWidth,hh=node.offsetHeight;
      let x=t.x+PIN+12,y=t.y-PIN;
      const right=innerWidth-(panelOpen?panel.offsetWidth:0)-16; // keep cards clear of the side panel
      if(x+w>right)x=Math.max(16,Math.min(t.x-w-16,right-w));
      y=Math.min(Math.max(16,y),innerHeight-hh-16);
      node.style.transform=`translate(${Math.round(x)}px,${Math.round(y)}px)`;
    });
    if(show||draft)frame=requestAnimationFrame(place);
  }

  // ---------- data ----------
  function upsert(c:Comment){const i=comments.findIndex(x=>x.id===c.id);if(i<0)comments.push(c);else comments[i]=c;comments.sort((a,b)=>a.created_at.localeCompare(b.created_at));render();}
  function render(){
    renderPins();renderPanel();renderPreview();
    if(card.dataset.kind==='thread'&&openId){
      const c=comments.find(x=>x.id===openId);
      if(!c||(c.resolved&&!admin))closeCard();
      // While someone types a reply only the message list refreshes, so the draft and focus stay.
      else if(card.contains(root.activeElement)){const list=card.querySelector<HTMLElement>('.thread');if(list){fillThread(list,c);list.scrollTop=list.scrollHeight;}}
      else openThread(openId);
    }
    sync();
  }
  async function load(){
    const {data,error}=await sb.from('review_comments').select('*').eq('page',page).order('created_at');
    if(error){flash(`Comments unavailable: ${error.message}`);return;}
    comments=(data??[]) as Comment[];anchors.clear();render();
  }
  async function refreshAdmin(){
    const {data:{session}}=await sb.auth.getSession();email=session?.user.email??null;
    if(!session){admin=false;render();return;}
    const {data}=await sb.from('review_admins').select('user_id').eq('user_id',session.user.id).maybeSingle();
    admin=!!data;if(!admin)flash('Signed in, but this account is not an admin');render();
  }
  sb.auth.onAuthStateChange(()=>{setTimeout(refreshAdmin,0);});
  const channel:RealtimeChannel=sb.channel(`review:${page}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'review_comments',filter:`page=eq.${page}`},payload=>{
      if(payload.eventType==='DELETE'){const id=(payload.old as {id:string}).id;comments=comments.filter(x=>x.id!==id&&x.parent_id!==id);render();return;}
      upsert(payload.new as Comment);
    }).subscribe();
  window.addEventListener('pagehide',()=>{sb.removeChannel(channel);});

  // ---------- keys ----------
  document.addEventListener('keydown',e=>{
    const active=root.activeElement??document.activeElement;
    if(e.key==='Escape'){
      if(card.classList.contains('is-on')){closeCard();e.preventDefault();return;}
      if(panelOpen&&!mode){panelOpen=false;renderPanel();sync();return;}
      if(mode){setMode(false);e.preventDefault();}
      return;
    }
    if((e.key==='c'||e.key==='C'||e.code==='KeyC')&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!editable(active)&&!editable(document.activeElement)){
      e.preventDefault();setMode(!mode);
    }
  },true);
  window.addEventListener('resize',()=>{anchors.clear();sync();},{passive:true});
  window.addEventListener('scroll',sync,{passive:true});

  renderToolbar();load();refreshAdmin();
}
