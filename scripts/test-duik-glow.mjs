import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';

const filename='GlowingEdgeOverlayCore.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const original=await readFile(new URL('../components/home/landing/baseline/_nuxt/'+filename,import.meta.url),'utf8');
// Explicit diagnostic mode runs these same lifecycle assertions against the
// untouched capture. It must fail on the original background/teardown bugs.
const diagnostic=process.env.DUIK_GLOW_TEST_ORIGINAL==='1';
const transform=diagnostic?source=>source:(await import('./lib/landing-glow.mjs')).patchGlowLifecycle;
const code=transform(original);

test('the local published glow is derived from the immutable capture and current patch',{skip:diagnostic},async()=>{
  const published=await readFile(new URL('../public/_nuxt/'+filename,import.meta.url),'utf8');
  assert.equal(published,code);
});

class Events{
  listeners=new Map();
  addEventListener(type,run){const group=this.listeners.get(type)||new Set();group.add(run);this.listeners.set(type,group);}
  removeEventListener(type,run){this.listeners.get(type)?.delete(run);}
  emit(type,values={}){for(const run of [...this.listeners.get(type)||[]])run({type,...values});}
  count(){return [...this.listeners.values()].reduce((total,group)=>total+group.size,0);}
}

// Executes the captured component setup and its real renderer callback. Only
// Vue scheduling, time and WebGL calls are adapted; no shader/visual claim.
function fixture(t,{hidden=false,reduced=false,active=false,idleCallback=true,dom=true}={}){
  const win=new Events(),doc=new Events(),media=new Events(),refs=[],mounted=[],unmounted=[],watchers=[],timers=new Map(),frameHistory=[],tweens=new Set(),tweenHistory=[],uniforms=[],glCalls=[],images=[];
  let now=0,nextId=0,draws=0,contexts=0,lost=0;
  doc.hidden=hidden;media.matches=reduced;
  const schedule=(run,delay,kind)=>{const id=++nextId;timers.set(id,{at:now+delay,run,kind});if(kind==='frame')frameHistory.push(run);return id;};
  const killTween=tween=>{tween.killed=true;tweens.delete(tween);};
  const gsap={to(target,options){const tween={target,options,start:target.value,elapsed:0,paused:false,killed:false,pause(){this.paused=true;return this;},resume(){this.paused=false;return this;},kill(){killTween(this);return this;}};tweens.add(tween);tweenHistory.push(tween);return tween;},killTweensOf(target){for(const tween of [...tweens])if(tween.target===target)killTween(tween);}};
  const advanceTweens=delta=>{for(const tween of [...tweens]){if(tween.paused||tween.killed)continue;tween.elapsed+=delta;const p=Math.min(1,tween.elapsed/(tween.options.duration*1000));tween.target.value=tween.start+(tween.options.value-tween.start)*p;if(p===1){tweens.delete(tween);tween.options.onComplete?.();}}};
  function advance(duration){const end=now+duration;let guard=0;while(true){const entry=[...timers].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!entry)break;assert(++guard<2000,'Unexpected unbounded lifecycle work');const [id,timer]=entry;advanceTweens(timer.at-now);now=timer.at;timers.delete(id);timer.run(now);}advanceTweens(end-now);now=end;}
  const gl=new Proxy({}, {get(_,key){
    if(typeof key!=='string')return undefined;
    if(key===key.toUpperCase())return key;
    if(key==='getExtension')return name=>name==='WEBGL_lose_context'?{loseContext(){lost++;}}:null;
    if(key==='getShaderParameter'||key==='getProgramParameter')return ()=>true;
    if(key==='getUniformLocation')return (_program,name)=>name;
    if(key.startsWith('create'))return ()=>({resource:key,id:++nextId});
    if(key==='uniform1f')return (name,value)=>{uniforms.push({name,value,at:now});};
    if(key==='drawArrays')return ()=>{draws++;};
    return (...args)=>{glCalls.push({key,args,at:now});};
  }});
  const canvas={clientWidth:1440,clientHeight:1000,width:0,height:0,getContext(){contexts++;return gl;}};
  Object.assign(win,{innerWidth:1440,innerHeight:1000,matchMedia:()=>media});
  if(idleCallback)win.requestIdleCallback=()=>{};
  const ref=value=>{const item={value};refs.push(item);return item;};
  const context={window:win,document:doc,performance:{now:()=>now},requestAnimationFrame:run=>schedule(run,16,'frame'),cancelAnimationFrame:id=>timers.delete(id),setTimeout:(run,delay)=>schedule(run,delay,'timer'),clearTimeout:id=>timers.delete(id),Image:class{constructor(){images.push(this);}},console,Float32Array,Uint8Array,Math,Set,
    he:()=>({setCustomState(){},scrollVelocity:{value:0}}),Q:gsap,Se:value=>value,
    ge:(get,run,options)=>{watchers.push({get,run});if(options?.immediate)run(get());},Be:run=>mounted.push(run),Fe:run=>unmounted.push(run),ve:ref,pe:ref,Le:value=>value,
    Ce(){},Me(){},Ue(){},Ae:value=>value,
  };
  if(!dom){delete context.window;delete context.document;}
  const ast=ts.createSourceFile(filename,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);let clean=code,exported;
  for(const node of [...ast.statements].reverse()){
    if(ts.isExportDeclaration(node)){exported=node.exportClause.elements.find(item=>item.name.text==='default').propertyName.text;clean=clean.slice(0,node.getStart(ast))+clean.slice(node.end);}
    if(ts.isImportDeclaration(node))clean=clean.slice(0,node.getStart(ast))+clean.slice(node.end);
  }
  const component=runInNewContext(clean+'\n'+exported,context),props={active,absolute:false};component.setup(props);
  refs[0].value=canvas;
  let destroyed=false;
  const destroy=()=>{if(destroyed)return;destroyed=true;for(const run of unmounted)run();};t.after(destroy);
  const frameCount=()=>[...timers.values()].filter(timer=>timer.kind==='frame').length;
  return {win,doc,media,refs,canvas,timers,uniforms,glCalls,frameHistory,tweens,tweenHistory,images,watchers,advance,destroy,frameCount,mount(){for(const run of mounted)run();},show(){win.emit('glowing-edge-progress',{detail:{progress:1}});},hidePage(value){doc.hidden=value;doc.emit('visibilitychange');},reduce(value){media.matches=value;media.emit('change',{matches:value});},get draws(){return draws;},get contexts(){return contexts;},get lost(){return lost;},get now(){return now;},lastUniform(name){return uniforms.findLast(item=>item.name===name)?.value;}};
}

