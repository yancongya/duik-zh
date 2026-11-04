import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {parse} from 'parse5';
import gsap from '../public/_nuxt/index4.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
import {patchCapabilityLayoutRuntime} from './lib/landing-capability-layout.mjs';
import {patchCapabilityKeyboardRuntime} from './lib/landing-capability-keyboard.mjs';

const filename='HomeCapabilitiesKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const original=await readFile(new URL('../components/home/landing/baseline/_nuxt/'+filename,import.meta.url),'utf8');
const diagnostic=process.env.DUIK_CAPABILITY_TEST_ORIGINAL==='1';
const patches=diagnostic?null:await import('./lib/landing-capability-resize.mjs');
const transform=diagnostic?source=>source:patches.patchCapabilityResizeRuntime;
const code=transform(original);
const patchedTest=(name,run)=>test(name,{skip:diagnostic},run);

class Events{
  listeners=new Map();
  addEventListener(type,run){const group=this.listeners.get(type)||new Set();group.add(run);this.listeners.set(type,group);}
  removeEventListener(type,run){this.listeners.get(type)?.delete(run);}
  emit(type,event={}){for(const run of [...this.listeners.get(type)||[]])run({type,...event});}
  count(type){return this.listeners.get(type)?.size||0;}
}

// The seam is the captured component's setup, render, mount, native resize and
// MediaQueryList change events, and unmount. Its complete GSAP timeline, tween ordering, formulas and onUpdate
// callbacks run unchanged using the locally shipped GSAP engine. Only browser
// geometry, Vue's render queue/VNode helpers and ScrollTrigger's viewport boundary are adapted;
// this does not claim a browser layout, GPU or physical-scroll verification.
function fixture(t,{interacted=true,environment='production',initialSize={},reduced=false,keyboard=false}={}){
  const win=new Events(),refs=[],mounted=[],unmounted=[],frames=new Map(),frameHistory=[],ticks=[],history=[],active=new Set(),scrollCalls=[];
  const interaction={value:interacted};
  const keyboardCalls=[];let keyboardOptions;
  const size={width:1440,height:900,container:1344,inner:500,list:3500,...initialSize};
  let nextFrame=0,domDesktop=true,domSpacer='200vh',disposed=false,refreshCount=0,currentScrollProgress=0,geometryReads=0,currentOwner=null;
  const mediaLists=new Map();
  const matches=query=>{
    const min=/min-width\s*:\s*([\d.]+)px/.exec(query),max=/max-width\s*:\s*([\d.]+)px/.exec(query);
    if(min&&size.width<Number(min[1])||max&&size.width>Number(max[1]))return false;
    if(/prefers-reduced-motion\s*:\s*no-preference/.test(query))return !reduced;
    if(/prefers-reduced-motion\s*:\s*reduce/.test(query))return reduced;
    return true;
  };
  const matchMedia=query=>{
    if(!mediaLists.has(query)){
      const list=new Events();list.media=query;
      Object.defineProperty(list,'matches',{get:()=>matches(query)});
      mediaLists.set(query,list);
    }
    return mediaLists.get(query);
  };
  class Element{
    constructor(kind){this.kind=kind;this.style={};this.attributes=new Map();this.x=0;this.strokeDashoffset=0;this.strokeDasharray=0;}
    getBoundingClientRect(){geometryReads++;return {width:this.kind==='inner'?size.inner:this.kind==='list'?size.list:this.kind==='container'?size.container:size.width,height:size.height};}
    setAttribute(name,value){this.attributes.set(name,String(value));}
    getAttribute(name){return this.attributes.get(name)||null;}
    getTotalLength(){return 4096;}
  }
  const nodes={
    '.kp-home-capabilities-wrap':new Element('wrapper'),
    '.kp-home-capabilities-inner':new Element('inner'),
    '.kp-home-capabilities-content':new Element('content'),
    '.kp-home-capabilities-content-list':new Element('list'),
    '.kp-home-capabilities .kp-container':new Element('container'),
  };
  const svg=new Element('svg'),path=new Element('path');
  const doc={querySelector(selector){if(!domDesktop&&['.kp-home-capabilities-inner','.kp-home-capabilities-content','.kp-home-capabilities-content-list'].includes(selector))return null;return nodes[selector]||null;}};
  Object.assign(win,{
    matchMedia,
    getComputedStyle(){return {paddingRight:'0'};},
    scrollTo(...args){scrollCalls.push(args);},
    lenis:{scrollTo(...args){scrollCalls.push(args);}},
  });
  Object.defineProperties(win,{innerWidth:{get:()=>size.width},innerHeight:{get:()=>size.height}});
  const triggers={
    getById(id){return [...active].find(record=>record.options.id===id);},
    update(){},
    refresh(){refreshCount++;for(const record of active){record.refreshedEnd=record.options.end();record.spacerAtRefresh=domSpacer;record.timeline.totalProgress(currentScrollProgress,false);}},
  };
  const engine={
    registerPlugin(){},
    set:gsap.set,
    context(run){
      const owner={records:[]},previous=currentOwner;currentOwner=owner;
      let context;try{context=gsap.context(run);}finally{currentOwner=previous;}
      return {revert(){context.revert();for(const record of owner.records){record.reverted=true;active.delete(record);}}};
    },
    matchMedia(){return {add(query,run){if(matches(query))run();return this;}};},
    timeline({scrollTrigger}){
      const timeline=gsap.timeline({paused:true});
      const record={options:scrollTrigger,timeline,reverted:false};
      history.push(record);active.add(record);currentOwner?.records.push(record);
      return timeline;
    },
  };
  const ref=value=>{const item={value};refs.push(item);return item;};
  const vnode=(tag,props,children)=>({tag,props,children});
  const context={
    window:win,document:doc,HTMLElement:Element,M:engine,oe:triggers,matchMedia,
    Xe:value=>value,T:ref,Ye:()=>({hasInteracted:interaction}),
    at:get=>({get value(){return get();}}),nt:()=>({public:{PUBLIC_ENV:environment}}),
    Fe(){},Ze:run=>mounted.push(run),et:run=>unmounted.push(run),K:value=>value,
    console:{log(){}},
    requestAnimationFrame(run){const id=++nextFrame;frames.set(id,run);frameHistory.push(run);return id;},
    cancelAnimationFrame(id){frames.delete(id);},
    duikCapabilityNextTick(){return new Promise(resolve=>ticks.push(resolve));},
    mountCapabilityKeyboardFocus(options){
      keyboardOptions=options;keyboardCalls.push({type:'mount'});
      return Object.fromEntries(['suspend','resume','dispose'].map(type=>[type,()=>keyboardCalls.push({type,trigger:options.getTrigger(),reduced:options.isReduced(),refreshCount})]));
    },
    Ne:'text',Ue:'diagram1',je:'diagram2',qe:'diagram3',Ve:'border',re:'orbit',Ge:'swiper',Je:'slide',Qe:'pagination',
    t(){},d:vnode,r:vnode,A:vnode,o:vnode,i:()=>null,tt:value=>value,it:value=>value,
    le:value=>value,ce:value=>value,_:value=>value&&typeof value==='object'&&'value'in value?value.value:value,
    ue:'fragment',pe:(items,run)=>items.map(run),c:run=>run,
  };
  const runtime=keyboard?patchCapabilityKeyboardRuntime(code):code;
  const ast=ts.createSourceFile(filename,runtime,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);let clean=runtime,exported;
  for(const node of [...ast.statements].reverse()){
    if(ts.isExportDeclaration(node)){exported=node.exportClause.elements.find(item=>item.name.text==='default').propertyName.text;clean=clean.slice(0,node.getStart(ast))+clean.slice(node.end);}
    if(ts.isImportDeclaration(node))clean=clean.slice(0,node.getStart(ast))+clean.slice(node.end);
  }
  const component=runInNewContext(clean+'\n'+exported,context);
  const render=component.setup({blok:{listItems:[]}});
  const commitDOM=()=>{domDesktop=refs[3].value;domSpacer=refs[1].value;refs[4].value=domDesktop?svg:null;refs[5].value=domDesktop?path:null;};
  commitDOM();
  const destroy=()=>{if(disposed)return;disposed=true;for(const run of unmounted)run();gsap.ticker.sleep();};
  t.after(destroy);
  const frame=()=>{const pending=[...frames];frames.clear();for(const [,run]of pending)run();};
  const tick=async()=>{commitDOM();for(const resolve of ticks.splice(0))resolve();await Promise.resolve();await Promise.resolve();};
  const settle=async()=>{for(let count=0;frames.size||ticks.length;count++){assert(count<20,'Unbounded resize scheduling');if(frames.size)frame();if(ticks.length)await tick();}};
  return {
    win,refs,nodes,size,svg,path,frames,frameHistory,ticks,history,active,scrollCalls,frame,tick,settle,destroy,keyboardCalls,
    get keyboardOptions(){return keyboardOptions;},
    preference:matchMedia('(prefers-reduced-motion: reduce)'),
    mount(){for(const run of mounted)run();commitDOM();triggers.refresh();gsap.ticker.sleep();},
    resize(values){Object.assign(size,values);win.emit('resize');},
    setReduced(value,geometry={}){
      const previous=new Map([...mediaLists].map(([query,list])=>[query,list.matches]));
      reduced=value;Object.assign(size,geometry);
      for(const [query,list]of mediaLists)if(previous.get(query)!==list.matches)list.emit('change',{matches:list.matches,media:query});
    },
    atProgress(value){currentScrollProgress=value;triggers.refresh();},
    setPhysicalProgress(value){currentScrollProgress=value;},
    setInteracted(value){interaction.value=value;},
    renderRoot(){return render({},[]);},
    get refreshCount(){return refreshCount;},get geometryReads(){return geometryReads;},get domDesktop(){return domDesktop;},
    get current(){return [...active].at(-1);},
    measure(){const current=[...active].at(-1);return {x:current?.timeline.getChildren(false,true,false).find(tween=>Object.hasOwn(tween.vars,'x'))?.vars.x,end:current?.options.end(),height:refs[1].value,desktop:refs[3].value};},
  };
}

