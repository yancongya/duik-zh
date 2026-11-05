// Original, editable vector title sequence. Metadata is an authored fixture,
// grounded in Duik's Layer Manager; this is not AE execution or image parsing.
export const TOOLS_CINEMA_DURATION = 10800;
export const TOOLS_CINEMA_LAYERS = Object.freeze([
  Object.freeze({id:'title',source:'Art_片头_MAKE',name:'MAKE 标题',group:'片头',side:'无',type:'美术'}),
  Object.freeze({id:'ribbon',source:'Art_片头_R_流线',name:'流线',group:'片头',side:'右',type:'美术'}),
  Object.freeze({id:'type',source:'Art_片头_MOVE',name:'MOVE 字样',group:'片头',side:'无',type:'美术'}),
]);
const clamp = (value,min=0,max=1) => Math.min(max,Math.max(min,Number(value)||0));
// The shared on-screen motion curve: cubic-bezier(.77, 0, .175, 1).
function ease(position) {
  const x=clamp(position);let lo=0,hi=1,t=x;
  for(let n=0;n<18;n++){t=(lo+hi)/2;const b=3*(1-t)*(1-t)*t*.77+3*(1-t)*t*t*.175+t*t*t;if(b<x)lo=t;else hi=t;}
  return 3*(1-t)*t*t+t*t*t;
}
const between=(p,start,end)=>ease((p-start)/(end-start));
export function sampleToolsCinema(elapsed,{reduced=false}={}) {
  const p=clamp(elapsed/TOOLS_CINEMA_DURATION);
  if(reduced)return {progress:1,phase:'complete',zoom:0,selection:1,source:0,name:1,group:1,side:1,type:1,tagged:true};
  const zoom=between(p,.09,.29)*(1-between(p,.65,.89));
  const selection=between(p,.19,.25)*(1-between(p,.79,.88));
  const reveal=between(p,.28,.33),leave=1-between(p,.76,.85);
  return {progress:p,phase:p<.19?'artwork':p<.35?'select':p<.65?'organize':p<.89?'return':'complete',zoom,selection,
    source:reveal*(1-between(p,.36,.42))*leave,name:between(p,.36,.43)*leave,
    group:between(p,.42,.47)*leave,side:between(p,.47,.52)*leave,type:between(p,.52,.57)*leave,tagged:p>=.43};
}

