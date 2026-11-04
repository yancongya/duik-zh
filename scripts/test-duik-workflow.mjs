import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseFragment} from 'parse5';
import {createWorkflowTour, mountWorkflow, workflowLayerLayout, workflowPoseFrame, workflowMarkup, workflowViews} from '../components/home/landing/orientation.mjs';
const approvedManifest=JSON.parse(readFileSync(new URL('../public/riglab-project/rig.json',import.meta.url),'utf8'));

function clock(){
  const timers=new Map(),motionTimers=new Map(),history=new Map();let now=0,nextId=0;
  const setTimer=(run,delay)=>{const id=++nextId;timers.set(id,{at:now+delay,run});history.set(id,run);return id;};
  const clearTimer=id=>timers.delete(id);
  const setMotionTimer=(run,delay)=>{const id=++nextId;motionTimers.set(id,{at:now+delay,run});return id;};
  const clearMotionTimer=id=>motionTimers.delete(id);
  const advance=duration=>{
    const end=now+duration;let count=0;
    while(true){
      const next=[...[...timers].map(([id,timer])=>[id,timer,timers]),...[...motionTimers].map(([id,timer])=>[id,timer,motionTimers])].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];
      if(!next)break;assert(++count<1000,'a timed loop must not recurse synchronously');
      now=next[1].at;next[2].delete(next[0]);next[1].run();
    }
    now=end;
  };
  return {timers,motionTimers,history,setTimer,clearTimer,setMotionTimer,clearMotionTimer,advance,get now(){return now;}};
}

function controlledTour(options={}){
  const time=clock(),steps=[],states=[],pending=[];
  const tour=createWorkflowTour({...time,onStep:value=>steps.push(value),onState:value=>states.push(value),whenSettled:done=>{const record={done,cancelled:false};pending.push(record);return()=>{record.cancelled=true;};},...options});
  return {time,steps,states,pending,tour};
}

test('tour advances immediately on real completion and ends after exactly three shots',()=>{
  const {time,steps,states,pending,tour}=controlledTour();
  assert.equal(tour.started,false);tour.start();assert.deepEqual(steps,[0]);assert(tour.started);
  assert.equal(time.timers.size,0,'no artificial reading hold is scheduled');
  pending[0].done();assert.deepEqual(steps,[0,1]);assert(pending[0].cancelled);
  pending[1].done();assert.deepEqual(steps,[0,1,2]);assert(tour.running);
  time.advance(10000);assert.deepEqual(states,['playing'],'elapsed wall time cannot settle the final camera');
  pending[2].done();assert.equal(tour.running,false);assert.deepEqual(states,['playing','complete']);
  tour.start();pending.forEach(record=>record.done());time.advance(10000);
  assert.deepEqual(steps,[0,1,2]);assert.equal(time.timers.size,0);tour.destroy();
});

test('interruption cancels pending completion and permanently consumes this introduction',()=>{
  const {time,steps,states,pending,tour}=controlledTour();
  tour.start();pending[0].done();tour.stop();assert(pending[1].cancelled);
  pending[1].done();tour.start();time.advance(10000);
  assert.deepEqual(steps,[0,1]);assert.deepEqual(states,['playing','user']);assert.equal(tour.running,false);
  tour.stop('hidden');assert.deepEqual(states,['playing','user']);
});

test('duplicate start calls neither replay nor interrupt an active introduction',()=>{
  const {steps,states,pending,tour}=controlledTour();
  tour.start();tour.start();assert.deepEqual(steps,[0]);assert.equal(pending.length,1);
  pending[0].done();tour.start();assert.deepEqual(steps,[0,1]);assert.equal(pending.length,2);
  pending[1].done();pending[2].done();tour.start();
  assert.deepEqual(steps,[0,1,2]);assert.deepEqual(states,['playing','complete']);
});

test('takeover inside onStep does not schedule the next stage',()=>{
  for(const stopAt of [0,1,2]){
    const time=clock(),steps=[],states=[];let tour;
    tour=createWorkflowTour({...time,onStep:value=>{steps.push(value);if(value===stopAt)tour.stop('user');},onState:value=>states.push(value)});
    tour.start();time.advance(10000);
    assert.deepEqual(steps,[0,1,2].slice(0,stopAt+1));assert.equal(time.timers.size,0);assert.equal(tour.running,false);
    assert.deepEqual(states,['playing','user']);
  }
});

test('a reentrant start from a stage callback cannot create a second sequence',()=>{
  const steps=[];let tour;
  tour=createWorkflowTour({onStep:value=>{steps.push(value);tour.start();},onState(){}});
  tour.start();assert.deepEqual(steps,[0,1,2]);assert.equal(tour.running,false);
});

test('disposal during a pending or active callback prevents all later work',()=>{
  for(const disposeAt of [-1,0,1]){
    const time=clock(),steps=[],states=[],pending=[];let tour;
    tour=createWorkflowTour({...time,onStep:value=>{steps.push(value);if(value===disposeAt)tour.destroy();},onState:value=>states.push(value),whenSettled:done=>{pending.push(done);return()=>{};}});
    tour.start();if(disposeAt===-1)tour.destroy();
    for(const run of pending)run();tour.start();time.advance(10000);
    assert.deepEqual(steps,disposeAt===1?[0,1]:[0]);assert.equal(time.timers.size,0);assert.equal(tour.running,false);
    assert.deepEqual(states,['playing','disposed']);
  }
});

test('duplicate earlier completion callbacks cannot skip a later shot',()=>{
  const {steps,pending,tour}=controlledTour();tour.start();const first=pending[0];
  first.done();first.done();assert.deepEqual(steps,[0,1]);assert.equal(pending[1].cancelled,false);
  pending[1].done();first.done();assert.deepEqual(steps,[0,1,2]);assert.equal(pending[2].cancelled,false);
  pending[2].done();assert.equal(tour.running,false);pending.forEach(record=>record.done());assert.deepEqual(steps,[0,1,2]);
});

test('skip consumes the opportunity before readiness while an idle stop does not',()=>{
  const skipped=controlledTour();skipped.tour.skip('reduced');skipped.tour.start();
  assert.equal(skipped.tour.started,true);assert.deepEqual(skipped.steps,[]);assert.deepEqual(skipped.states,['reduced']);
  const waiting=controlledTour();waiting.tour.stop('offscreen');assert.equal(waiting.tour.started,false);
  waiting.tour.start();assert.deepEqual(waiting.steps,[0]);waiting.tour.destroy();
});

