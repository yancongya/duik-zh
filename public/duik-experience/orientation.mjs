// Product explanations grounded in the pinned upstream Markdown, not a fake AE UI.
export const officialRoot='/duik-experience/official/';
export const panelScreenshots=Object.freeze({bones:'duik/bones/bones_panel.png',constraints:'duik/constraints/constraints-panel.png',controllers:'duik/controllers/panel.png',automation:'duik/automation/panel.png',animation:'duik/animation/animation-panel.png',camera:'duik/cameras/camera-panel.png',tools:'duik/tools/comp-tools.png',command:'duik/cmd.png'});
export const orientationMarkup=`<section id="inside-ae" class="duik-orientation duik-experience-section" aria-label="认识 Duik">
 <div class="duik-orientation-heading"><p>Duik Ángela · 就在 After Effects 里</p><a href="/docs/getting-started/first-look">认识 Duik ↗</a></div>
 <details class="duik-orientation-reference" data-orientation-reference><summary>查看 Duik 的真实面板</summary>
  <figure class="duik-official-workspace"><img src="${officialRoot}duik/individual-panels.png" width="1265" height="567" alt="官方文档中的 Duik 独立面板：骨骼、链接与约束、自动化、控制器和动画" loading="lazy" decoding="async"><figcaption><span>可按工作需要独立打开的 Duik 面板</span><span>RxLaboratory 官方文档 / <a href="/docs/misc/doc-license">GFDL 1.3</a></span></figcaption></figure>
 </details>
</section>`;
export const workflowSteps=Object.freeze([
 {id:'bones',title:'准备骨架',image:panelScreenshots.bones,width:286,height:486,alt:'Duik 骨骼面板，包含骨架类型与 Auto-rig 按钮',heading:'结构与美术，分开组织。',description:'先为角色准备可独立运动的美术图层，再按角色结构创建、摆放骨骼。Duik 的骨骼使用 AE 形状图层，不需要把表达式直接写到美术层上。',items:['选择合适的骨架类型，或创建自定义骨架。','对齐肩、肘、腕等关节，再检查包络与连接位置。','保持名称、左右侧与所属角色清楚。'],href:'/docs/guide/bones',link:'阅读骨骼与结构指南',note:'这里展示骨骼面板原图；不会自动拆分或识别上传的角色图片。'},
 {id:'link',title:'关联与绑定',image:panelScreenshots.constraints,width:269,height:405,alt:'Duik 链接与约束面板，包含 Auto-rig、Connector 与 Kinematics',heading:'让骨骼驱动画面，而不是反过来。',description:'使用 Link Art（链接图形）将美术层与骨骼关联；随后根据结构自动绑定或使用具体约束。先确认参与的图层，再让工具建立关系。',items:['链接图形：将美术层与图钉父子链接到骨骼。','自动绑定：按骨架或肢体结构配置控制关系。','需要时使用 IK、父子约束等底层工具进一步调整。'],href:'/docs/guide/bones/tools/link-art',link:'查看关联美术层的方法',note:'图示为链接与约束面板；Link Art 位于骨骼面板工具栏。'},
 {id:'control',title:'控制与动画',image:panelScreenshots.controllers,width:393,height:460,alt:'Duik 控制器面板，包含控制器形状及显示隐藏、设置等工具',heading:'把复杂关系，收在少量控制器里。',description:'通过控制器测试关节和运动范围，再为控制器安排关键帧。结构确认后，使用动画与自动化面板继续处理节奏、循环和表现。',items:['测试手部目标、身体与头部的控制关系。','整理控制器的显隐与外观，减少画面干扰。','在动画面板调整插值，不必重新建立绑定。'],href:'/docs/guide/controllers',link:'了解控制器与动画衔接',note:'Hero 中的角色可拖拽体验；它是受限网页示意，不是 AE 自动绑定结果。'},
]);
// Real panels remain available, but the first layer explains by showing.
const detail=step=>`<div class="duik-workflow-explanation"><h3>${step.title}</h3><p>${step.description}</p><ol>${step.items.map(item=>`<li>${item}</li>`).join('')}</ol><a href="${step.href}">${step.link}</a><p class="duik-source-line">${step.note}</p></div><figure class="duik-workflow-panel"><img src="${officialRoot+step.image}" width="${step.width}" height="${step.height}" alt="${step.alt}" loading="lazy" decoding="async"><figcaption>RxLaboratory 官方文档 / GFDL 1.3</figcaption></figure>`;
export const workflowViews=Object.freeze([
 {label:'展开图层',heading:'从每一层，看见整体。',description:'26 张已准备好的透明图层，在同一空间展开。',hint:'分层素材原理示意',mode:'assembled',controls:false,poster:'layers-exploded.webp'},
 {label:'关联骨骼',heading:'归位之后，建立联系。',description:'图层回到原坐标；选择一个部位，查看驱动关系。',hint:'选择部位，镜头跟随关联位置',mode:'assembled',controls:true,poster:'bones-controls.webp'},
 {label:'接管动作',heading:'现在，把动作交给你。',description:'拖动彩色控制器，让手臂、头部和身体一起回应。',hint:'拖动彩色控制器；方向键也能微调',mode:'assembled',controls:true,poster:'bones-controls.webp'},
]);
export const workflowParts=Object.freeze([
 {id:'fore-l',label:'左臂',group:'左臂',control:'handL'},
 {id:'fore-r',label:'右臂',group:'右臂',control:'handR'},
 {id:'face',label:'头部',group:'面部',control:'head'},
 {id:'torso',label:'躯干',group:'躯干',control:'body'},
]);
const viewCopy=view=>`<p>${view.description}</p>`;
export const workflowMarkup=`<section id="workflow" class="duik-workflow-chapter duik-experience-section" data-duik-workflow data-workflow-scroll data-workflow-step="0" data-workflow-tour="scroll" aria-labelledby="duik-workflow-title">
 <div class="duik-workflow-pin" data-workflow-pin>
 <div class="duik-workflow-heading"><h2 id="duik-workflow-title">从分层素材，<br>到一段表演。</h2></div>
 <div class="duik-workflow-stage">
  <div class="duik-workflow-toolbar"><button type="button" data-workflow-retry hidden>重新加载角色</button></div>
  <div class="duik-workflow-canvas">
   <div class="duik-workflow-art" data-workflow-art><div class="duik-workflow-camera" data-workflow-camera><img data-workflow-poster src="/duik-landing-assets/layers-exploded.webp" width="1400" height="1200" alt="已确认角色的 26 张独立透明图层" loading="lazy" decoding="async"><div class="duik-workflow-layer-stack" data-workflow-layer-stack aria-hidden="true"></div><div data-workflow-rig-host></div></div><p data-workflow-status>26 张已准备好的透明图层</p></div>
  </div>
 </div>
 <div class="duik-workflow-footnote"><p class="duik-workflow-boundary">已分层角色 · 网页原理示意</p><a href="/docs/guide/rigging">了解 Duik 绑定</a></div>
 </div>
</section>`;