// Parallel, mathematically specified strips form a single artwork layer. Their
// varying widths are authored art, not four primitive shapes or a fake panel.
function ribbonMarkup(){
  return Array.from({length:21},(_,i)=>{
    const y=89+i*15.1,w=5.5+i*.18;
    return '<path d="M 644 '+y+' C 744 '+(y-109)+' 857 '+(y+120)+' 971 '+(y+20)+' S 1126 '+(y-122)+' 1186 '+(y-52)+'" fill="none" stroke="'+(i%7===0?'#293f37':'#c4512e')+'" stroke-width="'+w+'"/>';
  }).join('');
}
const cornerMarks='<path d="M 622 57 h 20 m -20 0 v 20 M 1198 57 h -20 m 20 0 v 20 M 622 429 h 20 m -20 0 v -20 M 1198 429 h -20 m 20 0 v -20"/>';
const drawing=`<svg class="duik-tools-cinema-art" data-tools-cinema-art viewBox="0 0 1280 800" role="group" aria-label="MAKE IT MOVE 分层片头作品，右侧流线可以拖动">
  <g data-tools-cinema-camera>
    <g class="duik-tools-cinema-paper"><rect width="1280" height="800" fill="#eeeee4"/><path d="M 0 718 H 1280 V 800 H 0 Z" fill="#dce3d4"/></g>
    <g data-cinema-art-layer="title" class="duik-tools-cinema-display" fill="#293f37"><text x="61" y="212" font-size="190" letter-spacing="-7">MAKE</text><text x="60" y="394" font-size="190" letter-spacing="-7">IT</text></g>
    <g data-cinema-art-layer="countertype" class="duik-tools-cinema-display" fill="#293f37"><text x="329" y="337" font-size="31" letter-spacing="-1">让想法</text><text x="329" y="381" font-size="31" letter-spacing="-1">动起来。</text></g>
    <g data-tools-cinema-object tabindex="0" role="button" aria-label="流线美术。拖动调整位置，方向键微调，Home 恢复位置" aria-describedby="duik-tools-cinema-help" data-cinema-art-layer="ribbon">
      <rect class="duik-tools-cinema-hit" x="622" y="57" width="576" height="372" fill="transparent"/>
      <g data-tools-cinema-ribbons>${ribbonMarkup()}</g>
      <g data-tools-cinema-selection class="duik-tools-cinema-selection" opacity="0" aria-hidden="true">${cornerMarks}<path d="M 622 57 H 1198 V 429 H 622 Z" stroke-dasharray="3 7" stroke-opacity=".42"/></g>
    </g>
    <g data-cinema-art-layer="type" class="duik-tools-cinema-display" fill="#293f37"><text x="48" y="690" font-size="334" letter-spacing="-13" textLength="1184" lengthAdjust="spacingAndGlyphs">MOVE.</text></g>
    <g class="duik-tools-cinema-signature" fill="#293f37"><text x="65" y="765" font-size="18">DUIK / 动画里的每一层</text><text x="1214" y="765" font-size="18" text-anchor="end">分层片头示例</text></g>
    <g data-tools-cinema-labels class="duik-tools-cinema-labels" aria-hidden="true" pointer-events="none">
      <g data-tools-cinema-source opacity="0"><rect x="630" y="444" width="484" height="46" rx="3" fill="#f8f6f0"/><text x="646" y="474" font-size="21" fill="#686b5e">Art_片头_R_流线</text></g>
      <g data-tools-cinema-name opacity="0"><rect x="630" y="444" width="484" height="46" rx="3" fill="#f8f6f0"/><text x="646" y="475" font-size="24" fill="#293f37">流线</text></g>
      <g data-tools-cinema-group opacity="0"><text x="646" y="523" font-size="17" fill="#293f37">片头组</text></g>
      <g data-tools-cinema-side opacity="0"><text x="777" y="523" font-size="17" fill="#293f37">右侧</text></g>
      <g data-tools-cinema-type opacity="0"><text x="887" y="523" font-size="17" fill="#293f37">美术</text></g>
    </g>
  </g>
</svg>`;

export const toolsCinemaMarkup=`<section class="duik-tools-cinema" data-tools-cinema-root data-cinema-state="idle" aria-label="Duik 图层管理动态作品">
  <header class="duik-tools-cinema-heading"><h2>作品可以复杂，图层不必。</h2><p>名称、组别、侧别，整理好，下一次修改就有迹可循。</p></header>
  <figure class="duik-tools-cinema-stage" data-tools-cinema-stage>${drawing}<figcaption>网页原理示意</figcaption></figure>
  <span class="duik-tools-cinema-sr" id="duik-tools-cinema-help">自动镜头按预设图层名称展示标记，不识别图像或修改 After Effects 工程。仅在拖动、按键调整和展开工作台时让位。</span>
  <div class="duik-tools-cinema-footer"><a href="/docs/guide/tools/layers">了解图层管理</a><details data-tools-cinema-details><summary>更多工具与原面板</summary><div data-tools-cinema-workbench></div></details></div>
</section>`;