test('the exact capture still owns the full measured track and three orbit phases',t=>{
  assert.equal(createHash('sha256').update(original).digest('hex'),'968322741e58d607e91ff96470af8175c7dcca443b57f2b499ef89fa2deb866c');
  const f=fixture(t);f.mount();
  assert.deepEqual(f.measure(),{x:-5526,end:'bottom+=945px bottom',height:'9741.6px',desktop:true});
  const phases=f.current.timeline.getChildren(false,true,false).filter(tween=>Object.hasOwn(tween.vars,'val'));
  assert.deepEqual(phases.map(tween=>tween.vars.val),[.5,1,1.5]);
  for(const [index,expected]of [.25,.75,1.25].entries()){
    const tween=phases[index];f.current.timeline.totalTime(tween.startTime()+tween.duration()/2,false);
    assert(Math.abs(f.refs[2].value-expected)<1e-5,'The original orbit phase callback remains active');
  }
});

test('production resize after interaction updates the track distance, spacer and trigger extent',async t=>{
  const f=fixture(t);f.mount();
  f.resize({width:1280,height:720,container:1184,inner:440,list:3000});await f.settle();
  assert.deepEqual(f.measure(),{x:-4926,end:'bottom+=756px bottom',height:'8601.6px',desktop:true});
  assert.equal(f.active.size,1,'The old measured timeline must be released');
});

