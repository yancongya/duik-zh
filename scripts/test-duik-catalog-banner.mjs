import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {readFile} from 'node:fs/promises';
import {catalogBannerKeys,catalogBannerLabels,catalogBannerMarkup,mountCatalogBanner} from '../components/home/landing/catalog-banner.mjs';
import {panels} from '../components/home/landing/tool-catalog.mjs';

class Target{
  constructor(){this.listeners=new Map();}
  addEventListener(type,fn){if(!this.listeners.has(type))this.listeners.set(type,new Set());this.listeners.get(type).add(fn);}
  removeEventListener(type,fn){this.listeners.get(type)?.delete(fn);}
  emit(type,event={}){for(const fn of this.listeners.get(type)||[])fn(event);}
}
const attribute=key=>'data-'+key.replace(/[A-Z]/g,char=>'-'+char.toLowerCase());
class Node extends Target{
  constructor(parsed,doc){
    super();this.tagName=parsed.tagName;this.ownerDocument=doc;this.attrs=new Map((parsed.attrs||[]).map(item=>[item.name,item.value]));this.children=(parsed.childNodes||[]).filter(item=>item.tagName).map(item=>new Node(item,doc));this.isConnected=true;
    this.dataset=new Proxy({},{get:(_,key)=>this.getAttribute(attribute(key)),set:(_,key,value)=>{this.setAttribute(attribute(key),value);return true;}});
  }
  matches(selector){const match=selector.match(/^\[([^=\]]+)(?:="?([^"\]]+)"?)?\]$/);return Boolean(match&&this.attrs.has(match[1])&&(match[2]===undefined||this.attrs.get(match[1])===match[2]));}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  getAttribute(name){return this.attrs.get(name)??null;}
  setAttribute(name,value){this.attrs.set(name,String(value));}
  hasAttribute(name){return this.attrs.has(name);}
  toggleAttribute(name,enabled){if(enabled)this.attrs.set(name,'');else this.attrs.delete(name);}
  getBoundingClientRect(){return this.ownerDocument.rect;}
  animate(frames,options){
    if(this.ownerDocument.failAnimate)throw Error('fixture: animation unavailable');
    const animation={target:this,frames,options,state:'running',currentTime:0,play(){this.state='running';},pause(){this.state='paused';},cancel(){this.state='canceled';}};
    this.ownerDocument.animations.push(animation);return animation;
  }
}
function fixture(){
  const doc=Object.assign(new Target(),{hidden:false,animations:[],rect:{left:0,top:0,right:1200,bottom:300,width:1200,height:300}});
  const preference=Object.assign(new Target(),{matches:false}),view=Object.assign(new Target(),{innerWidth:1200,innerHeight:900,matchMedia:()=>preference});
  const observers=[];
  view.IntersectionObserver=class{constructor(callback){this.callback=callback;observers.push(this);}observe(node){this.node=node;}disconnect(){this.disconnected=true;}deliver(entries){this.callback(entries);}};
  doc.defaultView=view;
  const root=new Node(parseFragment(catalogBannerMarkup()).childNodes[0],doc);
  const visible=ratio=>{doc.rect={left:0,top:900-300*ratio,right:1200,bottom:1200-300*ratio,width:1200,height:300};observers.at(-1)?.deliver([{target:root,isIntersecting:ratio>0,intersectionRatio:ratio}]);};
  return {root,doc,view,preference,observers,visible};
}
const visibleScenes=root=>root.querySelectorAll('[data-catalog-banner-scene]').filter(node=>!node.hasAttribute('hidden')).map(node=>node.dataset.catalogBannerScene);

test('panorama is SSR-safe and preserves the eight panels plus a complete all-tools state',()=>{
  assert.deepEqual(catalogBannerKeys,[...panels.map(panel=>panel.id),'all']);
  assert.equal(typeof document,'undefined');
  assert.doesNotThrow(()=>mountCatalogBanner(null).destroy());
  const f=fixture(),svg=f.root.querySelector('[data-catalog-banner-svg]');
  assert.equal(svg.getAttribute('viewBox'),'0 0 1200 300');
  assert.equal(svg.getAttribute('width'),'1200');assert.equal(svg.getAttribute('height'),'300');
  assert.equal(svg.getAttribute('role'),'img');
  assert.deepEqual(visibleScenes(f.root),['bones']);
  assert.match(catalogBannerMarkup(),/网页功能示意/);
  assert(!catalogBannerMarkup().includes('官方面板'));
  assert(!catalogBannerMarkup().includes('<script'));
  for(const id of catalogBannerKeys){
    const markup=catalogBannerMarkup(id),root=new Node(parseFragment(markup).childNodes[0],f.doc);
    assert.deepEqual(visibleScenes(root),[id]);
    assert.equal(root.querySelector('[data-catalog-banner-svg]').getAttribute('aria-label'),catalogBannerLabels[id]);
    assert(root.querySelectorAll('[data-catalog-motion]').every(node=>node.getAttribute('style')),'Every animation has a meaningful static pose');
  }
});

