import test from 'node:test';
import assert from 'node:assert/strict';
import gsap from '../public/_nuxt/index4.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
import {mountCapabilityKeyboardFocus} from '../components/home/landing/capability-keyboard.mjs';

class Events {
  listeners = new Map();
  addEventListener(type, callback) {const group=this.listeners.get(type)||new Set();group.add(callback);this.listeners.set(type,group);}
  removeEventListener(type, callback) {this.listeners.get(type)?.delete(callback);}
  emit(type, fields={}) {
    const event={type,target:this,isTrusted:true,defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...fields};
    for(const callback of [...this.listeners.get(type)||[]])callback(event);
    return event;
  }
  count() {return [...this.listeners.values()].reduce((sum,group)=>sum+group.size,0);}
}

// Real shipped GSAP owns x and phase interpolation. Only native focus delivery,
// DOM geometry, Lenis's physical scroll and ScrollTrigger.update are adapted.
// These tests do not claim to reproduce browser default Tab scrolling or paint.
function fixture(t,{lenis=true,withSync=true,withOrbit=true,width=1600,cardWidth=1320,stageWidth=876,padding=24}={}) {
  const doc=new Events(),win=new Events(),scrolls=[],orbitCalls=[];
  const size={width,height:900,containerLeft:80,containerRight:width-80,padding,cardWidth,stageWidth,orbitLeft:6760};
  let reduced=false,trigger,updates=0;
  class Node {
    constructor(kind,parent,rect) {this.kind=kind;this.parent=parent;this.rect=rect;this.ownerDocument=doc;this.isConnected=true;this.x=0;}
    contains(node) {for(let current=node;current;current=current.parent)if(current===this)return true;return false;}
    closest(selector) {for(let node=this;node;node=node.parent)if(selector==='.duik-capability-card'&&node.kind==='card'||selector==='#reuse'&&node.kind==='orbit')return node;return null;}
    querySelector(selector) {if(this===root)return selector==='.kp-home-capabilities-content'?content:selector==='.kp-container'?container:null;return selector==='[data-motion-stage]'?this.stage||null:null;}
    getBoundingClientRect() {const value=this.rect();return {...value,right:value.left+value.width,bottom:value.top+value.height};}
    focus() {assert.fail('The handoff must not replace native focus navigation');}
  }
  const root=new Node('root',null,()=>({left:0,top:0,width:size.width,height:size.height}));
  const content=new Node('content',root,()=>({left:content.x,top:0,width:6000,height:size.height}));
  const container=new Node('container',root,()=>({left:size.containerLeft,top:0,width:size.containerRight-size.containerLeft,height:size.height}));
  const cards=Array.from({length:3},(_,index)=>{
    const card=new Node('card',content,()=>({left:100+index*1620+content.x,top:180,width:size.cardWidth,height:650}));
    card.stage=new Node('stage',card,()=>({left:card.getBoundingClientRect().left+444,top:180,width:size.stageWidth,height:526}));
    card.control=new Node('control',card,()=>({left:card.getBoundingClientRect().left+600,top:742,width:100,height:34}));
    card.link=new Node('link',card,()=>({left:card.getBoundingClientRect().left+1225,top:790,width:95,height:22}));
    return card;
  });
  const orbit=new Node('orbit',content,()=>({left:size.orbitLeft+content.x,top:0,width:size.width,height:size.height}));
  orbit.selected=2;
  orbit.link=new Node('orbit-link',orbit,()=>({left:orbit.getBoundingClientRect().left+350,top:680,width:210,height:28}));
  orbit.step=new Node('orbit-step',orbit,()=>({left:orbit.getBoundingClientRect().left+350,top:240,width:120,height:44}));
  Object.assign(win,{
    scrollY:0,
    getComputedStyle:()=>({paddingLeft:String(size.padding),paddingRight:String(size.padding)}),
    scrollTo(options){scrolls.push({transport:'native',...options});win.scrollY=options.top;},
  });
  Object.defineProperties(win,{innerWidth:{get:()=>size.width},innerHeight:{get:()=>size.height}});
  if(lenis)win.lenis={scrollTo(top,options){scrolls.push({transport:'lenis',top,...options});win.scrollY=top;}};
  Object.assign(doc,{defaultView:win,activeElement:root,hidden:false,documentElement:{}});
  Object.defineProperties(doc.documentElement,{clientWidth:{get:()=>size.width},clientHeight:{get:()=>size.height}});
  const sync=()=>{updates++;trigger.animation.totalProgress((win.scrollY-trigger.start)/(trigger.end-trigger.start),false);};
  const rebuild=({distance=6000,delay=.05,travelDuration=3,totalTail=3,start=2400,span=10000}={})=>{
    trigger?.animation.kill();gsap.set(content,{x:0});
    const animation=gsap.timeline({paused:true});
    animation.to(content,{x:-distance,ease:'none',duration:travelDuration},delay);
    animation.to({val:0},{val:1,duration:totalTail},delay+travelDuration);
    trigger={animation,start,end:start+span,update:sync};
    animation.time(delay,false);win.scrollY=start+delay/animation.totalDuration()*span;
    gsap.ticker.sleep();
  };
  rebuild();
  const args={root,getTrigger:()=>trigger,gsap,isReduced:()=>reduced,...withSync?{sync}:{},...withOrbit?{revealOrbit:target=>orbitCalls.push(target)}:{}};
  let controller=mountCapabilityKeyboardFocus(args);
  const focus=target=>{
    if(doc.activeElement!==target)win.emit('blur',{target:doc.activeElement});
    doc.activeElement=target;doc.emit('focusin',{target});
  };
  const tab=(target,fields={})=>{
    const event=doc.emit('keydown',{key:'Tab',...fields});focus(target);doc.emit('keyup',{key:'Tab'});
    assert.equal(event.defaultPrevented,false,'Tab must retain its native default action');
  };
  t.after(()=>{controller.dispose();trigger?.animation.kill();gsap.ticker.sleep();});
  return {
    root,doc,win,size,content,cards,orbit,orbitCalls,scrolls,focus,tab,rebuild,args,
    get controller(){return controller;},get trigger(){return trigger;},get updates(){return updates;},
    setReduced(value){reduced=value;},replaceTrigger(value){trigger=value;},
    remount(){const previous=controller;controller=mountCapabilityKeyboardFocus(args);return previous;},
    seek(fraction){const animation=trigger.animation;animation.time(.05+3*fraction,false);win.scrollY=trigger.start+animation.totalProgress()*(trigger.end-trigger.start);},
    assertVisible(node){const box=node.getBoundingClientRect();assert(box.left>=size.containerLeft+size.padding-.001);assert(box.right<=size.containerRight-size.padding+.001);},
  };
}