patchedTest('a height-only resize refreshes the captured spacer and scroll extent',async t=>{
  const f=fixture(t);f.mount();
  f.resize({height:720});await f.settle();
  assert.deepEqual(f.measure(),{x:-5526,end:'bottom+=756px bottom',height:'9561.6px',desktop:true});
  assert.equal(f.current.spacerAtRefresh,'9561.6px');
});

patchedTest('the measurement host never regains a 500px content-visibility placeholder',async t=>{
  const f=fixture(t,{interacted:false});
  assert.equal(f.renderRoot().props.style,undefined,'The first Vue frame must expose the full measured host');
  f.mount();f.setInteracted(true);
  assert.equal(f.renderRoot().props.style,undefined);
  f.resize({width:1280,height:720,container:1184,inner:440,list:3000});await f.settle();
  assert.equal(f.renderRoot().props.style,undefined);
  f.setInteracted(false);
  assert.equal(f.renderRoot().props.style,undefined,'A later store/render transition cannot recreate containment');
  assert.equal(f.measure().height,'8601.6px');
});

patchedTest('same-frame resize bursts rebuild once using the latest real dimensions',async t=>{
  const f=fixture(t);f.mount();
  const refreshBefore=f.refreshCount;
  f.resize({width:1300,height:800,container:1204,inner:450,list:3200});
  f.resize({width:1290,height:760,container:1194,inner:445,list:3100});
  f.resize({width:1280,height:720,container:1184,inner:440,list:3000});
  assert.equal(f.frames.size,1);
  assert.equal(f.history.length,1,'No geometry is rebuilt inside the native resize handler');
  await f.settle();
  assert.equal(f.history.length,2);
  assert.equal(f.refreshCount,refreshBefore+1);
  assert(f.history[0].reverted);
  assert.deepEqual(f.measure(),{x:-4926,end:'bottom+=756px bottom',height:'8601.6px',desktop:true});
});

patchedTest('preview and production-before-interaction retain their resize behavior',async t=>{
  for(const options of [{environment:'preview'},{interacted:false}]){
    await t.test(JSON.stringify(options),async t=>{
      const f=fixture(t,options);f.mount();
      f.resize({width:1280,height:720,container:1184,inner:440,list:3000});await f.settle();
      assert.deepEqual(f.measure(),{x:-4926,end:'bottom+=756px bottom',height:'8601.6px',desktop:true});
    });
  }
});

patchedTest('crossing the breakpoint waits for Vue DOM and releases or restores the desktop track',async t=>{
  const f=fixture(t);f.mount();
  f.resize({width:960,container:864});f.frame();
  assert.equal(f.refs[3].value,false);
  assert.equal(f.domDesktop,true,'Vue has not committed its conditional branch yet');
  assert.equal(f.active.size,1);
  await f.tick();
  assert.equal(f.domDesktop,false);
  assert.equal(f.active.size,0);
  assert(f.history[0].reverted);
  await f.settle();

  f.resize({width:1280,height:720,container:1184,inner:440,list:3000});f.frame();
  assert.equal(f.refs[3].value,true);
  assert.equal(f.domDesktop,false);
  assert.equal(f.history.length,1,'Do not measure absent desktop nodes');
  await f.tick();
  assert.equal(f.domDesktop,true);
  assert.equal(f.history.length,2);
  await f.settle();
  assert.deepEqual(f.measure(),{x:-4926,end:'bottom+=756px bottom',height:'8601.6px',desktop:true});
  assert.equal(f.active.size,1);
  assert.equal(f.current.spacerAtRefresh,'8601.6px');
});