test('category changes update one visible scene immediately and cancel only its former animations',()=>{
  const f=fixture(),api=mountCatalogBanner(f.root);assert.equal(mountCatalogBanner(f.root),api);
  for(const id of catalogBannerKeys){
    const old=f.doc.animations.filter(animation=>animation.state!=='canceled');
    api.select(id);assert.deepEqual(visibleScenes(f.root),[id]);
    assert.equal(f.root.dataset.catalogBannerActive,id);
    assert.equal(f.root.querySelector('[data-catalog-banner-svg]').getAttribute('aria-label'),catalogBannerLabels[id]);
    if(id!=='bones')assert(old.every(animation=>animation.state==='canceled'));
    assert.equal(f.root.dataset.catalogBannerPlayback,'playing');
  }
  const count=f.doc.animations.length;api.select('all');assert.equal(f.doc.animations.length,count,'Typing in all-tools must not restart its illustration');
  api.select('not-a-panel');assert.equal(f.root.dataset.catalogBannerActive,'all');
  api.destroy();
});

test('visibility uses the current panorama box and stale observation geometry cannot resume it',()=>{
  const f=fixture(),api=mountCatalogBanner(f.root);
  f.visible(.64);assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  assert(f.doc.animations.every(animation=>animation.state==='paused'));
  f.visible(.65);assert.equal(f.root.dataset.catalogBannerPlayback,'playing');
  f.visible(0);
  f.observers[0].deliver([{target:f.root,isIntersecting:true,intersectionRatio:1}]);
  assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  f.visible(1);f.doc.hidden=true;f.doc.emit('visibilitychange');assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  f.doc.hidden=false;f.doc.emit('visibilitychange');assert.equal(f.root.dataset.catalogBannerPlayback,'playing');
  f.root.isConnected=false;f.view.emit('resize');assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  api.destroy();
});

test('reduced motion freezes a meaningful static scene, category changes still work',()=>{
  const f=fixture(),api=mountCatalogBanner(f.root);
  for(const animation of f.doc.animations)animation.currentTime=1200;
  f.preference.matches=true;f.preference.emit('change');
  assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  assert(f.doc.animations.every(animation=>animation.state==='paused'&&animation.currentTime===0));
  api.select('camera');assert.deepEqual(visibleScenes(f.root),['camera']);
  assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  f.preference.matches=false;f.preference.emit('change');assert.equal(f.root.dataset.catalogBannerPlayback,'playing');
  api.destroy();
});

test('BFCache suspends artwork and resumes only according to its current viewport',()=>{
  const f=fixture(),api=mountCatalogBanner(f.root);
  f.view.emit('pagehide',{persisted:true});assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  f.visible(1);assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  f.visible(0);f.view.emit('pageshow',{persisted:true});assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  f.observers[0].deliver([{target:f.root,isIntersecting:true,intersectionRatio:1}]);assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  f.visible(1);assert.equal(f.root.dataset.catalogBannerPlayback,'playing');
  api.destroy();
});

test('destroy and queued old callbacks cannot mutate a replacement instance',()=>{
  const f=fixture(),api=mountCatalogBanner(f.root);const old=f.observers[0];api.destroy();api.destroy();
  assert(f.doc.animations.every(animation=>animation.state==='canceled'));assert(old.disconnected);
  for(const target of [f.doc,f.view,f.preference])assert([...target.listeners.values()].every(list=>list.size===0));
  const replacement=mountCatalogBanner(f.root);replacement.select('tools');
  api.select('bones');api.destroy();old.deliver([{target:f.root,isIntersecting:false,intersectionRatio:0}]);
  assert.equal(f.root.dataset.catalogBannerActive,'tools');assert.equal(f.root.dataset.catalogBannerPlayback,'playing');
  assert.equal(mountCatalogBanner(f.root),replacement);
  f.view.emit('pagehide',{persisted:false});
  assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  f.view.emit('pageshow');assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
});

test('unavailable animation falls back to the selected static drawing without blocking catalog',()=>{
  const f=fixture();f.doc.failAnimate=true;const api=mountCatalogBanner(f.root);
  assert.equal(f.root.dataset.catalogBannerPlayback,'poster');
  api.select('animation');assert.deepEqual(visibleScenes(f.root),['animation']);
  assert.match(f.root.querySelector('[data-catalog-banner-scene="animation"]').querySelector('[data-catalog-motion="traveller-0"]').getAttribute('style'),/translate\(80px,224px\)/);
  api.destroy();
});

test('banner styling preserves ratio and the reading list has no transition or loop',async()=>{
  const css=await readFile(new URL('../components/home/landing/experience-catalog.css',import.meta.url),'utf8');
  assert.match(css,/\.duik-catalog-banner\{[^}]*aspect-ratio:4\/1/);
  assert.match(css,/\.duik-catalog-banner>svg\{[^}]*width:100%;height:100%/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert(!/\.duik-catalog-(?:results|group|categories)[^{]*\{[^}]*(?:animation|transition):/.test(css));
  assert(!css.includes('duik-catalog-panel-photo'));
});
