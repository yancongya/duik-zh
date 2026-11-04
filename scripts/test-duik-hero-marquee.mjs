import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {parseFragment} from 'parse5';
import ts from 'typescript';
import {patchHeroMarqueeRuntime,renderHeroMarqueeSSR} from './lib/landing-hero-marquee.mjs';
import {heroMarqueeItems,heroMarqueeProps,mountHeroMarquee} from '../components/home/landing/hero-marquee.mjs';
import {panels} from '../components/home/landing/tool-catalog.mjs';

const original=await readFile(new URL('../components/home/landing/baseline/_nuxt/LogoMarqueeKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js',import.meta.url),'utf8');
const code=patchHeroMarqueeRuntime(original);
const normalizeClass=value=>Array.isArray(value)?value.map(normalizeClass).filter(Boolean).join(' '):value||'';
const normalizeStyle=value=>typeof value==='string'?value.split(';').map(v=>v.trim()).filter(Boolean).sort().join(';'):Object.entries(value).map(([name,item])=>name.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())+':'+item).sort().join(';');
function attrs(entries){return Object.fromEntries(entries.filter(([key,value])=>!['key','ref','ref_key','ref_for'].includes(key)&&!key.startsWith('on')&&!key.startsWith('data-v-')&&value!==null&&value!==undefined).map(([key,value])=>[key,key==='class'?normalizeClass(value):key==='style'?normalizeStyle(value):String(value)]).sort(([a],[b])=>a.localeCompare(b)));}

function initialVNode(){
  const ast=ts.createSourceFile('marquee.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  let clean=code,exported;
  for(const node of [...ast.statements].reverse()){
    if(ts.isExportDeclaration(node)){exported=node.exportClause.elements.find(item=>item.name.text==='default').propertyName.text;clean=clean.slice(0,node.getStart(ast))+clean.slice(node.end);}
    if(ts.isImportDeclaration(node))clean=clean.slice(0,node.getStart(ast))+clean.slice(node.end);
  }
  const fragment=Symbol('fragment'),node=(tag,props,children)=>({tag,props,children});
  const context={duikMarqueeItems:heroMarqueeItems,mountHeroMarquee(){},w:x=>x,M(){},x(){},k(){},t:node,g:node,c:normalizeClass,h:fragment,_:(value,fn)=>typeof value==='number'?Array.from({length:value},(_,index)=>fn(index+1,index)):value.map(fn),s:value=>({value}),n(){},z:x=>x,I:(value)=>value};
  const component=runInNewContext(clean+'\n'+exported,context);
  const vnode=component.setup(heroMarqueeProps)({},[]);
  function normalize(value){
    if(value===null||value===undefined)return [];
    if(typeof value==='string')return [value];
    if(Array.isArray(value))return Array.from(value).flatMap(normalize);
    if(value.tag===fragment)return normalize(value.children);
    return [{tag:value.tag,attrs:attrs(Object.entries(value.props||{})),children:normalize(value.children)}];
  }
  return normalize(vnode);
}
function initialSSR(){
  function normalize(node){
    if(node.nodeName==='#comment')return [];
    if(node.nodeName==='#text')return [node.value];
    return [{tag:node.tagName,attrs:attrs((node.attrs||[]).map(a=>[a.name,a.value])),children:(node.childNodes||[]).flatMap(normalize)}];
  }
  return parseFragment(renderHeroMarqueeSSR()).childNodes.flatMap(normalize);
}

test('marquee keeps original width measurement, three-copy initial loop and 40px/s speed',()=>{
  for(const anchor of ['B=40','d=s(3)','m=s(30)','Math.ceil(a/e)+1','Math.ceil(e/B)','window.addEventListener("resize",o)','document.fonts?.ready?.then(()=>{o()})','duikDisposeMarquee?.()'])assert(code.includes(anchor),anchor);
  assert.equal(patchHeroMarqueeRuntime(code),code);
  assert(!code.includes('/images/logos/logo-'));
  assert.deepEqual(heroMarqueeItems.map(item=>item.href),panels.map(panel=>panel.href));
});
test('SSR and the patched original render function produce identical initial DOM',()=>{
  assert.deepEqual(initialVNode(),initialSSR());
  const html=renderHeroMarqueeSSR();
  assert.equal((html.match(/<a /g)||[]).length,24);
  assert.equal((html.match(/tabindex="0"/g)||[]).length,8);
  assert.equal((html.match(/aria-hidden="true"/g)||[]).length,2);
  assert.equal((html.match(/animation-duration:30s/g)||[]).length,3);
});

class Target{
  listeners=new Map();
  addEventListener(type,listener,options={}){if(options.signal?.aborted)return;const group=this.listeners.get(type)||new Set();group.add(listener);this.listeners.set(type,group);options.signal?.addEventListener('abort',()=>group.delete(listener));}
  emit(type,props={}){const event={type,target:this,...props};for(const listener of [...this.listeners.get(type)||[]])listener(event);}
}
class Element extends Target{
  dataset={};style={opacity:'',pointerEvents:''};attributes={};hidden=false;inert=false;
  setAttribute(key,value){this.attributes[key]=String(value);}
  contains(node){return node===this||node?.ribbon===this;}
  matches(){return false;}
}
function fixture(){
  const win=new Target(),doc=new Target(),ribbon=new Element(),root=new Element(),main=new Element(),toggle=new Element();
  const preference=new Target();preference.matches=false;
  const timers=new Map(),observers=[],mutations=[];let timerId=0;
  Object.assign(win,{AbortController:class{signal=new Target();abort(){this.signal.aborted=true;this.signal.emit('abort');}},matchMedia:()=>preference,setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),IntersectionObserver:class{constructor(fn){this.callback=fn;observers.push(this);}observe(target){this.target=target;}disconnect(){this.disconnected=true;}},MutationObserver:class{constructor(fn){this.callback=fn;mutations.push(this);}observe(){}disconnect(){this.disconnected=true;}}});
  Object.assign(doc,{defaultView:win,hidden:false});
  root.ownerDocument=doc;root.ribbon=ribbon;toggle.ribbon=ribbon;
  root.closest=selector=>selector==='.duik-hero-ribbon'?ribbon:selector==='.kp-home-hero-main'?main:null;
  ribbon.querySelector=()=>toggle;
  return {win,doc,ribbon,root,main,toggle,preference,timers,observers,mutations,flush(){for(const [id,fn]of [...timers]){timers.delete(id);fn();}},visible(value){observers[0].callback([{target:root,isIntersecting:value}]);}};
}