// The Linearity HomeHowItWorksKP timeline keeps one image stage while its
// viewpoint and explanation change. This adapter keeps that continuity with
// the approved transparent artwork, using original coordinates at handoff.
// VoiceStudio's setView request generation / offscreen canvas lifecycle inform
// cancellation; no source brand UI or ambient animation is imported.
const workflowEase='cubic-bezier(0.77, 0, 0.175, 1)';
const workflowCameraPoses=Object.freeze({
 layers:'perspective(1400px) rotateX(7deg) rotateY(-12deg) scale(.88)',
 'fore-l':'translate(-7%, -1%) scale(1.13)',
 'fore-r':'translate(6%, -8%) scale(1.13)',
 face:'translate(3%, 18%) scale(1.2)',
 torso:'translate(3%, -7%) scale(1.12)',
 control:'translate(0, 0) scale(1)',
});

/** Uses the same aspect-preserving camera projection as the shared renderer. */
export function workflowLayerLayout(manifest,width,height){
 const base=manifest.camera,aspect=width/height;
 let cw=base[2],ch=base[3];if(aspect>cw/ch)cw=ch*aspect;else ch=cw/aspect;
 const camera=[base[0]+(base[2]-cw)/2,base[1]+(base[3]-ch)/2,cw,ch];
 const scale=width/cw;
 return manifest.parts.map((part,index)=>{
  const [x0,y0,x1,y1]=part.bbox;
  let x=0,y=0,z=0,rotate=0;
  if(part.group==='头发'){x=-265;y=-120-index*7;z=110+index*9;rotate=-7;}
  else if(part.group==='五官'){x=260+(index%2)*85;y=-110+(index-18)*24;z=175+(index-18)*15;rotate=5;}
  else if(part.group==='左臂'){x=270+(index-14)*46;y=-45+(index-14)*38;z=70+(index-14)*35;rotate=5;}
  else if(part.group==='右臂'){x=-250-(index-10)*44;y=20+(index-10)*40;z=70+(index-10)*30;rotate=-5;}
  else if(part.group==='面部'){x=35+(index-4)*28;y=-145;z=80+index*13;rotate=2;}
  else{x=-35;y=part.id==='waist'?145:part.id==='neck'?-70:30;z=-60;rotate=-2;}
  return {id:part.id,left:(x0-camera[0])/cw*100,top:(y0-camera[1])/ch*100,width:(x1-x0)/cw*100,height:(y1-y0)/ch*100,
   offsets:[x*scale,y*scale,z*scale,rotate],exploded:`translate3d(${(x*scale).toFixed(3)}px, ${(y*scale).toFixed(3)}px, ${(z*scale).toFixed(3)}px) rotateY(${rotate}deg)`,assembled:'translate3d(0px, 0px, 0px) rotateY(0deg)'};
 });
}

// Sample the same strong ease-in-out used by the CSS camera. Pose values are
// rendered through the shared rig; its stored user pose is never overwritten.
export function workflowPoseFrame(pose,progress){
 const x=Math.max(0,Math.min(1,progress));let lo=0,hi=1;
 for(let i=0;i<16;i++){const t=(lo+hi)/2,v=3*(1-t)**2*t*.77+3*(1-t)*t*t*.175+t**3;if(v<x)lo=t;else hi=t;}
 const t=x===0?0:x===1?1:(lo+hi)/2,eased=3*(1-t)*t*t+t**3;
 return Object.fromEntries(Object.entries(pose).map(([key,value])=>[key,Array.isArray(value)?value.map(item=>item*eased):value*eased]));
}

