import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setMaxListeners} from 'node:events';
import {parseFragment} from 'parse5';
import {MOTION_CINEMA_DURATION,MOTION_CINEMA_REDUCED_FRAME,MOTION_CINEMA_MIN_VISIBLE,cinemaPath,cinemaLayerMatrix,sampleMotionCinema,motionCinemaMarkup,mountMotionCinema} from '../components/home/landing/motion-cinema.mjs';

const elements=node=>[node,...(node.childNodes||[]).flatMap(elements)];
const has=(node,key,value)=>node.attrs?.some(attr=>attr.name===key&&(value===undefined||attr.value===value));
const numericLeaves=value=>typeof value==='number'?[value]:value&&typeof value==='object'?Object.values(value).flatMap(numericLeaves):[];
const near=(a,b,tolerance=1e-6)=>assert(Math.abs(a-b)<tolerance,`${a} must stay close to ${b}`);

// Controlled DOM/event/clock tests. These execute the shipping mount function,
// but are not a substitute for the integrated browser's camera/visual review.
function harness({reduced=false}={}){
  const frames=new Map(),docHandlers=new Map(),winHandlers=new Map(),mediaHandlers=new Map(),observers=[];
  let nextFrame=0,now=0;
  const listen=(map,type,fn,options={})=>{const handlers=map.get(type)||new Set();handlers.add(fn);map.set(type,handlers);options.signal?.addEventListener('abort',()=>handlers.delete(fn),{once:true});};
  const doc={hidden:false,addEventListener:(type,fn,opts)=>listen(docHandlers,type,fn,opts)};
  const media={matches:reduced,addEventListener:(type,fn,opts)=>listen(mediaHandlers,type,fn,opts)};
  const win={innerHeight:960,innerWidth:1440,AbortController:class extends AbortController{constructor(){super();setMaxListeners(0,this.signal);}},matchMedia:()=>media,addEventListener:(type,fn,opts)=>listen(winHandlers,type,fn,opts),requestAnimationFrame(fn){const id=++nextFrame;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);},IntersectionObserver:class{constructor(callback){this.callback=callback;observers.push(this);}observe(target){this.target=target;}disconnect(){this.disconnected=true;}}};
  doc.defaultView=win;
  const build=(parsed,parent=null)=>{
    const attrs=Object.fromEntries((parsed.attrs||[]).map(attr=>[attr.name,attr.value])),handlers=new Map(),captures=new Set();
    const element={attrs,parent,handlers,ownerDocument:doc,isConnected:true,dataset:Object.fromEntries(Object.entries(attrs).filter(([key])=>key.startsWith('data-')).map(([key,value])=>[key.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase()),value])),textContent:(parsed.childNodes||[]).filter(n=>n.nodeName==='#text').map(n=>n.value).join(''),box:{left:30,right:1230,top:150,bottom:750,width:1200,height:600},getBoundingClientRect(){return this.box;},setAttribute(key,value){this.attrs[key]=String(value);},matches(selector){const match=selector.match(/^(\w+)?(?:\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\])?$/);return !!match&&(!match[1]||parsed.tagName===match[1])&&(!match[2]||(Object.hasOwn(this.attrs,match[2])&&(match[3]===undefined||this.attrs[match[2]]===match[3])));},closest(selector){return this.matches(selector)?this:this.parent?.closest(selector)||null;},querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);},querySelector(selector){return this.querySelectorAll(selector)[0]||null;},addEventListener(type,fn,opts){listen(handlers,type,fn,opts);},setPointerCapture(id){captures.add(id);},hasPointerCapture(id){return captures.has(id);},releasePointerCapture(id){captures.delete(id);},focus(){doc.activeElement=this;}};
    element.children=(parsed.childNodes||[]).filter(n=>n.tagName).map(child=>build(child,element));return element;
  };
  const root=build(parseFragment(motionCinemaMarkup()).childNodes.find(node=>node.tagName==='section'));
  const dispatch=(handlers,event)=>{for(const fn of [...(handlers.get(event.type)||[])])fn(event);};
  const emit=(type,target,extra={})=>{const event={type,target,preventDefault(){this.defaultPrevented=true;},...extra};for(let node=target;node;node=node.parent)dispatch(node.handlers,event);dispatch(docHandlers,event);return event;};
  const cleanup=mountMotionCinema(root);
  const tick=milliseconds=>{now+=milliseconds;const pending=[...frames.values()];frames.clear();pending.forEach(fn=>fn(now));};
  return {root,doc,win,media,cleanup,emit,tick,observers,control:selector=>root.querySelector(selector),get pending(){return frames.size;},frameCallbacks:()=>[...frames.values()],advance(milliseconds){for(let left=milliseconds;left>0;left-=40)tick(Math.min(40,left));},show(ratio=1){const observer=observers.at(-1);observer.callback([{target:observer.target,isIntersecting:ratio>0,intersectionRatio:ratio}]);},batch(ratios){const observer=observers.at(-1);observer.callback(ratios.map(ratio=>({target:observer.target,isIntersecting:ratio>0,intersectionRatio:ratio})));},background(hidden){doc.hidden=hidden;dispatch(docHandlers,{type:'visibilitychange'});},reduced(matches){media.matches=matches;dispatch(mediaHandlers,{type:'change',matches});},documentEvent(type,extra={}){dispatch(docHandlers,{type,...extra});},windowEvent(type,extra={}){dispatch(winHandlers,{type,target:win,...extra});}};
}

