import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {setMaxListeners} from 'node:events';
import {MOTION_KINDS, AUTOMATION_PRESETS, CAMERA_DURATION, animationStagePoint, animationTimeAtX, easing, pathPoint, sampleAnimation, sampleAutomation, cameraTransforms, sampleCameraTour, easePath, automationPath} from '../components/home/landing/motion-model.mjs';
import {renderMotion,mountMotion} from '../components/home/landing/motion-demo.mjs';
import {capabilityClasses,patchCapabilityLayoutRuntime,patchCapabilityLayoutSSR} from './lib/landing-capability-layout.mjs';
import {parseFragment} from 'parse5';
const elements=node=>[node,...(node.childNodes||[]).flatMap(elements)];
const has=(node,key,value)=>node.attrs?.some(attr=>attr.name===key&&(value===undefined||attr.value===value));

// A deliberately small DOM/event substitute for controller-unit tests. It does
// not render CSS, dispatch trusted browser input, or prove browser acceptance.
function motionHarness(kind){
  const frames=new Map(),events=[];let nextFrame=0,observer,observed;
  const listen=(map,type,fn,options={})=>{const listeners=map.get(type)||new Set();listeners.add(fn);map.set(type,listeners);options.signal?.addEventListener('abort',()=>listeners.delete(fn),{once:true});};
  const docHandlers=new Map(),mediaHandlers=new Map();
  const doc={hidden:false,addEventListener:(type,fn,options)=>listen(docHandlers,type,fn,options)};
  const media={matches:false,addEventListener:(type,fn,options)=>listen(mediaHandlers,type,fn,options)};
  const win={innerHeight:900,innerWidth:1440,AbortController:class extends AbortController{constructor(){super();setMaxListeners(0,this.signal);}},CustomEvent,matchMedia:()=>media,requestAnimationFrame(fn){const id=++nextFrame;frames.set(id,fn);return id;},cancelAnimationFrame(id){frames.delete(id);},IntersectionObserver:class{constructor(callback){observer=callback;}observe(target){observed=target;}disconnect(){observer=null;}}};
  doc.defaultView=win;
  const build=(parsed,parent=null)=>{
    const attrs=Object.fromEntries((parsed.attrs||[]).map(attr=>[attr.name,attr.value]));
    const handlers=new Map(),captures=new Set();
    const element={attrs,parent,handlers,ownerDocument:doc,dataset:Object.fromEntries(Object.entries(attrs).filter(([key])=>key.startsWith('data-')).map(([key,value])=>[key.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase()),value])),type:attrs.type,value:attrs.value,checked:Object.hasOwn(attrs,'checked'),hidden:Object.hasOwn(attrs,'hidden'),textContent:(parsed.childNodes||[]).filter(n=>n.nodeName==='#text').map(n=>n.value).join(''),box:{top:100,bottom:460,left:350,right:950,width:600,height:360},getBoundingClientRect(){return this.box;},setAttribute(key,value){this.attrs[key]=String(value);},matches(selector){const match=selector.match(/^(\w+)?(?:\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\])?$/);return !!match&&(!match[1]||parsed.tagName===match[1])&&(!match[2]||(Object.hasOwn(this.attrs,match[2])&&(match[3]===undefined||this.attrs[match[2]]===match[3])));},closest(selector){return this.matches(selector)?this:this.parent?.closest(selector)||null;},contains(target){return this===target||this.children.some(child=>child.contains(target));},querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);},querySelector(selector){return this.querySelectorAll(selector)[0]||null;},addEventListener(type,fn,options){listen(handlers,type,fn,options);},dispatchEvent(event){events.push(event);for(const fn of handlers.get(event.type)||[])fn(event);return true;},setPointerCapture(id){captures.add(id);},hasPointerCapture(id){return captures.has(id);},releasePointerCapture(id){captures.delete(id);},focus(){emit('focusin',this);}};
    element.children=(parsed.childNodes||[]).filter(child=>child.tagName).map(child=>build(child,element));return element;
  };
  const root=build(parseFragment(renderMotion(kind)).childNodes.find(node=>node.tagName==='section'));
  const emit=(type,target,extra={})=>{const event={type,target,detail:type==='click'?1:0,preventDefault(){this.defaultPrevented=true;},...extra};for(let node=target;node;node=node.parent)node.dispatchEvent(event);return event;};
  const cleanup=mountMotion(root,kind);
  return {root,events,cleanup,control:selector=>root.querySelector(selector),emit,documentEvent(type,extra={}){for(const fn of docHandlers.get(type)||[])fn({type,...extra});},preview(){observer([{target:observed,isIntersecting:true,intersectionRatio:1}]);},intersect(ratio){observer([{target:observed,isIntersecting:ratio>0,intersectionRatio:ratio}]);},visible(value){observer([{target:observed,isIntersecting:value,intersectionRatio:value?1:0}]);},background(hidden){doc.hidden=hidden;for(const fn of docHandlers.get('visibilitychange')||[])fn();},reduced(matches){media.matches=matches;for(const fn of mediaHandlers.get('change')||[])fn({matches});},tick(now){const callbacks=[...frames.values()];frames.clear();callbacks.forEach(fn=>fn(now));},get observed(){return observed;},get pendingFrames(){return frames.size;}};
}
test('first view exposes the live scene while keeping authentic references secondary',()=>{
  for(const kind of MOTION_KINDS){
    const nodes=elements(parseFragment(renderMotion(kind)));
    assert(has(nodes.find(n=>has(n,'data-motion-demo')),'data-view','demo'));
    assert(!has(nodes.find(n=>has(n,'data-motion-interactive')),'hidden'));
    assert(has(nodes.find(n=>has(n,'data-motion-reference')),'hidden'));
    assert(has(nodes.find(n=>has(n,'data-motion-view','demo')),'aria-pressed','true'));
    assert(nodes.some(n=>n.tagName==='img'&&has(n,'width')&&has(n,'height')&&n.attrs.some(a=>a.name==='src'&&a.value.includes('/official/'))));
  }
});