// A deliberately small DOM/event and character adapter. These tests execute the
// real mountWorkflow controller, but do not render CSS/WebGL or trusted input.
// Asset loading is injected; the approved rig renderer is validated separately.
class LocalTarget{
  listeners=[];
  addEventListener(type,listener){if(!this.listeners.some(item=>item.type===type&&item.listener===listener))this.listeners.push({type,listener});}
  removeEventListener(type,listener){this.listeners=this.listeners.filter(item=>item.type!==type||item.listener!==listener);}
  fire(type,values={}){
    const event={type,target:this,detail:type==='click'?1:0,key:'',preventDefault(){this.defaultPrevented=true;},composedPath:()=>{const path=[];for(let node=this;node;node=node.parentElement)path.push(node);return path;},...values};
    for(let target=this;target;target=['click','keydown','pointerdown','pointerup','pointercancel','focusin','focusout'].includes(type)?target.parentElement:null){
      for(const item of [...target.listeners])if(item.type===type)item.listener(event);
    }
    return event;
  }
}
const dataAttr=key=>'data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
class LocalElement extends LocalTarget{
  constructor(tag,document,attrs=[]){
    super();this.tagName=tag;this.ownerDocument=document;this.attrs=new Map(attrs.map(a=>[a.name,a.value]));this.childNodes=[];this.parentElement=null;this._text='';this.style={};
    if(document.waapi===false)this.animate=undefined;
    this.dataset=new Proxy({}, {get:(_,key)=>this.getAttribute(dataAttr(key))??undefined,set:(_,key,value)=>{this.setAttribute(dataAttr(key),value);return true;},deleteProperty:(_,key)=>{this.removeAttribute(dataAttr(key));return true;}});
  }
  getAttribute(key){return this.attrs.get(key)??null;}
  setAttribute(key,value){this.attrs.set(key,String(value));}
  hasAttribute(key){return this.attrs.has(key);}
  removeAttribute(key){this.attrs.delete(key);}
  matches(selector){
    const match=selector.match(/^([a-z][\w-]*)?(?:\[([^=\]]+)(?:="([^"]*)")?\])?$/);
    if(!match)return false;
    return (!match[1]||this.tagName===match[1])&&(!match[2]||(this.hasAttribute(match[2])&&(match[3]===undefined||this.getAttribute(match[2])===match[3])));
  }
  closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
  contains(other){for(let node=other;node;node=node.parentElement)if(node===this)return true;return false;}
  querySelectorAll(selector){const found=[];const visit=node=>{for(const child of node.childNodes){if(child.tagName!=='#text'&&child.matches(selector))found.push(child);visit(child);}};visit(this);return found;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  append(...children){for(const child of children){child.parentElement=this;this.childNodes.push(child);}}
  replaceChildren(...children){for(const child of this.childNodes)child.parentElement=null;this.childNodes=[];this._text='';this.append(...children);}
  remove(){if(this.parentElement){this.parentElement.childNodes=this.parentElement.childNodes.filter(child=>child!==this);this.parentElement=null;}if(this.rig)this.rig.destroyed=true;}
  set innerHTML(html){this.replaceChildren(...parseFragment(html).childNodes.map(node=>fromParsed(node,this.ownerDocument)));}
  get textContent(){return this._text+this.childNodes.map(child=>child.textContent).join('');}
  set textContent(value){this.replaceChildren();this._text=String(value);}
  focus(){this.ownerDocument.activeElement=this;this.fire('focusin');}
  blur(relatedTarget=null){this.ownerDocument.activeElement=relatedTarget;this.fire('focusout',{relatedTarget});}
  getBoundingClientRect(){return this.rect||{width:1100,height:560};}
  decode(){return Promise.resolve();}
  animate(frames,options){const document=this.ownerDocument;let timer;
    const record={element:this,frames,options,cancelled:false,cancel(){this.cancelled=true;document.motionClock.clearMotionTimer(timer);}};
    const deliveryDelay=typeof document.animationDelay==='function'?document.animationDelay(this,options):document.animationDelay||0;
    timer=document.motionClock.setMotionTimer(()=>{if(!record.cancelled)record.onfinish?.();},options.duration+(options.delay||0)+deliveryDelay);
    document.animations.push(record);return record;
  }
}
for(const name of ['src','alt','width','height'])Object.defineProperty(LocalElement.prototype,name,{get(){return this.getAttribute(name)||'';},set(value){this.setAttribute(name,value);}});
for(const name of ['hidden','disabled'])Object.defineProperty(LocalElement.prototype,name,{get(){return this.hasAttribute(name);},set(value){if(value)this.setAttribute(name,'');else this.removeAttribute(name);}});
function fromParsed(node,document){const result=new LocalElement(node.tagName||'#text',document,node.attrs||[]);if(node.nodeName==='#text')result._text=node.value;result.append(...(node.childNodes||[]).map(child=>fromParsed(child,document)));return result;}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
function harness(t,{loadCharacter,ready,loadManifest,decode,waapi=true,animationDelay=0}={}){
  const time=clock(),document=new LocalTarget(),preference=new LocalTarget(),observers=[],resizes=[],instances=[],cleanups=[],globals=new Map();
  document.hidden=false;document.animations=[];document.motionClock=time;document.animationDelay=animationDelay;document.waapi=waapi;document.baseURI='http://127.0.0.1:3017/';preference.matches=false;
  const rigParts=[{id:'upper-l',group:'左臂',label:'左上臂'},{id:'fore-l',group:'左臂',label:'左前臂'},{id:'fore-r',group:'右臂',label:'右前臂'},{id:'face',group:'面部',label:'面部底层'}].map(part=>({...part,thumbnail:'/fixture/'+part.id+'.png'}));
  document.createElement=tag=>{
    const element=new LocalElement(tag,document);
    if(tag==='img'&&decode)element.decode=()=>decode(element);
    if(tag==='character-rig'){
      const rig={mode:'assembled',pose:{handL:[8,4]},renderedPose:{handL:[8,4]},renderedFrames:[],selected:null,options:{},resets:[],destroyed:false,setMode(value){this.mode=value;this.render();},configure(options){this.options={...this.options,...options};this.render();},selectPart(value){this.selected=value;this.render();},getParts(){return rigParts;},reset(value){this.resets.push(value);this.pose={handL:[0,0]};this.render();},render(pose=this.pose){this.renderedPose=structuredClone(pose);this.renderedFrames.push(structuredClone(pose));},exportPose(){return {pose:structuredClone(this.renderedPose)};}};
      element.rig=rig;element.ready=ready?ready(rig):Promise.resolve(rig);instances.push(element);
    }
    return element;
  };
  const host=document.createElement('div');host.innerHTML=workflowMarkup;
  for(const [key,value]of Object.entries({document,matchMedia:()=>preference,setTimeout:time.setTimer,clearTimeout:time.clearTimer,requestAnimationFrame:run=>time.setTimer(()=>run(time.now),16),cancelAnimationFrame:time.clearTimer,ResizeObserver:class{
    constructor(callback){this.callback=callback;this.disconnected=false;resizes.push(this);}
    observe(element){this.element=element;}
    disconnect(){this.disconnected=true;}
  },IntersectionObserver:class{
    constructor(callback,options){this.callback=callback;this.options=options;this.disconnected=false;observers.push(this);}
    observe(element){this.element=element;}
    disconnect(){this.disconnected=true;}
    notify(visible,intersectionRatio=visible?1:0){if(!this.disconnected)this.callback([{target:this.element,isIntersecting:visible,intersectionRatio,time:time.now}]);}
  }})){
    globals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});
  }
  let loads=0;
  const mount=()=>{const cleanup=mountWorkflow(host,{loadCharacter:async()=>{loads++;await loadCharacter?.();},loadManifest:loadManifest||(async()=>approvedManifest)});cleanups.push(cleanup);return cleanup;};
  t.after(()=>{for(const cleanup of cleanups)cleanup();for(const [key,descriptor]of globals)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];});
  const root=host.querySelector('[data-duik-workflow]');
  return {...time,host,root,document,preference,observers,resizes,instances,mount,get loads(){return loads;},control:selector=>root.querySelector(selector),async load({visible=true}={}){observers.find(observer=>observer.element===root&&!observer.disconnected).notify(true);observers.find(observer=>observer.element===root.querySelector('[data-workflow-art]')&&!observer.disconnected).notify(visible);await flush();assert.equal(root.dataset.workflowReady,'true');}};
}

test('SSR keeps one complete stage and separates three step controls from the root state',()=>{
  const document={};const host=fromParsed(parseFragment(workflowMarkup),document);
  assert.equal(host.querySelectorAll('[data-workflow-art]').length,1);
  assert.equal(host.querySelectorAll('[data-workflow-rig-host]').length,1);
  const buttons=host.querySelectorAll('button[data-workflow-step]');
  assert.equal(buttons.length,3);assert.equal(host.querySelectorAll('[data-workflow-step]').length,4);
  assert.deepEqual(buttons.map(button=>button.getAttribute('aria-pressed')),['true','false','false']);
  assert.deepEqual(buttons.map(button=>button.textContent.slice(1)),workflowViews.map(view=>view.label));
  assert.equal(host.querySelector('[data-workflow-tour-toggle]'),null);
  assert(host.querySelectorAll('button').every(button=>!/播放|暂停|重播|重新演示/.test(button.textContent)));
  assert.equal(host.querySelectorAll('details').length,2);assert(host.querySelectorAll('details').every(detail=>!detail.hasAttribute('open')));
  assert.match(workflowMarkup,/已准备好的透明图层/);assert.match(workflowMarkup,/不在浏览器中执行 Duik 自动绑定/);
});

test('the live stage does not inherit the legacy hidden slideshow container',()=>{
  // This protects the class boundary, not computed browser layout.
  const host=fromParsed(parseFragment(workflowMarkup),{});
  assert.equal(host.querySelectorAll('[class="duik-workflow-canvas"]').length,1);
  for(const legacy of ['duik-workflow-scene','duik-workflow-scenes','duik-workflow-visual']){
    assert.equal(host.querySelectorAll(`[class="${legacy}"]`).length,0);
  }
});

test('lazy loading and repeated stage clicks mount a single instance without altering its pose',async t=>{
  const env=harness(t);env.mount();await env.load();
  const rig=env.instances[0].rig,pose=structuredClone(rig.pose);
  for(const index of [1,2,0,2])env.control(`button[data-workflow-step="${index}"]`).fire('click');
  await flush();assert.equal(env.loads,1);assert.equal(env.instances.length,1);assert.deepEqual(rig.pose,pose);
  assert.equal(rig.mode,'assembled');assert.equal(rig.options.interaction,'drag');assert.equal(rig.options.showControls,true);
  assert.equal(env.control('[data-workflow-parts]').hidden,false);assert.equal(env.control('[data-workflow-reset]').hidden,false);
});