test('markup is one continuous scene with three real document exits and no transport',()=>{
  const markup=motionCinemaMarkup(),nodes=elements(parseFragment(markup));
  assert.equal(nodes.filter(n=>has(n,'data-cinema-svg')).length,1);
  assert.equal(nodes.filter(n=>has(n,'data-cinema-plane')).length,1);
  assert.equal(nodes.filter(n=>has(n,'data-cinema-layer')).length,6);
  assert.equal(nodes.filter(n=>n.tagName==='h2').length,1);
  assert.equal(nodes.filter(n=>n.tagName==='a').length,3);
  assert(nodes.filter(n=>n.tagName==='a').every(n=>n.attrs.some(a=>a.name==='href'&&a.value.startsWith('/docs/guide/'))));
  assert(!nodes.some(n=>['button','input','iframe','img'].includes(n.tagName)));
  assert(!nodes.some(n=>has(n,'role','tab')||has(n,'role','slider')||has(n,'role','progressbar')));
  assert(has(nodes.find(n=>has(n,'data-cinema-status')),'aria-live','off'));
  assert(markup.includes('网页原理示意'));assert(!markup.includes('播放'));
});

test('the easing changes timing on a shared closed path, not the scenery or endpoints',()=>{
  const a=cinemaPath(0),b=cinemaPath(1);near(a.x,b.x);near(a.y,b.y);
  const sample=sampleMotionCinema(1.4);assert(Math.abs(sample.plane.x-sample.reference.x)>20);
  for(let seconds=0;seconds<24;seconds+=.07){const value=sampleMotionCinema(seconds);assert(numericLeaves(value).every(Number.isFinite));assert(value.plane.x>=160&&value.plane.x<=1040);assert(value.plane.y>100&&value.plane.y<415);}
});

test('all geometric channels are continuous at chapter boundaries and at the loop seam',()=>{
  for(const point of [5.4,6,7.4,8,8.2,13,14.3,16,16.7,20.4,20.8,21,22,24]){
    const before=sampleMotionCinema(point-1e-7),after=sampleMotionCinema(point+1e-7);
    const a=numericLeaves({...before,time:0,plane:{...before.plane,angle:0},reference:{...before.reference,angle:0}});
    const b=numericLeaves({...after,time:0,plane:{...after.plane,angle:0},reference:{...after.reference,angle:0}});
    a.forEach((number,index)=>near(number,b[index],.001));
    for(const depth of [.08,.24,.43,.56,.62,.9])cinemaLayerMatrix(before,depth).forEach((number,index)=>near(number,cinemaLayerMatrix(after,depth)[index],.001));
  }
  assert.deepEqual(sampleMotionCinema(0),sampleMotionCinema(MOTION_CINEMA_DURATION));
  assert.deepEqual(sampleMotionCinema(0),sampleMotionCinema(NaN));
});

test('automation affects the same objects and camera separates the same depth-ordered layers',()=>{
  assert.equal(sampleMotionCinema(0).wind,0);assert.notEqual(sampleMotionCinema(10.3).wind,0);
  const sample=sampleMotionCinema(18.5);assert(sample.depth>.95);assert(sample.push>.2);
  const layers=[.08,.24,.43,.56,.62,.9].map(depth=>cinemaLayerMatrix(sample,depth));
  assert.equal(new Set(layers.map(JSON.stringify)).size,6);
  const nearLayer=cinemaLayerMatrix(sample,.9,{x:100,y:40}),farLayer=cinemaLayerMatrix(sample,.08,{x:100,y:40});
  near(nearLayer[4]-layers.at(-1)[4],90);near(farLayer[4]-layers[0][4],8);
});

