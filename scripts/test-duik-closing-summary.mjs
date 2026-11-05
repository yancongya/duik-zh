// Runs the real closing/catalog/guide/API handlers against a narrow DOM/clock
// adapter. This is lifecycle and content evidence, not browser visual acceptance.
import test from 'node:test';
import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import {parseFragment} from 'parse5';
import {closingIndexMarkup, closingStartMarkup, mountClosingIndex, mountClosingStart} from '../components/home/landing/closing-summary.mjs';
import {guidePaths, guideFaqItems} from '../components/home/landing/guide-experience.mjs';
import {panels, tools, apiExamples} from '../components/home/landing/tool-catalog.mjs';
import {textSlots} from '../components/home/landing/content.mjs';

class Events {
  listeners = new Map();
  addEventListener(type, callback) { if (!this.listeners.has(type)) this.listeners.set(type, new Set()); this.listeners.get(type).add(callback); }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  fire(type, values = {}) {
    const event = {type, target:this, detail:0, button:0, defaultPrevented:false, preventDefault(){this.defaultPrevented=true;}, ...values};
    let current = this;
    do {
      for (const callback of [...(current.listeners.get(type) || [])]) callback(event);
      current = ['click','input','keydown','focusin','submit','pointerdown'].includes(type) ? current.parentElement : null;
    } while (current);
    return event;
  }
}
class Element extends Events {
  constructor(source, document) {
    super(); this.tagName = source.tagName || '#text'; this.ownerDocument = document;
    this.attributes = new Map((source.attrs || []).map(({name,value}) => [name,value]));
    this.children = []; this.parentElement = null; this.style = {}; this._text = source.value || '';
    this.dataset = new Proxy({}, {get:(_, key) => this.getAttribute('data-' + String(key).replace(/[A-Z]/g, char => '-' + char.toLowerCase())) ?? undefined, set:(_,key,value) => {this.setAttribute('data-' + String(key).replace(/[A-Z]/g, char => '-' + char.toLowerCase()), value); return true;}});
    for (const child of source.childNodes || []) this.append(new Element(child, document));
  }
  append(child) { child.parentElement = this; this.children.push(child); }
  setAttribute(key,value) { this.attributes.set(key,String(value)); }
  getAttribute(key) { return this.attributes.get(key) ?? null; }
  hasAttribute(key) { return this.attributes.has(key); }
  removeAttribute(key) { this.attributes.delete(key); }
  toggleAttribute(key, force) { const enabled = force ?? !this.hasAttribute(key); if (enabled) this.setAttribute(key,''); else this.removeAttribute(key); }
  matches(selector) {
    const one = (element, part) => {
      if (!(element instanceof Element)) return false;
      const tag = part.match(/^[a-z][a-z0-9-]*/i)?.[0]; if (tag && element.tagName !== tag) return false;
      const id = part.match(/#([\w-]+)/)?.[1]; if (id && element.id !== id) return false;
      for (const [,cls] of part.matchAll(/\.([\w-]+)/g)) if (!(element.getAttribute('class') || '').split(/\s+/).includes(cls)) return false;
      for (const [,key,quoted,plain] of part.matchAll(/\[([^\]=]+)(?:=(?:"([^"]*)"|([^\]]+)))?\]/g)) {
        const expected = quoted ?? plain; if (!element.hasAttribute(key) || (expected !== undefined && element.getAttribute(key) !== expected)) return false;
      }
      return true;
    };
    return selector.split(',').some(selectorPart => {
      const parts = selectorPart.trim().split(/\s+/); let current = this;
      if (!one(current,parts.pop())) return false;
      while (parts.length) { const part = parts.pop(); do {current=current.parentElement;} while (current && !one(current,part)); if (!current) return false; }
      return true;
    });
  }
  closest(selector) { for (let node=this; node instanceof Element; node=node.parentElement) if (node.matches(selector)) return node; return null; }
  contains(node) { for (let current=node; current; current=current.parentElement) if (current === this) return true; return false; }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  get innerHTML() { throw new Error('The fixture only needs DOM writes, not serialization'); }
  set innerHTML(markup) { this._text=''; this.children=[]; for (const child of parseFragment(markup).childNodes) this.append(new Element(child,this.ownerDocument)); }
  get textContent() { return this._text + this.children.map(child=>child.textContent).join(''); }
  set textContent(value) { this._text=String(value); this.children=[]; }
  focus() { this.ownerDocument.activeElement=this; this.fire('focusin'); }
  click() { this.fire('click'); }
  scrollIntoView(options) { this.ownerDocument.scrolls.push({target:this,options}); }
  getBoundingClientRect() { return this.ownerDocument.rect; }
  animate(frames,options) { const animation={target:this,frames,options,currentTime:0,playState:'running',play(){this.playState='running';},pause(){this.playState='paused';},cancel(){this.playState='idle';}}; this.ownerDocument.animations.push(animation); return animation; }
}
for (const name of ['id','value','href','src','alt','tabIndex']) Object.defineProperty(Element.prototype,name,{get(){return this.getAttribute(name.toLowerCase()) || '';},set(value){this.setAttribute(name.toLowerCase(),value);}});
for (const name of ['hidden','open','disabled']) Object.defineProperty(Element.prototype,name,{get(){return this.hasAttribute(name);},set(value){this.toggleAttribute(name,!!value);}});
function fixture(hash='') {
  const document=new Events(),view=new Events(),preference=new Events();
  document.hidden=false; document.animations=[]; document.scrolls=[]; document.activeElement=null;
  document.rect={left:0,top:0,right:1200,bottom:300,width:1200,height:300};
  document.defaultView=view; view.location={href:'http://127.0.0.1:3017/'+hash,hash}; preference.matches=false;
  view.innerWidth=1331;view.innerHeight=1086;
  const frames=new Map(),observers=[]; let frameId=0;
  view.requestAnimationFrame=callback=>{frames.set(++frameId,callback);return frameId;}; view.cancelAnimationFrame=id=>frames.delete(id);
  view.matchMedia=()=>preference; view.getComputedStyle=()=>({getPropertyValue:()=>''}); view.navigator={clipboard:{writeText:async()=>{}}};
  view.IntersectionObserver=class{constructor(callback){this.callback=callback;this.disconnected=false;observers.push(this);}observe(element){this.element=element;}disconnect(){this.disconnected=true;}notify(visible=true){this.callback([{target:this.element,isIntersecting:visible,intersectionRatio:visible?1:0}]);}};
  const host=new Element({tagName:'div'},document); host.parentElement=document; host.innerHTML=closingIndexMarkup+closingStartMarkup;
  const tick=()=>{const pending=[...frames.values()];frames.clear();for(const callback of pending)callback();};
  const changeHash=value=>{view.location.hash=value;view.location.href='http://127.0.0.1:3017/'+value;view.fire('hashchange');};
  return {host,document,view,preference,frames,observers,tick,changeHash};
}
const allElements = markup => {const env=fixture();env.host.innerHTML=markup;return env.host;};
const observersWithin = (env,root) => env.observers.filter(observer=>root.contains(observer.element));
const animationsWithin = (env,root) => env.document.animations.filter(animation=>root.contains(animation.target));

test('two closing regions have one heading each, unique IDs and compact default visibility',()=>{
  const host=allElements(closingIndexMarkup+closingStartMarkup),ids=host.querySelectorAll('[id]').map(node=>node.id);
  assert.equal(new Set(ids).size,ids.length);
  assert.deepEqual(host.querySelectorAll('h2').map(node=>node.textContent),['找到需要的工具','开始使用']);
  for (const id of ['toolkit','api','faq','learning']) assert.equal(host.querySelectorAll('#'+id).length,1);
  assert.equal(host.querySelectorAll('#inside-ae').length,0,'the original introduction owns this anchor');
  assert(!host.querySelector('[data-catalog-query]').closest('details'),'search stays on the first layer');
  for (const selector of ['[data-closing-learning]','[data-closing-api]','[data-closing-more-faq]']) assert.equal(host.querySelector(selector).open,false);
  assert.equal(host.querySelectorAll('[data-closing-question]').filter(node=>!node.parentElement.closest('[data-closing-more-faq]')).length,4);
  assert.equal(host.querySelectorAll('input[type="range"]').length,0);
  assert(!/data-api-play|data-reuse-play|iframe/.test(closingIndexMarkup));
});

test('learning retains all five tasks and all sixteen exact reading destinations',()=>{
  const host=allElements(closingIndexMarkup),detail=host.querySelector('[data-closing-learning]');
  assert.equal(detail.querySelectorAll('[data-guide-path]').length,5);
  assert.equal(detail.querySelectorAll('[data-guide-reading]').length,16);
  for (const path of guidePaths) assert.deepEqual(detail.querySelector('[data-guide-panel="'+path.id+'"]').querySelectorAll('[data-guide-reading]').map(link=>link.href),path.steps.map(step=>step.href));
  assert.equal(detail.querySelector('[data-duik-guide]').getAttribute('aria-labelledby'),'duik-closing-learning-title');
  assert(detail.querySelector('#duik-closing-learning-title'));
});

test('FAQ preserves every question, answer, source link and grouping, with only start questions at first level',()=>{
  const host=allElements(closingStartMarkup);
  assert.equal(host.querySelectorAll('[data-closing-question]').length,11);
  for (const item of guideFaqItems) {
    const detail=host.querySelector('[data-closing-question="'+item.id+'"]');
    assert.equal(detail.querySelector('summary').textContent,textSlots[item.question]);
    assert.equal(detail.querySelector('p').textContent,textSlots[item.answer]);
    assert.equal(detail.querySelector('a').href,item.href);
    assert.equal(!!detail.parentElement.closest('[data-closing-more-faq]'),item.group!=='start');
    assert.equal(detail.open,false);
  }
  const official=host.querySelector('[target="_blank"]');
  assert.equal(official.href,'https://rxlaboratory.org/tools/duik-angela/');assert.equal(official.getAttribute('rel'),'noopener noreferrer');
});

test('all local links resolve, catalog screenshots are absent and retained API images reserve dimensions',async()=>{
  const host=allElements(closingIndexMarkup+closingStartMarkup);
  const links=new Set([...host.querySelectorAll('a').map(node=>node.href),...tools.map(tool=>tool.href),...apiExamples.map(example=>example.href)].filter(href=>href.startsWith('/docs')));
  for (const href of links) {
    const relative=href.replace(/^\/docs\/?/,'')||'index';
    assert(await Promise.any([relative+'.mdx',relative+'/index.mdx'].map(path=>access(new URL('../content/docs/'+path,import.meta.url)).then(()=>true))).catch(()=>false),'missing '+href);
  }
  for (const image of host.querySelectorAll('img')) assert(image.hasAttribute('width')&&image.hasAttribute('height'),'intrinsic dimensions remain in source');
  const catalog=host.querySelector('[data-duik-catalog]');
  assert(catalog.querySelector('[data-catalog-banner-svg]'));
  assert(catalog.querySelectorAll('img').every(image=>image.src.startsWith('/duik-experience/icons/')),'only category icons remain, not official panel screenshots');
  assert.equal(catalog.querySelectorAll('[data-catalog-reference],[data-catalog-image]').length,0);
  assert.match(closingIndexMarkup,/功能关系示意，不执行 AE 操作/);
  assert.match(closingIndexMarkup,/DuAEF\.init\(\)/);assert.match(closingIndexMarkup,/DuAEF\.enterRunTime\(\)/);
});

test('real catalog keeps eight panels, all 33 results, search and keyboard document selection',()=>{
  const env=fixture(),cleanup=mountClosingIndex(env.host),root=env.host.querySelector('[data-closing-index]');
  assert.deepEqual(root.querySelectorAll('.duik-catalog-categories button').map(node=>node.dataset.catalogPanel),panels.map(panel=>panel.id));
  const banner=root.querySelector('[data-catalog-banner]');
  for(const panel of panels){
    root.querySelector('[data-catalog-panel="'+panel.id+'"]').click();
    assert.equal(banner.dataset.catalogBannerActive,panel.id);
    assert.deepEqual(banner.querySelectorAll('[data-catalog-banner-scene]').filter(scene=>!scene.hidden).map(scene=>scene.dataset.catalogBannerScene),[panel.id]);
  }
  root.querySelector('[data-catalog-panel="all"]').click();
  assert.equal(banner.dataset.catalogBannerActive,'all');
  assert.deepEqual(root.querySelectorAll('[data-catalog-result]').map(link=>link.href).sort(),tools.map(tool=>tool.href).sort());
  const input=root.querySelector('[data-catalog-query]');input.value='wiggle';input.fire('input');
  assert(root.querySelectorAll('[data-catalog-result]').length>0);assert(root.querySelectorAll('[data-catalog-result]').length<33);
  input.fire('keydown',{key:'ArrowDown'});assert(env.document.activeElement.hasAttribute('data-catalog-result'));
  input.fire('keydown',{key:'Escape'});assert.equal(input.value,'');assert.equal(root.querySelectorAll('[data-catalog-result]').length,33);
  cleanup();input.value='no-match';input.fire('input');assert.equal(root.querySelectorAll('[data-catalog-result]').length,33,'disposed catalog listeners do not run');
});

test('closed details mount no demonstration, and learning is mounted only while expanded',()=>{
  const env=fixture(),cleanup=mountClosingIndex(env.host),detail=env.host.querySelector('[data-closing-learning]');
  const banner=env.host.querySelector('[data-catalog-banner]');
  assert.equal(observersWithin(env,banner).length,1,'first-layer banner mounts independently of closed details');
  assert.equal(observersWithin(env,detail).length,0);assert.equal(animationsWithin(env,detail).length,0);assert.equal(env.frames.size,0);
  const tab=detail.querySelector('[data-guide-path="rig"]');tab.click();assert.equal(tab.getAttribute('aria-selected'),'false','closed secondary tools have no handlers');
  detail.open=true;detail.fire('toggle');assert.equal(detail.dataset.closingMounted,'true');assert.equal(observersWithin(env,detail).length,1);
  const observer=observersWithin(env,detail)[0];
  observer.notify();tab.fire('click',{detail:1});assert.equal(tab.getAttribute('aria-selected'),'true');assert.equal(animationsWithin(env,detail).length,1);
  detail.open=false;detail.fire('toggle');assert.equal(detail.dataset.closingMounted,'false');assert.equal(observer.disconnected,true);assert.equal(animationsWithin(env,detail)[0].playState,'idle');
  const next=detail.querySelector('[data-guide-path="animation"]');next.click();assert.equal(next.getAttribute('aria-selected'),'false');
  detail.open=true;detail.fire('toggle');assert.equal(observersWithin(env,detail).length,2);next.click();assert.equal(next.getAttribute('aria-selected'),'true');
  cleanup();assert.equal(observersWithin(env,detail)[1].disconnected,true);detail.fire('toggle');assert.equal(observersWithin(env,detail).length,2);
  assert.equal(observersWithin(env,banner)[0].disconnected,true);assert(animationsWithin(env,banner).every(animation=>animation.playState==='idle'));
});

test('API defaults closed, preserves three real examples and releases RAF/WAAPI on close',()=>{
  const env=fixture(),cleanup=mountClosingIndex(env.host),detail=env.host.querySelector('[data-closing-api]');
  assert.equal(detail.querySelectorAll('[data-api-example]').length,3);assert.equal(env.frames.size,0);
  detail.open=true;detail.fire('toggle');const observer=observersWithin(env,detail)[0];observer.notify();assert(env.frames.size>0);
  for (const example of apiExamples) {
    detail.querySelector('[data-api-example="'+example.id+'"]').click();
    assert.equal(detail.querySelector('[data-api-call]').textContent,example.call);
    assert.equal(detail.querySelector('[data-api-code]').textContent,example.call);
    assert.equal(detail.querySelector('[data-api-source]').href,example.href);
  }
  const stale=[...env.frames.values()][0];detail.open=false;detail.fire('toggle');
  assert.equal(observer.disconnected,true);assert.equal(env.frames.size,0);assert(animationsWithin(env,detail).every(animation=>animation.playState==='idle'));
  detail.open=true;detail.fire('toggle');observersWithin(env,detail)[1].notify();const position=detail.querySelector('[data-duik-api]').dataset.apiPosition;
  stale();observer.notify();assert.equal(detail.querySelector('[data-duik-api]').dataset.apiPosition,position);
  cleanup();assert.equal(env.frames.size,0);assert(env.observers.every(item=>item.disconnected));
});

test('initial API hash opens the disclosure, mounts once and focuses its native summary',()=>{
  const env=fixture('#api'),cleanup=mountClosingIndex(env.host),detail=env.host.querySelector('#api');
  assert.equal(detail.open,true);assert.equal(detail.dataset.closingMounted,'true');assert.equal(observersWithin(env,detail).length,1);
  detail.fire('toggle');assert.equal(observersWithin(env,detail).length,1,'native toggle after hash reveal does not remount');
  env.tick();assert.equal(env.document.activeElement,detail.querySelector('summary'));assert.equal(env.document.scrolls.at(-1).target,detail);
  assert.equal(mountClosingIndex(env.host),cleanup,'repeat mounting returns the same cleanup');cleanup();
});

test('same-hash clicks reopen the API, modified clicks stay native and closing cancels pending focus',()=>{
  const env=fixture('#api'),cleanup=mountClosingIndex(env.host),detail=env.host.querySelector('#api');env.tick();
  detail.open=false;detail.fire('toggle');const link=new Element({tagName:'a',attrs:[{name:'href',value:'#api'}]},env.document);link.parentElement=env.document;
  link.fire('click',{ctrlKey:true});assert.equal(detail.open,false);
  link.fire('click');assert.equal(detail.open,true);assert.equal(observersWithin(env,detail).length,2);
  const before=env.document.scrolls.length;detail.open=false;detail.fire('toggle');env.tick();assert.equal(env.document.scrolls.length,before,'a closed destination must not steal focus');
  cleanup();link.click();assert.equal(detail.open,false,'cleaned-up global links do not reopen the section');
});

test('nested FAQ hash expands the extra questions and focuses the actual answer summary',()=>{
  const env=fixture('#faq-artwork'),cleanup=mountClosingStart(env.host),detail=env.host.querySelector('#faq-artwork');
  assert.equal(detail.open,true);assert.equal(env.host.querySelector('[data-closing-more-faq]').open,true);env.tick();
  assert.equal(env.document.activeElement,detail.querySelector('summary'));assert.equal(mountClosingStart(env.host),cleanup);
  cleanup();env.changeHash('#faq-handoff');assert.equal(env.host.querySelector('#faq-handoff').open,false);
});

test('hash navigation handles learning and root anchors, ignores external paths and rejects stale focus',()=>{
  const env=fixture(),cleanup=mountClosingIndex(env.host);
  env.changeHash('#learning');env.tick();assert.equal(env.host.querySelector('#learning').open,true);assert.equal(env.document.activeElement.id,'duik-closing-learning-title');
  env.changeHash('#toolkit');env.tick();assert.equal(env.document.activeElement.id,'toolkit');assert.equal(env.document.activeElement.getAttribute('tabindex'),'-1');
  const count=env.document.scrolls.length;env.changeHash('#%broken');env.tick();assert.equal(env.document.scrolls.length,count);
  env.changeHash('#api');const pending=[...env.frames.values()].at(-1);cleanup();pending?.();assert.equal(env.document.scrolls.length,count);
  assert.equal(env.frames.size,0);
  const remount=mountClosingIndex(env.host);const current=env.host.querySelector('#api').dataset.closingMounted;cleanup();assert.equal(env.host.querySelector('#api').dataset.closingMounted,current);remount();
});

test('reduced motion keeps expanded API readable without automatic RAF playback',()=>{
  const env=fixture('#api');env.preference.matches=true;const cleanup=mountClosingIndex(env.host);env.tick();observersWithin(env,env.host.querySelector('#api'))[0].notify();
  assert.equal(env.frames.size,0);assert.equal(env.host.querySelector('[data-duik-api]').dataset.apiPlaying,'false');
  env.host.querySelector('[data-api-example="wiggle"]').click();assert.match(env.host.querySelector('[data-api-call]').textContent,/wiggle/);
  cleanup();
});

test('styles stay scoped, flatten reused shells and retain explicit narrow-screen/reduced-motion rules',async()=>{
  const css=await readFile(new URL('../components/home/landing/closing-summary.css',import.meta.url),'utf8');
  const {parse}=await import('postcss');parse(css).walkRules(rule=>{for(const selector of rule.selectors)assert(selector.startsWith('.duik-closing'),'unscoped '+selector);});
  assert.match(css,/\.duik-closing \.duik-guide-learning[^}]*padding:0[^}]*background:transparent/);
  assert.match(css,/\.duik-closing \.duik-api-cinema\{[^}]*padding:0/);
  assert.match(css,/@media\(max-width:700px\)/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert(!/position:fixed|100vh|animation:|box-shadow|backdrop-filter/.test(css));
});