test('real GSAP inverse instantly brings every Motion scene into view in either Tab direction',t=>{
  const f=fixture(t),childCount=f.trigger.animation.getChildren().length;
  for(const index of [1,2,1,0,2]){
    const card=f.cards[index],beforeX=f.content.x,box=card.getBoundingClientRect();
    const desiredX=Math.max(-6000,Math.min(0,beforeX+(1600-box.left-box.right)/2));
    const expectedTime=.05+(-desiredX/6000)*3;
    f.tab(card.stage,{shiftKey:index<2});
    f.assertVisible(card.stage);
    assert.equal(f.doc.activeElement,card.stage);
    assert(Math.abs(f.trigger.animation.time()-expectedTime)<1e-6);
    assert.equal(f.scrolls.at(-1).immediate,true);
    assert.equal(f.scrolls.at(-1).force,undefined);
  }
  assert.equal(f.trigger.animation.getChildren().length,childCount,'No extra animation may be created');
  assert.equal(f.updates,f.scrolls.length);
});

test('visible links and same-scene controls do not recenter the parent',t=>{
  const f=fixture(t);
  f.tab(f.cards[0].link);assert.equal(f.scrolls.length,0);
  f.tab(f.cards[1].stage);const scrolls=f.scrolls.length;
  f.tab(f.cards[1].control);f.tab(f.cards[1].link);
  assert.equal(f.scrolls.length,scrolls);
  assert.equal(f.root.inert,undefined);assert.equal(f.cards[2].inert,undefined);
  assert.equal(f.cards[2].tabIndex,undefined,'The helper must not rewrite Tab order');
});