export function createWorkflowCinema({art,camera,stack,rigHost,rig,manifest,reduced}){
 let shot=0,part='fore-l',animations=[],disposed=false,version=0,poseFrame=0,restoringPose=false;
 let layoutWidth=0,layoutHeight=0;
 let scrollProgress=null,scrollPose=null;
 const settledListeners=new Set();
 const images=manifest.parts.map(part=>{
  const image=document.createElement('img');image.src=new URL(part.src,new URL('/riglab-project/rig.json',document.baseURI)).href;
  image.alt='';image.width=part.bbox[2]-part.bbox[0];image.height=part.bbox[3]-part.bbox[1];image.dataset.workflowLayer=part.id;
  image.decoding='async';return image;
 });
 stack.replaceChildren(...images);art.dataset.workflowLayerCount=String(images.length);
 function isSettled(){return !restoringPose&&animations.every(record=>record.finished);}
 function notifySettled(){
  if(disposed||!isSettled())return;
  const listeners=[...settledListeners];settledListeners.clear();for(const listener of listeners)listener();
 }
 function cancel(freeze=true){
  version++;
  if(poseFrame)cancelAnimationFrame(poseFrame);poseFrame=0;
  if(restoringPose){restoringPose=false;rig.render();}
  delete art.dataset.workflowPoseHandoff;
  for(const {element,animation}of animations){
   if(freeze&&typeof getComputedStyle==='function'){
    const style=getComputedStyle(element);element.style.transform=style.transform;element.style.opacity=style.opacity;
   }
   animation.cancel();
  }
  animations=[];
 }
 function exposeRig(){stack.style.opacity='0';rigHost.style.opacity='1';rigHost.style.pointerEvents='';rigHost.inert=false;}
 function handoff(token){
  if(disposed||token!==version)return;
  const pose=rig.exportPose().pose;
  if(reduced.matches||Object.values(pose).flat().every(value=>value===0)){exposeRig();return;}
  // The PNGs have collected at their authored neutral coordinates. Continue
  // with the same mesh in neutral, then visibly return to the saved pose.
  // render(pose) updates only renderedPose; state.pose stays user-owned.
  restoringPose=true;art.dataset.workflowPoseHandoff='restoring';rig.render(workflowPoseFrame(pose,0));
  stack.style.opacity='0';rigHost.style.opacity='1';rigHost.style.pointerEvents='none';rigHost.inert=true;
  let started;
  const tick=now=>{
   poseFrame=0;if(disposed||token!==version)return;
   if(started===undefined)started=now;
   const progress=Math.min(1,(now-started)/500);rig.render(workflowPoseFrame(pose,progress));
   if(progress<1)poseFrame=requestAnimationFrame(tick);
   else{restoringPose=false;rig.render();delete art.dataset.workflowPoseHandoff;exposeRig();notifySettled();}
  };
  poseFrame=requestAnimationFrame(tick);
 }
 function move(element,transform,animate,duration=1200,delay=0){
  const from=element.style.transform||'none';element.style.transform=transform;
  if(!animate||!element.animate)return null;
  const animation=element.animate([{transform:from},{transform}],{duration,delay,easing:workflowEase,fill:'backwards'});
  const record={element,animation,finished:false,after:null},token=version;
  animation.onfinish=()=>{if(disposed||token!==version||record.finished)return;record.finished=true;record.after?.();notifySettled();};
  animations.push(record);return record;
 }
 function project(){
  const rect=art.getBoundingClientRect();layoutWidth=Math.max(1,rect.width);layoutHeight=Math.max(1,rect.height);
  const layout=workflowLayerLayout(manifest,layoutWidth,layoutHeight);
  for(const [i,item]of layout.entries()){
   const image=images[i];Object.assign(image.style,{left:item.left+'%',top:item.top+'%',width:item.width+'%',height:item.height+'%'});
  }
  return layout;
 }
 function show(next,{animate=false,selected=part,expandFromRest=false}={}){
  if(disposed)return;scrollProgress=null;scrollPose=null;cancel();shot=next;part=selected;const token=version;
  const motion=animate&&!reduced.matches&&typeof camera.animate==='function'&&images.every(image=>typeof image.animate==='function'),layout=project();
  art.dataset.workflowShot=next===0?'layers':next===1?'link':'control';
  const pose=next===0?'layers':next===1?part:'control';camera.dataset.workflowCameraPose=pose;
  if(expandFromRest){for(const image of images)image.style.transform='translate3d(0px, 0px, 0px) rotateY(0deg)';camera.style.transform=workflowCameraPoses.control;}
  move(camera,workflowCameraPoses[pose],motion,next===1?1200:1000);
  if(next===0){
   const expand=()=>{
    stack.style.opacity='1';rigHost.style.opacity='0';rigHost.style.pointerEvents='none';rigHost.inert=true;
    for(const [i,item]of layout.entries())move(images[i],item.exploded,motion,1000,i%5*45);
   };
   const saved=rig.exportPose().pose;
   if(motion&&rigHost.style.opacity==='1'&&Object.values(saved).flat().some(value=>value!==0)){
    // Close the loop through the actual mesh, then reveal the neutral PNGs.
    // Never replace a posed silhouette with the neutral artwork in one frame.
    restoringPose=true;art.dataset.workflowPoseHandoff='returning';rigHost.inert=true;rigHost.style.pointerEvents='none';
    let started;
    const tick=now=>{
     poseFrame=0;if(disposed||token!==version)return;
     if(started===undefined)started=now;
     const progress=Math.min(1,(now-started)/500);rig.render(workflowPoseFrame(saved,1-progress));
     if(progress<1)poseFrame=requestAnimationFrame(tick);
     else{restoringPose=false;delete art.dataset.workflowPoseHandoff;expand();notifySettled();}
    };
    poseFrame=requestAnimationFrame(tick);
   }else expand();
  }else if(next===1&&motion&&stack.style.opacity!=='0'){
   // Collect first, then expose the exact same-coordinate rig and its mesh.
   rigHost.style.opacity='0';rigHost.style.pointerEvents='none';rigHost.inert=true;stack.style.opacity='1';
   const flights=layout.map((item,i)=>move(images[i],item.assembled,true,1000,i%5*45));
   const last=flights[4]||flights.at(-1);
   if(last)last.after=()=>handoff(token);
  }else{
   for(const [i,item]of layout.entries())images[i].style.transform=item.assembled;
   exposeRig();
  }
  notifySettled();
 }
 // One physical scroll coordinate is the only playhead. Reversing the page
 // samples the same PNG transforms and the same saved-pose blend; no reverse
 // timer, completion callback or fresh neutral character is introduced.
 function seek(progress,{force=false}={}){
  if(disposed)return;
  const p=reduced.matches?1:Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
  if(p===scrollProgress&&!force)return;
  if(scrollProgress===null){cancel(false);scrollPose=rig.exportPose().pose;}
  else if(scrollProgress===1&&p<1)scrollPose=rig.exportPose().pose;
  scrollProgress=p;
  const layout=project(),sample=workflowScrollFrame(p);
  art.dataset.workflowProgress=p.toFixed(4);art.dataset.workflowShot=sample.shot;
  camera.dataset.workflowCameraPose=sample.shot;
  camera.style.transform=sample.camera;
  for(const [i,item]of layout.entries()){
   // A small layer-order offset retains the authored depth without creating
   // dead scroll holds. Every image is exactly at its source bbox by 0.58.
   const q=workflowPoseFrame({amount:1},Math.max(0,Math.min(1,(p-i%5*.015)/(.58-i%5*.015)))).amount;
   const [x,y,z,rotation]=item.offsets.map(value=>value*(1-q));
   images[i].style.transform=`translate3d(${x.toFixed(3)}px, ${y.toFixed(3)}px, ${z.toFixed(3)}px) rotateY(${rotation.toFixed(3)}deg)`;
  }
  const live=p>=.58;
  stack.style.opacity=live?'0':'1';rigHost.style.opacity=live?'1':'0';
  rigHost.style.pointerEvents=p===1?'':'none';rigHost.inert=p!==1;
  if(live){
   if(p===1)rig.render();else rig.render(workflowPoseFrame(scrollPose,sample.pose));
  }
 }
 const observer=new ResizeObserver(()=>{
  if(disposed)return;
  const rect=art.getBoundingClientRect();
  if(Math.max(1,rect.width)===layoutWidth&&Math.max(1,rect.height)===layoutHeight)return;
  if(scrollProgress!==null){seek(scrollProgress,{force:true});return;}
  // The initial/same-size notification is not a completed shot. A real resize
  // retargets unfinished motion, preserving its pending completion subscriber.
  show(shot,{selected:part,animate:!isSettled()});
 });observer.observe(art);
 return {show,seek,whenSettled(listener){if(disposed)return()=>{};if(isSettled()){listener();return()=>{};}settledListeners.add(listener);return()=>settledListeners.delete(listener);},stop(){cancel();if(shot!==0)exposeRig();notifySettled();},async decode(){await Promise.all(images.map(image=>image.decode?.()));},destroy(){disposed=true;cancel(false);settledListeners.clear();observer.disconnect();stack.replaceChildren();delete art.dataset.workflowLayerCount;delete art.dataset.workflowShot;delete art.dataset.workflowProgress;delete camera.dataset.workflowCameraPose;camera.style.transform='';rigHost.style.opacity='';rigHost.style.pointerEvents='';rigHost.inert=false;stack.style.opacity='';}};
}