test('a visible ready stage plays once with continuous shot boundaries then yields controls',async t=>{
  const env=harness(t);env.mount();await env.load();const rig=env.instances[0].rig;
  assert.equal(env.root.dataset.workflowTour,'playing');assert.equal(env.control('[data-workflow-tour-toggle]'),null);
  assert.equal(env.timers.size,0,'no fixed narrative hold exists');
  env.advance(1179);assert.equal(env.root.dataset.workflowStep,'0');
  env.advance(1);assert.equal(env.root.dataset.workflowStep,'1','collection starts on the final expansion completion');
  env.advance(1180+527);assert.equal(env.root.dataset.workflowStep,'1');
  env.advance(1);assert.equal(env.root.dataset.workflowStep,'2','final camera starts as soon as the saved pose is restored');
  assert.equal(rig.options.interaction,'none','moving final camera does not expose draggable controls early');
  env.advance(999);assert.equal(env.root.dataset.workflowTour,'playing');
  env.advance(1);assert.equal(env.root.dataset.workflowTour,'complete');assert.equal(rig.options.interaction,'drag');
  const frames=rig.renderedFrames.length;
  env.advance(20000);env.root.fire('pointerleave');await flush();
  assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.root.dataset.workflowTour,'complete');
  assert.equal(env.timers.size,0);assert.equal(env.motionTimers.size,0);assert.equal(rig.renderedFrames.length,frames);
  assert.deepEqual(rig.resets,[]);
});

test('keyboard takeover gives the final controls to the reader and focus exit never replays',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(1180);
  const stage=env.control('button[data-workflow-step="1"]');stage.focus();env.advance(10000);
  assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.root.dataset.workflowTour,'user');assert.equal(env.timers.size,0);
  env.root.fire('pointerleave');stage.blur();await flush();env.advance(10000);
  assert.equal(env.root.dataset.workflowTour,'user');assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.instances[0].rig.options.interaction,'drag');
});

test('pointer ownership is permanent after takeover including pointer exit and release',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(3600);
  const stage=env.control('button[data-workflow-step="2"]');stage.fire('pointerdown',{pointerId:1,isPrimary:true});stage.focus();
  const pose=structuredClone(env.instances[0].rig.pose);env.root.fire('pointerleave');env.advance(10000);
  assert.equal(env.root.dataset.workflowTour,'user');assert.equal(env.root.dataset.workflowStep,'2');
  env.document.fire('pointerup',{pointerId:1,isPrimary:true});env.advance(10000);
  assert.equal(env.root.dataset.workflowTour,'user');assert.equal(env.root.dataset.workflowStep,'2');
  assert.deepEqual(env.instances[0].rig.pose,pose);assert.equal(env.timers.size,0);
});

test('neither primary nor secondary pointer release can replay the completed presentation',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(3600);
  const art=env.control('[data-workflow-art]');art.fire('pointerdown',{pointerId:41,isPrimary:true});
  art.fire('pointerdown',{pointerId:42,isPrimary:false});env.root.fire('pointerleave');
  env.document.fire('pointerup',{pointerId:42,isPrimary:false});env.advance(5000);
  assert.equal(env.root.dataset.workflowTour,'user');assert.equal(env.root.dataset.workflowStep,'2');
  env.document.fire('pointercancel',{pointerId:41,isPrimary:true});env.advance(5000);
  assert.equal(env.root.dataset.workflowTour,'user');assert.equal(env.instances[0].rig.options.interaction,'drag');
});

test('moving keyboard focus within or outside the chapter never restarts automatic motion',async t=>{
  const env=harness(t);env.mount();await env.load();const first=env.control('button[data-workflow-step="0"]'),next=env.control('button[data-workflow-step="1"]');
  first.focus();first.blur(next);next.fire('focusin');await flush();env.advance(10000);
  assert.equal(env.root.dataset.workflowTour,'user');assert.equal(env.timers.size,0);
  next.blur();await flush();assert.equal(env.root.dataset.workflowTour,'user');assert.equal(env.root.dataset.workflowStep,'2');
});

test('reading a detail hands off once and closing it never resumes the introduction',async t=>{
  const env=harness(t);env.mount();await env.load();const detail=env.root.querySelector('details');
  detail.setAttribute('open','');env.root.fire('toggle',{target:detail});
  env.advance(10000);assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.root.dataset.workflowTour,'user');
  env.root.fire('pointerleave');detail.removeAttribute('open');env.root.fire('toggle',{target:detail});env.advance(10000);
  assert.equal(env.root.dataset.workflowTour,'user');assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.timers.size,0);
});

test('opening details after a manual stage selection preserves that stage and its official reference',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(4000);
  env.control('button[data-workflow-step="1"]').fire('click');env.advance(1200);
  const detail=env.root.querySelector('details'),before=env.control('[data-workflow-detail]').textContent;
  assert.equal(env.root.dataset.workflowStep,'1');assert.match(before,/关联与绑定/);
  detail.setAttribute('open','');env.root.fire('toggle',{target:detail});
  assert.equal(env.root.dataset.workflowStep,'1');assert.equal(env.control('[data-workflow-detail]').textContent,before);
  detail.removeAttribute('open');env.root.fire('toggle',{target:detail});env.advance(10000);
  assert.equal(env.root.dataset.workflowStep,'1');assert.notEqual(env.root.dataset.workflowTour,'playing');
});

test('pointer and keyboard step selection take over immediately and reset is explicit',async t=>{
  const env=harness(t);env.mount();await env.load();const rig=env.instances[0].rig;
  const stage=env.control('button[data-workflow-step="1"]');stage.fire('pointerdown');stage.fire('click');
  env.advance(10000);assert.equal(env.root.dataset.workflowStep,'1');assert.equal(env.timers.size,0);
  const before=env.document.animations.length;stage.fire('keydown',{key:'End'});
  assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.document.animations.length,before,'keyboard stage changes are immediate');
  assert.equal(env.document.activeElement,env.control('button[data-workflow-step="2"]'));
  assert.deepEqual(rig.pose,{handL:[8,4]});env.control('[data-workflow-reset]').fire('click');assert.deepEqual(rig.resets,[false]);assert.deepEqual(rig.pose,{handL:[0,0]});
});

test('selecting an artwork or visible controller updates actual association output',async t=>{
  const env=harness(t);env.mount();await env.load();env.control('button[data-workflow-step="1"]').fire('click');
  assert.equal(env.control('[data-workflow-linked]').childNodes.length,2);
  env.control('button[data-workflow-part="fore-r"]').fire('click');assert.equal(env.instances[0].rig.selected,'fore-r');
  assert.equal(env.control('[data-workflow-linked]').childNodes.length,1);
  const host=env.control('[data-workflow-rig-host]');host.fire('pointerdown',{composedPath:()=>[{dataset:{control:'head'}},host]});
  assert.equal(env.root.dataset.workflowPart,'face');assert.equal(env.instances[0].rig.selected,'face');
  assert.equal(env.control('[data-workflow-linked]').textContent,'面部底层');
});

test('control takeover keeps the target, linked layers and mesh on the same part',async t=>{
  const env=harness(t);env.mount();await env.load();
  const rig=env.instances[0].rig,host=env.control('[data-workflow-rig-host]');
  env.control('button[data-workflow-step="1"]').fire('click');
  env.control('button[data-workflow-part="face"]').fire('click');
  env.control('button[data-workflow-step="2"]').fire('click');
  const pose=structuredClone(rig.pose);
  for(const [type,control,part,count]of [['pointerdown','handL','fore-l',2],['focusin','handR','fore-r',1]]){
    host.fire(type,{composedPath:()=>[{dataset:{control},ownerSVGElement:{hasPointerCapture:()=>true}},host]});
    assert.equal(env.root.dataset.workflowPart,part);
    assert.equal(rig.selected,part);assert.equal(rig.options.showMesh,true);
    assert.equal(env.control('[data-workflow-parts]').hidden,false);
    assert.equal(env.control('[data-workflow-linked]').childNodes.length,count);
    assert(env.control('[data-workflow-linked]').childNodes.every(item=>item.dataset.workflowLinkedPart));
    assert.equal(env.control('[data-workflow-camera]').dataset.workflowCameraPose,'control');
    assert.deepEqual(rig.pose,pose,'selection must never rewrite the authored pose');
    const frames=rig.renderedFrames.length;
    host.fire(type,{composedPath:()=>[{dataset:{control},ownerSVGElement:{hasPointerCapture:()=>true}},host]});
    assert.equal(rig.renderedFrames.length,frames,'refocusing a replaced control must not recursively render');
  }
  env.control('button[data-workflow-step="1"]').fire('click');
  assert.equal(env.root.dataset.workflowPart,'fore-r');
  assert.equal(env.control('button[data-workflow-part="fore-r"]').getAttribute('aria-pressed'),'true');
  env.control('button[data-workflow-step="0"]').fire('click');
  host.fire('focusin',{composedPath:()=>[{dataset:{control:'head'}},host]});
  assert.equal(env.root.dataset.workflowPart,'fore-r','hidden controls cannot change the layer view');
});

