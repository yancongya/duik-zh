// Source/DOM-contract tests only. Actual shared-page browser acceptance belongs to the integration owner.
import test from 'node:test';
import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {parseFragment} from 'parse5';
import {learningMarkup, faqMarkup, footerMarkup, guidePaths, guideTaskIcons, guideFaqItems, guideFaqGroups, guideAssetSources, renderGuide, mountGuide} from '../components/home/landing/guide-experience.mjs';
import {textSlots} from '../components/home/landing/content.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const markups = {learning:learningMarkup, faq:faqMarkup, footer:footerMarkup};
function elements(markup) {
  const nodes = [];
  const walk = node => {
    if(node.tagName) nodes.push({tag:node.tagName, attrs:Object.fromEntries(node.attrs.map(attr=>[attr.name,attr.value]))});
    node.childNodes?.forEach(walk);
  };
  walk(parseFragment(markup));
  return nodes;
}

class FixtureNode {
  constructor(source, document) {
    this.attrs = Object.fromEntries((source.attrs || []).map(attr=>[attr.name,attr.value]));
    this.ownerDocument = document;
    this.dataset = Object.fromEntries(Object.entries(this.attrs).filter(([key])=>key.startsWith('data-')).map(([key,value])=>[key.slice(5).replace(/-([a-z])/g,(_,letter)=>letter.toUpperCase()),value]));
    this.children = (source.childNodes || []).map(child=>new FixtureNode(child,document));
    this.hidden = Object.hasOwn(this.attrs,'hidden');
    this.open = Object.hasOwn(this.attrs,'open');
    this.tabIndex = Number(this.attrs.tabindex || 0);
    this._text = source.value || '';
    this.listeners = new Map();
  }
  matches(selector) {
    const match = selector.match(/^\[([^=\]]+)(?:="([^"]*)")?\]$/);
    return !!match && Object.hasOwn(this.attrs,match[1]) && (match[2] === undefined || this.attrs[match[1]] === match[2]);
  }
  querySelectorAll(selector) {
    return this.children.flatMap(child=>[...(child.matches(selector) ? [child] : []),...child.querySelectorAll(selector)]);
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  setAttribute(key,value) { this.attrs[key]=String(value); }
  getAttribute(key) { return this.attrs[key]; }
  addEventListener(key,callback) { if(!this.listeners.has(key))this.listeners.set(key,new Set());this.listeners.get(key).add(callback); }
  removeEventListener(key,callback) { this.listeners.get(key)?.delete(callback); }
  focus() { this.ownerDocument.activeElement=this; }
  emit(type,props={}) { const event={defaultPrevented:false,preventDefault(){this.defaultPrevented=true;},...props};for(const callback of this.listeners.get(type)||[])callback(event);return event; }
  set textContent(value) { this._text=value;this.children=[]; }
  get textContent() { return this._text+this.children.map(child=>child.textContent).join(''); }
}
function fixture(kind, view={}) {
  const document={defaultView:view,activeElement:null};
  const host=new FixtureNode(parseFragment(markups[kind]),document);
  return {host,document,root:host.querySelector(`[data-duik-guide="${kind}"]`)};
}

test('SSR markup is deterministic, has no browser import dependency and rejects unknown surfaces',()=>{
  assert.equal(typeof document,'undefined');
  for(const [kind,markup] of Object.entries(markups)){assert.equal(renderGuide(kind),markup);assert.equal(renderGuide(kind),renderGuide(kind));assert(!markup.includes('undefined'));assert(!markup.includes('<script'));assert.equal(typeof mountGuide(null,kind),'function');}
  assert.throws(()=>renderGuide('unknown'),/Unknown/);
  assert.throws(()=>mountGuide(null,'unknown'),/Unknown/);
});

test('learning offers five concrete tasks with linked tabs and 16 real reading entries',()=>{
  assert.deepEqual(guidePaths.map(path=>path.id),['install','rig','animation','tools','api']);
  assert.equal(guidePaths.flatMap(path=>path.steps).length,16);
  const toolsPath=guidePaths.find(path=>path.id==='tools');
  assert.equal(toolsPath.steps.length,4);
  assert.deepEqual(toolsPath.steps.map(step=>step.href),['/docs/guide/tools/composition/crop','/docs/guide/tools/layers','/docs/guide/tools/text/rename','/docs/guide/tools/scripting/script-editor']);
  const rigPath=guidePaths.find(path=>path.id==='rig');
  assert.match(rigPath.description,/骨骼结构/);assert.match(rigPath.steps[0].detail,/OCO 预设骨架/);
  assert.equal(rigPath.steps[1].title,'链接图形（Link Art）');
  const nodes=elements(learningMarkup),tabs=nodes.filter(node=>node.attrs.role==='tab'),panels=nodes.filter(node=>node.attrs.role==='tabpanel');
  assert.equal(tabs.length,5);assert.equal(panels.length,5);
  assert.equal(tabs.filter(node=>node.attrs['aria-selected']==='true').length,1);
  assert.equal(panels.filter(node=>!Object.hasOwn(node.attrs,'hidden')).length,1);
  for(const tab of tabs)assert(panels.some(panel=>panel.attrs.id===tab.attrs['aria-controls'] && panel.attrs['aria-labelledby']===tab.attrs.id));
  assert.match(learningMarkup,/Duik Angela\.jsx/);assert.match(learningMarkup,/Window 菜单/);assert.match(learningMarkup,/Install ScriptUI Panel/);
});

test('learning promotes one next document per task and preserves all ordered onward routes',()=>{
  const {root:surface}=fixture('learning');
  assert.equal(surface.querySelectorAll('[data-guide-next]').length,5);
  assert.equal(surface.querySelectorAll('[data-guide-reading]').length,16);
  assert.equal(surface.querySelectorAll('[data-guide-route]').length,5);
  for(const path of guidePaths){
    const panel=surface.querySelector('[data-guide-panel="'+path.id+'"]');
    const next=panel.querySelector('[data-guide-next]');
    const route=panel.querySelector('[data-guide-route]');
    assert.equal(next.getAttribute('href'),path.steps[0].href);
    assert(next.textContent.includes(path.steps[0].title));
    assert.deepEqual(panel.querySelectorAll('[data-guide-reading]').map(link=>link.getAttribute('href')),path.steps.map(step=>step.href));
    assert.equal(route.querySelectorAll('[data-guide-reading]').length,path.steps.length-1);
    assert.equal(!!route.querySelector('[start="2"]'),!path.choices);
    assert.match(route.textContent,path.choices ? /或直接查看/ : /接着阅读/);
  }
  assert(!learningMarkup.includes('duik-guide-path-drawing'));
  assert(!learningMarkup.includes('duik-guide-path-overview'));
});

test('all local documentation links resolve and ids remain unique across the three surfaces',async()=>{
  const nodes=elements(Object.values(markups).join('')),ids=nodes.map(node=>node.attrs.id).filter(Boolean);
  assert.equal(new Set(ids).size,ids.length);
  const paths=[...new Set(nodes.map(node=>node.attrs.href).filter(href=>href?.startsWith('/docs')))];
  for(const path of paths){const local=path.slice('/docs'.length)||'/index';const candidates=[join(root,'content/docs',local+'.mdx'),join(root,'content/docs',local,'index.mdx')];assert(await Promise.any(candidates.map(candidate=>access(candidate).then(()=>true))).catch(()=>false),`Missing route ${path}`);}
});

test('learning uses compact official task markers and open reading routes instead of repeated wall covers',async()=>{
  const nodes=elements(learningMarkup);
  const tabs=nodes.find(node=>node.attrs.role==='tablist');
  assert.equal(tabs.attrs['aria-orientation'],'horizontal');
  assert.equal(nodes.filter(node=>node.attrs.class==='duik-guide-task-icon').length,5);
  assert.equal(nodes.filter(node=>node.attrs.class==='duik-guide-reading-spread').length,5);
  assert.equal(nodes.filter(node=>node.attrs['data-guide-next']!==undefined).length,5);
  assert.equal(nodes.filter(node=>node.attrs['data-guide-reading']!==undefined).length,16);
  const officialIcons=JSON.parse(await readFile(join(root,'components/home/landing/icons/sources.json'),'utf8'));
  for(const path of guidePaths){
    const file=guideTaskIcons[path.id]+'.svg';
    assert(officialIcons.files[file],`Unattributed task icon: ${file}`);
    await access(join(root,'components/home/landing/icons',file));
    assert(learningMarkup.includes('/duik-experience/icons/'+file));
  }
  const images=nodes.filter(node=>node.tag==='img');
  assert.equal(images.length,6,'five task markers and the optional official installation screenshot');
  assert(images.filter(node=>node.attrs.class==='duik-guide-task-icon').every(node=>node.attrs.width==='24'&&node.attrs.height==='24'&&node.attrs.alt===''));
  assert(!learningMarkup.includes('/wall/'));
  assert(!learningMarkup.includes('duik-guide-task-cover'));
  assert(!learningMarkup.includes('duik-guide-next-media'));
  assert(!learningMarkup.includes('duik-guide-route-media'));
  assert(!learningMarkup.includes('插画用于学习路线示意'));
});

test('FAQ retains all eleven source answers in three meaningful groups using native details',()=>{
  assert.equal(guideFaqItems.length,11);assert.equal(guideFaqGroups.length,3);
  const nodes=elements(faqMarkup);assert.equal(nodes.filter(node=>node.tag==='details').length,11);assert.equal(nodes.filter(node=>node.tag==='summary').length,11);
  for(const item of guideFaqItems){assert(faqMarkup.includes(textSlots[item.question]));assert(faqMarkup.includes(textSlots[item.answer]));assert(faqMarkup.includes(`href="${item.href}"`));}
  assert.deepEqual(guideFaqGroups.map(group=>guideFaqItems.filter(item=>item.group===group.id).length),[4,3,4]);
});

test('official installation visual is local, attributed and not a generated mock panel',async()=>{
  assert.equal(guideAssetSources.length,1);
  await access(join(root,guideAssetSources[0].file));
  assert.match(guideAssetSources[0].source,/src-docs\/docs\/img/);
  assert.equal(guideAssetSources[0].license,'GFDL-1.3');
  assert.match(learningMarkup,/官方 Duik 主页面板/);
  const {root:surface}=fixture('learning'),reference=surface.querySelector('[data-guide-reference]');
  assert(reference);assert.equal(reference.open,false);
  const screenshot=reference.querySelector('[src]');
  assert.equal(screenshot.getAttribute('width'),'292');assert.equal(screenshot.getAttribute('height'),'529');
  assert.equal(screenshot.getAttribute('src'),guideAssetSources[0].src);
  assert(reference.textContent.includes(guideAssetSources[0].credit));
  assert(reference.querySelector('[href="/docs/misc/doc-license"]'));
  const images=elements(Object.values(markups).join('')).filter(node=>node.tag==='img');
  assert(images.every(image=>image.attrs.src.startsWith('/')));
});

test('footer preserves non-official identity, license boundaries and safe official links',()=>{
  assert.match(footerMarkup,/非官方中文文档站/);assert.match(footerMarkup,/不代表 RxLaboratory/);assert.match(footerMarkup,/不提供安装包镜像/);assert.match(footerMarkup,/GPLv3/);assert.match(footerMarkup,/GFDL 1\.3/);assert.match(footerMarkup,/Duduf/);
  const external=elements(footerMarkup).filter(node=>node.tag==='a' && node.attrs.href?.startsWith('https:'));
  assert.equal(external.length,3);
  for(const link of external){assert.equal(link.attrs.target,'_blank');assert.match(link.attrs.rel,/noopener noreferrer/);}
});

test('closing leads with four unanswered starter questions and one installation action',()=>{
  const {root:surface}=fixture('faq');
  const groups=surface.querySelectorAll('[data-guide-faq-group]');
  assert.deepEqual(groups.filter(group=>!group.hidden).map(group=>group.dataset.guideFaqGroup),['start']);
  assert.equal(groups[0].querySelectorAll('[data-guide-faq-item]').length,4);
  assert(surface.querySelectorAll('[data-guide-faq-item]').every(item=>!item.open));
  assert.equal(surface.querySelectorAll('[data-guide-faq-item]').length,11);
  const primary=elements(footerMarkup).filter(node=>node.attrs.class==='duik-guide-primary-link');
  assert.equal(primary.length,1);assert.equal(primary[0].attrs.href,'/docs/getting-started/install');
  assert(!footerMarkup.includes('duik-guide-end-drawing'));
});

test('learning supports clicks, arrow/Home/End focus, idempotent mount and clean remount',()=>{
  const {host,document,root:surface}=fixture('learning');
  const tabs=surface.querySelectorAll('[data-guide-path]'),panels=surface.querySelectorAll('[data-guide-panel]');
  const cleanup=mountGuide(host,'learning');assert.equal(mountGuide(host,'learning'),cleanup);
  tabs[3].emit('click');assert.equal(tabs[3].getAttribute('aria-selected'),'true');assert.equal(panels[3].hidden,false);assert.equal(panels.filter(panel=>!panel.hidden).length,1);
  assert(tabs[3].emit('keydown',{key:'ArrowDown'}).defaultPrevented);assert.equal(document.activeElement,tabs[4]);
  tabs[4].emit('keydown',{key:'ArrowRight'});assert.equal(document.activeElement,tabs[0]);
  tabs[0].emit('keydown',{key:'End'});assert.equal(document.activeElement,tabs[4]);
  tabs[4].emit('keydown',{key:'Home'});assert.equal(document.activeElement,tabs[0]);
  cleanup();tabs[2].emit('click');assert.equal(panels[0].hidden,false);
  const next=mountGuide(host,'learning');cleanup();assert.equal(mountGuide(host,'learning'),next);tabs[2].emit('click');assert.equal(panels[2].hidden,false);next();
});

function learningMotionFixture() {
  const eventTarget=()=>{
    const handlers=new Map();
    return {handlers,addEventListener(type,handler){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(handler);},removeEventListener(type,handler){handlers.get(type)?.delete(handler);},emit(type){for(const handler of handlers.get(type)||[])handler();}};
  };
  const media={...eventTarget(),matches:false},observers=[],animations=[];
  const view={matchMedia:()=>media,getComputedStyle:()=>({getPropertyValue:()=>'cubic-bezier(.23,1,.32,1)'}),IntersectionObserver:class {
    constructor(callback){this.callback=callback;this.disconnected=false;observers.push(this);}
    observe(target){this.target=target;}
    disconnect(){this.disconnected=true;}
  }};
  const result=fixture('learning',view);
  Object.assign(result.document,eventTarget(),{hidden:false});
  for(const panel of result.root.querySelectorAll('[data-guide-panel]')) panel.animate=(frames,options)=>{
    const animation={panel,frames,options,cancelled:false,cancel(){this.cancelled=true;}};
    animations.push(animation);return animation;
  };
  return {...result,media,observers,animations,tabs:result.root.querySelectorAll('[data-guide-path]'),setVisible(value){for(const observer of observers)observer.callback([{target:observer.target,isIntersecting:value}]);}};
}

test('learning feedback is short, interruptible and pointer-only; keyboard selection remains immediate',()=>{
  const context=learningMotionFixture(),{root:surface,tabs,animations}=context;
  const cleanup=mountGuide(context.host,'learning');
  assert.equal(animations.length,0);context.setVisible(true);
  tabs[1].emit('click',{detail:1});
  assert.equal(animations.length,1);assert.equal(animations[0].options.duration,180);
  assert.equal(animations[0].frames[0].transform,'translateX(8px)');
  assert.equal(surface.dataset.guideMotion,'active');
  tabs[1].emit('click',{detail:1});assert.equal(animations.length,1);assert(animations[0].cancelled);
  tabs[0].emit('click',{detail:1});assert.equal(animations[1].frames[0].transform,'translateX(-8px)');
  tabs[2].emit('click',{detail:0});assert.equal(animations.length,2);assert(animations[1].cancelled);assert.equal(surface.dataset.guideInput,'keyboard');
  assert.equal(surface.dataset.guideActive,'animation');
  tabs[3].emit('click',{detail:1});surface.emit('focusin');assert(animations[2].cancelled);
  tabs[4].emit('click',{detail:1});surface.emit('keydown',{key:'Escape'});assert(animations[3].cancelled);assert.equal(surface.dataset.guideInput,'keyboard');
  tabs[0].emit('click',{detail:1});surface.emit('pointerdown');assert(animations[4].cancelled);
  tabs[1].emit('click',{detail:1});animations[5].onfinish();assert.equal(surface.dataset.guideMotion,'idle');
  cleanup();
});

test('learning cancels feedback offscreen, in background, on reduced motion and during cleanup without replay',()=>{
  const context=learningMotionFixture(),{root:surface,tabs,animations,document:doc,media,observers}=context;
  const cleanup=mountGuide(context.host,'learning');
  tabs[1].emit('click',{detail:1});assert.equal(animations.length,0);
  context.setVisible(true);tabs[2].emit('click',{detail:1});assert.equal(animations.length,1);
  doc.hidden=true;doc.emit('visibilitychange');assert(animations[0].cancelled);assert.equal(surface.dataset.guideMotion,'hidden');
  tabs[3].emit('click',{detail:1});assert.equal(animations.length,1);
  doc.hidden=false;doc.emit('visibilitychange');assert.equal(animations.length,1);
  tabs[4].emit('click',{detail:1});media.matches=true;media.emit('change');assert(animations[1].cancelled);assert.equal(surface.dataset.guideMotion,'reduced');
  tabs[0].emit('click',{detail:1});assert.equal(animations.length,2);
  media.matches=false;media.emit('change');assert.equal(animations.length,2);
  tabs[1].emit('click',{detail:1});context.setVisible(false);assert(animations[2].cancelled);assert.equal(surface.dataset.guideVisible,'false');
  context.setVisible(true);assert.equal(animations.length,3);
  tabs[2].emit('click',{detail:1});cleanup();cleanup();assert(animations[3].cancelled);
  assert(observers.every(observer=>observer.disconnected));assert.equal(doc.handlers.get('visibilitychange').size,0);assert.equal(media.handlers.get('change').size,0);
  tabs[4].emit('click',{detail:1});assert.equal(surface.dataset.guideActive,'animation');assert.equal(animations.length,4);
});

test('FAQ classification filters actual groups and collapse affects all native answers',()=>{
  const {host,root:surface}=fixture('faq');const cleanup=mountGuide(host,'faq');
  const filters=surface.querySelectorAll('[data-guide-faq-filter]'),groups=surface.querySelectorAll('[data-guide-faq-group]'),items=surface.querySelectorAll('[data-guide-faq-item]');
  filters[2].emit('click');assert.equal(groups[1].hidden,false);assert.equal(groups.filter(group=>!group.hidden).length,1);assert.match(surface.querySelector('[data-guide-faq-status]').textContent,/角色与项目 3/);
  filters[0].emit('click');assert(groups.every(group=>!group.hidden));
  for(const item of items)item.open=true;surface.querySelector('[data-guide-faq-collapse]').emit('click');assert(items.every(item=>!item.open));
  cleanup();filters[1].emit('click');assert(groups.every(group=>!group.hidden));
});

test('footer uses the existing Lenis host and respects reduced motion with native fallback',()=>{
  const calls=[],view={matchMedia:()=>({matches:true}),lenis:{scrollTo:(...args)=>calls.push(args)}};
  const {host,root:surface}=fixture('footer',view);const cleanup=mountGuide(host,'footer');
  assert(surface.querySelector('[data-guide-top]').emit('click').defaultPrevented);assert.deepEqual(calls,[[0,{immediate:true,force:true}]]);cleanup();
  surface.querySelector('[data-guide-top]').emit('click');assert.equal(calls.length,1);
  const nativeCalls=[],native=fixture('footer',{matchMedia:()=>({matches:false}),scrollTo:options=>nativeCalls.push(options)});mountGuide(native.host,'footer')();
  const remove=mountGuide(native.host,'footer');native.root.querySelector('[data-guide-top]').emit('click');assert.deepEqual(nativeCalls,[{top:0,behavior:'smooth'}]);remove();
});

test('CSS stays scoped, keeps hidden panels hidden and provides keyboard/reduced-motion treatment',async()=>{
  const css=await readFile(join(root,'components/home/landing/guide-experience.css'),'utf8');
  assert.match(css,/\.duik-guide \[hidden\]\{display:none!important/);assert.match(css,/:focus-visible/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/object-fit:contain/);assert(!css.includes('https://'));
  assert(!/duik-guide-(task-cover|next-media|route-media)/.test(css),'removed wall thumbnails have no stale layout rules');
  assert.match(css,/@media\(max-width:700px\).*\.duik-guide-reading-spread\{grid-template-columns:1fr/);
  assert.match(css,/@media\(max-width:1000px\).*\.duik-guide-path-tabs\{[^}]*flex-wrap:wrap/);
});
