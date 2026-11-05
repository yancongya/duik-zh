import {clamp, easing} from './motion-model.mjs';

// One continuous, local illustration. This is an explanation of timing,
// procedural properties and parallax, not an AE render or a Duik solver.
export const MOTION_CINEMA_DURATION = 24;
export const MOTION_CINEMA_REDUCED_FRAME = 18.5;
export const MOTION_CINEMA_MIN_VISIBLE = .9;
const WIDTH = 1200, HEIGHT = 600, TAU = Math.PI * 2;
const chapters = [
  {id:'animation', text:'同一条路径，缓动让飞行有了轻重。', label:'插值', href:'/docs/guide/animation/interpolation'},
  {id:'automation', text:'风起，树梢与风标一起回应。', label:'自动化', href:'/docs/guide/automation/wiggle'},
  {id:'camera', text:'拉开景层，镜头穿过同一片山谷。', label:'摄像机', href:'/docs/guide/camera/camera-2d'},
];
const ramp = (time, from, to) => easing((time-from)/(to-from));
const finite = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const fmt = value => finite(value).toFixed(3);
const transform = matrix => `matrix(${matrix.map(fmt).join(' ')})`;

export function cinemaPath(progress) {
  const angle = progress * TAU - Math.PI * .82;
  const x = 600 + 440 * Math.cos(angle), y = 258 + 108 * Math.sin(angle) + 28 * Math.sin(angle*2);
  return {x, y, angle:Math.atan2(108*Math.cos(angle)+56*Math.cos(angle*2),-440*Math.sin(angle))*180/Math.PI};
}

export function sampleMotionCinema(seconds = 0) {
  const time = ((finite(seconds)%MOTION_CINEMA_DURATION)+MOTION_CINEMA_DURATION)%MOTION_CINEMA_DURATION;
  const lap = time/8, linear = lap%1;
  // A periodic easing has no discontinuity or dwell at the loop seam. Both
  // travelers follow the identical geometric path, at different speeds.
  const eased = linear - .105*Math.sin(TAU*linear);
  const environment = ramp(time,5.4,8.2)*(1-ramp(time,21,24));
  const depth = ramp(time,13,16.7)*(1-ramp(time,20.4,24));
  const spread = ramp(time,13,16.7)*(1-ramp(time,17.8,20.5));
  const push = ramp(time,16.7,19.8)*(1-ramp(time,20.8,24));
  const wave = Math.sin(TAU*lap*2), secondary = Math.sin(TAU*lap*3+.7);
  const plane = cinemaPath(eased), reference = cinemaPath(linear);
  const phase = time<7.4?'animation':time<14.3?'automation':'camera';
  return {
    time, phase, plane, reference, environment, depth, spread, push,
    referenceOpacity:.7*(1-ramp(time,6,8))+.7*ramp(time,22,24),
    pathOpacity:.5*(1-ramp(time,12,16))+.5*ramp(time,21,24),
    wind:environment*(wave*6+secondary*2.6),
    vane:environment*(wave*16+secondary*5),
    cloudX:environment*(Math.sin(TAU*lap)*23),
    cloudScale:1+environment*.035*Math.sin(TAU*lap*2),
    cameraX:depth*(Math.sin((time-13)/11*TAU)*46),
    cameraY:depth*(Math.sin((time-13)/11*TAU+1)*15),
  };
}

// The same matrices move the visible layers and map pointer deltas back into
// the flight plane. No replacement artwork or separate chapter canvas exists.
export function cinemaLayerMatrix(sample, depth, view = {x:0,y:0}) {
  const scale = 1 + sample.push*.26 + sample.spread*(depth-.5)*.075;
  const a = scale*(1-sample.spread*.24), b = -sample.spread*.10;
  const c = sample.spread*.18, d = scale*(1-sample.spread*.47);
  const x = (-sample.cameraX+finite(view.x))*depth + sample.spread*(depth-.5)*136;
  const y = (-sample.cameraY+finite(view.y))*depth + sample.spread*(depth-.5)*220;
  return [a,b,c,d,600-a*600-c*300+x,300-b*600-d*300+y];
}