test('the mounted plane, trees and layers remain identical DOM nodes through a whole loop',()=>{
  const h=harness(),plane=h.control('[data-cinema-plane]'),tree=h.control('[data-cinema-tree]'),layers=h.root.querySelectorAll('[data-cinema-layer]');
  h.show();h.tick(0);h.advance(25000);
  assert.equal(h.control('[data-cinema-plane]'),plane);assert.equal(h.control('[data-cinema-tree]'),tree);assert.deepEqual(h.root.querySelectorAll('[data-cinema-layer]'),layers);
  assert.equal(h.root.dataset.phase,'animation');near(Number(h.root.dataset.time),1,.001);assert.equal(h.root.dataset.playing,'true');assert.equal(h.pending,1);h.cleanup();
});

test('ordinary hover and focus cannot stall the automatic sequence',()=>{
  const h=harness(),stage=h.control('[data-cinema-stage]');h.show();h.tick(0);
  for(const type of ['pointerenter','pointerleave','focusin','focusout'])h.emit(type,stage);
  h.advance(500);assert.equal(h.root.dataset.playing,'true');assert.equal(h.root.dataset.time,'0.500');h.cleanup();
});

test('dragging the plane preserves the grab point and resumes smoothly on matching release',()=>{
  const h=harness(),plane=h.control('[data-cinema-plane]');h.show();h.tick(0);h.advance(950);
  const before=plane.attrs.transform,time=h.root.dataset.time;
  h.emit('pointerdown',plane,{button:0,pointerId:11,isPrimary:true,clientX:460,clientY:350});assert.equal(plane.attrs.transform,before);assert(plane.hasPointerCapture(11));
  h.emit('pointermove',plane,{pointerId:11,clientX:530,clientY:324});assert.notEqual(plane.attrs.transform,before);assert.equal(h.root.dataset.time,time);
  h.documentEvent('pointerup',{pointerId:99});assert.equal(h.root.dataset.playing,'false');assert(plane.hasPointerCapture(11));
  const held=plane.attrs.transform;h.documentEvent('pointerup',{pointerId:11});assert.equal(h.root.dataset.playing,'true');assert(!plane.hasPointerCapture(11));assert.equal(plane.attrs.transform,held);
  h.tick(0);assert.equal(plane.attrs.transform,held);h.advance(1200);
  const expected=sampleMotionCinema(Number(h.root.dataset.time));near(Number(h.root.dataset.planeX),expected.plane.x,.003);near(Number(h.root.dataset.planeY),expected.plane.y,.003);h.cleanup();
});

test('a second pointer cannot take over or end the first view gesture',()=>{
  const h=harness(),stage=h.control('[data-cinema-stage]');h.show();
  h.emit('pointerdown',stage,{button:0,pointerId:3,isPrimary:true,clientX:500,clientY:400});
  h.emit('pointerdown',stage,{button:0,pointerId:4,isPrimary:false,clientX:700,clientY:400});
  h.emit('pointermove',stage,{pointerId:4,clientX:800,clientY:400});assert.equal(h.root.dataset.viewX,'0.000');
  h.emit('pointermove',stage,{pointerId:3,clientX:570,clientY:430});assert.equal(h.root.dataset.viewX,'70.000');assert.equal(h.root.dataset.viewY,'30.000');
  const layers=h.root.querySelectorAll('[data-cinema-layer]').map(layer=>layer.attrs.transform);assert.equal(new Set(layers).size,6);
  h.documentEvent('pointercancel',{pointerId:4});assert.equal(h.root.dataset.playing,'false');h.documentEvent('pointercancel',{pointerId:3});assert.equal(h.root.dataset.playing,'true');h.cleanup();
});

test('drag deltas stay under the pointer during the perspective layer opening',()=>{
  const h=harness(),plane=h.control('[data-cinema-plane]');h.show();h.tick(0);h.advance(17000);
  const sample=sampleMotionCinema(Number(h.root.dataset.time)),[a,b,c,d]=cinemaLayerMatrix(sample,.56);
  const before={x:Number(h.root.dataset.planeX),y:Number(h.root.dataset.planeY)};
  h.emit('pointerdown',plane,{button:0,pointerId:19,isPrimary:true,clientX:400,clientY:350});h.emit('pointermove',plane,{pointerId:19,clientX:470,clientY:324});
  const dx=Number(h.root.dataset.planeX)-before.x,dy=Number(h.root.dataset.planeY)-before.y;
  near(a*dx+c*dy,70,.003);near(b*dx+d*dy,-26,.003);
  assert(h.root.querySelectorAll('[data-cinema-frame]').every(frame=>Number(frame.attrs.opacity)>.4));
  h.documentEvent('pointerup',{pointerId:19});assert.equal(h.root.dataset.playing,'true');h.cleanup();
});