patchedTest('a newer resize invalidates an older pending Vue branch callback',async t=>{
  const f=fixture(t);f.mount();
  const refreshBefore=f.refreshCount;
  f.resize({width:1280});f.frame();
  f.resize({width:960,container:864});
  await f.tick();
  assert.equal(f.history.length,1,'The first callback must not rebuild against newer dimensions');
  assert.equal(f.refreshCount,refreshBefore);
  await f.settle();
  assert.equal(f.domDesktop,false);
  assert.equal(f.active.size,0);
  assert.equal(f.refreshCount,refreshBefore+1);
});

patchedTest('a newer resize invalidates an older pending spacer refresh',async t=>{
  const f=fixture(t);f.mount();
  const refreshBefore=f.refreshCount;
  f.resize({width:1300,height:800,container:1204,inner:450,list:3200});f.frame();await f.tick();
  assert.equal(f.history.length,2);
  f.resize({width:1280,height:720,container:1184,inner:440,list:3000});
  await f.tick();
  assert.equal(f.refreshCount,refreshBefore);
  await f.settle();
  assert.equal(f.history.length,3);
  assert.equal(f.active.size,1);
  assert(f.history[1].reverted);
  assert.equal(f.refreshCount,refreshBefore+1);
  assert.deepEqual(f.measure(),{x:-4926,end:'bottom+=756px bottom',height:'8601.6px',desktop:true});
});

patchedTest('resize refresh follows current physical scroll without forcing old pixel or phase positions',async t=>{
  const finalSize={width:1280,height:720,container:1184,inner:440,list:3000};
  const f=fixture(t),reference=fixture(t,{initialSize:finalSize});f.mount();reference.mount();
  f.atProgress(.28);
  f.resize(finalSize);f.frame();await f.tick();
  f.setPhysicalProgress(.77);
  reference.atProgress(.77);
  await f.tick();
  assert(Math.abs(f.current.timeline.totalProgress()-.77)<1e-7);
  assert(Math.abs(f.refs[2].value-reference.refs[2].value)<1e-5,'Original mergedProgress uses the refreshed physical position');
  assert.equal(f.current.spacerAtRefresh,'8601.6px');
  assert.equal(f.current.refreshedEnd,'bottom+=756px bottom');
  assert.deepEqual(f.scrollCalls,[],'Resize must not take over native scroll or Lenis');
});

patchedTest('unmount cancels queued resize and makes canceled frame callbacks harmless',async t=>{
  const f=fixture(t);f.mount();
  f.resize({width:1280});
  const stale=f.frameHistory.at(-1),reads=f.geometryReads,refreshBefore=f.refreshCount;
  f.destroy();
  assert.equal(f.frames.size,0);
  assert.equal(f.win.count('resize'),0);
  assert.equal(f.active.size,0);
  await stale();f.win.emit('resize');await f.settle();
  assert.equal(f.geometryReads,reads);
  assert.equal(f.refreshCount,refreshBefore);
  assert.equal(f.history.length,1);
});

patchedTest('unmount while waiting for Vue prevents any later geometry or refresh writes',async t=>{
  const f=fixture(t);f.mount();
  f.resize({width:1280});f.frame();
  const reads=f.geometryReads,refreshBefore=f.refreshCount;
  f.destroy();await f.tick();await f.settle();
  assert.equal(f.geometryReads,reads);
  assert.equal(f.refreshCount,refreshBefore);
  assert.equal(f.history.length,1);
  assert.equal(f.active.size,0);
});

patchedTest('unmount while waiting for the spacer releases the rebuilt context without refreshing it',async t=>{
  const f=fixture(t);f.mount();
  f.resize({width:1280});f.frame();await f.tick();
  assert.equal(f.history.length,2);
  const reads=f.geometryReads,refreshBefore=f.refreshCount;
  f.destroy();await f.tick();await f.settle();
  assert.equal(f.geometryReads,reads);
  assert.equal(f.refreshCount,refreshBefore);
  assert(f.history[1].reverted);
  assert.equal(f.active.size,0);
});

patchedTest('reduced-motion on first mount never creates the desktop scroll timeline',async t=>{
  const f=fixture(t,{reduced:true});f.mount();await f.settle();
  assert.equal(f.history.length,0,'CSS alone must not leave a hidden scroll timeline running');
  assert.equal(f.active.size,0);
  assert.equal(f.preference.count('change'),1,'The actual media preference owns a lifecycle subscription');
  assert.equal(f.domDesktop,true,'Reduced motion keeps the desktop manual presentation, not the mobile branch');
  assert.equal(f.measure().height,'0px','The inactive track does not keep its measured scroll spacer');
  assert.deepEqual(f.scrollCalls,[]);
});