test('all three demos render on the server without DOM globals',()=>{
  for(const kind of MOTION_KINDS){const text=renderMotion(kind);assert(text.includes(`data-motion-demo="${kind}"`));assert(text.includes('data-playing="false"'));assert(text.includes('网页原理示意'));assert(!/<iframe|https?:\/\/(?!www\.w3\.org)/.test(text));assert(text.includes('href="/docs/'));}
  assert.throws(()=>renderMotion('unknown'),/Unknown motion/);
});
test('interpolation changes timing but never the motion path or endpoints',()=>{
  for(const mode of ['linear','smooth']){assert.deepEqual(sampleAnimation(0,mode),{time:0,progress:0,...pathPoint(0),angle:Math.atan2(-64*Math.PI,464)*180/Math.PI});assert.equal(sampleAnimation(1,mode).x,pathPoint(1).x);}
  assert.notEqual(sampleAnimation(.25,'linear').x,sampleAnimation(.25,'smooth').x);
  assert.deepEqual(pathPoint(easing(.25,'smooth')),{x:sampleAnimation(.25,'smooth').x,y:sampleAnimation(.25,'smooth').y});
  assert.equal(easing(.5),.5);assert.equal(easing(-10),0);assert.equal(easing(10),1);
});
test('automation is deterministic and amplitude zero neutralizes all driven properties',()=>{
  assert.deepEqual(sampleAutomation({time:1.2}),sampleAutomation({time:1.2}));
  for(let time=0;time<=4;time+=.1){const s=sampleAutomation({time,amplitude:0});assert.equal(s.x,0);assert.equal(s.rotation,0);assert.equal(s.scale,1);}
  assert.notEqual(sampleAutomation({time:1.2,frequency:2}).x,sampleAutomation({time:1.2,frequency:4}).x);
});
test('every loop closes and all automation values remain bounded',()=>{
  for(let frequency=1;frequency<=6;frequency++){
    const a=sampleAutomation({time:0,frequency}),b=sampleAutomation({time:4,frequency});
    for(const k of ['x','rotation','scale'])assert(Math.abs(a[k]-b[k])<1e-10);
    for(let time=0;time<=4;time+=.04){const s=sampleAutomation({time,frequency,amplitude:64});assert(Math.abs(s.x)<=64);assert(Math.abs(s.rotation)<=64*.72);assert(s.scale>=1-64/220&&s.scale<=1+64/220);}
  }
  assert.notEqual(sampleAutomation({time:0,loop:false}).x,sampleAutomation({time:4,loop:false}).x);
});
test('camera parallax is depth-ordered, bounded and exactly resettable',()=>{
  const moved=cameraTransforms(80,40);assert(Math.abs(moved[0].x)<Math.abs(moved[1].x));assert(Math.abs(moved[1].x)<Math.abs(moved[2].x));
  assert.deepEqual(cameraTransforms(1000,-1000),cameraTransforms(100,-70));
  for(const t of cameraTransforms()){assert.equal(Math.abs(t.x),0);assert.equal(Math.abs(t.y),0);}
});
test('graph paths stay finite at all supported parameter extremes',()=>{
  for(const mode of ['linear','smooth'])assert(!/NaN|Infinity/.test(easePath(mode)));
  for(const amplitude of [0,64])for(const frequency of [1,6])for(const loop of [false,true])assert(!/NaN|Infinity/.test(automationPath({amplitude,frequency,loop})));
});
test('source keeps all runtime state scoped and provides lifecycle cleanup',async()=>{
  const source=await readFile(new URL('../components/home/landing/motion-demo.mjs',import.meta.url),'utf8');
  assert(source.includes('const mounts = new WeakMap()'));assert(source.includes('lifetime.abort()'));assert(source.includes('observer?.disconnect()'));assert(source.includes('cancelAnimationFrame'));assert(source.includes('visibilitychange'));assert(source.includes('prefers-reduced-motion'));assert(source.includes('data-camera-drag'));
});