test('keyboard input is immediate and releasing the last held key continues automatically',()=>{
  const h=harness(),stage=h.control('[data-cinema-stage]'),plane=h.control('[data-cinema-plane]');h.show();
  h.emit('keydown',stage,{key:'ArrowRight'});assert.equal(h.root.dataset.viewX,'18.000');assert.equal(h.root.dataset.playing,'false');
  h.emit('keydown',stage,{key:'ArrowUp'});h.documentEvent('keyup',{key:'ArrowRight'});assert.equal(h.root.dataset.playing,'false');h.documentEvent('keyup',{key:'ArrowUp'});assert.equal(h.root.dataset.playing,'true');
  const x=Number(h.root.dataset.planeX);h.emit('keydown',plane,{key:'ArrowLeft'});near(Number(h.root.dataset.planeX),x-18,.002);h.emit('focusout',plane);assert.equal(h.root.dataset.playing,'true');h.cleanup();
});

test('visibility uses the real aperture, rejects stale observers, and never catches up offscreen time',()=>{
  const h=harness(),stage=h.control('[data-cinema-stage]');stage.box={left:1300,right:2500,top:150,bottom:750,width:1200,height:600};h.show();assert.equal(h.pending,0);
  stage.box={left:30,right:1230,top:150,bottom:750,width:1200,height:600};h.show();h.tick(0);h.advance(200);const held=h.root.dataset.time;
  h.show(0);h.tick(8000);assert.equal(h.root.dataset.time,held);h.show();h.tick(10000);assert.equal(h.root.dataset.time,held);h.tick(40);assert.equal(h.root.dataset.time,'0.240');
  h.batch([0,1]);assert.equal(h.pending,1);const observer=h.observers[0],frame=h.frameCallbacks()[0];h.cleanup();observer.callback([{target:stage,isIntersecting:true,intersectionRatio:1}]);frame(20000);assert.equal(h.pending,0);assert.equal(h.root.dataset.playing,'false');
});

test('backgrounding cancels held input and freezes both the shot and its hand-back blend',()=>{
  const h=harness(),stage=h.control('[data-cinema-stage]');h.show();h.tick(0);h.advance(400);
  h.emit('pointerdown',stage,{button:0,pointerId:7,isPrimary:true,clientX:300,clientY:300});h.emit('pointermove',stage,{pointerId:7,clientX:375,clientY:300});h.background(true);
  assert(!stage.hasPointerCapture(7));assert.equal(h.pending,0);const time=h.root.dataset.time;
  h.documentEvent('pointerup',{pointerId:7});h.tick(5000);assert.equal(h.root.dataset.time,time);h.background(false);h.tick(5000);assert.equal(h.root.dataset.time,time);assert.equal(h.root.dataset.playing,'true');h.cleanup();
});

test('automatic entry requires both the observer and real aperture to reach 90 percent',()=>{
  assert.equal(MOTION_CINEMA_MIN_VISIBLE,.9);
  const h=harness(),stage=h.control('[data-cinema-stage]');
  h.show(.89);assert.equal(h.pending,0);assert.equal(h.root.dataset.playing,'false');
  stage.box={left:30,right:1230,top:-66,bottom:534,width:1200,height:600};
  h.show(.9);assert.equal(h.pending,0,'a stale 90% observer cannot override 89% real aperture');
  stage.box={...stage.box,top:-60,bottom:540};h.show(.9);
  assert.equal(h.pending,1);assert.equal(h.root.dataset.playing,'true');
  h.tick(0);h.advance(200);const held=h.root.dataset.time;
  stage.box={...stage.box,top:-66,bottom:534};h.tick(40);
  assert.equal(h.pending,0);assert.equal(h.root.dataset.time,held,'RAF also checks the current aperture');h.cleanup();
});

test('resize uses the same 89 percent stopped and 90 percent running boundary',()=>{
  const h=harness(),stage=h.control('[data-cinema-stage]');h.show();h.tick(0);h.advance(200);
  stage.box={left:30,right:1230,top:-66,bottom:534,width:1200,height:600};h.windowEvent('resize');
  const held=h.root.dataset.time;assert.equal(h.pending,0);assert.equal(h.root.dataset.playing,'false');
  h.tick(8000);stage.box={...stage.box,top:-60,bottom:540};h.windowEvent('resize');
  assert.equal(h.pending,1);assert.equal(h.root.dataset.playing,'true');h.tick(8000);assert.equal(h.root.dataset.time,held);h.cleanup();
});