patchedTest('native reduced-motion change releases the old GSAP context without a window resize',async t=>{
  const f=fixture(t);f.mount();f.atProgress(.68);
  const previous=f.current;
  f.setReduced(true);await f.settle();
  assert(previous.reverted,'Entering reduced motion must revert the complete old GSAP owner');
  assert.equal(f.active.size,0);
  assert.equal(f.history.length,1,'No replacement scrolling timeline is created in reduced mode');
  assert.equal(f.measure().height,'0px');
  assert.deepEqual(f.scrollCalls,[],'Preference changes cannot force native scroll or Lenis');
});

patchedTest('restoring motion remeasures current geometry and follows current physical scroll',async t=>{
  const finalSize={width:1280,height:720,container:1184,inner:440,list:3000};
  const f=fixture(t,{reduced:true}),reference=fixture(t,{initialSize:finalSize});
  f.mount();reference.mount();
  f.setReduced(false,finalSize);f.frame();await f.tick();
  f.setPhysicalProgress(.77);reference.atProgress(.77);await f.settle();
  assert.equal(f.history.length,1);
  assert.equal(f.active.size,1);
  assert.deepEqual(f.measure(),{x:-4926,end:'bottom+=756px bottom',height:'8601.6px',desktop:true});
  assert.equal(f.current.spacerAtRefresh,'8601.6px','Refresh waits until Vue commits the rebuilt spacer');
  assert(Math.abs(f.current.timeline.totalProgress()-.77)<1e-7);
  assert(Math.abs(f.refs[2].value-reference.refs[2].value)<1e-5,'Original orbit phases follow the new physical position');
  assert.deepEqual(f.scrollCalls,[],'Restoration must not jump to a saved scroll or orbit phase');
});

patchedTest('same-frame motion preference bursts coalesce with resize and use the final state',async t=>{
  const f=fixture(t);f.mount();
  const previous=f.current,refreshBefore=f.refreshCount;
  f.setReduced(true);
  assert.equal(f.frames.size,1,'The media change itself must schedule the rebuild before any resize');
  f.resize({width:1300,height:800,container:1204,inner:450,list:3200});
  f.setReduced(false,{width:1280,height:720,container:1184,inner:440,list:3000});
  assert.equal(f.frames.size,1,'Native resize and preference changes share one owner queue');
  assert.equal(f.history.length,1);
  await f.settle();
  assert(previous.reverted);
  assert.equal(f.history.length,2);
  assert.equal(f.active.size,1);
  assert.equal(f.refreshCount,refreshBefore+1);
  assert.deepEqual(f.measure(),{x:-4926,end:'bottom+=756px bottom',height:'8601.6px',desktop:true});
  assert.deepEqual(f.scrollCalls,[]);
});

patchedTest('a newer preference invalidates a restoration waiting for the Vue branch',async t=>{
  const f=fixture(t,{reduced:true});f.mount();
  const refreshBefore=f.refreshCount;
  f.setReduced(false,{width:1280,height:720,container:1184,inner:440,list:3000});f.frame();
  assert.equal(f.ticks.length,1,'Restoration waits for the native preference layout to settle');
  f.setReduced(true);await f.tick();
  assert.equal(f.history.length,0,'An obsolete restore cannot measure or rebuild a scrolling timeline');
  assert.equal(f.refreshCount,refreshBefore);
  await f.settle();
  assert.equal(f.history.length,0);
  assert.equal(f.active.size,0);
  assert.equal(f.refreshCount,refreshBefore+1);
  f.setReduced(false);await f.settle();
  assert.equal(f.history.length,1);
  assert.deepEqual(f.measure(),{x:-4926,end:'bottom+=756px bottom',height:'8601.6px',desktop:true});
  assert.deepEqual(f.scrollCalls,[]);
});

patchedTest('a newer preference invalidates a restoration waiting for the spacer',async t=>{
  const f=fixture(t,{reduced:true});f.mount();
  const refreshBefore=f.refreshCount;
  f.setReduced(false);f.frame();await f.tick();
  assert.equal(f.history.length,1);
  assert.equal(f.ticks.length,1);
  const previous=f.current;
  f.setReduced(true);await f.tick();
  assert.equal(f.refreshCount,refreshBefore,'The superseded spacer callback must not refresh stale geometry');
  await f.settle();
  assert(previous.reverted);
  assert.equal(f.active.size,0);
  assert.equal(f.refreshCount,refreshBefore+1);
  assert.deepEqual(f.scrollCalls,[]);
});