test('baseline is exact, transform is deterministic and all captured shader programs stay byte-identical',()=>{
  assert.equal(createHash('sha256').update(original).digest('hex'),'61e42d531d986df2bf26dfd4afdadb89f7fe62fd65a8e3e512940135f3c4f294');
  assert.equal(transform(code),code);
  const shaders=source=>{const tree=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),result=[];function visit(node){if(ts.isVariableDeclaration(node)&&['J','De','Oe','Pe'].includes(node.name.getText(tree)))result.push(node.initializer.getText(tree));ts.forEachChild(node,visit);}visit(tree);return result;};
  assert.equal(shaders(original).length,4);assert.deepEqual(shaders(code),shaders(original));
  for(const anchor of ['mainRotSpeed:-5','mainBlurPasses:5','mainBlurSpread:2','mainBloomStrength:2','mainAlpha:.7','mainRadius:50','mainSquircle:3.8','mainPulseSpeed:.65','ue+=n*x','we("pulse",m)','Math.min(ee.value*.004,3)','Math.min(ee.value*.02,3)','glowing-edge-progress'])assert(code.includes(anchor),anchor);
});

test('transform rejects changed or duplicated capture anchors instead of silently publishing an unowned loop',{skip:diagnostic},()=>{
  assert.throws(()=>transform(original.replace('function me(o){','function me(now){')),/Unknown glow lifecycle anchor/);
  assert.throws(()=>transform(original+'\nfunction ce(o=1.001,u=.5){m=0,$=[o,u]}'),/Unknown glow lifecycle anchor/);
});

test('visible glow still renders the captured pipeline with one owned frame callback',t=>{
  const f=fixture(t);f.mount();f.advance(100);assert.equal(f.contexts,1);f.show();f.advance(80);
  assert(f.draws>0);assert.equal(f.frameCount(),1);assert(f.lastUniform('u_time')>0);assert.equal(f.lastUniform('u_amount'),1);
  f.win.emit('glowing-edge-trigger-pulse',{detail:{x:.2,y:.6}});f.advance(16);assert(f.lastUniform('u_pulse')<1);
});