test('focus entry reads the live transform after native Tab has already changed physical scroll',t=>{
  const f=fixture(t);f.seek(.08);
  f.doc.emit('keydown',{key:'Tab'});
  // Model only the observed ordering, not the browser's default scroll amount.
  // The parent timeline has consumed that scroll before focusin is delivered.
  f.seek(.12);const before=f.win.scrollY;
  f.focus(f.cards[1].stage);f.doc.emit('keyup',{key:'Tab'});
  f.assertVisible(f.cards[1].stage);assert.notEqual(f.win.scrollY,before);
  assert(Math.abs(f.content.x+1580)<1e-6,'Current geometry must cancel the current translation');
});

test('keydown → old element blur → focusin → keyup preserves Tab intent at the window capture listener',t=>{
  const f=fixture(t),oldTarget=f.cards[0].link,target=f.cards[1].stage;
  f.doc.activeElement=oldTarget;
  f.doc.emit('keydown',{target:oldTarget,key:'Tab'});
  f.win.emit('blur',{target:oldTarget});
  f.doc.activeElement=target;f.doc.emit('focusin',{target});f.doc.emit('keyup',{target,key:'Tab'});
  assert.equal(f.scrolls.length,1);f.assertVisible(target);
  f.doc.emit('keydown',{target,key:'Tab'});f.win.emit('blur',{target:f.win});
  f.focus(f.cards[2].stage);f.doc.emit('keyup',{key:'Tab'});
  assert.equal(f.scrolls.length,1,'Actual window blur must still cancel pending Tab intent');
});

test('pointer focus, programmatic focus and synthetic or modified Tab do not move the timeline',t=>{
  const f=fixture(t),target=f.cards[1].stage;
  f.focus(target);
  f.tab(target,{isTrusted:false});f.tab(target,{ctrlKey:true});f.tab(target,{altKey:true});f.tab(target,{metaKey:true});
  f.doc.emit('keydown',{key:'Tab'});f.doc.emit('pointerdown');f.focus(target);
  f.doc.emit('keydown',{key:'Tab'});f.doc.emit('keyup',{key:'Tab'});f.focus(target);
  f.doc.emit('keydown',{key:'ArrowRight'});f.focus(target);
  assert.equal(f.scrolls.length,0);
  f.tab(target);assert.equal(f.scrolls.length,1);
  f.focus(f.cards[2].stage);assert.equal(f.scrolls.length,1,'One Tab authorizes only its next focus event');
});

test('Tab can reveal the same scene again after the user has scrolled away',t=>{
  const f=fixture(t);f.tab(f.cards[1].stage);f.seek(.7);
  const before=f.scrolls.length;f.tab(f.cards[1].control);
  assert.equal(f.scrolls.length,before+1);f.assertVisible(f.cards[1].control);
});

test('camera exit and reverse orbit entry delegate only to the original orbit owner',t=>{
  const f=fixture(t);f.tab(f.cards[2].stage);f.tab(f.cards[2].link);
  const scrolls=f.scrolls.length,updates=f.updates;
  f.tab(f.orbit.link);
  assert.deepEqual(f.orbitCalls,[f.orbit.link]);assert.equal(f.orbit.selected,2);
  assert.equal(f.doc.activeElement,f.orbit.link);
  assert.equal(f.scrolls.length,scrolls);assert.equal(f.updates,updates,'The callback alone owns scroll synchronization');
  f.focus(f.root);f.tab(f.orbit.step,{shiftKey:true});
  assert.deepEqual(f.orbitCalls,[f.orbit.link,f.orbit.step]);assert.equal(f.orbit.selected,2);
  f.seek(1);f.tab(f.cards[2].link,{shiftKey:true});f.assertVisible(f.cards[2].link);
  assert.equal(f.orbitCalls.length,2,'Returning to Motion uses its original translation inverse');
});