test('pointer takeover replaces an older keyboard focus before controls are rendered again',async t=>{
  const env=harness(t);env.mount();await env.load();
  env.control('button[data-workflow-step="2"]').fire('click');
  const rig=env.instances[0].rig,host=env.control('[data-workflow-rig-host]'),render=rig.render;
  const control=name=>{const node=env.document.createElement('g');node.dataset.control=name;node.ownerSVGElement={hasPointerCapture:id=>id===1};host.append(node);return node;};
  let renders=0;
  // The real core rebuilds control glyphs on render and restores the focused
  // control. Pointerdown prevents the browser's default focus transfer.
  rig.render=function(pose){
    assert(++renders<20,'restored control focus must not cause unbounded rendering');
    const focused=env.document.activeElement?.dataset.control;
    render.call(this,pose);
    if(focused)control(focused).focus();
  };
  control('head').focus();assert.equal(env.root.dataset.workflowPart,'face');
  control('handL').fire('pointerdown',{pointerId:1});
  assert.equal(env.root.dataset.workflowPart,'fore-l');
  assert.equal(env.document.activeElement.dataset.control,'handL');
  control('head').fire('pointerdown',{isPrimary:false});
  assert.equal(env.root.dataset.workflowPart,'fore-l','a secondary touch cannot replace the active control');
  assert.equal(env.document.activeElement.dataset.control,'handL');
  control('head').fire('pointerdown',{isPrimary:true,pointerId:2});
  assert.equal(env.root.dataset.workflowPart,'fore-l','a rejected pointer cannot replace the captured gesture');
  assert.equal(env.document.activeElement.dataset.control,'handL');
  rig.pose.handL=[14,8];rig.render();
  assert.equal(env.root.dataset.workflowPart,'fore-l');assert.equal(rig.selected,'fore-l');
  assert.deepEqual(rig.pose.handL,[14,8]);
  assert.equal(env.control('[data-workflow-camera]').dataset.workflowCameraPose,'control');
});

test('leaving during the introduction cancels old work and returning retains interactive completion',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(1180);
  const observer=env.observers.find(item=>item.element===env.control('[data-workflow-art]'));
  const stale=env.document.animations.map(animation=>animation.onfinish).filter(Boolean);
  observer.notify(false);assert.equal(env.root.dataset.workflowTour,'offscreen');assert.equal(env.timers.size,0);
  assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.instances[0].rig.options.interaction,'drag');
  assert(env.document.animations.every(animation=>animation.cancelled));observer.notify(true);
  const frames=env.instances[0].rig.renderedFrames.length;stale.forEach(run=>run());env.advance(10000);
  assert.equal(env.root.dataset.workflowTour,'offscreen');assert.equal(env.root.dataset.workflowStep,'2');
  assert.equal(env.instances[0].rig.renderedFrames.length,frames);assert.equal(env.motionTimers.size,0);
});

test('preload and a visible sliver do not consume the one-shot opportunity before 65 percent visibility',async t=>{
  const env=harness(t);env.mount();await env.load({visible:false});
  assert.equal(env.timers.size,0);assert.notEqual(env.root.dataset.workflowTour,'playing');
  const observer=env.observers.find(item=>item.element===env.control('[data-workflow-art]'));
  observer.notify(true,.2);env.advance(10000);assert.equal(env.root.dataset.workflowStep,'0');assert.equal(env.motionTimers.size,0);
  observer.notify(true,.649);assert.equal(env.motionTimers.size,0);
  observer.notify(true,.65);assert.equal(env.root.dataset.workflowTour,'playing');
  const count=env.document.animations.length;observer.notify(true,.9);assert.equal(env.document.animations.length,count);
  env.advance(10000);assert.equal(env.root.dataset.workflowTour,'complete');observer.notify(false);observer.notify(true);
  assert.equal(env.root.dataset.workflowTour,'complete');assert.equal(env.root.dataset.workflowStep,'2');
});

test('scene visibility consumes the latest matching entry without replaying an interrupted shot',async t=>{
  const env=harness(t);env.mount();await env.load({visible:false});
  const art=env.control('[data-workflow-art]'),observer=env.observers.find(item=>item.element===art&&!item.disconnected);
  const entry=(target,isIntersecting,time)=>({target,isIntersecting,intersectionRatio:isIntersecting?1:0,time});
  observer.callback([entry(art,false,10),entry(art,true,20)]);
  assert.equal(env.root.dataset.workflowTour,'playing','before starting, the latest visible entry owns the opportunity');
  observer.callback([entry(art,true,30),entry(art,false,40)]);
  assert.equal(env.root.dataset.workflowTour,'offscreen');assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.timers.size,0);
  observer.callback([entry(art,true,50),entry(env.root,false,60)]);observer.callback([entry(env.root,false,70)]);
  assert.equal(env.root.dataset.workflowTour,'offscreen','later visibility changes cannot replay');
  assert.equal(env.root.dataset.workflowReady,'true');assert.equal(art.dataset.ready,'true');assert.equal(env.motionTimers.size,0);
});

test('a batched exit and reentry cancels old animations and exposes only the final interactive stage',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(1180);
  const art=env.control('[data-workflow-art]'),observer=env.observers.find(item=>item.element===art&&!item.disconnected);
  const oldAnimations=[...env.document.animations],oldCallbacks=oldAnimations.map(animation=>animation.onfinish).filter(Boolean);
  observer.callback([{target:art,isIntersecting:false,intersectionRatio:0,time:10},{target:art,isIntersecting:true,intersectionRatio:1,time:20}]);
  assert(oldAnimations.every(animation=>animation.cancelled));assert.equal(env.root.dataset.workflowTour,'offscreen');assert.equal(env.root.dataset.workflowStep,'2');
  const frames=env.instances[0].rig.renderedFrames.length;oldCallbacks.forEach(run=>run());env.advance(10000);
  assert.equal(env.instances[0].rig.renderedFrames.length,frames);assert.equal(env.timers.size,0);assert.equal(env.motionTimers.size,0);
  assert.equal(env.control('[data-workflow-rig-host]').inert,false);assert.equal(env.instances[0].rig.options.interaction,'drag');
});

test('backgrounding an active introduction hands off permanently but does not consume an unstarted one',async t=>{
  const env=harness(t);env.mount();await env.load();
  env.document.hidden=true;env.document.fire('visibilitychange');env.advance(5000);
  assert.equal(env.root.dataset.workflowTour,'hidden');assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.timers.size,0);
  env.document.hidden=false;env.document.fire('visibilitychange');env.advance(10000);
  assert.equal(env.root.dataset.workflowTour,'hidden');assert.equal(env.instances[0].rig.options.interaction,'drag');
  env.mount();await env.load({visible:false});env.document.hidden=true;env.document.fire('visibilitychange');
  env.document.hidden=false;env.document.fire('visibilitychange');
  const observer=env.observers.find(item=>item.element===env.control('[data-workflow-art]')&&!item.disconnected);
  observer.notify(true);assert.equal(env.root.dataset.workflowTour,'playing','hidden preload is not a completed introduction');
});

test('reduced motion permanently cancels the introduction but preserves direct stages and associations',async t=>{
  const env=harness(t);env.mount();await env.load();
  env.preference.matches=true;env.preference.fire('change');assert.equal(env.root.dataset.workflowTour,'reduced');assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.timers.size,0);
  const count=env.document.animations.length;env.control('button[data-workflow-step="1"]').fire('click');
  assert.equal(env.document.animations.length,count);assert.equal(env.instances[0].rig.options.showMesh,true);
  env.control('button[data-workflow-step="2"]').fire('click');assert.equal(env.instances[0].rig.options.interaction,'drag');
  env.preference.matches=false;env.preference.fire('change');env.root.fire('pointerleave');await flush();env.advance(10000);
  assert.notEqual(env.root.dataset.workflowTour,'playing');assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.timers.size,0);
});

