import {solveTwoBone} from './rig-vendor/rev2d-ik.js';
import {renderControllers,CONTROLLER_STYLE} from './rig-controller-overlay.js';
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), rad=x=>x*Math.PI/180;
const I=()=>[1,0,0,1,0,0];
const point=(m,p)=>[m[0]*p[0]+m[2]*p[1]+m[4],m[1]*p[0]+m[3]*p[1]+m[5]];
const multiply=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
function rotation(p,degrees){const c=Math.cos(rad(degrees)),s=Math.sin(rad(degrees));return [c,s,-s,c,p[0]-c*p[0]+s*p[1],p[1]-s*p[0]-c*p[1]];}
function segment(a,b,ta,tb){const angle=Math.atan2(tb[1]-ta[1],tb[0]-ta[0])-Math.atan2(b[1]-a[1],b[0]-a[0]);const c=Math.cos(angle),s=Math.sin(angle);return [c,s,-s,c,ta[0]-c*a[0]+s*a[1],ta[1]-s*a[0]-c*a[1]];}
const initial=()=>({rootX:0,rootY:0,body:0,head:0,wristL:0,wristR:0,blink:0,gaze:0,brow:0,smile:0,hair:0,hairL:0,hairR:0,handL:[0,0],handR:[0,0]});

/** One rendering implementation shared by the workbench and embeddable element. */
export async function mountCharacterRig({elements,manifestURL,onChange=()=>{},onError=()=>{},signal,interaction:initialInteraction='drag',controls=true}){
 const $=id=>elements[id],NS='http://www.w3.org/2000/svg';
 for(const name of ['stage','rigCanvas','controls','sourceImage','stageLabels'])if(!$(name))throw Error('Missing rig element: '+name);
 const state={pose:initial(),mode:'assembled',playing:false,animation:'idle',visible:new Set(),selected:'torso',showControls:controls,showLabels:false,showMesh:false,overlay:false};
 let rig,gl,program,positionBuffer,sourceBuffer,loc={},camera=[-160,-80,1632,1399],renderedPose=initial(),matrices=[],arms={},positions,resources=[],supports=[],dirty=true,frame=0,blinkStart=null,animationStart=0;
 let destroyed=false,active=true,raf=0,resizeObserver,drag=null,interaction=initialInteraction,layoutDirty=true;
 const life=new AbortController(),allocated={textures:[],buffers:[],shaders:[]},reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const hover={x:0,y:0,tx:0,ty:0};
 const on=(target,type,listener)=>target.addEventListener(type,listener,{signal:life.signal});
 const assertAlive=()=>{if(destroyed||life.signal.aborted)throw new DOMException('Rig has been destroyed','AbortError');};
 const canDrag=()=>interaction==='drag'||interaction==='both';
 const canHover=()=>interaction==='hover'||interaction==='both';
 function clearHover(){hover.x=hover.y=hover.tx=hover.ty=0;}
 function requestRender(){dirty=true;if(!destroyed&&active&&!raf&&rig&&gl)raf=requestAnimationFrame(tick);}
 function stop(){if(state.playing)state.pose=structuredClone(renderedPose);state.playing=false;}
 function cancelDrag(pointerId){if(!drag||(pointerId!==undefined&&pointerId!==drag.id))return;const id=drag.id;drag=null;const el=$('controls');try{if(el.hasPointerCapture(id))el.releasePointerCapture(id);}catch(error){if(error.name!=='NotFoundError')throw error;}}
 function destroy(){if(destroyed)return;destroyed=true;cancelDrag();life.abort();signal?.removeEventListener('abort',destroy);cancelAnimationFrame(raf);raf=0;resizeObserver?.disconnect();if(gl){for(const t of allocated.textures)gl.deleteTexture(t);for(const b of allocated.buffers)gl.deleteBuffer(b);for(const s of allocated.shaders)gl.deleteShader(s);if(program)gl.deleteProgram(program);}resources=[];supports=[];$('controls').replaceChildren();}
 if(signal?.aborted){destroy();assertAlive();}signal?.addEventListener('abort',destroy,{once:true});
 const sliderDefs=[['body','上身倾斜',-4,4,.1,'°'],['head','头部倾斜',-8,8,.1,'°'],['wristL','抬起手腕',-18,18,.1,'°'],['blink','闭眼',0,1,.01,'%'],['gaze','视线左右',-1,1,.01,''],['brow','眉毛抬起',-1,1,.01,''],['smile','微笑幅度',0,1,.01,''],['hair','发梢摆动',-3,3,.1,'°']];

 function svg(tag,attrs,parent=$('controls')){const el=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,String(v));parent.append(el);return el;}