const instances=new WeakMap();let instanceCount=0;
export function mountToolsCinema(host,{loadWorkbench=()=>import('./tools-demo.mjs')}={}) {
  let root=host.matches?.('[data-tools-cinema-root]')?host:host.querySelector('[data-tools-cinema-root]');
  if(!root){host.innerHTML=toolsCinemaMarkup;root=host.querySelector('[data-tools-cinema-root]');}
  if(instances.has(root))return instances.get(root);
  const doc=root.ownerDocument,win=doc.defaultView,life=new win.AbortController();
  const on=(target,type,listener,options={})=>target.addEventListener(type,listener,{...options,signal:life.signal});
  const $=selector=>root.querySelector(selector),stage=$('[data-tools-cinema-stage]'),svg=$('[data-tools-cinema-art]');
  const camera=$('[data-tools-cinema-camera]'),object=$('[data-tools-cinema-object]'),labels=$('[data-tools-cinema-labels]');
  const selection=$('[data-tools-cinema-selection]'),details=$('[data-tools-cinema-details]'),slot=$('[data-tools-cinema-workbench]');
  const channels=Object.fromEntries(['source','name','group','side','type'].map(name=>[name,$('[data-tools-cinema-'+name+']')]));
  const help=$('.duik-tools-cinema-sr');help.id='duik-tools-cinema-help-'+(++instanceCount);object.setAttribute('aria-describedby',help.id);
  const media=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let disposed=false,visible=!win.IntersectionObserver,pageActive=true,reduced=Boolean(media?.matches);
  let elapsed=0,previous=null,frame=0,generation=0,drag=null,offset={x:0,y:0};const keys=new Set();
  let workbenchCleanup=null,detailsGeneration=0;
  const allowed=()=>!disposed&&visible&&pageActive&&!doc.hidden&&!reduced&&!drag&&!keys.size&&!details.open;
  const snapshot=()=>sampleToolsCinema(elapsed,{reduced});
  function render(){
    if(disposed)return;const state=snapshot(),peakZoom=1.4,z=1+state.zoom*(peakZoom-1);
    // Camera and object have separate owners. A direct drag never moves its
    // coordinate frame, so the user cannot end up chasing a moving target.
    // Keep the selection corners and metadata in the 1280 × 800 artwork even
    // at both permitted drag extremes; CSS scales the whole frame, not a crop.
    const tx=(640-910*peakZoom)*state.zoom,ty=(400-292*peakZoom)*state.zoom;
    camera.setAttribute('transform','translate('+tx.toFixed(3)+' '+ty.toFixed(3)+') scale('+z.toFixed(5)+')');
    object.setAttribute('transform','translate('+offset.x+' '+offset.y+')');labels.setAttribute('transform','translate('+offset.x+' '+offset.y+')');
    selection.setAttribute('opacity',String(drag||keys.size?1:state.selection));
    for(const [name,node]of Object.entries(channels))node.setAttribute('opacity',String(state[name]));
    root.dataset.cinemaPhase=state.phase;root.dataset.cinemaProgress=state.progress.toFixed(4);root.dataset.cinemaTagged=String(state.tagged);
    root.dataset.cinemaOffsetX=String(offset.x);root.dataset.cinemaOffsetY=String(offset.y);
  }
  function stop(){generation++;if(frame)win.cancelAnimationFrame(frame);frame=0;previous=null;}
  function schedule(){const current=generation;frame=win.requestAnimationFrame(time=>{if(disposed||current!==generation)return;frame=0;if(!allowed()){sync();return;}const delta=previous===null?0:clamp(time-previous,0,100);previous=time;elapsed=(elapsed+delta)%TOOLS_CINEMA_DURATION;render();schedule();});}
  function releaseDrag(){const held=drag;drag=null;if(held&&object.hasPointerCapture?.(held.id))object.releasePointerCapture(held.id);}
  function sync(){
    if(disposed)return;
    if(!visible||!pageActive||doc.hidden||reduced){releaseDrag();keys.clear();}
    const active=allowed();root.dataset.cinemaState=active?'running':reduced?'reduced':details.open?'details':drag||keys.size?'interaction':'paused';
    if(active){if(!frame)schedule();}else stop();render();
  }
  function point(event){const matrix=camera.getScreenCTM?.();if(!matrix)return null;const local=new win.DOMPoint(event.clientX,event.clientY).matrixTransform(matrix.inverse());return {x:local.x,y:local.y};}
  on(object,'pointerdown',event=>{
    if(disposed||drag||event.button!==0||event.isPrimary===false)return;const p=point(event);if(!p)return;
    object.focus({preventScroll:true});drag={id:event.pointerId,start:p,origin:{...offset}};object.setPointerCapture(event.pointerId);event.preventDefault();sync();
  });
  on(object,'pointermove',event=>{if(drag?.id!==event.pointerId)return;const p=point(event);if(!p)return;offset={x:clamp(drag.origin.x+p.x-drag.start.x,-72,72),y:clamp(drag.origin.y+p.y-drag.start.y,-40,40)};render();});
  const endPointer=event=>{if(drag?.id!==event.pointerId)return;releaseDrag();sync();};
  on(object,'pointerup',endPointer);on(object,'pointercancel',endPointer);on(object,'lostpointercapture',event=>{if(drag?.id!==event.pointerId)return;drag=null;sync();});
  on(object,'keydown',event=>{
    const delta={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[event.key];
    if(!delta&&event.key!=='Home')return;event.preventDefault();keys.add(event.key);
    const step=event.shiftKey?10:2;offset=event.key==='Home'?{x:0,y:0}:{x:clamp(offset.x+delta[0]*step,-72,72),y:clamp(offset.y+delta[1]*step,-40,40)};sync();
  });
  on(doc,'keyup',event=>{if(keys.delete(event.key))sync();});
  on(object,'blur',()=>{keys.clear();sync();});
  on(win,'blur',event=>{if(event.target!==win)return;releaseDrag();keys.clear();sync();});
  const observer=win.IntersectionObserver?new win.IntersectionObserver(entries=>{
    if(disposed)return;for(const entry of entries){if(entry.target!==stage)continue;const next=entry.isIntersecting&&entry.intersectionRatio>=.65;if(!next){visible=false;sync();}visible=next;}sync();
  },{threshold:[0,.65]}):null;observer?.observe(stage);
  on(doc,'visibilitychange',sync);
  if(media?.addEventListener)on(media,'change',event=>{reduced=event.matches;sync();});
  on(win,'pagehide',()=>{pageActive=false;sync();});
  on(win,'pageshow',()=>{pageActive=true;const r=stage.getBoundingClientRect();visible=r.width>0&&r.height>0&&Math.max(0,Math.min(r.right,win.innerWidth)-Math.max(r.left,0))*Math.max(0,Math.min(r.bottom,win.innerHeight)-Math.max(r.top,0))/(r.width*r.height)>=.65;sync();});
  function releaseWorkbench(){detailsGeneration++;workbenchCleanup?.();workbenchCleanup=null;slot.replaceChildren();slot.removeAttribute('aria-busy');}
  async function syncDetails(){
    if(disposed)return;releaseDrag();keys.clear();sync();releaseWorkbench();if(!details.open)return;
    const current=detailsGeneration;slot.setAttribute('aria-busy','true');slot.textContent='正在打开工具工作台…';
    try{const module=await loadWorkbench();if(disposed||current!==detailsGeneration||!details.open)return;slot.innerHTML=module.toolsMarkup;workbenchCleanup=module.mountTools(slot);slot.removeAttribute('aria-busy');}
    catch{if(disposed||current!==detailsGeneration||!details.open)return;slot.removeAttribute('aria-busy');slot.textContent='工具工作台暂时无法打开，请收起后重试。';}
  }
  on(details,'toggle',syncDetails);
  const cleanup=()=>{if(disposed)return;disposed=true;stop();life.abort();observer?.disconnect();releaseDrag();releaseWorkbench();instances.delete(root);root.dataset.cinemaState='disposed';};
  instances.set(root,cleanup);render();sync();if(details.open)void syncDetails();return cleanup;
}