test('cleanup cancels timers, animations, subscriptions and its character instance',async t=>{
  const env=harness(t),cleanup=env.mount();await env.load();cleanup();
  assert.equal(env.timers.size,0);assert(env.observers.every(observer=>observer.disconnected));assert(env.document.animations.every(animation=>animation.cancelled));
  assert.equal(env.root.listeners.length,0);assert.equal(env.document.listeners.length,0);assert.equal(env.preference.listeners.length,0);
  assert.equal(env.control('[data-workflow-rig-host]').listeners.length,0);assert.equal(env.instances[0].rig.destroyed,true);
  assert.equal(env.control('[data-workflow-rig-host]').childNodes.length,0);assert.equal(env.root.dataset.workflowReady,undefined);
});

test('failed loading keeps a poster and retries successfully without duplicate instances',async t=>{
  let attempt=0;const env=harness(t,{loadCharacter:async()=>{if(++attempt===1)throw Error('fixture load failure');}});env.mount();
  env.observers[0].notify(true);await flush();assert.equal(env.root.dataset.workflowReady,'error');assert.equal(env.control('[data-workflow-retry]').hidden,false);
  assert.equal(env.control('[data-workflow-art]').dataset.ready,undefined);assert.equal(env.timers.size,0);
  env.control('[data-workflow-retry]').fire('click');await flush();assert.equal(env.root.dataset.workflowReady,'true');assert.equal(env.instances.length,1);assert.equal(env.loads,2);
  assert.equal(env.control('[data-workflow-retry]').hidden,true);
});

test('rapid stage changes during loading retain the latest choice with only one asset request',async t=>{
  let resolveLoad;const pending=new Promise(resolve=>{resolveLoad=resolve;});const env=harness(t,{loadCharacter:()=>pending});env.mount();
  env.observers[0].notify(true);
  for(const index of [1,0,1,2])env.control(`button[data-workflow-step="${index}"]`).fire('click');
  assert.equal(env.loads,1);assert.equal(env.instances.length,0);assert.equal(env.root.dataset.workflowStep,'2');
  resolveLoad();await flush();assert.equal(env.instances.length,1);assert.equal(env.root.dataset.workflowReady,'true');
  assert.equal(env.instances[0].rig.mode,'assembled');assert.equal(env.instances[0].rig.options.interaction,'drag');
});

test('a manual association selection made during loading remains selected after readiness',async t=>{
  let finish;const pending=new Promise(resolve=>{finish=resolve;});
  const env=harness(t,{loadCharacter:()=>pending});env.mount();env.observers[0].notify(true);env.observers[1].notify(true);
  env.control('button[data-workflow-step="1"]').fire('click');
  const detail=env.root.querySelector('details');detail.setAttribute('open','');env.root.fire('toggle',{target:detail});
  assert.equal(env.root.dataset.workflowStep,'1');finish();await flush();
  assert.equal(env.root.dataset.workflowReady,'true');assert.equal(env.root.dataset.workflowStep,'1');
  assert.match(env.control('[data-workflow-detail]').textContent,/关联与绑定/);assert.equal(env.instances[0].rig.options.interaction,'none');
  detail.removeAttribute('open');env.root.fire('toggle',{target:detail});env.advance(10000);
  assert.equal(env.root.dataset.workflowStep,'1');assert.notEqual(env.root.dataset.workflowTour,'playing');
});

test('a rejected character ready promise removes the broken instance and enables a clean retry',async t=>{
  let attempt=0;const env=harness(t,{ready:rig=>++attempt===1?Promise.reject(Error('fixture texture failure')):Promise.resolve(rig)});env.mount();
  env.observers[0].notify(true);await flush();assert.equal(env.root.dataset.workflowReady,'error');assert.equal(env.instances[0].rig.destroyed,true);
  assert.equal(env.control('[data-workflow-rig-host]').childNodes.length,0);
  env.control('[data-workflow-retry]').fire('click');await flush();assert.equal(env.root.dataset.workflowReady,'true');
  assert.equal(env.instances.length,2);assert.equal(env.control('[data-workflow-rig-host]').childNodes.length,1);assert.equal(env.instances[1].rig.destroyed,false);
});

test('a runtime rig error restores the poster and retry recovers final controls without replay',async t=>{
  const env=harness(t);env.mount();await env.load();const rigHost=env.control('[data-workflow-rig-host]');
  env.advance(1180);const pending=env.document.animations.filter(animation=>animation.onfinish).map(animation=>animation.onfinish),broken=env.instances[0];
  rigHost.fire('rig-error',{target:broken,detail:{message:'fixture context lost'}});
  assert.equal(env.root.dataset.workflowReady,'error');assert.equal(env.root.dataset.workflowTour,'error');assert.equal(env.root.dataset.workflowStep,'1');
  assert.equal(env.timers.size,0);assert.equal(broken.rig.destroyed,true);assert.equal(rigHost.childNodes.length,0);
  assert.notEqual(env.control('[data-workflow-art]').dataset.ready,'true');assert.equal(env.control('[data-workflow-retry]').hidden,false);
  pending.forEach(run=>run());assert.equal(env.root.dataset.workflowStep,'1','queued completions cannot continue after failure');
  env.control('[data-workflow-retry]').fire('pointerdown');env.control('[data-workflow-retry]').fire('click');await flush();
  assert.equal(env.root.dataset.workflowReady,'true');assert.equal(rigHost.childNodes.length,1);assert.equal(env.instances[1].rig.options.showMesh,true);
  env.root.fire('pointerleave');await flush();env.advance(10000);
  assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.instances[1].rig.options.interaction,'drag');assert.notEqual(env.root.dataset.workflowTour,'playing');
  assert.equal(env.timers.size,0);assert.equal(env.motionTimers.size,0);
});

test('foreign and stale rig errors are ignored and cleanup removes the error subscription',async t=>{
  const env=harness(t),cleanup=env.mount();await env.load();const rigHost=env.control('[data-workflow-rig-host]'),old=env.instances[0];
  rigHost.fire('rig-error',{target:env.document.createElement('character-rig')});assert.equal(env.root.dataset.workflowReady,'true');assert.equal(old.rig.destroyed,false);
  rigHost.fire('rig-error',{target:old});env.control('[data-workflow-retry]').fire('click');await flush();const current=rigHost.childNodes[0];
  rigHost.fire('rig-error',{target:old});assert.equal(env.root.dataset.workflowReady,'true');assert.equal(current.rig.destroyed,false);
  cleanup();assert.equal(rigHost.listeners.filter(listener=>listener.type==='rig-error').length,0);
  rigHost.fire('rig-error',{target:current});assert.equal(env.root.dataset.workflowReady,undefined);
});

test('unmount during the pending import never appends a late character',async t=>{
  let resolveLoad;const pending=new Promise(resolve=>{resolveLoad=resolve;});const env=harness(t,{loadCharacter:()=>pending}),cleanup=env.mount();
  env.observers[0].notify(true);cleanup();resolveLoad();await flush();
  assert.equal(env.instances.length,0);assert.equal(env.control('[data-workflow-rig-host]').childNodes.length,0);assert.equal(env.timers.size,0);
});

test('unmount during character readiness cannot restore a disposed live view',async t=>{
  let resolveReady;const env=harness(t,{ready:rig=>new Promise(resolve=>{resolveReady=()=>resolve(rig);})}),cleanup=env.mount();
  env.observers[0].notify(true);await flush();assert.equal(env.instances.length,1);cleanup();resolveReady();await flush();
  assert.equal(env.instances[0].rig.destroyed,true);assert.equal(env.control('[data-workflow-rig-host]').childNodes.length,0);
  assert.notEqual(env.control('[data-workflow-art]').dataset.ready,'true');assert.equal(env.root.dataset.workflowReady,undefined);assert.equal(env.timers.size,0);
});

test('remount disposes the old workflow and its stale cleanup cannot erase the new ready state',async t=>{
  const env=harness(t),oldCleanup=env.mount();await env.load();
  const cleanup=env.mount();assert.equal(env.instances[0].rig.destroyed,true);assert.equal(env.timers.size,0);await env.load();
  assert.equal(env.control('[data-workflow-rig-host]').childNodes.length,1);assert.equal(env.root.listeners.filter(item=>item.type==='click').length,1);
  oldCleanup();assert.equal(env.root.dataset.workflowReady,'true');assert.equal(env.instances[1].rig.destroyed,false);
  cleanup();assert.equal(env.instances[1].rig.destroyed,true);
});