test('mount is idempotent, pauses on interaction/retirement and cleans listeners',()=>{
  const f=fixture(),dispose=mountHeroMarquee(f.root);
  assert.equal(mountHeroMarquee(f.root),dispose);
  assert.equal(f.observers.length,1);
  f.visible(true);assert.equal(f.root.dataset.marqueeState,'playing');
  f.root.emit('pointerenter',{pointerType:'mouse'});assert.equal(f.root.dataset.marqueeState,'paused');
  f.root.emit('pointerleave',{pointerType:'mouse'});assert.equal(f.root.dataset.marqueeState,'playing');
  assert.equal(f.toggle.listeners.get('click')?.size||0,0,'automatic strip has no playback listener');
  f.root.emit('focusin',{target:{matches:()=>true}});assert.equal(f.root.dataset.marqueeKeyboard,'true');assert.equal(f.root.dataset.marqueeState,'paused');
  f.root.emit('focusout',{relatedTarget:f.toggle});assert.equal(f.root.dataset.marqueeKeyboard,'false');
  assert.equal(f.root.dataset.marqueeState,'playing','leaving the moving links resumes their loop');
  f.main.style.opacity='0';for(let i=0;i<50;i++)f.mutations[0].callback();
  assert.equal(f.timers.size,1,'style updates are coalesced, never read once per frame');
  f.flush();assert.equal(f.root.dataset.marqueeState,'paused');
  f.main.style.opacity='1';f.mutations[0].callback();f.flush();assert.equal(f.root.dataset.marqueeState,'playing');
  f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.root.dataset.marqueeState,'paused');
  f.doc.hidden=false;f.doc.emit('visibilitychange');assert.equal(f.root.dataset.marqueeState,'playing');
  f.visible(false);assert.equal(f.root.dataset.marqueeState,'paused');
  dispose();dispose();assert(f.observers[0].disconnected);assert(f.mutations[0].disconnected);
  const label=f.toggle.textContent;f.toggle.emit('click');assert.equal(f.toggle.textContent,label);
  assert.equal(f.timers.size,0);
});
test('retired hero excludes the entire ribbon from focus and restores its original inert state',()=>{
  for(const initiallyInert of [false,true]){
    const f=fixture();f.ribbon.inert=initiallyInert;
    const dispose=mountHeroMarquee(f.root);f.visible(true);
    assert.equal(f.ribbon.inert,initiallyInert);
    f.main.style.opacity='0';f.mutations[0].callback();f.flush();
    assert.equal(f.ribbon.inert,true,'transparent hero cannot retain focusable ribbon links or controls');
    f.main.style.opacity='1';f.mutations[0].callback();f.flush();
    assert.equal(f.ribbon.inert,initiallyInert,'returning to hero restores the original focus boundary');
    f.main.style.pointerEvents='none';f.mutations[0].callback();f.flush();
    f.preference.matches=true;f.preference.emit('change');
    assert.equal(f.ribbon.inert,true,'reduced-motion tab stop stays inside the retired inert boundary');
    dispose();assert.equal(f.ribbon.inert,initiallyInert,'unmount restores state owned by the host');
  }
});
test('reduced motion is a single manual strip, pointer focus never hides the clicked copy',async()=>{
  const f=fixture();mountHeroMarquee(f.root);f.visible(true);
  f.ribbon.emit('pointerdown');f.root.emit('focusin',{target:{matches:()=>true}});
  assert.equal(f.root.dataset.marqueeKeyboard,'false');
  f.win.emit('pointerup');f.root.emit('focusout',{relatedTarget:null});
  f.preference.matches=true;f.preference.emit('change');
  assert.equal(f.root.dataset.marqueeState,'reduced');assert.equal(f.root.tabIndex,0);
  const css=await readFile(new URL('../components/home/landing/hero-marquee.css',import.meta.url),'utf8');
  assert(css.includes('@media(prefers-reduced-motion:reduce)'));
  assert(css.includes(':not([data-duik-marquee-copy="1"]){display:none}'));
  assert(css.includes('overflow-x:auto'));
  f.preference.matches=false;f.preference.emit('change');assert.equal(f.root.dataset.marqueeState,'playing');
});