patchedTest('unmount cancels preference frames, removes its listener and makes stale callbacks harmless',async t=>{
  const f=fixture(t);f.mount();
  assert.equal(f.preference.count('change'),1);
  const staleChange=[...f.preference.listeners.get('change')][0];
  f.setReduced(true);
  const staleFrame=f.frameHistory.at(-1),reads=f.geometryReads,refreshBefore=f.refreshCount;
  assert.equal(typeof staleFrame,'function');
  f.destroy();
  assert.equal(f.preference.count('change'),0);
  assert.equal(f.win.count('resize'),0);
  assert.equal(f.frames.size,0);
  assert.equal(f.active.size,0);
  await staleFrame();staleChange({type:'change',matches:false});f.setReduced(false);await f.settle();
  assert.equal(f.geometryReads,reads);
  assert.equal(f.refreshCount,refreshBefore);
  assert.equal(f.history.length,1);
  assert.deepEqual(f.scrollCalls,[]);
});

patchedTest('unmount during either preference nextTick prevents stale geometry and refresh',async t=>{
  for(const phase of ['branch','spacer'])await t.test(phase,async t=>{
    const f=fixture(t,{reduced:true});f.mount();
    f.setReduced(false);f.frame();
    if(phase==='spacer')await f.tick();
    assert.equal(f.ticks.length,1,'The test must stop at the real async lifecycle boundary');
    const reads=f.geometryReads,refreshBefore=f.refreshCount,builds=f.history.length;
    f.destroy();await f.tick();await f.settle();
    assert.equal(f.preference.count('change'),0);
    assert.equal(f.geometryReads,reads);
    assert.equal(f.refreshCount,refreshBefore);
    assert.equal(f.history.length,builds);
    assert.equal(f.active.size,0);
    assert.deepEqual(f.scrollCalls,[]);
  });
});

patchedTest('the named import points to the captured Vue nextTick, not watch',async()=>{
  const entry=await readFile(new URL('../components/home/landing/baseline/_nuxt/entry.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js',import.meta.url),'utf8');
  assert(entry.includes('Vi as ac'));
  assert(entry.includes('function Vi(e){const t=Ku||wb;return e?t.then(this?e.bind(this):e):t}'));
  assert(code.includes('import{ac as duikCapabilityNextTick,'));
});

patchedTest('the patch fails closed on missing or duplicated capture anchors',()=>{
  for(const anchor of [
    'import{e as Xe,a5 as Ye,f as Ze',
    'let S,z;',
    'u(),z=()=>{Y.value&&!me||(ae(),te(),u())},window.addEventListener("resize",z)',
    'et(()=>{S&&S.revert(),typeof window<"u"&&z&&window.removeEventListener("resize",z)})',
    'class:"relative contain-paint kp-home-capabilities-wrap",style:le(_(Y)?"":"content-visibility: auto; contain-intrinsic-block-size: auto 500px;")',
  ]){
    assert.throws(()=>transform(original.replace(anchor,'unknown-capture')),/Unknown capability resize anchor/);
    assert.throws(()=>transform(original+'\n'+anchor),/Unknown capability resize anchor/);
  }
});

patchedTest('the patch is idempotent, layout-composable and leaves all measured timeline formulas unchanged',()=>{
  assert.equal(transform(code),code);
  assert.equal(patchCapabilityLayoutRuntime(code),transform(patchCapabilityLayoutRuntime(original)));
  const measurementBody=source=>{
    const ast=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),bodies=[];
    function visit(node){
      if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='u'&&node.initializer&&ts.isArrowFunction(node.initializer)){
        const body=node.initializer.body.getText(ast);
        if(body.startsWith('{S&&S.revert()'))bodies.push(body);
      }
      ts.forEachChild(node,visit);
    }
    visit(ast);assert.equal(bodies.length,1,'Exactly one captured track measurement owner must remain');return bodies[0];
  };
  assert(measurementBody(original).includes('D=1.8,W='));
  assert.equal(measurementBody(code),measurementBody(original));
  assert.equal(measurementBody(patchCapabilityKeyboardRuntime(code)),measurementBody(original));
  const ticked=ts.createSourceFile(filename,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  assert.equal(ticked.parseDiagnostics.length,0);
});

patchedTest('keyboard handoff mounts against the actual owner and resumes only after both Vue commits',async t=>{
  const f=fixture(t,{keyboard:true});f.mount();
  assert.equal(f.keyboardOptions.root,f.nodes['.kp-home-capabilities-wrap']);
  assert.equal(f.keyboardOptions.getTrigger(),f.current);
  assert.equal(f.keyboardOptions.isReduced(),false);
  f.resize({width:1280,height:720,container:1184,inner:440,list:3000});
  assert.equal(f.keyboardCalls.at(-1).type,'suspend','Suspend in the resize event, before old geometry can be used');
  f.frame();await f.tick();
  assert.equal(f.keyboardCalls.at(-1).type,'suspend','The new spacer has not committed yet');
  await f.tick();
  assert.equal(f.keyboardCalls.at(-1).type,'resume');
  assert.equal(f.keyboardCalls.at(-1).trigger,f.current,'Re-entry must use the replacement owner');
  assert.equal(f.keyboardCalls.at(-1).refreshCount,f.refreshCount);
  assert.equal(f.current.spacerAtRefresh,'8601.6px');
});