test('a disconnected scene callback cannot overwrite a ready same-root remount',async t=>{
  const env=harness(t);env.mount();await env.load();
  const art=env.control('[data-workflow-art]');
  const oldObserver=env.observers.find(item=>item.element===art&&!item.disconnected);
  env.control('button[data-workflow-step="2"]').fire('click');
  env.mount();await env.load();assert(oldObserver.disconnected);assert.equal(env.root.dataset.workflowTour,'playing');
  const snapshot=()=>({tour:env.root.dataset.workflowTour,step:env.root.dataset.workflowStep,
    rigOpacity:env.control('[data-workflow-rig-host]').style.opacity,
    stackOpacity:env.control('[data-workflow-layer-stack]').style.opacity,
    inert:env.control('[data-workflow-rig-host]').inert});
  const before=snapshot();
  // disconnect prevents new observations, not a callback already in the queue.
  // Bypass notify's delivery gate deliberately; execute the actual old closure.
  oldObserver.callback([{target:art,isIntersecting:false,intersectionRatio:0,time:10}]);
  assert.equal(env.root.dataset.workflowTour,'playing','a disposed mount must not stop the current ready scene');
  assert.deepEqual(snapshot(),before,'old cinema cleanup must not mutate the new scene either');
  assert.equal(env.root.dataset.workflowReady,'true');assert.equal(art.dataset.ready,'true');
  assert.equal(env.instances[1].rig.destroyed,false);
  assert.equal(env.control('[data-workflow-rig-host]').childNodes.length,1);
  const current=env.observers.find(item=>item.element===art&&!item.disconnected);
  current.notify(false);assert.equal(env.timers.size,0);
  current.notify(true);assert.equal(env.root.dataset.workflowTour,'offscreen');assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.timers.size,0);
});

test('the layer stage projects all approved PNG bounds into the shared camera at each aspect ratio',()=>{
  for(const [width,height]of [[1100,560],[720,500],[350,365]]){
    const layout=workflowLayerLayout(approvedManifest,width,height);
    assert.equal(layout.length,26);assert.equal(new Set(layout.map(part=>part.id)).size,26);
    const base=approvedManifest.camera,scale=Math.min(width/base[2],height/base[3]);
    for(const [i,part]of layout.entries()){
      const bbox=approvedManifest.parts[i].bbox;
      assert(Math.abs(part.width/100*width-(bbox[2]-bbox[0])*scale)<1e-6);
      assert(Math.abs(part.height/100*height-(bbox[3]-bbox[1])*scale)<1e-6);
      assert(Math.abs(part.left/100*width-((bbox[0]-base[0])*scale+(width-base[2]*scale)/2))<1e-6);
      assert(Math.abs(part.top/100*height-((bbox[1]-base[1])*scale+(height-base[3]*scale)/2))<1e-6);
      assert.equal(part.assembled,'translate3d(0px, 0px, 0px) rotateY(0deg)');
      assert.notEqual(part.exploded,part.assembled);
    }
  }
});

test('the initial stage uses 26 decoded local transparent layers and no replacement rig mode',async t=>{
  const env=harness(t);env.mount();await env.load();
  const stack=env.control('[data-workflow-layer-stack]'),rigHost=env.control('[data-workflow-rig-host]');
  assert.equal(stack.childNodes.length,26);assert.equal(env.control('[data-workflow-art]').dataset.workflowLayerCount,'26');
  assert.deepEqual(stack.childNodes.map(image=>image.dataset.workflowLayer),approvedManifest.parts.map(part=>part.id));
  assert(stack.childNodes.every(image=>image.src.startsWith('http://127.0.0.1:3017/riglab-project/')));
  assert.equal(env.instances[0].rig.mode,'assembled');assert.equal(rigHost.inert,true);assert.equal(stack.style.opacity,'1');
  assert.equal(env.control('[data-workflow-camera]').dataset.workflowCameraPose,'layers');
});

test('the camera waits for collection and pose restoration before the final camera moves',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(1180);
  const host=env.control('[data-workflow-rig-host]'),stack=env.control('[data-workflow-layer-stack]');
  assert.equal(host.style.opacity,'0');assert.equal(host.inert,true);assert.equal(stack.style.opacity,'1');
  assert.equal(env.control('[data-workflow-camera]').dataset.workflowCameraPose,'fore-l');
  env.advance(1180);assert.equal(host.style.opacity,'1');assert.equal(host.inert,true);assert.equal(stack.style.opacity,'0');
  env.advance(527);assert.equal(env.root.dataset.workflowStep,'1');env.advance(1);assert.equal(env.root.dataset.workflowStep,'2');
  assert.equal(env.instances[0].rig.options.showMesh,true);assert.equal(env.instances[0].rig.options.interaction,'none');
  env.advance(1000);assert.equal(env.instances[0].rig.options.interaction,'drag');assert.equal(host.inert,false);
  env.control('button[data-workflow-step="1"]').fire('click');env.control('button[data-workflow-part="face"]').fire('click');
  assert.equal(env.control('[data-workflow-camera]').dataset.workflowCameraPose,'face');
});

test('a cancelled collection cannot expose controls after a new layer shot or cleanup',async t=>{
  const env=harness(t),cleanup=env.mount();await env.load();env.control('button[data-workflow-step="1"]').fire('click');
  const old=env.document.animations.findLast(animation=>animation.element.dataset.workflowLayer===approvedManifest.parts[4].id);
  env.control('button[data-workflow-step="0"]').fire('click');
  const state=()=>({stack:env.control('[data-workflow-layer-stack]').style.opacity,host:env.control('[data-workflow-rig-host]').style.opacity,handoff:env.control('[data-workflow-art]').dataset.workflowPoseHandoff});
  const before=state();old.onfinish();assert.deepEqual(state(),before,'the previous collection cannot expose a new layer shot');
  env.advance(528);
  assert.equal(env.control('[data-workflow-layer-stack]').style.opacity,'1');assert.equal(env.control('[data-workflow-rig-host]').style.opacity,'0');
  env.control('button[data-workflow-step="1"]').fire('click');const pending=env.document.animations.findLast(animation=>animation.element.dataset.workflowLayer===approvedManifest.parts[4].id);
  cleanup();pending.onfinish();assert.equal(env.control('[data-workflow-layer-stack]').childNodes.length,0);assert.equal(env.control('[data-workflow-rig-host]').style.opacity,'');
});

test('assets must all decode before visible automatic playback starts',async t=>{
  let finishDecode;const pending=new Promise(resolve=>{finishDecode=resolve;});
  const env=harness(t,{decode:()=>pending});env.mount();env.observers[0].notify(true);env.observers[1].notify(true);await flush();
  assert.notEqual(env.root.dataset.workflowTour,'playing');env.observers[1].notify(true);
  assert.notEqual(env.root.dataset.workflowTour,'playing');assert.equal(env.timers.size,0);
  finishDecode();await flush();assert.equal(env.root.dataset.workflowReady,'true');assert.equal(env.root.dataset.workflowTour,'playing');
});

test('a failed layer decode removes partial layers, restores the poster and offers retry',async t=>{
  let reject=true;const env=harness(t,{decode:()=>reject?Promise.reject(Error('fixture image decode failure')):Promise.resolve()});env.mount();
  env.observers[0].notify(true);await flush();assert.equal(env.root.dataset.workflowReady,'error');assert.equal(env.control('[data-workflow-layer-stack]').childNodes.length,0);
  assert.equal(env.control('[data-workflow-retry]').hidden,false);reject=false;env.control('[data-workflow-retry]').fire('click');await flush();assert.equal(env.root.dataset.workflowReady,'true');
});

test('a runtime failure during layer decode cannot be overwritten by its late success',async t=>{
  let finish;const pending=new Promise(resolve=>{finish=resolve;});
  const env=harness(t,{decode:()=>pending});env.mount();env.observers[0].notify(true);env.observers[1].notify(true);await flush();
  const host=env.control('[data-workflow-rig-host]'),old=env.instances[0];assert(old);assert.notEqual(env.root.dataset.workflowReady,'true');
  host.fire('rig-error',{target:old});assert.equal(env.root.dataset.workflowReady,'error');assert.equal(host.childNodes.length,0);
  finish();await flush();
  assert.equal(env.root.dataset.workflowReady,'error');assert.notEqual(env.control('[data-workflow-art]').dataset.ready,'true');
  assert.equal(env.control('[data-workflow-retry]').hidden,false);assert.equal(host.childNodes.length,0);assert.equal(env.timers.size,0);
  env.control('[data-workflow-retry]').fire('click');await flush();
  assert.equal(env.root.dataset.workflowReady,'true');assert.equal(host.childNodes.length,1);assert.equal(env.instances.length,2);
});