test('hidden tabs stop GPU work and the owned frame, then resume without counting hidden time',t=>{
  const f=fixture(t);f.mount();f.advance(100);f.show();f.advance(160);const before={draws:f.draws,time:f.lastUniform('u_time')};
  f.hidePage(true);assert.equal(f.frameCount(),0,'Hidden glow must cancel its own RAF');f.advance(2000);assert.equal(f.draws,before.draws);assert.equal(f.lastUniform('u_time'),before.time);
  f.hidePage(false);assert.equal(f.frameCount(),1);f.advance(16);assert(f.draws>before.draws);assert(f.lastUniform('u_time')-before.time<.05,'Resume does not inject the hidden interval into shader time');
});

test('reduced motion renders a still state on demand, never starts a continuous shader clock',t=>{
  const f=fixture(t,{reduced:true});f.mount();f.advance(100);assert.equal(f.frameCount(),0,'Reduced-motion entry must not create a loop');
  f.show();assert(f.draws>0);const before={draws:f.draws,time:f.lastUniform('u_time')};f.advance(1000);assert.equal(f.draws,before.draws);assert.equal(f.lastUniform('u_time'),before.time);
  f.canvas.clientWidth=1200;f.win.emit('resize');assert(f.draws>before.draws,'Static canvas is redrawn after its framebuffer is resized');assert.equal(f.frameCount(),0);
  f.win.emit('glowing-edge-progress',{detail:{progress:0}});assert.equal(f.frameCount(),0);assert(f.glCalls.some(call=>call.key==='clear'));
  f.reduce(false);assert.equal(f.frameCount(),1);f.advance(32);f.reduce(true);const draws=f.draws;f.advance(1000);assert.equal(f.draws,draws);assert.equal(f.frameCount(),0);
});

test('hidden initial mount has no draw loop and hidden state wins over reduced-motion updates',t=>{
  const f=fixture(t,{hidden:true});f.mount();f.advance(100);f.show();assert.equal(f.frameCount(),0);assert.equal(f.draws,0);
  f.reduce(true);f.win.emit('resize');assert.equal(f.frameCount(),0);assert.equal(f.draws,0);
  f.hidePage(false);assert.equal(f.frameCount(),0);assert(f.draws>0);f.reduce(false);assert.equal(f.frameCount(),1);
});

test('opacity timelines pause with the page and keep original visible durations and progress events',t=>{
  const f=fixture(t);f.mount();f.advance(100);f.win.emit('glowing-edge-show');f.advance(160);const amount=f.refs[2].value;
  assert(amount>0&&amount<1);assert.equal(f.tweenHistory.at(-1).options.duration,1);
  f.hidePage(true);f.advance(1000);assert.equal(f.refs[2].value,amount,'GSAP opacity also pauses, not only WebGL');
  f.hidePage(false);f.advance(100);assert(f.refs[2].value>amount);f.win.emit('glowing-edge-hide');assert.equal(f.tweenHistory.at(-1).options.duration,1.5);
  f.reduce(true);f.win.emit('glowing-edge-show');assert.equal(f.refs[2].value,1);assert.equal(f.frameCount(),0);
  f.win.emit('glowing-edge-progress',{detail:{progress:.37}});assert.equal(f.refs[2].value,.37);assert.equal(f.tweens.size,0);
});

test('unmount before delayed initialization cancels setup instead of creating a detached WebGL context',t=>{
  const f=fixture(t);f.mount();assert(f.timers.size>0);f.destroy();f.advance(1000);
  assert.equal(f.contexts,0,'Unmounted glow must not initialize later');assert.equal(f.timers.size,0);assert.equal(f.win.count(),0);assert.equal(f.doc.count(),0);assert.equal(f.media.count(),0);assert.equal(f.tweens.size,0);
});

test('unmount cancels reveal, tweens and stale frames and releases the original GL resources',t=>{
  const f=fixture(t);f.mount();f.advance(100);f.show();f.advance(16);f.win.emit('glowing-edge-show');const before=f.draws,stale=[...f.frameHistory];
  f.destroy();assert.equal(f.lost,1);assert.equal(f.timers.size,0,'Both frame and pending reveal timer are owned');assert.equal(f.tweens.size,0);
  for(const run of stale)run(2000);for(const image of f.images)image.onload?.();f.doc.emit('visibilitychange');f.media.emit('change');f.advance(1000);
  assert.equal(f.frameCount(),0);assert.equal(f.draws,before);assert.equal(f.refs[3].value,false,'A cancelled reveal never mutates an unmounted component');
  assert.equal(f.win.count(),0);assert.equal(f.doc.count(),0);assert.equal(f.media.count(),0);assert(f.glCalls.some(call=>call.key==='deleteTexture'));assert(f.glCalls.some(call=>call.key==='deleteFramebuffer'));
});