test('large scenes lead while curves and precision parameters stay in closed disclosures',()=>{
  for(const kind of ['animation','automation']){
    const nodes=elements(parseFragment(renderMotion(kind)));
    const scene=nodes.find(n=>has(n,'class','duik-motion-scene'));
    assert(has(scene.childNodes.find(n=>n.tagName==='svg'),'viewBox','0 0 600 360'));
    const details=nodes.find(n=>has(n,'data-motion-adjust'));
    assert.equal(details.tagName,'details');assert(!has(details,'open'));
    assert(elements(details).some(n=>has(n,'class','duik-motion-graph')));
    for(const field of kind==='animation'?['progress']:['amplitude','frequency']){
      assert(elements(details).some(n=>has(n,'data-input',field)||has(n,'data-output',field)));
    }
    assert(!nodes.some(n=>has(n,'class','duik-motion-heading')));
    assert(has(nodes.find(n=>has(n,'data-motion-view','demo')),'hidden'));
    assert(!has(nodes.find(n=>has(n,'data-motion-view','reference')),'hidden'));
  }
});

test('motion disclosures overlay locally without resizing the scene or measured track',async()=>{
  for(const kind of MOTION_KINDS){
    const nodes=elements(parseFragment(renderMotion(kind)));
    const details=nodes.find(n=>has(n,'data-motion-adjust'));
    const body=details.childNodes.find(n=>has(n,'class','duik-motion-adjust-body'));
    assert(body,'Expanded controls need a bounded body separate from the summary');
    assert(!has(details,'open'));
    assert(elements(body).some(n=>n.tagName==='input'||n.tagName==='svg'));
  }
  const css=await readFile(new URL('../components/home/landing/motion-demo.css',import.meta.url),'utf8');
  assert(css.includes('aspect-ratio:5/3'),'The scene must retain its illustrated canvas ratio');
  assert(!css.includes(':has(.duik-motion-adjust[open])'),'Opening precision controls must not shrink the stage');
  const layout=await readFile(new URL('../components/home/landing/experience-shell.css',import.meta.url),'utf8');
  assert.match(layout,/\.duik-capability-card\{[^}]*align-items:start/,'Copy and artwork share a stable top edge');
});

test('animation projection enlarges the arc without changing timing or clipping the traveler',()=>{
  for(const mode of ['linear','smooth'])for(let i=0;i<=100;i++){
    const sample=sampleAnimation(i/100,mode),p=animationStagePoint(sample);
    assert.equal(p.x,sample.x);assert(p.y>=96-1e-10&&p.y<=240+1e-10);
    assert(Number.isFinite(p.angle));assert(Math.abs(p.angle)<50);
  }
  const nodes=elements(parseFragment(renderMotion('animation')));
  const dots=nodes.filter(n=>has(n,'data-sample-time'));
  assert.equal(dots.length,9);
  dots.forEach((dot,index)=>{const p=animationStagePoint(sampleAnimation(index/8));assert(has(dot,'cx',String(p.x)));assert(has(dot,'cy',String(p.y)));});
});