patchedTest('keyboard handoff ignores stale resize generations and releases on unmount',async t=>{
  const f=fixture(t,{keyboard:true});f.mount();
  f.resize({width:1280});f.frame();
  f.resize({width:1440});await f.tick();
  assert.equal(f.keyboardCalls.filter(call=>call.type==='resume').length,0);
  await f.settle();
  assert.equal(f.keyboardCalls.filter(call=>call.type==='resume').length,1);
  f.resize({height:720});f.frame();f.destroy();await f.tick();
  assert.equal(f.keyboardCalls.at(-1).type,'dispose');
  assert.equal(f.keyboardCalls.filter(call=>call.type==='resume').length,1,'No post-unmount focus scroll');
});

patchedTest('keyboard handoff follows reduced-motion and breakpoint ownership without preserving old geometry',async t=>{
  const f=fixture(t,{keyboard:true});f.mount();
  f.setReduced(true);
  assert.equal(f.keyboardOptions.isReduced(),true,'The preference is read immediately');
  await f.settle();
  assert.equal(f.keyboardCalls.at(-1).type,'resume');
  assert.equal(f.keyboardCalls.at(-1).trigger,undefined);
  f.setReduced(false,{width:960});await f.settle();
  assert.equal(f.keyboardOptions.isReduced(),true,'Mobile stays native, without the desktop track');
  f.resize({width:1440});await f.settle();
  assert.equal(f.keyboardOptions.isReduced(),false);
  assert.equal(f.keyboardCalls.at(-1).trigger,f.current);
});

patchedTest('keyboard publication is idempotent and fails closed when lifecycle anchors are incomplete',()=>{
  const result=patchCapabilityKeyboardRuntime(code);
  assert.equal(patchCapabilityKeyboardRuntime(result),result);
  assert.equal(ts.createSourceFile(filename,result,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS).parseDiagnostics.length,0);
  for(const anchor of ['duikCapabilityRebuild(),z=()=>{','      oe.refresh();\n','    duikCapabilityDisposed=true;\n']){
    assert.throws(()=>patchCapabilityKeyboardRuntime(code.replace(anchor,'unknown')),/Unknown capability keyboard anchor/);
    assert.throws(()=>patchCapabilityKeyboardRuntime(code+'\n'+anchor),/Unknown capability keyboard anchor/);
  }
  assert.throws(()=>patchCapabilityKeyboardRuntime(result.replace('      duikCapabilityKeyboard?.resume();\n','')),/Incomplete capability keyboard patch/);
  assert.throws(()=>patchCapabilityKeyboardRuntime(original),/requires the guarded resize owner/);
});

patchedTest('keyboard entry into the orbit uses its selected original phase, not a fourth Motion translation',t=>{
  const f=fixture(t,{keyboard:true});f.mount();
  f.current.start=2400;f.current.end=13000;
  const timeline=f.current.timeline;
  const phase=timeline.getChildren(false,true,false).find(tween=>tween.vars.val===1);
  for(const index of [0,2,4]){
    f.keyboardOptions.revealOrbit({closest:()=>({querySelector:()=>({getAttribute:()=>String(index)})})});
    const call=f.scrollCalls.at(-1);
    const expected=2400+(phase.startTime()+index/5*phase.duration())/timeline.totalDuration()*10600;
    // GSAP rounds stored phase times; allow only a thousandth of a CSS pixel
    // when comparing those values with the capture's unrounded local variables.
    assert(Math.abs(call[0]-expected)<.001,JSON.stringify({index,actual:call[0],expected}));
    assert.equal(call[1].immediate,true);
    assert.equal(call[1].duration,undefined);
  }
  assert.equal(f.current.timeline,timeline);
});

// Freeze the actual old resize patch, independently of the current transform.
// Relabeling new output as an old marker would never exercise a real upgrade.
function legacyResizeFixture(version){
  let legacy=original
    .replace('import{e as Xe,a5 as Ye,f as Ze','import{ac as duikCapabilityNextTick,e as Xe,a5 as Ye,f as Ze')
    .replace('let S,z;','let S,z,duikCapabilityFrame=null,duikCapabilityGeneration=0,duikCapabilityDisposed=false;')
    .replace('u(),z=()=>{Y.value&&!me||(ae(),te(),u())},window.addEventListener("resize",z)',`u(),z=()=>{
    if(duikCapabilityDisposed)return;
    duikCapabilityGeneration++;
    if(duikCapabilityFrame!==null)return;
    const frame=requestAnimationFrame(async()=>{
      if(duikCapabilityDisposed||duikCapabilityFrame!==frame)return;
      duikCapabilityFrame=null;
      const generation=duikCapabilityGeneration;
      ae();te();
      await duikCapabilityNextTick();
      if(duikCapabilityDisposed||generation!==duikCapabilityGeneration)return;
      u();
      await duikCapabilityNextTick();
      if(duikCapabilityDisposed||generation!==duikCapabilityGeneration)return;
      oe.refresh();
    });
    duikCapabilityFrame=frame;
  },window.addEventListener("resize",z)`)
    .replace('et(()=>{S&&S.revert(),typeof window<"u"&&z&&window.removeEventListener("resize",z)})',`et(()=>{
    duikCapabilityDisposed=true;
    duikCapabilityGeneration++;
    if(duikCapabilityFrame!==null)cancelAnimationFrame(duikCapabilityFrame);
    duikCapabilityFrame=null;
    S&&S.revert();
    typeof window<"u"&&z&&window.removeEventListener("resize",z);
  })`);
  if(version===2)legacy=legacy.replace('class:"relative contain-paint kp-home-capabilities-wrap",style:le(_(Y)?"":"content-visibility: auto; contain-intrinsic-block-size: auto 500px;")','class:"relative contain-paint kp-home-capabilities-wrap"');
  return '// duik-capability-resize-v'+version+'\n'+legacy;
}