export function workflowScrollFrame(progress){
 const p=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));
 const ease=value=>workflowPoseFrame({value:1},Math.max(0,Math.min(1,value))).value;
 const collect=ease(p/.58),depart=ease((p-.72)/.28),focus=ease((p-.4)/.25)*(1-depart);
 return {shot:p<.58?'layers':p<1?'link':'control',pose:Math.max(0,Math.min(1,(p-.72)/.28)),
  camera:`perspective(1400px) translate(${(-7*focus).toFixed(4)}%, ${(-focus).toFixed(4)}%) rotateX(${(7*(1-collect)).toFixed(4)}deg) rotateY(${(-12*(1-collect)).toFixed(4)}deg) scale(${(.88+.12*collect+.13*focus).toFixed(5)})`};
}

export function workflowScrollProgress({top,height},pinHeight,{inset=84,paddingTop=48,paddingBottom=64}={}){
 const travel=Math.max(1,height-paddingTop-paddingBottom-pinHeight);
 return Math.max(0,Math.min(1,(inset-top-paddingTop)/(travel*.85)));
}

// A single introduction: the next shot follows the actual completed movement,
// with no reading holds or repeat timer. The final shot belongs to the visitor.
export function createWorkflowTour({onStep,onState,whenSettled=done=>{done();return()=>{};}}){
 let unsubscribe=null,running=false,started=false,disposed=false,step=0,version=0,shotVersion=0;
 function stop(reason='user'){
  version++;
  unsubscribe?.();unsubscribe=null;
  const wasRunning=running;running=false;if(wasRunning)onState(reason);
 }
 function enter(token){
  if(disposed||!running||token!==version)return;
  const current=step,last=current===workflowViews.length-1,shotToken=++shotVersion;
  const currentShot=()=>!disposed&&running&&token===version&&shotToken===shotVersion;
  function advance(){
   if(!currentShot())return;
   unsubscribe?.();unsubscribe=null;
   if(last){stop('complete');return;}
   step++;enter(token);
  }
  onStep(current);if(!currentShot())return;
  const release=whenSettled(advance);
  if(currentShot())unsubscribe=release;else release?.();
 }
 return {
  get running(){return running;},
  get started(){return started;},
  start(){
   if(disposed||started)return;started=true;running=true;step=0;const token=version;
   onState('playing');enter(token);
  },
  stop,
  skip(reason='user'){if(disposed)return;const wasStarted=started;started=true;const wasRunning=running;stop(reason);if(!wasRunning&&!wasStarted)onState(reason);},
  destroy(){stop('disposed');disposed=true;},
 };
}