test('automation presets are explicit webpage samples and share the existing model',()=>{
  assert.equal(AUTOMATION_PRESETS.length,3);
  const nodes=elements(parseFragment(renderMotion('automation')));
  for(const preset of AUTOMATION_PRESETS){
    const button=nodes.find(n=>has(n,'data-motion-preset',preset.id));
    assert(button);assert(has(button,'aria-pressed',String(preset.id==='natural')));
    const sample=sampleAutomation({...preset,time:.5});
    assert(Number.isFinite(sample.x)&&Math.abs(sample.x)<=preset.amplitude);
  }
  const initial=sampleAutomation({time:.5});
  assert(has(nodes.find(n=>has(n,'data-art','position')),'transform','translate('+(300+initial.x).toFixed(2)+' 128)'));
  const assembly=nodes.find(n=>has(n,'data-art','position'));
  assert(elements(assembly).some(n=>has(n,'data-art','rotation')));
  assert(elements(assembly).some(n=>has(n,'data-art','scale')));
  assert(elements(nodes.find(n=>has(n,'data-motion-adjust'))).some(n=>has(n,'data-input','amplitude')),'Precise amplitude belongs with the optional parameters');
});

test('capability parent composition is shared by SSR and Vue and fails closed on drift',async()=>{
  const baseline=await readFile(new URL('../components/home/landing/baseline/_nuxt/HomeCapabilitiesKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js',import.meta.url),'utf8');
  const patched=patchCapabilityLayoutRuntime(baseline);
  for(const [original,marker]of capabilityClasses)assert(patched.includes(JSON.stringify(original+' '+marker)));
  assert.equal(patchCapabilityLayoutRuntime(patched),patched);
  assert.throws(()=>patchCapabilityLayoutRuntime(baseline.replace(capabilityClasses[0][0],'different-track')),/Unknown capability layout/);
  const published=await readFile(new URL('../public/landing.html',import.meta.url),'utf8');
  assert.equal(patchCapabilityLayoutSSR(published),published);
  const nodes=elements(parseFragment(published));
  assert.equal(nodes.filter(n=>n.attrs?.some(a=>a.name==='class'&&a.value.split(' ').includes('duik-capability-card'))).length,3);
  assert.equal(nodes.filter(n=>n.attrs?.some(a=>a.name==='class'&&a.value.split(' ').includes('duik-capability-track'))).length,1);
  const css=await readFile(new URL('../components/home/landing/experience-shell.css',import.meta.url),'utf8');
  assert(css.includes('.duik-capability-card :is(h2,.h2)'),'The template heading is p.h2, not an h2 element');
  assert.throws(()=>patchCapabilityLayoutSSR('<main></main>'),/Expected one measured desktop track/);
});

test('no scene exposes playback sliders, progress bars, or a transport reset',()=>{
  for(const kind of MOTION_KINDS){
    const nodes=elements(parseFragment(renderMotion(kind)));
    assert(!nodes.some(n=>['time','cameraTime','automationTime'].some(field=>has(n,'data-input',field))));
    assert(!nodes.some(n=>has(n,'data-action','play')||has(n,'data-action','reset')));
    assert(!nodes.some(n=>has(n,'data-art','timing-progress')||has(n,'data-art','reference-progress')));
    assert(nodes.filter(n=>n.tagName==='input').every(n=>['amplitude','frequency','viewX','viewY','grid'].some(field=>has(n,'data-input',field))));
  }
});

test('passive hovering and focus never pause the visible loop',()=>{
  for(const kind of MOTION_KINDS){
    const harness=motionHarness(kind);harness.preview();harness.tick(0);
    const initial=harness.root.dataset.time;
    harness.emit('pointerenter',harness.root,{pointerType:'mouse'});
    harness.emit('focusin',harness.control('[data-motion-stage]'));
    harness.emit('focusin',harness.control('[data-motion-adjust]'));
    harness.tick(100);
    assert.equal(harness.root.dataset.playing,'true');assert.equal(harness.pendingFrames,1);
    assert.notEqual(harness.root.dataset.time,initial);harness.cleanup();
  }
});

