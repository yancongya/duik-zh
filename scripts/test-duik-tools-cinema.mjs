import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {parseFragment} from 'parse5';
import {TOOLS_CINEMA_DURATION,TOOLS_CINEMA_LAYERS,sampleToolsCinema,toolsCinemaMarkup,mountToolsCinema} from '../components/home/landing/tools-cinema.mjs';

class Events {
  listeners=new Map();
  addEventListener(type,run,options={}) {if(options.signal?.aborted)return;const list=this.listeners.get(type)||[];list.push(run);this.listeners.set(type,list);options.signal?.addEventListener('abort',()=>this.listeners.set(type,(this.listeners.get(type)||[]).filter(value=>value!==run)),{once:true});}
  fire(type,extra={}) {const event={type,target:this,currentTarget:this,button:0,isPrimary:true,pointerId:1,key:'',preventDefault(){this.prevented=true;},...extra};return Promise.all((this.listeners.get(type)||[]).slice().map(run=>run(event)));}
}
class Element extends Events {
  constructor(tag,doc,attrs=[]){super();this.tagName=tag;this.ownerDocument=doc;this.attrs=new Map(attrs.map(a=>[a.name,a.value]));this.children=[];this.parentNode=null;this.captured=new Set();this.style={};this._text='';this.dataset=new Proxy({}, {get:(_,key)=>this.getAttribute('data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase())),set:(_,key,value)=>{this.setAttribute('data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),value);return true;}});}
  getAttribute(key){return this.attrs.get(key)??null;} setAttribute(key,value){this.attrs.set(key,String(value));} removeAttribute(key){this.attrs.delete(key);}
  get id(){return this.getAttribute('id');}set id(value){this.setAttribute('id',value);}get open(){return this.attrs.has('open');}set open(value){value?this.setAttribute('open',''):this.removeAttribute('open');}
  matches(selector){if(selector.startsWith('.'))return (this.getAttribute('class')||'').split(/\s+/).includes(selector.slice(1));const match=selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);return match?this.attrs.has(match[1])&&(match[2]===undefined||this.attrs.get(match[1])===match[2]):this.tagName===selector;}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  append(child){child.parentNode=this;this.children.push(child);}replaceChildren(...children){this.children=[];this._text='';for(const child of children)this.append(child);}
  set innerHTML(value){this.replaceChildren();const adapt=node=>{const el=new Element(node.tagName||'#text',this.ownerDocument,node.attrs||[]);el._text=node.value||'';for(const child of node.childNodes||[])el.append(adapt(child));return el;};for(const node of parseFragment(value).childNodes)this.append(adapt(node));}
  get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}set textContent(value){this.replaceChildren();this._text=String(value);}
  focus(){const old=this.ownerDocument.activeElement;if(old!==this){this.ownerDocument.activeElement=this;old?.fire('blur');this.fire('focus');}}
  setPointerCapture(id){this.captured.add(id);}hasPointerCapture(id){return this.captured.has(id);}releasePointerCapture(id){this.captured.delete(id);this.fire('lostpointercapture',{pointerId:id});}
  getScreenCTM(){return {inverse:()=>({})};}getBoundingClientRect(){return this.rect||{left:0,top:0,right:1280,bottom:800,width:1280,height:800};}
}
function fixture(t,{reduced=false,loadWorkbench}={}) {
  const doc=new Events(),win=new Events(),media=new Events(),frames=new Map(),history=[],observers=[];let clock=0,next=0;
  doc.hidden=false;doc.defaultView=win;media.matches=reduced;
  Object.assign(win,{AbortController,innerWidth:1440,innerHeight:1000,matchMedia:()=>media,DOMPoint:class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}},requestAnimationFrame(run){const id=++next;frames.set(id,run);history.push(run);return id;},cancelAnimationFrame:id=>frames.delete(id),IntersectionObserver:class{constructor(run){this.run=run;observers.push(this);}observe(target){this.target=target;}disconnect(){this.disconnected=true;}}});
  const host=new Element('div',doc);host.innerHTML=toolsCinemaMarkup;const root=host.querySelector('[data-tools-cinema-root]');
  const cleanup=mountToolsCinema(host,{loadWorkbench});t.after(cleanup);
  const $=s=>root.querySelector(s),advance=ms=>{for(let i=0;i<ms;i+=50){clock+=50;const pending=[...frames.values()];frames.clear();for(const run of pending)run(clock);}};
  const visible=(value=true)=>observers[0].run([{target:$('[data-tools-cinema-stage]'),isIntersecting:value,intersectionRatio:value?1:0}]);
  return {doc,win,media,host,root,$,frames,history,observers,advance,visible,cleanup,remount:options=>mountToolsCinema(root,options)};
}

