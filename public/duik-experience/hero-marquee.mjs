import {panels} from './tool-catalog.mjs';

export const heroMarqueeItems=Object.freeze(panels.map(panel=>Object.freeze({
  id:panel.id,title:panel.title,href:panel.href,src:'/duik-experience/icons/'+panel.icon+'.svg',alt:'',
})));
export const heroMarqueeProps=Object.freeze({paddingClass:'py-0',gapClass:'md:gap-[2rem] md:pr-[2rem] gap-[1.25rem] pr-[1.25rem]',iconHeightClass:'md:h-[1.75rem] h-[1.5rem]'});
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const scope=' data-v-76c20ef4';

/** Match the original Vue marquee's first render: three copies, 30 seconds.
 * Its mounted measurement still owns the eventual count and 40 px/s speed.
 */
export function renderHeroMarqueeSSR(){
  const items=copy=>heroMarqueeItems.map(item=>'<a href="'+escape(item.href)+'" tabindex="'+(copy===1?'0':'-1')+'" class="duik-hero-marquee-item flex items-center '+heroMarqueeProps.iconHeightClass+'"'+scope+'><img src="'+escape(item.src)+'" alt="" width="32" height="32" draggable="false" class="duik-hero-marquee-icon object-contain h-full w-auto"'+scope+'><span class="duik-hero-marquee-title"'+scope+'>'+escape(item.title)+'</span></a>').join('');
  const copies=Array.from({length:3},(_,index)=>{const copy=index+1;return '<div class="anim-marquee flex items-center '+heroMarqueeProps.gapClass+'" style="animation-duration:30s;animation-direction:normal;" data-duik-marquee-copy="'+copy+'"'+(copy===1?'':' aria-hidden="true"')+scope+'><!--[-->'+items(copy)+'<!--]--></div>';}).join('');
  return '<div class="marquee-container contain-paint h-full duik-hero-marquee '+heroMarqueeProps.paddingClass+'" role="navigation" aria-label="Duik 八个功能面板" tabindex="-1" data-v-727aab41'+scope+'><div class="marquee-content h-full"'+scope+'><!--[-->'+copies+'<!--]--></div></div>';
}

const mounted=new WeakMap();

/** Pause the retained CSS loop without owning its measurement or animation.
 * Parent style notifications are coalesced to <= 12.5 Hz. They inspect only
 * inline opacity/pointer-events, never computed style or layout on each frame.
 */
export function mountHeroMarquee(root){
  if(!root)return ()=>{};
  if(mounted.has(root))return mounted.get(root);
  const doc=root.ownerDocument,win=doc.defaultView;
  const ribbon=root.closest('.duik-hero-ribbon')||root;
  const originallyInert=ribbon.inert;
  const main=root.closest('.kp-home-hero-main');
  const preference=win.matchMedia('(prefers-reduced-motion: reduce)');
  const lifetime=new win.AbortController(),options={signal:lifetime.signal};
  let disposed=false,parentTimer=null,hovered=false,focused=false;
  let visible=!win.IntersectionObserver,parentHidden=false,keyboard=false,pointerDown=false;

  function sync(){
    if(disposed)return;
    const reduced=preference.matches;
    const running=!reduced&&!hovered&&!focused&&!doc.hidden&&visible&&!parentHidden;
    // The original Hero exits with opacity/pointer-events, which do not remove
    // keyboard stops. Cover both side controls as well as the moving links.
    ribbon.inert=originallyInert||parentHidden;
    root.dataset.marqueeState=reduced?'reduced':running?'playing':'paused';
    root.dataset.marqueeKeyboard=String(keyboard);
    root.tabIndex=reduced?0:-1;
  }
  function readParent(){
    parentTimer=null;
    const opacity=main?.style.opacity;
    parentHidden=!!main&&(main.hidden||main.style.pointerEvents==='none'||opacity!==''&&opacity!==undefined&&Number(opacity)<=.03);
    sync();
  }
  function queueParent(){if(parentTimer===null&&!disposed)parentTimer=win.setTimeout(readParent,80);}
  function setHover(event){if(event.pointerType!=='touch'){hovered=event.type==='pointerenter';sync();}}
  function focusIn(event){
    focused=true;
    // Only keyboard entry unfolds a static single copy. Pointer focus must not
    // hide a duplicate between pointerdown and click and cancel its navigation.
    if(!pointerDown&&event.target.matches?.(':focus-visible'))keyboard=true;
    sync();
  }
  function focusOut(event){if(!root.contains(event.relatedTarget)){focused=false;keyboard=false;sync();}}
  root.addEventListener('pointerenter',setHover,options);
  root.addEventListener('pointerleave',setHover,options);
  ribbon.addEventListener('pointerdown',()=>{pointerDown=true;},options);
  win.addEventListener('pointerup',()=>{pointerDown=false;},options);
  win.addEventListener('pointercancel',()=>{pointerDown=false;},options);
  root.addEventListener('focusin',focusIn,options);
  root.addEventListener('focusout',focusOut,options);
  root.addEventListener('keydown',event=>{if(event.key==='Tab'){keyboard=true;sync();}},options);
  doc.addEventListener('visibilitychange',sync,options);
  preference.addEventListener('change',sync,options);

  const visibility=win.IntersectionObserver?new win.IntersectionObserver(entries=>{
    for(const entry of entries)if(entry.target===root)visible=entry.isIntersecting;
    sync();
  },{threshold:.01}):null;
  visibility?.observe(root);
  const parentObserver=main&&win.MutationObserver?new win.MutationObserver(queueParent):null;
  parentObserver?.observe(main,{attributes:true,attributeFilter:['style','hidden']});
  function dispose(){
    if(disposed)return;
    disposed=true;lifetime.abort();visibility?.disconnect();parentObserver?.disconnect();
    if(parentTimer!==null)win.clearTimeout(parentTimer);
    root.dataset.marqueeState='paused';delete root.dataset.marqueeKeyboard;
    ribbon.inert=originallyInert;
    mounted.delete(root);
  }
  win.addEventListener('pagehide',event=>{if(!event.persisted)dispose();},options);
  win.addEventListener('pageshow',()=>{readParent();},options);
  mounted.set(root,dispose);readParent();
  return dispose;
}