test('presets change real parameters without turning into playback controls',()=>{
  const controlled=motionHarness('automation');controlled.preview();
  const preset=controlled.control('[data-motion-preset=lively]');controlled.emit('pointerdown',preset);controlled.emit('click',preset);
  assert.equal(controlled.root.dataset.playing,'true');
  const change=controlled.events.filter(event=>event.type==='duik-motion-change').at(-1);
  assert.equal(change.detail.state.amplitude,48);assert.equal(change.detail.state.frequency,3);
  assert.equal(preset.attrs['aria-pressed'],'true');
  controlled.emit('click',controlled.control('[data-motion-preset=natural]'));
  assert.equal(controlled.control('[data-motion-preset=natural]').attrs['aria-pressed'],'true');controlled.cleanup();
});

test('a parameter pointer owns the clock only until its matching release',()=>{
  const harness=motionHarness('automation'),input=harness.control('[data-input=amplitude]');harness.preview();
  harness.emit('focusin',input);assert.equal(harness.root.dataset.playing,'true');
  harness.emit('pointerdown',input,{button:0,pointerId:41,isPrimary:true});
  input.value=0;harness.emit('input',input);harness.tick(100);
  assert.equal(harness.root.dataset.playing,'false');assert.equal(harness.pendingFrames,0);
  assert.equal(harness.control('[data-art=position]').attrs.transform,'translate(300.00 128)');
  harness.emit('pointerdown',input,{button:0,pointerId:42,isPrimary:false});
  harness.documentEvent('pointerup',{pointerId:42});assert.equal(harness.root.dataset.playing,'false');
  harness.documentEvent('pointerup',{pointerId:41});assert.equal(harness.root.dataset.playing,'true');
  harness.tick(200);harness.tick(300);assert.equal(harness.control('[data-art=rotation]').attrs.transform,'rotate(0.00)');
  harness.cleanup();
});

test('parameter keyboard changes release the clock on keyup without requiring blur',()=>{
  const harness=motionHarness('automation'),input=harness.control('[data-input=frequency]');harness.preview();
  harness.emit('keydown',input,{key:'ArrowUp'});input.value=4;harness.emit('input',input);
  assert.equal(harness.root.dataset.playing,'false');
  harness.documentEvent('keyup',{key:'ArrowDown'});assert.equal(harness.pendingFrames,0);
  harness.documentEvent('keyup',{key:'ArrowUp'});assert.equal(harness.root.dataset.playing,'true');
  assert.equal(harness.control('[data-output=frequency]').textContent,'4 次/段');harness.cleanup();
});

test('scene drag release resumes while pointer and focus remain on the scene',()=>{
  for(const kind of MOTION_KINDS){
    const harness=motionHarness(kind),stage=harness.control('[data-motion-stage]');harness.preview();
    harness.emit('pointerenter',harness.root,{pointerType:'mouse'});
    harness.emit('pointerdown',stage,{button:0,pointerId:7,isPrimary:true,clientX:650,clientY:220});
    assert.equal(harness.root.dataset.playing,'false');assert(stage.hasPointerCapture(7));
    harness.emit('pointerup',stage,{pointerId:8});assert.equal(harness.root.dataset.playing,'false');
    harness.emit('pointerup',stage,{pointerId:7});assert.equal(harness.root.dataset.playing,'true');
    assert(!stage.hasPointerCapture(7));harness.cleanup();
  }
});

test('offscreen and reduced-motion transitions clear lost input holds without resurrecting gestures',()=>{
  for(const gate of ['offscreen','reduced','background']){
    const harness=motionHarness('automation'),input=harness.control('[data-input=amplitude]');harness.preview();
    harness.emit('pointerdown',input,{button:0,pointerId:5,isPrimary:true});
    harness.emit('keydown',input,{key:'ArrowRight'});assert.equal(harness.pendingFrames,0);
    if(gate==='offscreen'){harness.visible(false);harness.visible(true);}
    if(gate==='reduced'){harness.reduced(true);harness.reduced(false);}
    if(gate==='background'){harness.background(true);harness.background(false);}
    assert.equal(harness.root.dataset.playing,'true');assert.equal(harness.pendingFrames,1);
    harness.documentEvent('pointerup',{pointerId:5});harness.documentEvent('keyup',{key:'ArrowRight'});
    assert.equal(harness.pendingFrames,1);harness.cleanup();
  }
});