patchedTest('upgrading real v1 and v2 modules yields the same current lifecycle patch',async t=>{
  for(const version of [1,2])await t.test('v'+version,()=>{
    assert.equal(transform(legacyResizeFixture(version)),code);
  });
});

patchedTest('reduced-motion upgrades fail closed on missing or duplicated legacy lifecycle anchors',()=>{
  for(const version of [1,2]){
    const legacy=legacyResizeFixture(version);
    for(const anchor of [
      'let S,z,duikCapabilityFrame=null,duikCapabilityGeneration=0,duikCapabilityDisposed=false;',
      ';u(),z=()=>{',
      '\n      u();\n',
      '},window.addEventListener("resize",z)',
      'typeof window<"u"&&z&&window.removeEventListener("resize",z);',
    ]){
      assert.throws(()=>transform(legacy.replace(anchor,'unknown-lifecycle')),/Unknown capability resize anchor/,'Missing v'+version+' lifecycle: '+anchor);
      assert.throws(()=>transform(legacy+'\n'+anchor),/Unknown capability resize anchor/,'Duplicated v'+version+' lifecycle: '+anchor);
    }
  }
});

function elements(html){
  const result=[];
  function visit(node){if(node.tagName)result.push(node);for(const child of node.childNodes||[])visit(child);}
  visit(parse(html,{sourceCodeLocationInfo:true}));
  return result;
}
const attr=(node,name)=>node.attrs.find(item=>item.name===name)?.value;

patchedTest('captured SSR exposes the full track on first paint and stays idempotent',async()=>{
  const html=await readFile(new URL('../components/home/landing/baseline/landing.html',import.meta.url),'utf8');
  const host=elements(html).find(node=>attr(node,'class')?.split(/\s+/).includes('kp-home-capabilities-wrap'));
  assert.equal(attr(host,'style'),'content-visibility:auto;contain-intrinsic-block-size:auto 500px;');
  const loc=host.sourceCodeLocation.attrs.style;
  const patched=patches.patchCapabilityResizeSSR(html);
  assert.equal(patched,html.slice(0,loc.startOffset)+html.slice(loc.endOffset),'No other SSR markup changes');
  assert.equal(patches.patchCapabilityResizeSSR(patched),patched);
  const updated=elements(patched).find(node=>attr(node,'class')?.split(/\s+/).includes('kp-home-capabilities-wrap'));
  assert.equal(attr(updated,'style'),undefined);
});

patchedTest('SSR removes only measured-host containment and preserves unrelated styles and quoted values',()=>{
  const unrelated='content-visibility:auto;contain-intrinsic-block-size:auto 500px;';
  const retained='color:rgb(1,2,3);background:url(&quot;data:image/svg+xml;base64,a;b&quot;);--copy:&quot;content-visibility:auto;&quot;;transform:translateY(2px);';
  const html='<main><div class="relative kp-home-capabilities-wrap" style="'+retained+'/* host */CONTENT-VISIBILITY:auto!important;contain-intrinsic-block-size:auto 500px;content-visibility:visible;"><div class="child" style="'+unrelated+'"></div></div><section class="unrelated" style="'+unrelated+'"></section></main>';
  const patched=patches.patchCapabilityResizeSSR(html);
  const nodes=elements(patched),host=nodes.find(node=>attr(node,'class')==='relative kp-home-capabilities-wrap');
  assert.equal(attr(host,'style'),'color:rgb(1,2,3);background:url("data:image/svg+xml;base64,a;b");--copy:"content-visibility:auto;";transform:translateY(2px);');
  for(const name of ['child','unrelated'])assert.equal(attr(nodes.find(node=>attr(node,'class')===name),'style'),unrelated);
  assert.equal(patches.patchCapabilityResizeSSR(patched),patched);
});

patchedTest('SSR fails closed for missing or duplicated measurement hosts',()=>{
  assert.throws(()=>patches.patchCapabilityResizeSSR('<div></div>'),/Expected one measured capability host/);
  assert.throws(()=>patches.patchCapabilityResizeSSR('<div class="kp-home-capabilities-wrap"></div>'.repeat(2)),/Expected one measured capability host/);
});