function tree(x,y,scale,index,shade='#476853') {
  return `<g transform="translate(${x} ${y}) scale(${scale})"><g data-cinema-tree="${index}"><path d="M0 8V-133" fill="none" stroke="${shade}" stroke-width="8"/><path d="M0-176L-34-91H34Z M0-140L-48-42H48Z M0-95L-63 8H63Z" fill="${shade}"/><path d="M0-170V5" stroke="#8b9b7c" stroke-width="1.5" opacity=".55"/></g></g>`;
}
const planeArt = `<path d="M-55-32L64 0-55 32-22 0Z" fill="#c4512e"/><path d="M-22 0L64 0-55-32Z" fill="#eda980"/><path d="M-22 0L-55 32-41 8Z" fill="#973c29"/><path d="M-51-29L58-1" fill="none" stroke="#f7ccaa" stroke-width="1.6"/>`;
const flightPath = Array.from({length:129},(_,i)=>{const p=cinemaPath(i/128);return `${i?'L':'M'}${fmt(p.x)} ${fmt(p.y)}`;}).join(' ')+'Z';
const plateStart = '<svg width="1200" height="600" viewBox="0 0 1200 600" overflow="hidden">';
const plateEnd = '</svg><path data-cinema-frame d="M.5 .5H1199.5V599.5H.5Z" fill="none" stroke="#7b9075" stroke-width="1" opacity="0"/>';