test('persisted return does not resume at 89 percent but does resume at 90 percent',()=>{
  const h=harness(),stage=h.control('[data-cinema-stage]');h.show();h.tick(0);h.advance(200);
  const held=h.root.dataset.time;h.windowEvent('pagehide',{persisted:true});
  stage.box={left:30,right:1230,top:-66,bottom:534,width:1200,height:600};h.windowEvent('pageshow',{persisted:true});
  assert.equal(h.pending,0);assert.equal(h.root.dataset.playing,'false');assert.equal(h.root.dataset.time,held);
  h.windowEvent('pagehide',{persisted:true});stage.box={...stage.box,top:-60,bottom:540};h.windowEvent('pageshow',{persisted:true});
  assert.equal(h.pending,1);assert.equal(h.root.dataset.playing,'true');h.tick(9000);assert.equal(h.root.dataset.time,held);h.cleanup();
});

test('reduced motion shows a readable camera endpoint and retains direct controls without a loop',()=>{
  const h=harness({reduced:true}),stage=h.control('[data-cinema-stage]');h.show();assert.equal(h.root.dataset.time,MOTION_CINEMA_REDUCED_FRAME.toFixed(3));assert.equal(h.root.dataset.phase,'reduced');assert.equal(h.pending,0);assert(h.control('[data-cinema-status]').textContent.includes('景深'));
  h.emit('keydown',stage,{key:'ArrowRight'});h.documentEvent('keyup',{key:'ArrowRight'});h.advance(2000);assert.equal(h.root.dataset.viewX,'18.000');assert.equal(h.pending,0);
  h.reduced(false);assert.equal(h.root.dataset.playing,'true');h.tick(0);h.tick(40);h.reduced(true);assert.equal(h.root.dataset.time,MOTION_CINEMA_REDUCED_FRAME.toFixed(3));assert.equal(h.pending,0);h.cleanup();
});

test('BFCache returns re-evaluate visibility, while final pagehide rejects every queued restart',()=>{
  const h=harness();h.show();h.windowEvent('pagehide',{persisted:true});assert.equal(h.pending,0);h.show();assert.equal(h.pending,0);h.windowEvent('pageshow',{persisted:true});assert.equal(h.pending,1);
  h.windowEvent('pagehide',{persisted:false});h.show();h.reduced(false);h.background(false);h.windowEvent('pageshow',{persisted:true});assert.equal(h.pending,0);assert.equal(h.root.dataset.playing,'false');h.cleanup();
});

test('remount and cleanup isolate generations, gestures and scheduled frames',()=>{
  const h=harness(),stage=h.control('[data-cinema-stage]');h.show();const oldObserver=h.observers[0],oldFrame=h.frameCallbacks()[0];
  h.emit('pointerdown',stage,{button:0,pointerId:12,isPrimary:true,clientX:400,clientY:300});const cleanup=mountMotionCinema(h.root);assert(!stage.hasPointerCapture(12));h.show();
  oldObserver.callback([{target:stage,isIntersecting:false,intersectionRatio:0}]);oldFrame(99);assert.equal(h.root.dataset.playing,'true');assert.equal(h.pending,1);
  h.cleanup();assert.equal(h.root.dataset.playing,'true');cleanup();assert.equal(h.pending,0);assert.equal(h.root.dataset.cinemaMounted,undefined);
});

test('zero-size pointer input and real window blur are bounded without passive element blur pauses',()=>{
  const h=harness(),stage=h.control('[data-cinema-stage]'),svg=h.control('[data-cinema-svg]');h.show();svg.box={width:0,height:0,left:0,top:0};h.emit('pointerdown',stage,{button:0,pointerId:5,isPrimary:true,clientX:20,clientY:20});assert.equal(h.root.dataset.playing,'true');
  h.emit('keydown',stage,{key:'ArrowRight'});h.windowEvent('blur',{target:stage});assert.equal(h.root.dataset.playing,'false');h.windowEvent('blur');assert.equal(h.root.dataset.playing,'true');h.cleanup();
});

test('the composition preserves a wide frame and scales the whole scene for short desktop viewports',async()=>{
  const css=await readFile(new URL('../components/home/landing/motion-cinema.css',import.meta.url),'utf8');
  assert(css.includes('aspect-ratio:2/1'));assert(css.includes('calc((100svh - 250px)*2)'));
  assert(css.includes('@media(max-width:767px)'));assert(css.includes('prefers-reduced-motion'));assert(!css.includes('transition:all'));assert(!css.includes('grid-template-columns'));
});