test('SSR is one complete local artwork, a concise heading and one documentation entry',()=>{
  const doc=new Events(),host=new Element('div',doc);host.innerHTML=toolsCinemaMarkup;
  assert.equal(host.querySelectorAll('h2').length,1);assert.equal(host.querySelectorAll('figure').length,1);assert.equal(host.querySelectorAll('svg').length,1);
  assert.equal(host.querySelectorAll('[data-cinema-art-layer]').length,4);assert.equal(host.querySelectorAll('[data-tools-cinema-ribbons]')[0].querySelectorAll('path').length,21);
  assert.equal(host.querySelectorAll('a').length,1);assert.equal(host.querySelector('a').getAttribute('href'),'/docs/guide/tools/layers');
  assert(existsSync(new URL('../content/docs/guide/tools/layers.mdx',import.meta.url)));
  assert(!host.querySelector('details').open);assert.equal(host.querySelector('[data-tools-cinema-workbench]').children.length,0);
  assert.equal(host.querySelectorAll('[data-tools-cinema-object]').length,1);assert.equal(host.querySelectorAll('input').length,0);
  assert(!/播放|暂停|进度条|重播/.test(host.textContent));assert(!toolsCinemaMarkup.includes('http'));assert(!toolsCinemaMarkup.includes('iframe'));
  assert(toolsCinemaMarkup.includes('网页原理示意'));assert(TOOLS_CINEMA_LAYERS.every(item=>item.type==='美术'&&item.group==='片头'));
});
test('the authored camera approaches the actual artwork, exposes metadata and returns without an endpoint jump',()=>{
  const start=sampleToolsCinema(0),end=sampleToolsCinema(TOOLS_CINEMA_DURATION);
  for(const key of ['zoom','selection','source','name','group','side','type'])assert(Math.abs(start[key]-end[key])<.0001,key+' has no loop seam');
  assert(sampleToolsCinema(TOOLS_CINEMA_DURATION*.33).zoom>.99);assert(sampleToolsCinema(TOOLS_CINEMA_DURATION*.33).source>.99);
  const named=sampleToolsCinema(TOOLS_CINEMA_DURATION*.61);assert.equal(named.tagged,true);assert(named.name>.99&&named.group>.99&&named.side>.99&&named.type>.99);
  for(let t=0;t<=TOOLS_CINEMA_DURATION;t+=16){const a=sampleToolsCinema(t),b=sampleToolsCinema(t+16);assert(Math.abs(a.zoom-b.zoom)<.1);for(const value of Object.values(a).filter(x=>typeof x==='number'))assert(Number.isFinite(value));}
});
test('visible entry starts a continuous loop without controls or default workbench loading',t=>{
  let loads=0;const f=fixture(t,{loadWorkbench:()=>{loads++;throw Error('Should remain lazy');}});assert.equal(f.frames.size,0);assert.equal(loads,0);
  f.visible();assert.equal(f.frames.size,1);f.advance(3650);assert.equal(f.root.dataset.cinemaState,'running');assert.equal(f.root.dataset.cinemaPhase,'select');
  f.advance(3250);assert.equal(f.root.dataset.cinemaTagged,'true');f.advance(5000);assert.equal(f.root.dataset.cinemaState,'running');assert(Number(f.root.dataset.cinemaProgress)<.2);assert.equal(f.frames.size,1);assert.equal(loads,0);
});
test('hover, focus and unrelated keyboard input do not act as pause controls',t=>{
  const f=fixture(t);f.visible();f.advance(1000);const object=f.$('[data-tools-cinema-object]'),before=f.root.dataset.cinemaProgress;
  object.fire('pointerenter');object.focus();object.fire('keydown',{key:'Tab'});object.fire('keydown',{key:'Enter'});f.advance(1000);
  assert(Number(f.root.dataset.cinemaProgress)>Number(before));assert.equal(f.root.dataset.cinemaState,'running');assert.equal(f.frames.size,1);
});
test('direct drag owns the camera clock, rejects another pointer and preserves edits after automatic playback resumes',t=>{
  const f=fixture(t);f.visible();f.advance(3600);const object=f.$('[data-tools-cinema-object]'),camera=f.$('[data-tools-cinema-camera]');
  const clock=f.root.dataset.cinemaProgress,transform=camera.getAttribute('transform');object.fire('pointerdown',{pointerId:7,clientX:700,clientY:240});assert.equal(f.frames.size,0);
  object.fire('pointerdown',{pointerId:9,clientX:700,clientY:240});object.fire('pointerup',{pointerId:9});object.fire('lostpointercapture',{pointerId:9});assert.equal(f.frames.size,0);assert(object.hasPointerCapture(7));
  object.fire('pointermove',{pointerId:7,clientX:728,clientY:224});assert.equal(object.getAttribute('transform'),'translate(28 -16)');assert.equal(camera.getAttribute('transform'),transform,'Dragging does not move its coordinate frame');
  f.advance(1000);assert.equal(f.root.dataset.cinemaProgress,clock);object.fire('pointerup',{pointerId:7});assert.equal(f.frames.size,1);f.advance(750);
  assert.equal(object.getAttribute('transform'),'translate(28 -16)');assert.equal(f.$('[data-tools-cinema-labels]').getAttribute('transform'),object.getAttribute('transform'));assert.notEqual(f.root.dataset.cinemaProgress,clock);
});
test('keyboard changes are immediate, bounded, resettable and yield only while a real adjustment key is held',t=>{
  const f=fixture(t);f.visible();const object=f.$('[data-tools-cinema-object]');object.fire('keydown',{key:'ArrowRight',shiftKey:true});assert.equal(f.root.dataset.cinemaOffsetX,'10');assert.equal(f.frames.size,0);
  f.doc.fire('keyup',{key:'ArrowRight'});assert.equal(f.frames.size,1);for(let i=0;i<20;i++)object.fire('keydown',{key:'ArrowRight',shiftKey:true});assert.equal(f.root.dataset.cinemaOffsetX,'72');
  object.fire('keydown',{key:'Home'});assert.equal(f.root.dataset.cinemaOffsetX,'0');assert.equal(f.root.dataset.cinemaOffsetY,'0');object.fire('blur');assert.equal(f.frames.size,1);
});
test('the actual camera keeps selection and organization labels inside the full frame through the loop and all drag extremes',t=>{
  for(const [horizontal,vertical] of [['ArrowLeft','ArrowUp'],['ArrowLeft','ArrowDown'],['ArrowRight','ArrowUp'],['ArrowRight','ArrowDown']]){
    const f=fixture(t),object=f.$('[data-tools-cinema-object]'),camera=f.$('[data-tools-cinema-camera]');
    for(let i=0;i<8;i++)object.fire('keydown',{key:horizontal,shiftKey:true});f.doc.fire('keyup',{key:horizontal});
    for(let i=0;i<4;i++)object.fire('keydown',{key:vertical,shiftKey:true});f.doc.fire('keyup',{key:vertical});
    const dx=Number(f.root.dataset.cinemaOffsetX),dy=Number(f.root.dataset.cinemaOffsetY);
    const hit=f.$('.duik-tools-cinema-hit'),left=Number(hit.getAttribute('x')),top=Number(hit.getAttribute('y')),right=left+Number(hit.getAttribute('width'));
    const marker=f.$('[data-tools-cinema-type]').querySelector('text');
    const labelBottom=Number(marker.getAttribute('y'))+Number(marker.getAttribute('font-size'))*.35+3.5;
    f.visible();let peak=false;
    for(let elapsed=0;elapsed<=TOOLS_CINEMA_DURATION+50;elapsed+=50){
      f.advance(50);const match=camera.getAttribute('transform').match(/^translate\(([-.\d]+) ([-.\d]+)\) scale\(([-.\d]+)\)$/);assert(match);
      const [,tx,ty,z]=match.map(Number);peak ||= z>1.399;
      assert((left+dx)*z+tx>=0,'left selection remains in frame');assert((right+dx)*z+tx<=1280,'right selection remains in frame');
      assert((top+dy)*z+ty>=8,'upper corner has room at peak zoom');assert((labelBottom+dy)*z+ty<=795,'label descenders and stroke remain visible');
    }
    assert(peak,'the test must pass through the maximum camera push');
  }
});
test('offscreen, background and reduced-motion stop work; reduced-motion keeps full artwork and direct manipulation',t=>{
  const f=fixture(t);f.visible();f.advance(3800);const progress=f.root.dataset.cinemaProgress;
  f.visible(false);f.advance(4000);assert.equal(f.root.dataset.cinemaProgress,progress);assert.equal(f.frames.size,0);f.visible(true);assert.equal(f.frames.size,1);
  f.doc.hidden=true;f.doc.fire('visibilitychange');assert.equal(f.frames.size,0);f.doc.hidden=false;f.doc.fire('visibilitychange');assert.equal(f.frames.size,1);
  f.media.fire('change',{matches:true});assert.equal(f.root.dataset.cinemaState,'reduced');assert.equal(f.frames.size,0);assert.equal(f.$('[data-tools-cinema-camera]').getAttribute('transform'),'translate(0.000 0.000) scale(1.00000)');assert.equal(f.$('[data-tools-cinema-type]').getAttribute('opacity'),'1');
  f.$('[data-tools-cinema-object]').fire('keydown',{key:'ArrowDown'});assert.equal(f.root.dataset.cinemaOffsetY,'2');assert.equal(f.frames.size,0);f.media.fire('change',{matches:false});assert.equal(f.frames.size,1);
});
test('initial reduced motion is static and readable before entering the viewport',t=>{
  const f=fixture(t,{reduced:true});f.visible();f.advance(15000);assert.equal(f.frames.size,0);assert.equal(f.root.dataset.cinemaState,'reduced');assert.equal(f.root.dataset.cinemaProgress,'1.0000');assert.equal(f.$('[data-tools-cinema-name]').getAttribute('opacity'),'1');
});
test('a visibility batch cancels old frames before a new visible generation starts',t=>{
  const f=fixture(t);f.visible();f.advance(800);const stale=[...f.frames.values()][0],progress=f.root.dataset.cinemaProgress,stage=f.$('[data-tools-cinema-stage]');
  f.observers[0].run([{target:stage,isIntersecting:false,intersectionRatio:0},{target:stage,isIntersecting:true,intersectionRatio:1}]);stale(99999);assert.equal(f.root.dataset.cinemaProgress,progress);assert.equal(f.frames.size,1);
});
test('details lazily mount the unchanged workbench and pause the picture until they close',async t=>{
  let loads=0,mounts=0,disposals=0;const module={toolsMarkup:'<div>Original tools</div>',mountTools:host=>{mounts++;assert(host.textContent.includes('Original tools'));return()=>disposals++;}};
  const f=fixture(t,{loadWorkbench:async()=>{loads++;return module;}});f.visible();f.advance(1000);const details=f.$('[data-tools-cinema-details]'),progress=f.root.dataset.cinemaProgress;
  assert.equal(loads,0);details.open=true;await details.fire('toggle');assert.equal(loads,1);assert.equal(mounts,1);assert.equal(f.frames.size,0);assert.equal(f.root.dataset.cinemaState,'details');f.advance(4000);assert.equal(f.root.dataset.cinemaProgress,progress);
  details.open=false;await details.fire('toggle');assert.equal(disposals,1);assert.equal(f.$('[data-tools-cinema-workbench]').textContent,'');assert.equal(f.frames.size,1);
});
test('late imports cannot mount after close, a subsequent open, or cleanup',async t=>{
  const pending=[];let mounts=0,disposals=0;const f=fixture(t,{loadWorkbench:()=>new Promise(resolve=>pending.push(resolve))});f.visible();const details=f.$('[data-tools-cinema-details]'),module={toolsMarkup:'<p>tools</p>',mountTools:()=>{mounts++;return()=>disposals++;}};
  details.open=true;const first=details.fire('toggle');details.open=false;await details.fire('toggle');details.open=true;const second=details.fire('toggle');
  pending[0](module);await first;assert.equal(mounts,0);pending[1](module);await second;assert.equal(mounts,1);
  details.open=false;await details.fire('toggle');assert.equal(disposals,1);details.open=true;const third=details.fire('toggle');f.cleanup();pending[2](module);await third;assert.equal(mounts,1);assert.equal(f.$('[data-tools-cinema-workbench]').textContent,'');
});
test('workbench loading failures have a recoverable message rather than swallowing the error',async t=>{
  let fail=true;const f=fixture(t,{loadWorkbench:async()=>{if(fail)throw Error('network');return {toolsMarkup:'<p>Loaded</p>',mountTools:()=>()=>{}};}});const details=f.$('[data-tools-cinema-details]');details.open=true;await details.fire('toggle');assert(f.$('[data-tools-cinema-workbench]').textContent.includes('收起后重试'));assert.equal(f.$('[data-tools-cinema-workbench]').getAttribute('aria-busy'),null);
  details.open=false;await details.fire('toggle');fail=false;details.open=true;await details.fire('toggle');assert.equal(f.$('[data-tools-cinema-workbench]').textContent,'Loaded');
});
test('pagehide and remount reject queued callbacks and release captures without affecting a newer instance',t=>{
  const f=fixture(t);assert.equal(f.remount(),f.cleanup);f.visible();f.advance(700);const object=f.$('[data-tools-cinema-object]');object.fire('pointerdown',{pointerId:7,clientX:700,clientY:240});f.win.fire('pagehide');assert(!object.hasPointerCapture(7));assert.equal(f.frames.size,0);f.win.fire('pageshow');assert.equal(f.frames.size,1);
  const stale=[...f.frames.values()][0],oldObserver=f.observers[0];f.cleanup();const next=f.remount();t.after(next);const state=f.root.dataset.cinemaState;stale(999999);oldObserver.run([{target:f.$('[data-tools-cinema-stage]'),isIntersecting:true,intersectionRatio:1}]);assert.equal(f.root.dataset.cinemaState,state);assert.equal(f.frames.size,0);assert.equal(f.observers[0].disconnected,true);
});
test('CSS inherits the light world and includes native local display type and constrained small-screen composition',()=>{
  const css=readFileSync(new URL('../components/home/landing/tools-cinema.css',import.meta.url),'utf8');assert(css.includes('var(--duik-paper'));assert(css.includes('FFF-AcidGrotesk-Bold.woff2'));assert(css.includes('@media(max-width:767px)'));assert(css.includes('@media(prefers-reduced-motion:reduce)'));assert(css.includes(':focus-visible'));assert(!css.includes('transition:all'));assert(!css.includes('http'));
  assert(css.includes('calc(160svh - 576px)'),'short desktops constrain width from available height');assert(css.includes('aspect-ratio:8/5'),'the entire original composition scales together');assert(!css.includes('max-height:'),'do not fit by cropping height');
});