test('the timing comparison shares one path and pointer scrubbing inverts either timing mode',()=>{
  for(const mode of ['smooth','linear'])for(let i=0;i<=100;i++){
    const time=i/100,x=sampleAnimation(time,mode).x;
    assert(Math.abs(animationTimeAtX(x,mode)-time)<1e-7);
  }
  assert.equal(animationTimeAtX(-100),0);assert.equal(animationTimeAtX(900),1);
  const harness=motionHarness('animation');
  const primary=harness.control('[data-art=traveler]'),reference=harness.control('[data-art=reference-traveler]');
  assert.notEqual(primary.attrs.transform,reference.attrs.transform);
  harness.emit('click',harness.control('[data-ease=linear]'));
  assert.equal(primary.attrs.transform,reference.attrs.transform);
  assert.equal(reference.attrs.opacity,'0');
  const scene=harness.control('[data-motion-stage]');
  harness.emit('pointerdown',scene,{button:0,pointerId:1,clientX:650,clientY:200});
  assert.equal(harness.root.dataset.time,'0.50');
  harness.emit('pointerup',scene,{pointerId:1});assert(!scene.hasPointerCapture(1));harness.cleanup();
});

test('the camera tour is bounded, continuous and starts at the current user composition',()=>{
  const start={viewX:39,viewY:-27};
  assert.deepEqual(sampleCameraTour(0,start),start);
  assert.deepEqual(sampleCameraTour(CAMERA_DURATION,start),{viewX:28,viewY:-8});
  let previous=start;
  for(let i=1;i<=480;i++){
    const next=sampleCameraTour(i/100,start);
    assert(next.viewX>=-100&&next.viewX<=100&&next.viewY>=-70&&next.viewY<=70);
    assert(Math.abs(next.viewX-previous.viewX)<2&&Math.abs(next.viewY-previous.viewY)<2);
    previous=next;
  }
});

test('all visible demonstrations keep looping through the original timeline in both directions',()=>{
  for(const kind of MOTION_KINDS){
    const harness=motionHarness(kind);
    harness.preview();
    assert.equal(harness.root.dataset.playing,'true');
    const times=[];for(let i=0;i<210;i++){harness.tick(i*100);times.push(Number(harness.root.dataset.time));}
    assert.equal(harness.root.dataset.playing,'true');assert.equal(harness.pendingFrames,1);
    assert(times.some((time,i)=>i&&time<times[i-1]),'Return leg must be rendered, not a jump to the start');
    assert(times.some((time,i)=>i&&time>times[i-1]));
    harness.cleanup();
  }
});

test('each controller observes its physical scene and resumes without catch-up on reentry',()=>{
  for(const kind of MOTION_KINDS){
    const harness=motionHarness(kind);assert.equal(harness.observed,harness.control('[data-motion-stage]'));
    harness.preview();harness.tick(0);harness.tick(100);
    const time=harness.root.dataset.time;
    harness.visible(false);assert.equal(harness.root.dataset.playing,'false');assert.equal(harness.pendingFrames,0);
    harness.visible(true);harness.tick(1000);
    assert.equal(harness.root.dataset.playing,'true');assert.equal(harness.root.dataset.time,time);harness.cleanup();
  }
});

test('loops wait for ninety percent of the scene and resume at the held frame after exit',()=>{
  for(const kind of MOTION_KINDS){
    const harness=motionHarness(kind),initial=harness.root.dataset.time;
    harness.intersect(.55);
    assert.equal(harness.root.dataset.playing,'false');assert.equal(harness.root.dataset.previewed,undefined);
    harness.tick(100);assert.equal(harness.root.dataset.time,initial);
    harness.intersect(.89);assert.equal(harness.pendingFrames,0);
    harness.intersect(.9);assert.equal(harness.root.dataset.playing,'true');
    harness.tick(200);harness.tick(300);const held=harness.root.dataset.time;
    harness.visible(false);assert.equal(harness.root.dataset.playing,'false');assert.equal(harness.pendingFrames,0);
    harness.preview();harness.tick(400);
    assert.equal(harness.root.dataset.playing,'true');assert.equal(harness.root.dataset.time,held);harness.cleanup();
  }
});