test('a visible orbit target is a no-op, and orbit never requires a Motion translation tween',t=>{
  const f=fixture(t);f.size.orbitLeft=600;f.tab(f.orbit.link);assert.equal(f.orbitCalls.length,0);
  f.size.orbitLeft=6760;const original=f.trigger;f.replaceTrigger(null);
  f.tab(f.orbit.link);f.replaceTrigger(original);
  assert.deepEqual(f.orbitCalls,[f.orbit.link]);assert.equal(f.scrolls.length,0);
  f.orbit.parent=null;f.tab(f.orbit.step);assert.equal(f.orbitCalls.length,1,'The orbit must belong to this root');
  const optional=fixture(t,{withOrbit:false});optional.tab(optional.orbit.link);assert.equal(optional.scrolls.length,0);
});

test('orbit pointer focus and scroll locks do not invoke the reveal callback',t=>{
  const f=fixture(t);f.focus(f.orbit.link);
  f.doc.emit('keydown',{key:'Tab'});f.doc.emit('pointerdown');f.focus(f.orbit.step);
  f.win.lenis.isStopped=true;f.tab(f.orbit.link);f.win.lenis.isStopped=false;
  f.win.lenis.isLocked=true;f.tab(f.orbit.link);f.win.lenis.isLocked=false;
  assert.equal(f.orbitCalls.length,0);f.tab(f.orbit.link);assert.equal(f.orbitCalls.length,1);
});

test('orbit entry shares the guarded latest-focus resize queue',t=>{
  const f=fixture(t);f.controller.suspend();f.tab(f.orbit.link);f.tab(f.orbit.step);
  assert.equal(f.orbitCalls.length,0);f.controller.resume();
  assert.deepEqual(f.orbitCalls,[f.orbit.step]);
  f.controller.suspend();f.tab(f.orbit.link);f.focus(f.root);f.controller.resume();
  assert.equal(f.orbitCalls.length,1);
  f.controller.suspend();f.tab(f.orbit.link);f.orbit.link.isConnected=false;f.controller.resume();
  assert.equal(f.orbitCalls.length,1);
});

test('reduced-motion and disposal cancel orbit entry without changing its selection',t=>{
  const f=fixture(t);f.setReduced(true);f.tab(f.orbit.link);assert.equal(f.orbitCalls.length,0);
  f.setReduced(false);f.controller.suspend();f.tab(f.orbit.link);f.setReduced(true);f.controller.resume();
  f.setReduced(false);f.controller.resume();assert.equal(f.orbitCalls.length,0);
  f.controller.suspend();f.tab(f.orbit.link);f.controller.dispose();f.controller.resume();
  assert.equal(f.orbitCalls.length,0);assert.equal(f.orbit.selected,2);
});

test('oversized cards prioritize the focused control and available canvas instead of rejecting the scene',t=>{
  const f=fixture(t,{width:1100,cardWidth:1600,stageWidth:876});
  f.tab(f.cards[1].stage);f.assertVisible(f.cards[1].stage);
  f.tab(f.cards[1].link);f.assertVisible(f.cards[1].link);
  const stage=f.cards[1].stage.getBoundingClientRect();assert(stage.right>0&&stage.left<f.size.width);
  f.size.stageWidth=1500;f.tab(f.cards[2].stage);
  const oversized=f.cards[2].stage.getBoundingClientRect();
  assert(oversized.left<0&&oversized.right>f.size.width,'A wider-than-viewport canvas remains centered and reachable');
});