export function motionCinemaMarkup() {
  const initial = sampleMotionCinema(0);
  return `<section class="duik-motion-cinema" data-motion-cinema data-phase="animation" data-playing="false" aria-label="插值、自动化与摄像机的连续场景">
    <div class="duik-cinema-heading"><h2>让动作，走进整个画面。</h2><p data-cinema-status aria-live="off">${chapters[0].text}</p></div>
    <div class="duik-cinema-stage" data-cinema-stage tabindex="0" role="group" aria-label="动态山谷。拖动画面改变视点，方向键移动视点，Home 键归中。">
      <svg data-cinema-svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 600" fill="none" aria-label="同一架纸飞机飞过山谷，风带动树梢与风标，远近景层随镜头分离" role="group">
        <g data-cinema-layer="0.08">${plateStart}<path d="M-280-180H1480V780H-280Z" fill="#eeeee3"/><circle cx="876" cy="139" r="69" fill="#dfb68b"/><circle cx="876" cy="139" r="88" stroke="#cbbfa0" stroke-opacity=".35"/><g data-cinema-cloud="0"><path d="M80 117H225M122 104H282M120 129H188" stroke="#b9c5b1" stroke-width="2"/><path d="M875 255H992M937 242H1080" stroke="#c7cdbb" stroke-width="2"/></g><g data-cinema-cloud="1"><path d="M499 65H605M535 52H663M556 77H622" stroke="#bcc7b2" stroke-width="2"/></g>${plateEnd}</g>
        <g data-cinema-layer="0.24">${plateStart}<path d="M-220 432L76 262 177 331 354 134 556 340 746 198 964 352 1138 218 1420 410V760H-220Z" fill="#c2c9b1"/><path d="M354 134L556 340 409 293 366 216 280 213Z M746 198L964 352 797 298 725 252Z M1138 218L1420 410 1171 331Z" fill="#d7dbc5"/><path d="M-170 428L170 327 298 386 568 282 735 395 952 316 1292 394 1420 451V760H-170Z" fill="#a9b89c"/><path d="M-170 450Q80 350 250 445T659 432Q928 324 1420 450V760H-170Z" fill="#9bac91"/>${plateEnd}</g>
        <g data-cinema-layer="0.43">${plateStart}<path d="M-180 515Q51 370 232 454Q365 520 576 385Q741 304 966 430Q1180 554 1400 374V790H-180Z" fill="#829a7b"/><path d="M-50 490Q114 424 283 492M565 404Q701 342 815 389M970 449Q1114 522 1240 459" stroke="#a2b393" stroke-width="2"/><path d="M796 387Q681 429 704 471Q723 505 621 531Q549 551 574 604H640Q610 559 713 539Q794 513 752 469Q717 431 823 405Z" fill="#d6c39a"/><path d="M817 395Q716 428 731 472Q760 511 677 534" stroke="#e1d6b8" stroke-width="3"/>
          <g transform="translate(930 410)"><path d="M-39 0V-62H28V0Z" fill="#ecdfbb"/><path d="M-51-61L-7-96 40-61Z" fill="#bb6341"/><path d="M-8 0V-35H7V0" fill="#5c704f"/><path d="M-28-49H-17V-35H-28Z M11-49H21V-35H11Z" fill="#ac986e"/><path d="M24-72V-100H32V-66" fill="#a38b69"/></g>
          ${tree(86,448,.47,0,'#627f61')}${tree(310,478,.35,1,'#688567')}${tree(1011,440,.6,2,'#607e60')}${tree(1081,449,.4,3,'#6b8562')}
          <g transform="translate(461 448)"><path d="M0 0V-137" stroke="#5b7557" stroke-width="4"/><g data-cinema-vane><path d="M0-137L68-145 52-132 68-120Z" fill="#c4512e"/><circle cy="-137" r="4.5" fill="#e7d7b8"/></g></g>
        ${plateEnd}</g>
        <g data-cinema-layer="0.62">${plateStart}<path d="M-180 575Q18 418 220 495Q401 601 536 532Q660 474 827 534Q1084 642 1380 426V830H-180Z" fill="#617f61"/><path d="M-90 567Q88 476 201 526M783 558Q928 616 1064 590" stroke="#8ea581" stroke-width="2"/><g transform="translate(813 537)"><path d="M0 4V-54M0-23L-16-42M0-13L18-32" stroke="#a7b48d" stroke-width="2"/><g data-cinema-grass="0"><path d="M0-56Q-14-87-24-74Q-19-54 0-49Z M0-36Q16-70 25-55Q23-38 0-30Z" fill="#c9c39a"/></g></g>${plateEnd}</g>
        <g data-cinema-layer="0.56" data-cinema-flight>${plateStart}<path data-cinema-path d="${flightPath}" stroke="#667d67" stroke-width="1.2" stroke-dasharray="4 8" opacity=".5"/><g data-cinema-reference transform="translate(${fmt(initial.reference.x)} ${fmt(initial.reference.y)}) rotate(${fmt(initial.reference.angle)})" opacity=".7"><path d="M-55-32L64 0-55 32-22 0Z M-22 0H64" fill="#eeeee3" fill-opacity=".5" stroke="#577d7b" stroke-width="1.6" stroke-dasharray="5 4"/></g><g data-cinema-plane data-cinema-drag="plane" tabindex="0" role="group" aria-roledescription="可拖动的纸飞机" aria-label="拖动纸飞机调整位置，也可使用方向键；松开后继续飞行" transform="translate(${fmt(initial.plane.x)} ${fmt(initial.plane.y)}) rotate(${fmt(initial.plane.angle)})"><circle r="68" fill="transparent"/>${planeArt}</g>${plateEnd}</g>
        <g data-cinema-layer="0.9">${plateStart}<path d="M-220 626Q-56 415 107 514Q214 622 365 579Q494 549 603 631Q702 681 805 608Q1012 453 1235 560Q1361 625 1450 509V930H-220Z" fill="#365843"/><path d="M-180 640Q-41 504 82 552M839 617Q1029 526 1185 599" stroke="#648365" stroke-width="2"/>${tree(35,603,1.54,4,'#365943')}${tree(1178,589,1.64,5,'#294d3d')}${tree(1105,622,.85,6,'#3f634c')}<g transform="translate(245 597)"><g data-cinema-grass="1"><path d="M0 0Q-15-54-38-75M0 0Q7-61 33-82M0 0Q30-27 49-34" stroke="#8fa279" stroke-width="3"/><path d="M-29-61Q-55-73-50-91Q-29-83-29-61Z M26-63Q17-89 34-101Q41-83 26-63Z" fill="#8fa279"/></g></g>${plateEnd}</g>
      </svg>
    </div>
    <div class="duik-cinema-footer"><nav aria-label="了解场景使用的 Duik 工具">${chapters.map(item=>`<a href="${item.href}" data-cinema-doc="${item.id}">${item.label}</a>`).join('')}</nav><p data-cinema-hint>拖动飞机或画面，接手这一镜</p></div>
    <p class="duik-cinema-boundary">网页原理示意 · 非 AE / Duik 执行结果</p>
  </section>`;
}