test('rapid gate changes keep one callback and reject callbacks from cancelled generations',t=>{
  const f=fixture(t);f.mount();f.advance(100);f.show();f.advance(16);const stale=f.frameHistory.at(-1);
  f.hidePage(true);f.hidePage(false);assert.equal(f.frameCount(),1);const draws=f.draws;stale(9000);assert.equal(f.draws,draws);assert.equal(f.frameCount(),1);
  for(let i=0;i<5;i++){f.reduce(true);assert.equal(f.frameCount(),0);f.reduce(false);assert.equal(f.frameCount(),1);}f.advance(16);assert.equal(f.frameCount(),1);
});

test('reduced-motion pauses an in-flight fade and resumes its remaining duration without a clock jump',t=>{
  const f=fixture(t);f.mount();f.advance(100);
  // The real progress event takes ownership from the initial inactive tween.
  f.win.emit('glowing-edge-progress',{detail:{progress:0}});f.win.emit('glowing-edge-show');f.advance(160);
  f.reduce(true);const before={amount:f.refs[2].value,time:f.lastUniform('u_time'),draws:f.draws};
  f.advance(2000);assert.equal(f.refs[2].value,before.amount);assert.equal(f.draws,before.draws);
  f.reduce(false);f.advance(16);assert(f.refs[2].value>before.amount);assert(f.refs[2].value<1);assert(f.lastUniform('u_time')-before.time<.05);
  f.advance(1000);assert.equal(f.refs[2].value,1);assert.equal(f.tweens.size,0);
});

test('reduced-motion hide and zero progress clear a frozen pulse instead of leaving its shader output',t=>{
  for(const control of ['hide','progress']){
    const f=fixture(t);f.mount();f.advance(100);f.show();f.win.emit('glowing-edge-trigger-pulse',{detail:{x:.2,y:.6}});f.advance(160);f.reduce(true);
    const before={draws:f.draws,pulse:f.lastUniform('u_pulse'),clears:f.glCalls.filter(call=>call.key==='clear').length};
    assert(before.pulse>0&&before.pulse<1);
    f.win.emit('glowing-edge-'+control,control==='progress'?{detail:{progress:0}}:{});
    assert.equal(f.refs[2].value,0);assert.equal(f.draws,before.draws,control+' must clear, not render a frozen pulse');
    assert(f.glCalls.filter(call=>call.key==='clear').length>before.clears);f.advance(5000);assert.equal(f.draws,before.draws);assert.equal(f.frameCount(),0);
    f.reduce(false);f.show();f.advance(16);assert(f.lastUniform('u_pulse')>before.pulse);assert(f.lastUniform('u_pulse')<1,'Paused pulse state survives the static clear');
  }
});

test('both initialization branches and active initial props use lifecycle state after it is initialized',t=>{
  const f=fixture(t,{active:true,idleCallback:false});f.mount();f.advance(499);assert.equal(f.contexts,0);
  f.advance(1);assert.equal(f.contexts,1);assert.equal(f.frameCount(),1);f.advance(32);assert(f.draws>0);
});

test('retained initialization and reveal callbacks are inert after unmount',t=>{
  const early=fixture(t);early.mount();const init=[...early.timers.values()][0].run;early.destroy();init();assert.equal(early.contexts,0);assert.equal(early.timers.size,0);
  const ready=fixture(t);ready.mount();ready.advance(100);const reveal=[...ready.timers.values()].find(timer=>timer.kind==='timer').run;
  ready.destroy();reveal();assert.equal(ready.refs[3].value,false);assert.equal(ready.timers.size,0);
});

test('the original noise texture can redraw a reduced still but never draws while hidden',t=>{
  const f=fixture(t,{reduced:true});f.mount();f.advance(100);f.show();const before=f.draws;
  f.images[0].onload();assert(f.draws>before);assert.equal(f.frameCount(),0);
  f.hidePage(true);const hidden=f.draws;f.images[0].onload();assert.equal(f.draws,hidden);assert.equal(f.frameCount(),0);
});

test('setup and teardown do not require a browser DOM',t=>{
  const f=fixture(t,{dom:false});f.mount();f.destroy();f.advance(1000);
  assert.equal(f.contexts,0);assert.equal(f.timers.size,0);assert.equal(f.tweens.size,0);
});