test('resume uses the rebuilt timeline and latest still-focused request after both layout commits',t=>{
  const f=fixture(t);f.controller.suspend();f.tab(f.cards[1].stage);f.tab(f.cards[2].stage);
  assert.equal(f.scrolls.length,0);
  Object.assign(f.size,{width:1200,containerLeft:20,containerRight:1180,padding:16});
  f.rebuild({distance:5400,delay:.2,travelDuration:4,totalTail:2,start:6000,span:17000});
  const box=f.cards[2].stage.getBoundingClientRect(),desiredX=(1200-box.left-box.right)/2;
  const expected=6000+(.2+(-desiredX/5400)*4)/6.2*17000;
  f.controller.resume();
  assert.equal(f.scrolls.length,1);f.assertVisible(f.cards[2].stage);
  assert(Math.abs(f.scrolls[0].top-expected)<1e-6);
  f.controller.resume();assert.equal(f.scrolls.length,1,'A pending request is consumed once');
});

test('pending requests do not survive lost focus, disconnection, pointer input, blur or backgrounding',t=>{
  for(const cancel of [
    f=>f.focus(f.root),f=>{f.doc.activeElement=f.root;},f=>{f.cards[1].stage.isConnected=false;},
    f=>{f.root.isConnected=false;},f=>f.doc.emit('pointerdown'),f=>f.win.emit('blur'),
    f=>{f.doc.hidden=true;f.doc.emit('visibilitychange');f.doc.hidden=false;},
  ]){
    const f=fixture(t);f.controller.suspend();f.tab(f.cards[1].stage);cancel(f);f.controller.resume();
    assert.equal(f.scrolls.length,0);
  }
});

test('reduced-motion and rapid preference changes discard stale queued entry',t=>{
  const f=fixture(t);f.setReduced(true);f.tab(f.cards[1].stage);assert.equal(f.scrolls.length,0);
  f.setReduced(false);f.controller.suspend();f.tab(f.cards[1].stage);f.setReduced(true);f.controller.resume();
  assert.equal(f.scrolls.length,0);f.setReduced(false);f.controller.resume();assert.equal(f.scrolls.length,0);
  f.controller.suspend();f.tab(f.cards[1].stage);f.setReduced(true);f.controller.suspend();f.setReduced(false);f.controller.resume();
  assert.equal(f.scrolls.length,0);
});

test('dispose cancels pending work and removes every listener; remount does not duplicate owners',t=>{
  const f=fixture(t),count=f.doc.count()+f.win.count();assert(count>0);
  const previous=f.remount();assert.equal(f.doc.count()+f.win.count(),count);previous.dispose();
  f.controller.suspend();f.tab(f.cards[1].stage);f.controller.dispose();f.controller.resume();
  assert.equal(f.doc.count()+f.win.count(),0);assert.equal(f.scrolls.length,0);
  f.tab(f.cards[2].stage);assert.equal(f.scrolls.length,0);
});

test('native fallback is instant and may synchronize through the original trigger update',t=>{
  const f=fixture(t,{lenis:false,withSync:false});f.tab(f.cards[1].stage);
  assert.equal(f.scrolls[0].behavior,'instant');assert.equal(f.scrolls[0].transport,'native');
  assert.equal(f.updates,1);f.assertVisible(f.cards[1].stage);
});

test('existing Lenis locks are respected without timeline-only jumps',t=>{
  const f=fixture(t);f.win.lenis.isStopped=true;f.tab(f.cards[1].stage);
  f.win.lenis.isStopped=false;f.win.lenis.isLocked=true;f.tab(f.cards[1].stage);
  assert.equal(f.scrolls.length,0);assert.equal(f.updates,0);
  f.win.lenis.isLocked=false;f.tab(f.cards[1].stage);assert.equal(f.scrolls.length,1);
});

test('missing or ambiguous travel contracts fail safely without changing focus',t=>{
  const f=fixture(t),original=f.trigger;
  f.replaceTrigger(null);f.tab(f.cards[1].stage);f.replaceTrigger(original);
  f.rebuild({distance:0});f.tab(f.cards[1].stage);
  f.rebuild();f.trigger.animation.to(f.content,{x:-500,ease:'none',duration:1},0);f.tab(f.cards[1].stage);
  assert.equal(f.scrolls.length,0);assert.equal(f.doc.activeElement,f.cards[1].stage);
});

test('the DOM root and original timeline adapter are explicit requirements',()=>{
  assert.throws(()=>mountCapabilityKeyboardFocus(),TypeError);
});