const mounts = new WeakMap();
export function mountMotionCinema(host) {
  if(!host?.ownerDocument)throw new TypeError('Motion cinema requires a DOM host');
  let root = host.matches?.('[data-motion-cinema]')?host:host.querySelector('[data-motion-cinema]');
  if(!root){host.innerHTML=motionCinemaMarkup();root=host.querySelector('[data-motion-cinema]');}
  mounts.get(root)?.();
  const doc=root.ownerDocument, win=doc.defaultView, lifetime=new win.AbortController();
  const stage=root.querySelector('[data-cinema-stage]'), svg=root.querySelector('[data-cinema-svg]');
  const plane=root.querySelector('[data-cinema-plane]'), reference=root.querySelector('[data-cinema-reference]');
  const path=root.querySelector('[data-cinema-path]'), status=root.querySelector('[data-cinema-status]');
  const layers=[...root.querySelectorAll('[data-cinema-layer]')], trees=[...root.querySelectorAll('[data-cinema-tree]')],frames=[...root.querySelectorAll('[data-cinema-frame]')];
  const grass=[...root.querySelectorAll('[data-cinema-grass]')], clouds=[...root.querySelectorAll('[data-cinema-cloud]')];
  const vane=root.querySelector('[data-cinema-vane]'), links=[...root.querySelectorAll('[data-cinema-doc]')];
  const media=win.matchMedia?.('(prefers-reduced-motion: reduce)');
  let time=media?.matches?MOTION_CINEMA_REDUCED_FRAME:0, disposed=false, suspended=false, ended=false;
  let raf=0,last=null,generation=0,gesture=null,returning=null,phase='';
  const offsets={planeX:0,planeY:0,viewX:0,viewY:0},heldKeys=new Set();
  const listen=(target,type,fn,options={})=>target?.addEventListener?.(type,fn,{...options,signal:lifetime.signal});
  function aperture(){
    const box=stage.getBoundingClientRect();if(box.width<=0||box.height<=0)return 0;
    return Math.max(0,Math.min(box.right,win.innerWidth)-Math.max(0,box.left))*Math.max(0,Math.min(box.bottom,win.innerHeight)-Math.max(0,box.top))/(box.width*box.height);
  }
  let visible=!win.IntersectionObserver&&aperture()>=MOTION_CINEMA_MIN_VISIBLE;
  const connected=()=>root.isConnected!==false;
  const canRun=()=>!disposed&&!ended&&!suspended&&connected()&&visible&&aperture()>=MOTION_CINEMA_MIN_VISIBLE&&!doc.hidden&&!media?.matches&&!gesture&&!heldKeys.size;
  function paint(){
    if(disposed||ended)return;
    const sample=sampleMotionCinema(time),view={x:offsets.viewX,y:offsets.viewY};
    for(const layer of layers)layer.setAttribute('transform',transform(cinemaLayerMatrix(sample,Number(layer.dataset.cinemaLayer),view)));
    frames.forEach(frame=>frame.setAttribute('opacity',fmt(sample.spread*.45)));
    plane.setAttribute('transform',`translate(${fmt(sample.plane.x+offsets.planeX)} ${fmt(sample.plane.y+offsets.planeY)}) rotate(${fmt(sample.plane.angle)})`);
    reference.setAttribute('transform',`translate(${fmt(sample.reference.x)} ${fmt(sample.reference.y)}) rotate(${fmt(sample.reference.angle)})`);
    reference.setAttribute('opacity',fmt(sample.referenceOpacity));path.setAttribute('opacity',fmt(sample.pathOpacity));
    trees.forEach((tree,index)=>tree.setAttribute('transform',`rotate(${fmt(sample.wind*(.6+index%3*.18))})`));
    grass.forEach((item,index)=>item.setAttribute('transform',`rotate(${fmt(sample.wind*(index?1.7:1.25))})`));
    vane.setAttribute('transform',`translate(0 -137) rotate(${fmt(sample.vane)}) translate(0 137)`);
    clouds.forEach((cloud,index)=>cloud.setAttribute('transform',`translate(${fmt(sample.cloudX*(index?-.7:1))} 0) translate(600 120) scale(${fmt(sample.cloudScale)}) translate(-600 -120)`));
    const current=media?.matches?'reduced':sample.phase;
    if(phase!==current){
      phase=current;root.dataset.phase=current;
      status.textContent=current==='reduced'?'节奏、环境与景深，组成同一个画面。':chapters.find(item=>item.id===current).text;
      links.forEach(link=>{link.dataset.active=String(current===link.dataset.cinemaDoc);});
    }
    root.dataset.time=fmt(sample.time);root.dataset.depth=fmt(sample.depth);
    root.dataset.planeX=fmt(sample.plane.x+offsets.planeX);root.dataset.planeY=fmt(sample.plane.y+offsets.planeY);
    root.dataset.viewX=fmt(offsets.viewX);root.dataset.viewY=fmt(offsets.viewY);
  }
  function stop(){generation++;if(raf)win.cancelAnimationFrame(raf);raf=0;last=null;root.dataset.playing='false';}
  function schedule(){
    if(!canRun()){stop();return;}
    root.dataset.playing='true';if(raf)return;
    const token=generation;
    raf=win.requestAnimationFrame(now=>{if(disposed||ended||token!==generation)return;raf=0;if(!canRun()){stop();return;}
      const elapsed=last===null?0:Math.min(64,Math.max(0,now-last));last=now;
      time=(time+elapsed/1000)%MOTION_CINEMA_DURATION;
      if(returning){returning.elapsed+=elapsed;const amount=1-easing(returning.elapsed/1100);for(const key of Object.keys(offsets))offsets[key]=returning.from[key]*amount;if(amount===0)returning=null;}
      paint();schedule();
    });
  }
  function resume(){if(disposed||ended)return;if(canRun())schedule();else stop();}
  function beginReturn(){
    if(!media?.matches&&Object.values(offsets).some(value=>Math.abs(value)>.001))returning={from:{...offsets},elapsed:0};
    resume();
  }
  function releaseGesture(){
    const previous=gesture;gesture=null;root.dataset.dragging='false';
    if(previous?.target.hasPointerCapture?.(previous.id)){try{previous.target.releasePointerCapture(previous.id);}catch{/* A detached SVG target may already have lost capture. */}}
  }
  function interrupt(){releaseGesture();heldKeys.clear();stop();}
  function localPoint(event){const box=svg.getBoundingClientRect();if(box.width<=0||box.height<=0)return null;return {x:(event.clientX-box.left)*WIDTH/box.width,y:(event.clientY-box.top)*HEIGHT/box.height};}
  function setPlane(dx,dy){const sample=sampleMotionCinema(time);offsets.planeX=clamp(dx,75-sample.plane.x,1125-sample.plane.x);offsets.planeY=clamp(dy,72-sample.plane.y,456-sample.plane.y);}
  listen(stage,'pointerdown',event=>{
    if(disposed||ended||event.button!==0||event.isPrimary===false||gesture||!connected())return;
    const mode=event.target.closest?.('[data-cinema-plane]')?'plane':'view',target=mode==='plane'?plane:stage;
    const point=localPoint(event);if(!point)return;stop();returning=null;
    gesture={id:event.pointerId,target,mode,start:point,from:{...offsets}};root.dataset.dragging=mode;
    try{target.setPointerCapture?.(event.pointerId);}catch{/* Document pointerup is a fallback when capture is unavailable. */}
    target.focus?.({preventScroll:true});event.preventDefault();
  });
  listen(stage,'pointermove',event=>{
    if(disposed||ended||!gesture||gesture.id!==event.pointerId)return;
    const point=localPoint(event);if(!point)return;const dx=point.x-gesture.start.x,dy=point.y-gesture.start.y;
    if(gesture.mode==='plane'){
      const [a,b,c,d]=cinemaLayerMatrix(sampleMotionCinema(time),.56,{x:offsets.viewX,y:offsets.viewY}),det=a*d-b*c;
      setPlane(gesture.from.planeX+(d*dx-c*dy)/det,gesture.from.planeY+(-b*dx+a*dy)/det);
    }else{offsets.viewX=clamp(gesture.from.viewX+dx,-180,180);offsets.viewY=clamp(gesture.from.viewY+dy,-110,110);}
    paint();
  });
  const endPointer=event=>{if(disposed||ended||!gesture||gesture.id!==event.pointerId)return;releaseGesture();beginReturn();};
  for(const type of ['pointerup','pointercancel'])listen(doc,type,endPointer);
  listen(stage,'lostpointercapture',endPointer);
  listen(stage,'keydown',event=>{
    if(disposed||ended||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key)||gesture)return;
    event.preventDefault();stop();returning=null;heldKeys.add(event.key);
    const dx=event.key==='ArrowLeft'?-18:event.key==='ArrowRight'?18:0,dy=event.key==='ArrowUp'?-12:event.key==='ArrowDown'?12:0;
    if(event.target===plane)setPlane(event.key==='Home'?0:offsets.planeX+dx,event.key==='Home'?0:offsets.planeY+dy);
    else{offsets.viewX=event.key==='Home'?0:clamp(offsets.viewX+dx,-180,180);offsets.viewY=event.key==='Home'?0:clamp(offsets.viewY+dy,-110,110);}
    paint();
  });
  listen(doc,'keyup',event=>{if(heldKeys.delete(event.key)&&!heldKeys.size)beginReturn();});
  listen(stage,'focusout',()=>{if(heldKeys.size){heldKeys.clear();beginReturn();}});
  const observer=win.IntersectionObserver?new win.IntersectionObserver(entries=>{
    if(disposed||ended)return;
    const relevant=entries.filter(entry=>entry.target===stage),entry=relevant.at(-1);if(!entry)return;
    if(relevant.some(item=>!item.isIntersecting||item.intersectionRatio<MOTION_CINEMA_MIN_VISIBLE))interrupt();
    visible=entry.isIntersecting&&entry.intersectionRatio>=MOTION_CINEMA_MIN_VISIBLE;if(!visible)interrupt();resume();
  },{threshold:[0,.2,MOTION_CINEMA_MIN_VISIBLE,1]}):null;
  observer?.observe(stage);
  listen(doc,'visibilitychange',()=>{if(disposed||ended)return;if(doc.hidden)interrupt();resume();});
  listen(media,'change',()=>{if(disposed||ended)return;interrupt();returning=null;if(media.matches)time=MOTION_CINEMA_REDUCED_FRAME;paint();resume();});
  listen(win,'resize',()=>{if(disposed||ended)return;visible=aperture()>=MOTION_CINEMA_MIN_VISIBLE;if(!visible)interrupt();resume();});
  listen(win,'blur',event=>{if(!disposed&&!ended&&event.target===win){releaseGesture();heldKeys.clear();beginReturn();}});
  listen(win,'pagehide',event=>{if(disposed||ended)return;interrupt();suspended=true;if(!event.persisted){ended=true;observer?.disconnect();}});
  listen(win,'pageshow',event=>{if(disposed||ended||!event.persisted)return;suspended=false;visible=aperture()>=MOTION_CINEMA_MIN_VISIBLE;paint();resume();});
  root.dataset.cinemaMounted='true';paint();resume();
  const cleanup=()=>{if(disposed)return;interrupt();disposed=true;observer?.disconnect();lifetime.abort();delete root.dataset.cinemaMounted;if(mounts.get(root)===cleanup)mounts.delete(root);};
  mounts.set(root,cleanup);return cleanup;
}