test('an older decode completion cannot finish or clear a newer retry still loading',async t=>{
  let firstDone,secondDone,generation=0;
  const first=new Promise(resolve=>{firstDone=resolve;}),second=new Promise(resolve=>{secondDone=resolve;});
  const env=harness(t,{loadCharacter:()=>{generation++;},decode:()=>generation===1?first:second});
  env.mount();env.observers[0].notify(true);env.observers[1].notify(true);await flush();
  const host=env.control('[data-workflow-rig-host]');host.fire('rig-error',{target:env.instances[0]});
  env.control('[data-workflow-retry]').fire('click');await flush();assert.equal(env.instances.length,2);
  firstDone();await flush();assert.notEqual(env.root.dataset.workflowReady,'true');
  env.control('[data-workflow-retry]').fire('click');await flush();assert.equal(env.instances.length,2,'old finally cannot clear the active loading guard');
  secondDone();await flush();assert.equal(env.root.dataset.workflowReady,'true');assert.equal(host.childNodes.length,1);assert.equal(env.instances[1].rig.destroyed,false);
});

test('same-size initial and repeated resize notifications cannot swallow the first shot',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(100);
  const resize=env.resizes[0],count=env.document.animations.length;
  resize.callback([]);resize.callback([]);
  assert.equal(env.root.dataset.workflowStep,'0');assert.equal(env.document.animations.length,count);
  env.advance(1079);assert.equal(env.root.dataset.workflowStep,'0');env.advance(1);assert.equal(env.root.dataset.workflowStep,'1');
});

test('a real resize retargets the current moving shot and rejects its prior completion callbacks',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(100);
  const art=env.control('[data-workflow-art]'),old=env.document.animations.map(animation=>animation.onfinish).filter(Boolean);
  art.rect={width:900,height:600};env.resizes[0].callback([]);
  assert.equal(env.root.dataset.workflowStep,'0');old.forEach(done=>done());assert.equal(env.root.dataset.workflowStep,'0');
  env.advance(1179);assert.equal(env.root.dataset.workflowStep,'0');env.advance(1);assert.equal(env.root.dataset.workflowStep,'1');
  old.forEach(done=>done());assert.equal(env.root.dataset.workflowStep,'1');env.advance(5000);assert.equal(env.root.dataset.workflowTour,'complete');
  const count=env.document.animations.length;art.rect={width:1000,height:560};env.resizes[0].callback([]);
  assert.equal(env.root.dataset.workflowTour,'complete');assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.document.animations.length,count);
  assert.equal(env.instances[0].rig.options.interaction,'drag');
});

test('the single introduction visibly restores an existing pose without overwriting its stored values',async t=>{
  const env=harness(t);env.mount();await env.load();const rig=env.instances[0].rig;
  rig.pose={handL:[48,-36],handR:[-14,22],body:6,head:-9,smile:.4};rig.render();const saved=structuredClone(rig.pose);
  env.advance(2360);
  assert.deepEqual(rig.renderedPose,{handL:[0,-0],handR:[-0,0],body:0,head:-0,smile:0});
  assert.deepEqual(rig.pose,saved);assert.equal(env.control('[data-workflow-art]').dataset.workflowPoseHandoff,'restoring');
  env.advance(256);assert(rig.renderedPose.handL[0]>0&&rig.renderedPose.handL[0]<48);assert.deepEqual(rig.pose,saved);
  env.advance(272);assert.deepEqual(rig.renderedPose,saved);assert.deepEqual(rig.pose,saved);assert.deepEqual(rig.resets,[]);
  assert.equal(env.control('[data-workflow-art]').dataset.workflowPoseHandoff,undefined);
  env.advance(1000);assert.equal(env.control('[data-workflow-rig-host]').inert,false);assert.equal(env.root.dataset.workflowTour,'complete');
});

test('pose interpolation follows one monotonic camera curve and includes exact endpoints',()=>{
  const pose={handL:[48,-36],body:6};let last=0;
  for(let i=0;i<=20;i++){
    const frame=workflowPoseFrame(pose,i/20);assert(frame.handL[0]>=last);assert(frame.handL[0]<=48);last=frame.handL[0];
    assert(Math.abs(frame.handL[1]/-36-frame.body/6)<1e-8);
  }
  assert.deepEqual(workflowPoseFrame(pose,1),pose);assert.deepEqual(pose,{handL:[48,-36],body:6});
});

test('only an explicit layer selection returns the saved rig to neutral before revealing PNGs',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(4000);
  const rig=env.instances[0].rig,saved=structuredClone(rig.pose),art=env.control('[data-workflow-art]'),rigHost=env.control('[data-workflow-rig-host]'),stack=env.control('[data-workflow-layer-stack]');
  env.advance(3000);assert.equal(env.root.dataset.workflowStep,'2');assert.equal(art.dataset.workflowPoseHandoff,undefined);
  env.control('button[data-workflow-step="0"]').fire('click');assert.equal(art.dataset.workflowPoseHandoff,'returning');
  assert.equal(rigHost.style.opacity,'1');assert.equal(stack.style.opacity,'0');assert.deepEqual(rig.pose,saved);
  env.advance(256);assert(rig.renderedPose.handL[0]>0&&rig.renderedPose.handL[0]<saved.handL[0]);assert.deepEqual(rig.pose,saved);
  env.advance(272);assert.equal(art.dataset.workflowPoseHandoff,undefined);assert.equal(stack.style.opacity,'1');assert.equal(rigHost.style.opacity,'0');
  env.advance(1180);env.control('button[data-workflow-step="1"]').fire('click');env.advance(1708);
  assert.deepEqual(rig.renderedPose,saved);assert.deepEqual(rig.pose,saved);assert.deepEqual(rig.resets,[]);
  env.advance(10000);assert.equal(env.root.dataset.workflowStep,'1','manual inspection never resumes the introduction');
});

test('unmount during a manual return rejects queued pose frames and cannot touch a same-root remount',async t=>{
  const env=harness(t);env.mount();await env.load();env.advance(4000);env.control('button[data-workflow-step="0"]').fire('click');env.advance(128);
  assert.equal(env.control('[data-workflow-art]').dataset.workflowPoseHandoff,'returning');
  const old=env.instances[0].rig,callbacks=[...env.timers.keys()].map(id=>env.history.get(id));env.mount();await env.load();
  const current=env.instances[1].rig,count=current.renderedFrames.length,step=env.root.dataset.workflowStep;
  for(const run of callbacks)run();
  assert.equal(env.root.dataset.workflowStep,step);assert.equal(current.renderedFrames.length,count);assert(old.destroyed);assert.equal(env.root.dataset.workflowTour,'playing');
});

test('taking over a collection exposes the saved rig and invalidates the delayed handoff',async t=>{
  const env=harness(t);env.mount();await env.load();const rig=env.instances[0].rig,saved=structuredClone(rig.pose);
  env.control('button[data-workflow-step="1"]').fire('click');const pending=env.document.animations.findLast(animation=>animation.element.dataset.workflowLayer===approvedManifest.parts[4].id);
  env.control('[data-workflow-art]').fire('pointerdown');
  assert.equal(env.control('[data-workflow-rig-host]').style.opacity,'1');assert.equal(env.control('[data-workflow-rig-host]').inert,false);
  pending.onfinish();env.advance(1000);assert.equal(env.timers.size,0);assert.deepEqual(rig.pose,saved);assert.deepEqual(rig.renderedPose,saved);
  env.control('button[data-workflow-step="2"]').fire('click');assert.equal(rig.options.interaction,'drag');assert.equal(env.control('[data-workflow-rig-host]').inert,false);
});

test('leaving during saved-pose recovery restores the saved pose and reentry retains final controls',async t=>{
  const env=harness(t);env.mount();await env.load();const rig=env.instances[0].rig,saved=structuredClone(rig.pose);
  env.advance(2360+160);
  assert.notDeepEqual(rig.renderedPose,saved);const observer=env.observers.find(item=>item.element===env.control('[data-workflow-art]'));
  observer.notify(false);assert.deepEqual(rig.renderedPose,saved);assert.deepEqual(rig.pose,saved);assert.equal(env.timers.size,0);
  assert.equal(env.control('[data-workflow-rig-host]').inert,false);observer.notify(true);env.advance(10000);
  assert.equal(env.root.dataset.workflowTour,'offscreen');assert.equal(env.root.dataset.workflowStep,'2');assert.deepEqual(rig.pose,saved);
  assert.equal(rig.options.interaction,'drag');assert.equal(env.motionTimers.size,0);
});

