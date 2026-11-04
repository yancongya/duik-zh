// The two fixed paths are from the locally retained Linearity HomeDifferenceKP.
// This module owns only the surrounding drawing, never the tool demonstration.
const curves=Object.freeze([
  {side:'left',height:780,path:'M832.004 45.0059C794.251 302.86 583.997 800.189 45.0039 726.672',start:'top+=3% top',end:'bottom+=40% bottom'},
  {side:'right',height:779,path:'M832.012 732.188C635.636 750.492 203.309 638.682 45.0117 45.0111',start:'top-=60% top',end:'bottom bottom'},
]);

// SSR/no-JS/reduced-motion all have complete, visible paths. The host stylesheet
// supplies positioning and color; nothing here hides content while JS loads.
export function comparisonCurvesMarkup(){
  return '<div class="duik-tools-comparison-curves" aria-hidden="true">'+curves.map(curve=>
    '<svg class="duik-tools-comparison-curve duik-tools-comparison-curve-'+curve.side+'" viewBox="0 0 878 '+curve.height+'" width="878" height="'+curve.height+'" fill="none" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg"><path data-tools-comparison-curve="'+curve.side+'" d="'+curve.path+'" stroke="currentColor" stroke-width="79.02" stroke-linecap="round"/></svg>'
  ).join('')+'</div>';
}

const mounted=new WeakMap();
const ownedStyles=['stroke-dasharray','stroke-dashoffset','opacity'];

export function mountToolsComparisonMotion(host){
  if(!host?.ownerDocument)throw new TypeError('Comparison motion requires a host element');
  if(mounted.has(host))return mounted.get(host);
  const doc=host.ownerDocument,win=doc.defaultView;
  const paths=[...host.querySelectorAll('[data-tools-comparison-curve]')];
  if(paths.length!==2||curves.some(curve=>paths.filter(path=>path.getAttribute('data-tools-comparison-curve')===curve.side).length!==1)){
    throw new Error('Comparison motion requires the two original curve paths');
  }
  const records=curves.map(curve=>({
    ...curve,path:paths.find(path=>path.getAttribute('data-tools-comparison-curve')===curve.side),length:0,
  }));
  const prior=paths.map(path=>ownedStyles.map(name=>({name,value:path.style.getPropertyValue(name),priority:path.style.getPropertyPriority(name)})));
  const preference=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let reduced=Boolean(preference?.matches),visible=!win.IntersectionObserver,disposed=false,failed=false;
  let runtime=null,pending=null,generation=0,triggers=[];
  const allowed=()=>!disposed&&!failed&&!reduced&&visible&&!doc.hidden&&host.isConnected!==false;
  const staticPaths=()=>{for(const path of paths){path.style.setProperty('stroke-dasharray','none');path.style.setProperty('stroke-dashoffset','0');path.style.setProperty('opacity','1');}};
  function stop(){generation++;for(const trigger of triggers)trigger.kill();triggers=[];}
  function fallback(error){
    if(disposed)return;failed=true;stop();staticPaths();
    win.console?.warn('Duik comparison motion unavailable; retaining complete static paths.',error);
  }
  function activate(){
    if(!allowed()||!runtime||triggers.length)return;
    const current=++generation;
    try{
      for(const record of records){
        const paint=progress=>{
          if(!allowed()||current!==generation)return;
          const value=Math.max(0,Math.min(1,Number(progress)||0));
          runtime.gsap.set(record.path,{strokeDasharray:record.length,strokeDashoffset:record.length*(1-value),opacity:Math.min(1,value/.05)});
        };
        const measure=()=>{
          record.length=record.path.getTotalLength();
          if(!Number.isFinite(record.length)||record.length<=0)throw new Error('Comparison path length is invalid');
        };
        measure();
        const trigger=runtime.ScrollTrigger.create({
          trigger:host,start:record.start,end:record.end,scrub:true,invalidateOnRefresh:true,
          onUpdate:self=>paint(self.progress),
          onRefresh:self=>{if(!allowed()||current!==generation)return;try{measure();paint(self.progress);}catch(error){fallback(error);}},
        });
        // ScrollTrigger may synchronously call onRefresh during creation.
        if(!allowed()||current!==generation){trigger.kill();return;}
        triggers.push(trigger);paint(trigger.progress);
      }
    }catch(error){fallback(error);}
  }
  function load(){
    if(pending||runtime||!allowed())return;
    pending=Promise.all([
      import('/_nuxt/index4.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js'),
      import('/_nuxt/ScrollTrigger.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js'),
    ]).then(([engine,plugin])=>{
      if(disposed||mounted.get(host)!==dispose)return;
      runtime={gsap:engine.gsap||engine.default||engine,ScrollTrigger:plugin.ScrollTrigger};
      runtime.gsap.registerPlugin(runtime.ScrollTrigger);activate();
    }).catch(fallback).finally(()=>{pending=null;});
  }
  function sync(){
    if(disposed)return;
    if(!allowed()){stop();if(reduced||failed)staticPaths();return;}
    if(runtime)activate();else load();
  }
  const onPreference=event=>{reduced=event.matches;sync();};
  const observer=win.IntersectionObserver?new win.IntersectionObserver(entries=>{
    if(disposed)return;
    for(const entry of entries)if(entry.target===host)visible=entry.isIntersecting;
    sync();
  },{threshold:0}):null;
  function dispose(){
    if(disposed)return;disposed=true;stop();observer?.disconnect();
    doc.removeEventListener('visibilitychange',sync);
    preference?.removeEventListener?.('change',onPreference);
    for(const [index,path]of paths.entries())for(const style of prior[index]){
      if(style.value)path.style.setProperty(style.name,style.value,style.priority);else path.style.removeProperty(style.name);
    }
    if(mounted.get(host)===dispose)mounted.delete(host);
  }
  mounted.set(host,dispose);
  doc.addEventListener('visibilitychange',sync);preference?.addEventListener?.('change',onPreference);
  observer?.observe(host);sync();
  return dispose;
}