function loadImage(src){return new Promise((resolve,reject)=>{const img=new Image();const cancel=()=>{img.src='';reject(new DOMException('Rig loading cancelled','AbortError'));};const done=()=>life.signal.removeEventListener('abort',cancel);img.onload=()=>{done();resolve(img);};img.onerror=()=>{done();reject(new Error('图片加载失败：'+src));};if(life.signal.aborted){cancel();return;}life.signal.addEventListener('abort',cancel,{once:true});img.src=src;});}
function shader(type,source){const s=gl.createShader(type);allocated.shaders.push(s);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function setupGL(){gl=$('rigCanvas').getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,preserveDrawingBuffer:true});if(!gl)throw Error('当前浏览器不支持 WebGL，请启用硬件加速。不会回退为单张假绑定图片。');
program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,'attribute vec2 a_position;attribute vec2 a_source;uniform vec4 u_camera;uniform vec4 u_bbox;varying vec2 v_uv;void main(){vec2 p=(a_position-u_camera.xy)/u_camera.zw;gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,0.0,1.0);v_uv=(a_source-u_bbox.xy)/u_bbox.zw;}'));
gl.attachShader(program,shader(gl.FRAGMENT_SHADER,'precision highp float;uniform sampler2D u_image;varying vec2 v_uv;void main(){if(v_uv.x<0.0||v_uv.y<0.0||v_uv.x>1.0||v_uv.y>1.0)discard;gl_FragColor=texture2D(u_image,v_uv);}'));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));gl.useProgram(program);
for(const n of ['a_position','a_source'])loc[n]=gl.getAttribLocation(program,n);for(const n of ['u_camera','u_bbox','u_image'])loc[n]=gl.getUniformLocation(program,n);
positionBuffer=gl.createBuffer();sourceBuffer=gl.createBuffer();allocated.buffers.push(positionBuffer,sourceBuffer);gl.bindBuffer(gl.ARRAY_BUFFER,sourceBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(rig.vertices.flatMap(v=>v.slice(0,2))),gl.STATIC_DRAW);gl.enableVertexAttribArray(loc.a_source);gl.vertexAttribPointer(loc.a_source,2,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(loc.a_position);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.uniform1i(loc.u_image,0);
on($('rigCanvas'),'webglcontextlost',e=>{e.preventDefault();active=false;cancelAnimationFrame(raf);raf=0;onError(new Error('WebGL 上下文已丢失，请重新挂载角色'));});}
async function textureResource(p){const img=await loadImage(p.src);assertAlive();const texture=gl.createTexture();allocated.textures.push(texture);gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);const index=gl.createBuffer();allocated.buffers.push(index);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(p.indices),gl.STATIC_DRAW);return {...p,texture,index,image:img};}
function setMatrices(p){const j=rig.joints,root=[1,0,0,1,p.rootX,p.rootY],body=multiply(root,rotation(j.body,p.body)),neck=multiply(body,rotation(j.neck,p.head*.25)),head=multiply(neck,rotation(j.head,p.head*.75));matrices=[root,body,neck,head];arms={};
for(const side of ['r','l']){const rest=rig.joints[side],s=point(body,rest.shoulder),e=point(body,rest.elbow),w=point(body,rest.wrist),offset=p[side==='l'?'handL':'handR'];const target=[w[0]+offset[0],w[1]+offset[1]];const result=solveTwoBone(s,e,w,target,s);arms[side]=result;const upper=segment(rest.shoulder,rest.elbow,s,result.elbow),fore=segment(rest.elbow,rest.wrist,result.elbow,result.wrist),hand=multiply(fore,rotation(rest.wrist,p[side==='l'?'wristL':'wristR']));matrices.push(upper,fore,hand);}}
function skinVertex(v,x=v[0],y=v[1]){let px=0,py=0,total=0;for(let i=0;i<10;i++){const w=v[i+2];if(!w)continue;const m=matrices[i];px+=w*(m[0]*x+m[2]*y+m[4]);py+=w*(m[1]*x+m[3]*y+m[5]);total+=w;}return [px/(total||1),py/(total||1)];}
function hairOffset(v,p){let dx=0,dy=0;for(const field of rig.hairFields){const weight=Math.exp(-((v[0]-field.center[0])**2/field.radius[0]**2+(v[1]-field.center[1])**2/field.radius[1]**2)),value=p.hair+p[field.control];dx+=weight*value*field.vector[0];dy+=weight*value*field.vector[1];}return [dx,dy];}
function deform(p){setMatrices(p);positions=new Float32Array(rig.vertices.length*2);rig.vertices.forEach((v,i)=>{const h=hairOffset(v,p),q=skinVertex(v,v[0]+h[0],v[1]+h[1]);positions[i*2]=q[0];positions[i*2+1]=q[1];});}
function expressionPositions(part,p){const id=part.id,side=id.endsWith('-l')?'l':'r',isEye=/^(eye-|iris-|eye-support-)/.test(id),isIris=id.startsWith('iris-');if(!isEye&&!/^brow-/.test(id)&&id!=='mouth')return positions;
if(isEye&&!p.blink&&(!isIris||!p.gaze))return positions;if(id.startsWith('brow-')&&!p.brow)return positions;if(id==='mouth'&&!p.smile)return positions;
const pivot=isEye?rig.parts.find(x=>x.id==='eye-'+side).pivot:part.pivot;const out=new Float32Array(positions);
for(const i of new Set(part.indices)){const v=rig.vertices[i];let x=v[0],y=v[1];if(isEye){if(isIris)x+=p.gaze*4;y=pivot[1]+(y-pivot[1])*(1-.94*p.blink);}else if(id.startsWith('brow-'))y-=p.brow*7;else if(id==='mouth'){x=pivot[0]+(x-pivot[0])*(1+p.smile*.07);y=pivot[1]+(y-pivot[1])*(1+p.smile*.13);}const q=skinVertex(v,x,y);out[i*2]=q[0];out[i*2+1]=q[1];}return out;}
function explodedPositions(part,index){const cellW=270,cellH=255,col=index%6,row=Math.floor(index/6);const [x0,y0,x1,y1]=part.visualBBox||part.bbox,s=Math.min(210/(x1-x0),195/(y1-y0),1.4);const cx=-140+cellW*(col+.5),cy=-65+cellH*(row+.5);const out=new Float32Array(positions.length);rig.vertices.forEach((v,i)=>{out[i*2]=cx+(v[0]-(x0+x1)/2)*s;out[i*2+1]=cy+(v[1]-(y0+y1)/2)*s;});return out;}
function drawResource(p,pos){gl.bindBuffer(gl.ARRAY_BUFFER,positionBuffer);gl.bufferData(gl.ARRAY_BUFFER,pos,gl.DYNAMIC_DRAW);gl.vertexAttribPointer(loc.a_position,2,gl.FLOAT,false,0,0);gl.bindTexture(gl.TEXTURE_2D,p.texture);const [x0,y0,x1,y1]=p.bbox;gl.uniform4f(loc.u_bbox,x0,y0,x1-x0,y1-y0);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,p.index);gl.drawElements(gl.TRIANGLES,p.indices.length,gl.UNSIGNED_SHORT,0);}
// A canvas size write clears its drawing buffer, even when the value is unchanged.
// Queue measurement until a real draw so an inactive/offscreen rig keeps its last
// complete frame. Camera, SVG viewBox and bitmap then update in one render pass.
function layout(){layoutDirty=true;requestRender();}
function syncLayout(){if(!layoutDirty)return;layoutDirty=false;const stage=$('stage'),w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight),dpr=Math.min(devicePixelRatio,2),c=$('rigCanvas'),width=Math.round(w*dpr),height=Math.round(h*dpr);if(c.width!==width)c.width=width;if(c.height!==height)c.height=height;gl.viewport(0,0,c.width,c.height);const base=rig.camera,aspect=w/h;let cw=base[2],ch=base[3];if(aspect>cw/ch)cw=ch*aspect;else ch=cw/aspect;camera=[base[0]+(base[2]-cw)/2,base[1]+(base[3]-ch)/2,cw,ch];$('controls').setAttribute('viewBox',camera.join(' '));const img=$('sourceImage');img.style.left=(-camera[0]/cw*w)+'px';img.style.top=(-camera[1]/ch*h)+'px';img.style.width=(rig.canvas[0]/cw*w)+'px';img.style.height=(rig.canvas[1]/ch*h)+'px';}
function render(p=state.pose){if(destroyed)return;syncLayout();renderedPose=structuredClone(p);deform(p);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.uniform4fv(loc.u_camera,camera);const expressions=state.mode==='assembled'&&(p.blink!==0||p.gaze!==0||p.brow!==0||p.smile!==0);
for(let i=0;i<resources.length;i++){const part=resources[i];if(!state.visible.has(part.id))continue;
if(expressions&&part.id.startsWith('eye-')){const support=supports.find(x=>x.id==='eye-support-'+part.id.slice(-1));drawResource(support,expressionPositions(support,p));}
const pos=state.mode==='exploded'?explodedPositions(part,i):expressionPositions(part,p);drawResource(part,pos);if(expressions&&part.id==='face')drawResource(supports[0],positions);}
$('rigCanvas').style.visibility=state.mode==='source'?'hidden':'visible';$('sourceImage').hidden=!(state.mode==='source'||(state.overlay&&state.mode==='assembled'));$('sourceImage').style.opacity=state.mode==='source'?'1':'.35';updateControls();frame++;dirty=false;onChange(diagnostics());}
function updateControls(){const el=$('controls'),focused=el.getRootNode().activeElement?.closest('[data-control]')?.dataset.control;el.replaceChildren();$('stageLabels').replaceChildren();if(state.mode==='exploded'){resources.forEach((p,i)=>{const label=document.createElement('div');label.className='stage-label';const x=-140+270*(i%6+.5),y=-65+255*(Math.floor(i/6)+.5)+103;label.style.left=((x-camera[0])/camera[2]*100)+'%';label.style.top=((y-camera[1])/camera[3]*100)+'%';label.textContent=p.label;$('stageLabels').append(label);});return;}
if(state.mode!=='assembled')return;
if(state.showMesh){const p=resources.find(x=>x.id===state.selected);if(p&&state.visible.has(p.id)){const pos=expressionPositions(p,renderedPose);let d='';for(let i=0;i<p.indices.length;i+=3){const a=p.indices[i]*2,b=p.indices[i+1]*2,c=p.indices[i+2]*2;d+='M'+pos[a]+','+pos[a+1]+'L'+pos[b]+','+pos[b+1]+'L'+pos[c]+','+pos[c+1]+'Z';}svg('path',{d,fill:'none',stroke:'#c5ed9a','stroke-width':.7,opacity:.5});}}
if(state.showControls)renderControllers({root:el,rig,pose:renderedPose,arms,matrices,point,hairOffset,showLabels:state.showLabels});if(focused)el.querySelector('[data-control="'+focused+'"]')?.focus({preventScroll:true});}


 function sanitizePose(p){const clean={...initial(),...p};for(const key of Object.keys(initial())){if(key==='handL'||key==='handR'){if(!Array.isArray(clean[key])||clean[key].length!==2||!clean[key].every(Number.isFinite))throw Error('Invalid target');const d=Math.hypot(...clean[key]);clean[key]=clean[key].map(v=>v*(d>rig.motionLimits.handTargetRadius?rig.motionLimits.handTargetRadius/d:1));}else if(!Number.isFinite(clean[key]))throw Error('Invalid pose: '+key);}for(const [id,,min,max]of sliderDefs)clean[id]=clamp(clean[id],min,max);const m=rig.motionLimits;clean.wristR=clamp(clean.wristR,-m.wristDegrees,m.wristDegrees);clean.hairL=clamp(clean.hairL,-m.hairDegrees,m.hairDegrees);clean.hairR=clamp(clean.hairR,-m.hairDegrees,m.hairDegrees);clean.rootX=clamp(clean.rootX,-m.rootX,m.rootX);clean.rootY=clamp(clean.rootY,-m.rootY,m.rootY);return clean;}

 function localPointer(e){const r=$('controls').getBoundingClientRect();return [camera[0]+(e.clientX-r.left)/r.width*camera[2],camera[1]+(e.clientY-r.top)/r.height*camera[3]];}

 function bindInput(){
 on($('controls'),'pointerdown',e=>{const h=e.target.closest('[data-control]');if(!h||drag||!active||!state.showControls||state.mode!=='assembled'||!canDrag())return;stop();state.pose=structuredClone(renderedPose);clearHover();const p=localPointer(e);drag={name:h.dataset.control,start:p,pose:structuredClone(state.pose),id:e.pointerId};$('controls').setPointerCapture(e.pointerId);e.preventDefault();});
on($('controls'),'pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const p=localPointer(e),dx=p[0]-drag.start[0],dy=p[1]-drag.start[1],base=drag.pose;if(['root','globalMove'].includes(drag.name)){state.pose.rootX=clamp(base.rootX+dx,-rig.motionLimits.rootX,rig.motionLimits.rootX);state.pose.rootY=clamp(base.rootY+dy,-rig.motionLimits.rootY,rig.motionLimits.rootY);}else if(['head','direction'].includes(drag.name))state.pose.head=clamp(base.head+dx/7,-rig.motionLimits.headDegrees,rig.motionLimits.headDegrees);else if(['body','bodyGlobal'].includes(drag.name))state.pose.body=clamp(base.body-dx/16,-rig.motionLimits.bodyDegrees,rig.motionLimits.bodyDegrees);else if(drag.name==='gaze'){state.pose.gaze=clamp(base.gaze+dx/45,-1,1);state.pose.blink=clamp(base.blink+dy/60,0,1);}else if(drag.name==='smile')state.pose.smile=clamp(base.smile+dx/45,0,1);else if(drag.name.startsWith('hair'))state.pose[drag.name]=clamp(base[drag.name]+dx/14,-rig.motionLimits.hairDegrees,rig.motionLimits.hairDegrees);else {const target=[base[drag.name][0]+dx,base[drag.name][1]+dy],len=Math.hypot(...target);state.pose[drag.name]=target.map(v=>v*(len>rig.motionLimits.handTargetRadius?rig.motionLimits.handTargetRadius/len:1));}requestRender();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])on($('controls'),type,e=>cancelDrag(e.pointerId));
on($('controls'),'keydown',e=>{const h=e.target.closest('[data-control]');if(!h||!canDrag()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();stop();const dx=e.key==='ArrowLeft'?-5:e.key==='ArrowRight'?5:0,dy=e.key==='ArrowUp'?-5:e.key==='ArrowDown'?5:0,n=h.dataset.control;if(['root','globalMove'].includes(n)){state.pose.rootX+=dx;state.pose.rootY+=dy;}else if(['head','direction'].includes(n))state.pose.head+=dx/10;else if(['body','bodyGlobal'].includes(n))state.pose.body+=dx/10;else if(n==='gaze'){state.pose.gaze+=dx/40;state.pose.blink+=dy/50;}else if(n==='smile')state.pose.smile+=dx/50;else if(n.startsWith('hair'))state.pose[n]+=dx/15;else state.pose[n]=[state.pose[n][0]+dx,state.pose[n][1]+dy];state.pose=sanitizePose(state.pose);requestRender();});
 on($('stage'),'pointermove',e=>{if(!canHover()||drag||state.mode!=='assembled')return;const r=$('stage').getBoundingClientRect();hover.tx=clamp((e.clientX-r.left)/Math.max(1,r.width)*2-1,-1,1);hover.ty=clamp((e.clientY-r.top)/Math.max(1,r.height)*2-1,-1,1);requestRender();});
 on($('stage'),'pointerleave',()=>{hover.tx=hover.ty=0;requestRender();});
 on(reduced,'change',()=>{stop();clearHover();requestRender();});
 }
 function tick(now){raf=0;if(destroyed||!active)return;let p=state.pose;if(state.playing){const t=(now-animationStart)/1000;p=initial();p.body=Math.sin(t*1.3)*1.5;p.head=Math.sin(t*.9)*3;p.hair=Math.sin(t*1.7)*1.6;p.gaze=Math.sin(t*.6)*.45;p.brow=Math.sin(t*.8)*.18;p.handL=[Math.sin(t)*12,Math.sin(t*1.2)*18];p.handR=[Math.sin(t*.8)*7,Math.sin(t)*8];const cycle=t%4;p.blink=cycle>3.5&&cycle<3.8?Math.sin((cycle-3.5)/.3*Math.PI):0;if(state.animation==='wave'){const envelope=Math.min(1,t/.5);p.handL=[Math.sin(t*2.8)*45*envelope,-55*envelope+Math.sin(t*1.4)*15*envelope];p.wristL=Math.sin(t*4)*15*envelope;p.smile=.3*envelope;}dirty=true;}

 if(blinkStart!==null){const t=(now-blinkStart)/350;if(t>=1){blinkStart=null;p={...p,blink:state.pose.blink};}else p={...p,blink:Math.sin(t*Math.PI)};dirty=true;}
 const smoothing=reduced.matches?1:.22;hover.x+=(hover.tx-hover.x)*smoothing;hover.y+=(hover.ty-hover.y)*smoothing;
 if(Math.abs(hover.tx-hover.x)<.001)hover.x=hover.tx;if(Math.abs(hover.ty-hover.y)<.001)hover.y=hover.ty;
 if(canHover()&&!drag){p={...p,gaze:clamp(p.gaze+hover.x*.7,-1,1)};if(!reduced.matches)p={...p,head:p.head+hover.x*3,body:p.body-hover.x*.6,hair:p.hair+hover.x*.4};}
 if(dirty)render(sanitizePose(p));
 if(state.playing||blinkStart!==null||hover.x!==hover.tx||hover.y!==hover.ty)requestRender();
 }
 function diagnostics(){return {ready:!destroyed,destroyed,version:4,interaction,active,reducedMotion:reduced.matches,rafScheduled:Boolean(raf),controllerStyle:CONTROLLER_STYLE.id,source:rig.source,sourceSha256:rig.sourceSha256,motionLimits:rig.motionLimits,profile:rig.profile,partCount:rig.parts.length,vertexCount:rig.vertices.length,archive:rig.archive,selected:state.selected,showControls:state.showControls,showLabels:state.showLabels,showMesh:state.showMesh,overlay:state.overlay,visibleParts:[...state.visible],mode:state.mode,playing:state.playing,pose:structuredClone(renderedPose),arms:structuredClone(arms),finiteVertices:positions.every(Number.isFinite),restValidation:rig.validation,frames:frame,camera:[...camera],textureSources:resources.map(x=>x.src),supportSources:supports.map(x=>x.src),webglError:destroyed?0:gl.getError()};}

 try{
 if(!['none','drag','hover','both'].includes(interaction))throw Error('Unknown interaction mode');
 const url=new URL(manifestURL,location.href);if(url.origin!==location.origin)throw Error('绑定素材必须从当前站点本地加载');
 const response=await fetch(url,{cache:'no-store',signal:life.signal});if(!response.ok)throw Error('绑定数据加载失败 HTTP '+response.status);rig=await response.json();assertAlive();
 if(rig.profile!=='upper-body-2d-v1')throw Error('Unsupported rig profile');
 const asset=src=>{const u=new URL(src,url);if(u.origin!==location.origin)throw Error('角色资源必须同源');return u.href;};
 rig.source=asset(rig.source);rig.archive=asset(rig.archive);for(const p of [...rig.parts,...rig.eyeSupports,rig.faceSupport]){p.src=asset(p.src);if(p.thumbnail)p.thumbnail=asset(p.thumbnail);}
 const keys={body:'bodyDegrees',head:'headDegrees',wristL:'wristDegrees',hair:'hairDegrees'};for(const d of sliderDefs)if(keys[d[0]]){d[2]=-rig.motionLimits[keys[d[0]]];d[3]=rig.motionLimits[keys[d[0]]];}
 state.visible=new Set(rig.parts.map(p=>p.id));setupGL();resources=await Promise.all(rig.parts.map(textureResource));assertAlive();
 const facial=rig.parts.filter(p=>/^(eye-|iris-|brow-)/.test(p.id)||p.id==='mouth'),triangleKeys=new Set(),indices=[];for(const p of facial)for(let i=0;i<p.indices.length;i+=3){const tri=p.indices.slice(i,i+3),key=tri.join(',');if(!triangleKeys.has(key)){triangleKeys.add(key);indices.push(...tri);}}
 supports=await Promise.all([textureResource({id:'face-support',...rig.faceSupport,indices}),...rig.eyeSupports.map(textureResource)]);assertAlive();
 $('sourceImage').src=rig.source;bindInput();resizeObserver=new ResizeObserver(layout);resizeObserver.observe($('stage'));layout();render();
 const api={
  getState:diagnostics,
  getParts:()=>rig.parts.map(({id,label,group,thumbnail,src})=>({id,label,group,thumbnail,src})),
  getSliders:()=>structuredClone(sliderDefs),
  setPose(p){assertAlive();cancelDrag();stop();clearHover();state.pose=sanitizePose({...state.pose,...p});render();return diagnostics();},
  reset(full=true){assertAlive();cancelDrag();stop();clearHover();state.pose=initial();blinkStart=null;if(full){state.visible=new Set(rig.parts.map(p=>p.id));state.mode='assembled';state.overlay=false;}render();return diagnostics();},
  setMode(mode){assertAlive();if(!['assembled','exploded','source'].includes(mode))throw Error('Invalid mode');cancelDrag();stop();clearHover();state.mode=mode;render();},
  setVisible(id,visible){assertAlive();if(!rig.parts.some(p=>p.id===id))throw Error('Unknown part');visible?state.visible.add(id):state.visible.delete(id);render();},
  selectPart(id){assertAlive();if(!rig.parts.some(p=>p.id===id))throw Error('Unknown part');state.selected=id;render();},
  showAll(){state.visible=new Set(rig.parts.map(p=>p.id));render();},
  solo(){state.visible=new Set([state.selected]);render();},
  setControls(show){api.configure({showControls:show});},
  configure(options){assertAlive();if(options.interaction!==undefined){if(!['none','drag','hover','both'].includes(options.interaction))throw Error('Unknown interaction mode');interaction=options.interaction;clearHover();}for(const k of ['showControls','showLabels','showMesh','overlay'])if(k in options)state[k]=Boolean(options[k]);if(!canDrag()||!state.showControls)cancelDrag();render();},
  play(name='idle'){assertAlive();if(!['idle','wave'].includes(name))throw Error('Unknown animation');if(reduced.matches)return diagnostics();cancelDrag();state.mode='assembled';state.playing=true;state.animation=name;state.pose=initial();animationStart=performance.now();requestRender();return diagnostics();},
  pause(){assertAlive();stop();render();},
  blink(){assertAlive();stop();if(reduced.matches)return;blinkStart=performance.now();requestRender();},
  setActive(value){active=Boolean(value);if(active)requestRender();else{cancelDrag();cancelAnimationFrame(raf);raf=0;}},
  capture(){assertAlive();return $('rigCanvas').toDataURL('image/png');},
  exportPose:()=>({version:3,sourceSha256:rig.sourceSha256,pose:structuredClone(renderedPose)}),
  importPose(data){assertAlive();if(!data||!data.pose||typeof data.pose!=='object'||data.sourceSha256!==rig.sourceSha256)throw Error('姿态原图哈希不一致');return api.setPose(sanitizePose(data.pose));},
  destroy,render
 };
 return api;
 }catch(error){destroy();throw error;}
}