test('disposing during pose recovery cancels its frame and restores only its own character',async t=>{
  const env=harness(t),cleanup=env.mount();await env.load();const rig=env.instances[0].rig,saved=structuredClone(rig.pose);
  env.advance(2360+160);assert.equal(env.control('[data-workflow-art]').dataset.workflowPoseHandoff,'restoring');
  const pending=[...env.timers.keys()][0];assert(pending);cleanup();const count=rig.renderedFrames.length;
  env.history.get(pending)();assert.equal(rig.renderedFrames.length,count);assert.deepEqual(rig.renderedPose,saved);assert.deepEqual(rig.pose,saved);assert.equal(env.timers.size,0);
});

test('delayed collection and saved-pose recovery advance continuously without cutting either short',async t=>{
  const env=harness(t,{animationDelay:420});env.mount();await env.load();const rig=env.instances[0].rig;
  rig.pose={handL:[48,-36],handR:[-14,22],body:6,head:-9,smile:.4};rig.render();const saved=structuredClone(rig.pose);
  env.advance(3328);
  assert.equal(env.root.dataset.workflowStep,'1');assert.equal(env.control('[data-workflow-art]').dataset.workflowPoseHandoff,'restoring');
  assert(rig.renderedPose.handL[0]>0&&rig.renderedPose.handL[0]<24);assert.deepEqual(rig.pose,saved);
  env.advance(399);assert.equal(env.root.dataset.workflowStep,'1','the last pose frame is part of the shot');
  env.advance(1);assert.equal(env.root.dataset.workflowStep,'2');assert.deepEqual(rig.renderedPose,saved);assert.deepEqual(rig.pose,saved);
  assert.equal(env.instances[0].rig.options.interaction,'none');
  env.advance(1419);assert.equal(env.root.dataset.workflowTour,'playing');
  env.advance(1);assert.equal(env.root.dataset.workflowTour,'complete');assert.equal(env.instances[0].rig.options.interaction,'drag');
  env.advance(10000);assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.timers.size,0);assert.equal(env.motionTimers.size,0);
});

test('a synchronous completion path settles all shots with no timers or dangling subscription',()=>{
  const released=[],steps=[],states=[];
  const tour=createWorkflowTour({onStep:value=>steps.push(value),onState:value=>states.push(value),whenSettled:done=>{const index=steps.at(-1);done();return()=>released.push(index);}});
  tour.start();assert.deepEqual(steps,[0,1,2]);assert.deepEqual(states,['playing','complete']);assert.equal(tour.running,false);
  assert.deepEqual(released.sort(),[0,1,2]);tour.start();assert.deepEqual(steps,[0,1,2]);
});

for(const action of ['stop','skip','destroy'])test(`a queued completion cannot advance after ${action}`,()=>{
  const {time,steps,pending,tour}=controlledTour();tour.start();const old=pending[0];
  tour[action]();assert(old.cancelled);old.done();old.done();tour.start();time.advance(10000);
  assert.deepEqual(steps,[0]);assert.equal(time.timers.size,0);assert.equal(tour.running,false);
});

for(const action of ['stop','destroy'])test(`an earlier completion cannot cancel the current shot before ${action}`,()=>{
  const {steps,pending,tour}=controlledTour();tour.start();const old=pending[0];old.done();const active=pending[1];
  old.done();old.done();assert.deepEqual(steps,[0,1]);assert.equal(active.cancelled,false);
  tour[action]();assert(active.cancelled);active.done();assert.deepEqual(steps,[0,1]);
});

for(const action of ['takeover','reentry','offscreen','background','reduced','dispose'])test(`late WAAPI and pose frames cannot resume a recovery after ${action}`,async t=>{
  const env=harness(t,{animationDelay:420}),cleanup=env.mount();await env.load();const rig=env.instances[0].rig,saved=structuredClone(rig.pose);
  env.advance(3328);assert.equal(env.control('[data-workflow-art]').dataset.workflowPoseHandoff,'restoring');
  const callbacks=[...env.document.animations.map(animation=>animation.onfinish),...[...env.timers.keys()].map(id=>env.history.get(id))].filter(Boolean);
  if(action==='takeover')env.control('[data-workflow-art]').fire('pointerdown');
  if(action==='reentry'){env.observers[1].notify(false);env.observers[1].notify(true);}
  if(action==='offscreen')env.observers.find(observer=>observer.element===env.control('[data-workflow-art]')).notify(false);
  if(action==='background'){env.document.hidden=true;env.document.fire('visibilitychange');}
  if(action==='reduced'){env.preference.matches=true;env.preference.fire('change');}
  if(action==='dispose')cleanup();
  const step=env.root.dataset.workflowStep,frames=rig.renderedFrames.length;
  for(const callback of callbacks)callback();
  assert.equal(env.root.dataset.workflowStep,step);assert.equal(rig.renderedFrames.length,frames);assert.deepEqual(rig.pose,saved);
  env.advance(10000);assert.equal(env.root.dataset.workflowStep,step);assert.equal(env.timers.size,0);assert.equal(env.motionTimers.size,0);
  if(action!=='dispose'){
    assert.equal(step,'2');assert.deepEqual(rig.renderedPose,saved);assert.equal(env.control('[data-workflow-rig-host]').inert,false);assert.equal(rig.options.interaction,'drag');
  }
});

test('missing WAAPI synchronously completes once without hiding the saved character',async t=>{
  const env=harness(t,{waapi:false});env.mount();await env.load();const rig=env.instances[0].rig,saved=structuredClone(rig.pose);
  assert.equal(env.root.dataset.workflowTour,'complete');assert.equal(env.root.dataset.workflowStep,'2');
  assert.equal(env.control('[data-workflow-rig-host]').inert,false);assert.equal(env.control('[data-workflow-rig-host]').style.opacity,'1');
  assert.deepEqual(rig.renderedPose,saved);assert.equal(env.control('[data-workflow-art]').dataset.workflowPoseHandoff,undefined);assert.equal(rig.options.interaction,'drag');
  env.advance(10000);env.root.fire('pointerleave');assert.equal(env.root.dataset.workflowStep,'2');
  assert.equal(env.document.animations.length,0);assert.equal(env.timers.size,0);assert.equal(env.motionTimers.size,0);
});

test('initial reduced motion shows each selected shot immediately and never starts recovery',async t=>{
  const env=harness(t);env.preference.matches=true;env.mount();await env.load();const rig=env.instances[0].rig,saved=structuredClone(rig.pose);
  assert.notEqual(env.root.dataset.workflowTour,'playing');assert.equal(env.timers.size,0);
  for(const step of [1,2]){
    env.control(`button[data-workflow-step="${step}"]`).fire('click');assert.equal(env.root.dataset.workflowStep,String(step));
    assert.equal(env.control('[data-workflow-rig-host]').inert,false);assert.equal(env.control('[data-workflow-rig-host]').style.opacity,'1');
    assert.deepEqual(rig.renderedPose,saved);assert.equal(env.control('[data-workflow-art]').dataset.workflowPoseHandoff,undefined);
  }
  assert.equal(env.document.animations.length,0);assert.equal(env.timers.size,0);assert.equal(env.motionTimers.size,0);
});

test('initial reduced motion consumes the introduction without needing any manual input',async t=>{
  const env=harness(t);env.preference.matches=true;env.mount();await env.load();
  assert.equal(env.root.dataset.workflowStep,'2');assert.equal(env.instances[0].rig.options.interaction,'drag');
  const count=env.document.animations.length;env.preference.matches=false;env.preference.fire('change');
  env.observers[1].notify(false);env.observers[1].notify(true);env.advance(10000);
  assert.equal(env.root.dataset.workflowStep,'2');assert.notEqual(env.root.dataset.workflowTour,'playing');assert.equal(env.document.animations.length,count);
});

for(const target of ['camera','last-layer'])test(`every shot waits for its independently delayed ${target}`,async t=>{
  const matches=element=>target==='camera'?element.hasAttribute('data-workflow-camera'):element.dataset.workflowLayer===approvedManifest.parts.at(-1).id;
  const env=harness(t,{animationDelay:element=>matches(element)?1200:0});env.mount();await env.load();
  const layers=env.document.animations.filter(animation=>animation.element.hasAttribute('data-workflow-layer'));
  assert.equal(layers.length,26);assert(layers.every(animation=>typeof animation.onfinish==='function'));
  assert.equal(typeof env.document.animations.find(animation=>animation.element.hasAttribute('data-workflow-camera')).onfinish,'function');
  env.advance(1800);assert.equal(env.root.dataset.workflowStep,'0','the camera and all layers, not just the handoff layer, must finish');
  env.advance(399);assert.equal(env.root.dataset.workflowStep,'0');
  env.advance(1);assert.equal(env.root.dataset.workflowStep,'1');assert.equal(env.root.dataset.workflowTour,'playing');
});