test('entry previews measure the current scene aperture instead of trusting a stale intersection or the controls root',()=>{
  for(const kind of MOTION_KINDS){
    const harness=motionHarness(kind),stage=harness.control('[data-motion-stage]');
    Object.assign(stage.box,{left:1110,right:1710});
    harness.preview();
    assert.equal(harness.root.dataset.playing,'false');assert.equal(harness.root.dataset.previewed,undefined);
    // Ninety percent of each axis exposes only eighty-one percent of the art.
    Object.assign(stage.box,{left:900,right:1500,top:576,bottom:936});
    harness.preview();assert.equal(harness.root.dataset.previewed,undefined);
    // The controls root does not decide whether the artwork is ready to explain.
    Object.assign(harness.root.box,{left:1600,right:2200});
    Object.assign(stage.box,{top:100,bottom:460});
    harness.preview();assert.equal(harness.root.dataset.playing,'true');
    harness.cleanup();
  }
});

test('background and offscreen notifications do not spend an explanation that has not started',()=>{
  for(const kind of MOTION_KINDS){
    const harness=motionHarness(kind),initial=harness.root.dataset.time;
    harness.background(true);harness.preview();harness.tick(100);
    assert.equal(harness.root.dataset.previewed,undefined);assert.equal(harness.root.dataset.time,initial);
    harness.visible(false);harness.background(false);harness.tick(200);
    assert.equal(harness.root.dataset.previewed,undefined);assert.equal(harness.pendingFrames,0);
    harness.intersect(.95);assert.equal(harness.root.dataset.playing,'true');
    harness.tick(300);harness.tick(400);const held=harness.root.dataset.time;
    harness.background(true);harness.background(false);harness.preview();harness.tick(500);
    assert.equal(harness.root.dataset.playing,'true');assert.equal(harness.root.dataset.time,held);harness.cleanup();
  }
});

test('the aperture gate and an actual held keyboard adjustment block automatic motion',()=>{
  for(const kind of MOTION_KINDS){
    const explicit=motionHarness(kind);
    explicit.intersect(.55);assert.equal(explicit.control('[data-action=play]'),null);
    assert.equal(explicit.root.dataset.playing,'false');
    explicit.cleanup();
    const controlled=motionHarness(kind);controlled.intersect(.55);
    controlled.emit('focusin',controlled.control('[data-motion-stage]'));
    controlled.emit('keydown',controlled.control('[data-motion-stage]'),{key:'ArrowRight'});controlled.preview();
    assert.equal(controlled.root.dataset.playing,'false');assert.equal(controlled.root.dataset.previewed,undefined);
    controlled.documentEvent('keyup',{key:'ArrowRight'});assert.equal(controlled.root.dataset.playing,'true');
    controlled.cleanup();
  }
});

test('background and reduced-motion changes gate loops without a catch-up jump',()=>{
  for(const kind of MOTION_KINDS){
    const harness=motionHarness(kind);harness.preview();harness.tick(0);harness.tick(100);
    const time=harness.root.dataset.time;
    harness.background(true);harness.background(false);harness.tick(1000);
    assert.equal(harness.root.dataset.playing,'true');assert.equal(harness.root.dataset.time,time);
    harness.reduced(true);assert.equal(harness.root.dataset.playing,'false');assert.equal(harness.pendingFrames,0);
    harness.preview();assert.equal(harness.pendingFrames,0);
    harness.reduced(false);assert.equal(harness.root.dataset.playing,'true');harness.tick(3000);assert.equal(harness.root.dataset.time,time);harness.cleanup();
  }
});

test('frame guards use current scene bounds even if the observer has not delivered its edge',()=>{
  const harness=motionHarness('animation');harness.preview();harness.tick(0);
  harness.control('[data-motion-stage]').box.left=1500;
  harness.tick(100);assert.equal(harness.root.dataset.playing,'false');assert.equal(harness.pendingFrames,0);
  harness.preview();assert.equal(harness.root.dataset.playing,'false');
  harness.control('[data-motion-stage]').box.left=350;harness.control('[data-motion-stage]').box.height=0;
  harness.preview();assert.equal(harness.root.dataset.playing,'false');harness.cleanup();
});

test('direct camera takeover is relative, retains its composition, and yields to a new tour without snapping',()=>{
  const harness=motionHarness('camera'),stage=harness.control('[data-motion-stage]');
  const input=harness.control('[data-input=viewX]');input.value=35;harness.emit('input',input);
  harness.emit('pointerdown',stage,{button:0,pointerId:7,clientX:600,clientY:220});
  assert.equal(harness.root.dataset.viewX,'35.00');
  harness.emit('pointermove',stage,{pointerId:7,clientX:650,clientY:200});
  assert.equal(harness.root.dataset.viewX,'55.00');
  harness.emit('pointercancel',stage,{pointerId:7});assert(!stage.hasPointerCapture(7));
  const before=harness.root.dataset.viewY;
  harness.preview();harness.emit('pointerleave',harness.root);harness.tick(0);
  assert.equal(harness.root.dataset.viewX,'55.00');assert.equal(harness.root.dataset.viewY,before);
  harness.tick(100);assert.notEqual(harness.root.dataset.viewX,'55.00');harness.cleanup();
});