const workflowMounts=new WeakMap();
function mountWorkflowScroll(root,{loadCharacter,loadManifest}){
 const art=root.querySelector('[data-workflow-art]'),pin=root.querySelector('[data-workflow-pin]');
 const rigHost=root.querySelector('[data-workflow-rig-host]'),camera=root.querySelector('[data-workflow-camera]'),stack=root.querySelector('[data-workflow-layer-stack]');
 const status=root.querySelector('[data-workflow-status]'),retry=root.querySelector('[data-workflow-retry]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),life=new AbortController();
 const win=root.ownerDocument?.defaultView||(typeof window==='undefined'?null:window);
 let element,rig,cinema,disposed=false,loading=false,version=0,frame=0,forceFrame=false,visible=false,progress=null,mode=null,selected='fore-l';
 function cancelFrame(){if(frame)cancelAnimationFrame(frame);frame=0;forceFrame=false;}
 function geometry(){
  const rootStyle=typeof getComputedStyle==='function'?getComputedStyle(root):null,pinStyle=typeof getComputedStyle==='function'?getComputedStyle(pin):null;
  const number=(value,fallback)=>Number.isFinite(parseFloat(value))?parseFloat(value):fallback;
  return workflowScrollProgress(root.getBoundingClientRect(),pin.getBoundingClientRect().height,{inset:number(pinStyle?.top,84),paddingTop:number(rootStyle?.paddingTop,48),paddingBottom:number(rootStyle?.paddingBottom,64)});
 }
 function sync(force=false){
  if(disposed||!rig||art.dataset.ready!=='true'||document.hidden)return;
  if(!visible&&!reduced.matches)return;
  const next=reduced.matches?1:geometry();
  if(next===progress&&!force)return;
  progress=next;const state=workflowScrollFrame(next),nextMode=next===1?'control':next>=.58?'link':'layers';
  // During a sampled camera frame this owner renders the mesh directly. A
  // component visibility wake must not replace that sample with state.pose.
  rig.setActive?.(next===1);
  if(nextMode!==mode){
   mode=nextMode;
   const interaction=next===1?'drag':'none';element.setAttribute('interaction',interaction);
   rig.configure({interaction,showControls:next>=.58,showLabels:false,showMesh:next>=.58});
  }
  cinema.seek(next,{force});
  root.dataset.workflowStep=next===1?'2':next>=.58?'1':'0';root.dataset.workflowProgress=next.toFixed(4);
  root.dataset.workflowTour=reduced.matches?'reduced':next===1?'control':'scroll';
  status.textContent=next===1?'拖动彩色控制器，试试动作。':state.shot==='link'?'图层归位，连接骨骼与控制器。':'向下滚动，让每一层回到角色中。';
 }
 function schedule(force=false){if(force===true)forceFrame=true;if(disposed||frame||document.hidden)return;frame=requestAnimationFrame(()=>{frame=0;const forced=forceFrame;forceFrame=false;sync(forced);});}
 function fail(){
  if(disposed)return;version++;loading=false;cancelFrame();cinema?.destroy();cinema=null;rig=null;element?.remove();element=null;progress=null;mode=null;
  delete art.dataset.ready;root.dataset.workflowReady='error';root.dataset.workflowTour='error';retry.hidden=false;retry.disabled=false;
  status.textContent='交互未能加载，保留预览。可重新加载角色。';
 }
 function rigError(event){if(event.target===element&&!disposed)fail();}
 async function load(){
  if(disposed||loading||rig)return;loading=true;retry.disabled=true;const token=++version;root.dataset.workflowReady='loading';
  status.textContent='正在加载可交互图层…';
  try{
   const [,manifest]=await Promise.all([loadCharacter(),loadManifest(life.signal)]);if(disposed||token!==version)return;
   if(manifest.parts?.length!==26||!Array.isArray(manifest.camera))throw Error('角色分层数据不完整');
   const instance=document.createElement('character-rig');element=instance;
   instance.setAttribute('src','/riglab-project/rig.json');instance.setAttribute('interaction','none');instance.setAttribute('controls','visible');
   instance.setAttribute('aria-label','随滚动展开与绑定的同一角色，完成后可拖动控制器');rigHost.append(instance);
   const readyRig=await instance.ready;if(disposed||token!==version||element!==instance||!readyRig)return;rig=readyRig;
   rig.setMode('assembled');
   const readyCinema=createWorkflowCinema({art,camera,stack,rigHost,rig,manifest,reduced});cinema=readyCinema;
   await readyCinema.decode();if(disposed||token!==version||element!==instance||rig!==readyRig||cinema!==readyCinema)return;
   art.dataset.ready='true';root.dataset.workflowReady='true';retry.hidden=true;retry.disabled=false;
   // A preload outside the viewport still has an authored, fully expanded
   // starting frame. First entry samples the current physical scroll position.
   mode=null;progress=null;
   rig.configure({interaction:'none',showControls:false,showLabels:false,showMesh:false});
   cinema.seek(reduced.matches?1:0);sync(true);schedule(true);
  }catch(error){if(!disposed&&token===version)fail();}
  finally{if(token===version)loading=false;}
 }
 function click(event){if(event.target.closest?.('[data-workflow-retry]')===retry){retry.disabled=true;void load();}}
 function pickControl(event){
  if(disposed||progress!==1||!rig||event.isPrimary===false)return;
  const node=event.composedPath().find(item=>item?.dataset?.control);
  if(event.type==='pointerdown'&&!node?.ownerSVGElement?.hasPointerCapture(event.pointerId))return;
  if(event.type==='pointerdown')node?.focus?.({preventScroll:true});
  const part=workflowParts.find(item=>item.control===node?.dataset?.control);
  if(part&&part.id!==selected){selected=part.id;rig.selectPart(selected);root.dataset.workflowPart=selected;}
 }
 function visibility(){cancelFrame();if(!document.hidden){sync(true);schedule(true);}}
 function motionChange(){cancelFrame();progress=null;mode=null;sync(true);}
 const observer=new IntersectionObserver(entries=>{if(disposed)return;if(entries.some(entry=>entry.target===root&&entry.isIntersecting)){observer.disconnect();void load();}},{rootMargin:'250px'});observer.observe(root);
 const sceneObserver=new IntersectionObserver(entries=>{
  if(disposed)return;let latest;for(const entry of entries)if(entry.target===art)latest=entry;if(!latest)return;
  visible=latest.isIntersecting;if(!visible){cancelFrame();rig?.setActive?.(false);}else{sync(true);schedule(true);}
 },{threshold:[0,.65,1]});sceneObserver.observe(art);
 const resize=new ResizeObserver(()=>{if(disposed)return;schedule();});resize.observe(root);resize.observe(pin);
 root.addEventListener('click',click);rigHost.addEventListener('pointerdown',pickControl);rigHost.addEventListener('focusin',pickControl);rigHost.addEventListener('rig-error',rigError);
 document.addEventListener('visibilitychange',visibility);reduced.addEventListener('change',motionChange);
 win?.addEventListener('scroll',schedule,{passive:true});win?.addEventListener('resize',schedule);win?.addEventListener('pageshow',schedule);
 const cleanup=()=>{
  if(disposed)return;disposed=true;version++;loading=false;cancelFrame();life.abort();cinema?.destroy();observer.disconnect();sceneObserver.disconnect();resize.disconnect();element?.remove();
  root.removeEventListener('click',click);rigHost.removeEventListener('pointerdown',pickControl);rigHost.removeEventListener('focusin',pickControl);rigHost.removeEventListener('rig-error',rigError);
  document.removeEventListener('visibilitychange',visibility);reduced.removeEventListener('change',motionChange);
  win?.removeEventListener('scroll',schedule);win?.removeEventListener('resize',schedule);win?.removeEventListener('pageshow',schedule);
  delete root.dataset.workflowReady;delete root.dataset.workflowProgress;delete art.dataset.ready;workflowMounts.delete(root);
 };
 workflowMounts.set(root,cleanup);return cleanup;
}
export function mountWorkflow(host,{loadCharacter=()=>import('/character-rig.js'),loadManifest=async signal=>{
 const response=await fetch('/riglab-project/rig.json',{signal});if(!response.ok)throw Error('角色分层数据加载失败');return response.json();
}}={}){
 const root=host.querySelector('[data-duik-workflow]');if(!root)return ()=>{};
 workflowMounts.get(root)?.();
 if(root.hasAttribute('data-workflow-scroll'))return mountWorkflowScroll(root,{loadCharacter,loadManifest});
 const buttons=[...root.querySelectorAll('button[data-workflow-step]')];
 const art=root.querySelector('[data-workflow-art]'),poster=root.querySelector('[data-workflow-poster]');
 const rigHost=root.querySelector('[data-workflow-rig-host]'),status=root.querySelector('[data-workflow-status]');
 const copy=root.querySelector('[data-workflow-copy]'),reset=root.querySelector('[data-workflow-reset]');
 const parts=root.querySelector('[data-workflow-parts]'),linked=root.querySelector('[data-workflow-linked]');
 const retry=root.querySelector('[data-workflow-retry]');
 const camera=root.querySelector('[data-workflow-camera]'),stack=root.querySelector('[data-workflow-layer-stack]');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const life=new AbortController();
 let index=0,selected=workflowParts[0],element,rig,cinema,disposed=false,loading=false,loadVersion=0,sceneVisible=false,transition;
 let manual=false,selecting=false;
 const tour=createWorkflowTour({onStep:next=>{selecting=true;try{select(next,true,next===0);}finally{selecting=false;}},whenSettled:done=>cinema?cinema.whenSettled(done):(done(),()=>{}),onState:state=>{
  root.dataset.workflowTour=state;
  if(state!=='playing')cinema?.stop();
  if(state==='complete')applyRig();
 }});
 function syncAuto(){
  if(disposed)return;
  if(!rig||art.dataset.ready!=='true'||reduced.matches||!sceneVisible||document.hidden)return;
  if(tour.started||manual||root.querySelector('details[open]'))return;
  tour.start();
 }
 function fail(){
  loadVersion++;loading=false;
  tour.stop('error');transition?.cancel();cinema?.destroy();cinema=null;rig=null;element?.remove();element=null;
  delete art.dataset.ready;root.dataset.workflowReady='error';if(reset)reset.disabled=true;retry.hidden=false;
  status.textContent='交互未能加载，保留预览。可重新加载角色。';
 }
 function rigError(event){if(event.target===element&&rig&&!disposed)fail();}
 function showPart(animate=false){
  if(!rig)return;rig.selectPart(selected.id);
  for(const button of parts?.querySelectorAll('button')||[])button.setAttribute('aria-pressed',String(button.dataset.workflowPart===selected.id));
  linked?.replaceChildren(...rig.getParts().filter(part=>part.group===selected.group).map(part=>{
   const item=document.createElement('li'),img=document.createElement('img'),label=document.createElement('span');
   img.src=part.thumbnail||part.src;img.alt='';img.width=36;img.height=36;label.textContent=part.label;
   item.dataset.workflowLinkedPart=part.id;item.append(img,label);return item;
  }));root.dataset.workflowPart=selected.id;
  const count=root.querySelector('[data-workflow-linked-count]');if(count&&linked)count.textContent=String(linked.childNodes.length);
  if(animate)cinema?.show(index,{animate:true,selected:selected.id});
 }
 function applyRig(){
  if(!rig)return;const view=workflowViews[index];
  const interaction=index===2&&!tour.running?'drag':'none';
  // Keep the web component contract in sync with the core at handoff. Any
  // later attribute refresh must not restore its initial non-interactive mode.
  element?.setAttribute('interaction',interaction);
  rig.setMode(view.mode);rig.configure({interaction,showControls:view.controls,showLabels:false,showMesh:index>0});
  if(index>0)showPart();status.textContent=index===2?'拖动彩色控制器，试试动作。':view.hint;if(reset)reset.disabled=false;
 }
 function select(next,animate=false,expandFromRest=false){
  if(!workflowViews[next])return;index=next;const view=workflowViews[index];
  buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(index===i)));
  if(copy)copy.innerHTML=viewCopy(view);root.dataset.workflowStep=String(index);
  const details=root.querySelector('[data-workflow-detail]');if(details)details.innerHTML=detail(workflowSteps[index]);
  if(parts)parts.hidden=index===0;if(reset)reset.hidden=index!==2;
  poster.src='/duik-landing-assets/'+view.poster;poster.alt=index===0?'已确认角色的 26 张独立透明图层':'已确认角色与彩色控制器';
  applyRig();cinema?.show(index,{animate:animate&&sceneVisible&&!document.hidden,selected:selected.id,expandFromRest});transition?.cancel();
  if(animate&&!reduced.matches&&copy?.animate)transition=copy.animate([{opacity:.5,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:200,easing:'cubic-bezier(0.23, 1, 0.32, 1)'});
 }
 async function load(){
  if(loading||disposed||rig)return;loading=true;const token=++loadVersion;status.textContent='正在加载可交互图层…';
  try{
   const [,manifest]=await Promise.all([loadCharacter(),loadManifest(life.signal)]);if(disposed||token!==loadVersion)return;
   if(manifest.parts?.length!==26||!Array.isArray(manifest.camera))throw Error('角色分层数据不完整');
   element=document.createElement('character-rig');element.setAttribute('src','/riglab-project/rig.json');
   element.setAttribute('interaction','none');element.setAttribute('controls','visible');element.setAttribute('aria-label','分层、关联和控制同一角色');rigHost.append(element);
   const instance=element,readyRig=await instance.ready;if(disposed||token!==loadVersion||element!==instance||!readyRig)return;rig=readyRig;
   const readyCinema=createWorkflowCinema({art,camera,stack,rigHost,rig,manifest,reduced});cinema=readyCinema;
   await readyCinema.decode();if(disposed||token!==loadVersion||element!==instance||rig!==readyRig||cinema!==readyCinema)return;
   if(reduced.matches){tour.skip('reduced');index=2;}
   else if(tour.started&&!manual)index=2;
   select(index);art.dataset.ready='true';root.dataset.workflowReady='true';retry.hidden=true;syncAuto();
  }catch(error){if(!disposed&&token===loadVersion)fail();}
  finally{if(token===loadVersion)loading=false;}
 }
 function click(event){
  const button=event.target.closest('button');if(!button||!root.contains(button))return;
  if(button===retry){retry.hidden=true;void load();return;}
  takeover(event);
  if(button.hasAttribute('data-workflow-step')){tour.stop();select(Number(button.dataset.workflowStep),event.detail>0);if(!rig)void load();}
  if(button.hasAttribute('data-workflow-part')){tour.stop();selected=workflowParts.find(part=>part.id===button.dataset.workflowPart)||selected;showPart(index===1&&event.detail>0&&!reduced.matches&&sceneVisible&&!document.hidden);if(index===1&&event.detail===0)cinema?.show(index,{selected:selected.id});}
  if(button===reset&&rig){tour.stop();rig.reset(false);applyRig();cinema?.show(index,{selected:selected.id});}
 }
 function pickControl(event){
  if(index===0||!rig||event.type==='pointerdown'&&event.isPrimary===false)return;const controlNode=event.composedPath().find(node=>node?.dataset?.control),control=controlNode?.dataset.control;
  // The shared SVG captures an accepted drag before this event reaches us.
  // Rejected additional pointers must not change selection or keyboard focus.
  if(index===2&&event.type==='pointerdown'&&!controlNode?.ownerSVGElement?.hasPointerCapture(event.pointerId))return;
  // Core pointerdown prevents default focus. Transfer it before selectPart
  // rebuilds the glyphs, or the previous keyboard target would be restored.
  if(event.type==='pointerdown')controlNode?.focus?.({preventScroll:true});
  // Rendering controls restores focus; ignore that same-part focus event to avoid recursion.
  const part=workflowParts.find(part=>part.control===control);if(part&&part!==selected){selected=part;showPart();if(index===1)cinema?.show(index,{selected:selected.id});}
 }
 function key(event){
  const i=buttons.indexOf(event.target);if(i<0||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
  event.preventDefault();takeover(event);const n=event.key==='Home'?0:event.key==='End'?2:(i+(event.key==='ArrowRight'?1:2))%3;select(n);buttons[n].focus();if(!rig)void load();
 }
 function takeover(event){
  if(disposed||selecting||event.isPrimary===false)return;
  // Retrying a failed asset load is not a manual choice of the failed shot.
  if(event.target?.closest?.('[data-workflow-retry]')===retry)return;
  manual=true;
  if(tour.running)finishPresentation('user');else tour.skip('user');
 }
 function finishPresentation(reason){tour.skip(reason);select(2);transition?.cancel();}
 function disclosure(){
  if(root.querySelector('details[open]')){
   manual=true;
   if(tour.running)finishPresentation('user');
   else{tour.skip('user');cinema?.stop();transition?.cancel();}
  }else syncAuto();
 }
 function motionChange(){if(reduced.matches)finishPresentation('reduced');else syncAuto();}
 function visibility(){if(document.hidden){if(tour.running)finishPresentation('hidden');cinema?.stop();transition?.cancel();}else syncAuto();}
 root.addEventListener('click',click);root.addEventListener('keydown',key);rigHost.addEventListener('pointerdown',pickControl);rigHost.addEventListener('focusin',pickControl);reduced.addEventListener('change',motionChange);
 root.addEventListener('pointerdown',takeover);root.addEventListener('focusin',takeover);rigHost.addEventListener('rig-error',rigError);document.addEventListener('visibilitychange',visibility);
 root.addEventListener('toggle',disclosure,true);
 select(0);status.textContent=workflowViews[0].hint;root.dataset.workflowTour='idle';
 const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();void load();}},{rootMargin:'250px'});observer.observe(root);
 const sceneObserver=new IntersectionObserver(entries=>{
  if(disposed)return;
  // One delivery can contain both an exit and re-entry. Only the latest
  // record for this canvas owns visibility; old mounts must not write it.
  const enough=entry=>entry.isIntersecting&&entry.intersectionRatio>=.65;
  let latest,exited=false;for(const entry of entries)if(entry.target===art){latest=entry;if(!enough(entry))exited=true;}
  if(!latest)return;
  sceneVisible=enough(latest);
  // An exit cancels this generation even if the batch ends with a re-entry.
  if(exited){if(tour.running)finishPresentation('offscreen');cinema?.stop();transition?.cancel();}
  syncAuto();
 },{threshold:[0,.65,1]});sceneObserver.observe(art);
 const cleanup=()=>{if(disposed)return;disposed=true;loadVersion++;loading=false;life.abort();tour.destroy();cinema?.destroy();observer.disconnect();sceneObserver.disconnect();transition?.cancel();root.removeEventListener('click',click);root.removeEventListener('keydown',key);root.removeEventListener('pointerdown',takeover);root.removeEventListener('focusin',takeover);root.removeEventListener('toggle',disclosure,true);document.removeEventListener('visibilitychange',visibility);rigHost.removeEventListener('pointerdown',pickControl);rigHost.removeEventListener('focusin',pickControl);rigHost.removeEventListener('rig-error',rigError);reduced.removeEventListener('change',motionChange);element?.remove();delete root.dataset.workflowReady;delete art.dataset.ready;if(reset)reset.disabled=true;workflowMounts.delete(root);};
 workflowMounts.set(root,cleanup);return cleanup;
}