test('automation is one nested assembly and its primary input directly neutralizes every property',()=>{
  const harness=motionHarness('automation'),stage=harness.control('[data-motion-stage]');harness.preview();
  harness.emit('pointerdown',stage,{button:0,pointerId:3,clientX:650,clientY:210});
  harness.emit('pointermove',stage,{pointerId:3,clientX:450,clientY:210});
  assert.equal(harness.root.dataset.playing,'false');assert.equal(stage.attrs['aria-valuenow'],'0');
  assert.equal(harness.control('[data-art=position]').attrs.transform,'translate(300.00 128)');
  assert.equal(harness.control('[data-art=rotation]').attrs.transform,'rotate(0.00)');
  assert.equal(harness.control('[data-art=scale]').attrs.transform,'scale(1.00)');
  harness.background(true);assert(!stage.hasPointerCapture(3));harness.cleanup();
});

test('the mobile remains above its readout at the largest supported waveform',()=>{
  // Conservative corners enclose the semicircle, triangle and scaled disk.
  // This is geometric coverage, not a substitute for rendered-stage inspection.
  for(let frequency=1;frequency<=6;frequency++)for(let frame=0;frame<=400;frame++){
    const sample=sampleAutomation({time:frame/100,amplitude:64,frequency});
    const angle=sample.rotation*Math.PI/180;
    const corners=[[-165,58],[-165,103],[-75,58],[-75,103],[-30,44],[30,96],...[[-1,-1],[-1,1],[1,-1],[1,1]].map(([x,y])=>[120+x*30*sample.scale,68+y*30*sample.scale])];
    for(const [x,y]of corners){
      const stageX=300+sample.x+.86*(x*Math.cos(angle)-y*Math.sin(angle));
      const stageY=128+.86*(x*Math.sin(angle)+y*Math.cos(angle));
      assert(stageX>30&&stageX<570&&stageY>40&&stageY<295);
    }
  }
});

test('keyboard controls remain immediate in reduced motion without hiding their held result',()=>{
  for(const kind of MOTION_KINDS){
    const harness=motionHarness(kind),stage=harness.control('[data-motion-stage]');harness.reduced(true);
    const event=harness.emit('keydown',stage,{key:'ArrowRight'});assert(event.defaultPrevented);
    if(kind==='animation')assert.equal(harness.root.dataset.time,'0.34');
    if(kind==='automation')assert.equal(stage.attrs['aria-valuenow'],'34');
    if(kind==='camera')assert.equal(harness.root.dataset.viewX,'5.00');
    assert.equal(harness.pendingFrames,0);assert.equal(stage.dataset.instant,'true');harness.cleanup();
  }
});

test('switching to a real panel stops the stage and returning resumes its automatic loop',()=>{
  for(const kind of MOTION_KINDS){
    const harness=motionHarness(kind);harness.preview();harness.tick(0);harness.tick(100);
    harness.emit('click',harness.control('[data-motion-view=reference]'));
    assert.equal(harness.root.dataset.playing,'false');assert.equal(harness.pendingFrames,0);
    harness.emit('click',harness.control('[data-motion-view=demo]'));harness.preview();
    assert.equal(harness.root.dataset.playing,'true');assert.equal(harness.pendingFrames,1);harness.cleanup();
  }
});

test('unmount and a repeated mount release events, captures and scheduled frames',()=>{
  const harness=motionHarness('camera'),stage=harness.control('[data-motion-stage]');
  harness.emit('pointerdown',stage,{button:0,pointerId:5,clientX:600,clientY:220});
  const secondCleanup=mountMotion(harness.root,'camera');assert(!stage.hasPointerCapture(5));
  harness.preview();assert.equal(harness.pendingFrames,1);
  secondCleanup();assert.equal(harness.pendingFrames,0);assert.equal(harness.root.dataset.motionMounted,undefined);
  harness.emit('pointerleave',harness.root);assert.equal(harness.pendingFrames,0);
});
