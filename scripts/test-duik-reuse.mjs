import test from 'node:test';
import assert from 'node:assert/strict';
import {access, readFile} from 'node:fs/promises';
import {parseFragment} from 'parse5';
import {REUSE_LIBRARIES, REUSE_SAMPLES, createReuseState, updateReuseState, getReuseStep, mountReuse, reuseMarkup} from '../components/home/landing/reuse-demo.mjs';

const nodes=[];
function collect(node){
  nodes.push(node);
  for(const child of node.childNodes||[])collect(child);
}
collect(parseFragment(reuseMarkup));
const attr=(node,name)=>node.attrs?.find(item=>item.name===name)?.value;
const withAttr=name=>nodes.filter(node=>attr(node,name)!==undefined);
const repo=new URL('../',import.meta.url);
const imagePaths=[
  'duik/oco/oco_panel.png',
  'duik/animation/anim-library.png',
  'duik/tools/script-lib.png',
];

test('reuse is SSR safe and exposes the existing integration contract',()=>{
  assert.equal(typeof reuseMarkup,'string');
  assert.equal(typeof mountReuse,'function');
  assert.equal(withAttr('data-reuse-root').length,1);
  assert.throws(()=>mountReuse(null),/DOM element/);
  assert.throws(()=>mountReuse({}),/DOM element/);
  assert.match(reuseMarkup,/把做好的，留给下一次/);
  assert.equal(withAttr('data-reuse-play').length,0);
  assert.equal(withAttr('data-reuse-demo').length,0);
  assert.equal(withAttr('aria-live').length,0,'ambient cycles must not repeatedly announce every frame');
  assert.equal(nodes.filter(node=>attr(node,'role')==='status').length,0);
});

test('each library uses an actual, locally published upstream panel',async()=>{
  assert.deepEqual(REUSE_LIBRARIES.map(item=>item.id),['structure','animation','scripts']);
  for(const [index,library] of REUSE_LIBRARIES.entries()){
    assert.equal(library.image,'/duik-experience/official/'+imagePaths[index]);
    assert.equal(library.sourcePath,'src-docs/docs/img/'+imagePaths[index]);
    assert.match(library.alt,/Duik 官方文档/);
    const file=await readFile(new URL('components/home/landing/official-media/'+imagePaths[index],repo));
    assert.equal(file.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert(file.readUInt32BE(16)>100,'screenshot must have a real source width');
    assert(file.readUInt32BE(20)>100,'screenshot must have a real source height');
  }
  const officialImages=nodes.filter(node=>node.tagName==='img'&&attr(node,'src')?.startsWith('/duik-experience/official/'));
  assert.deepEqual(officialImages.map(node=>attr(node,'src')),REUSE_LIBRARIES.map(item=>item.image));
  for(const image of officialImages){
    let ancestor=image.parentNode;
    while(ancestor&&ancestor.tagName!=='details')ancestor=ancestor.parentNode;
    assert(ancestor,'official panels are secondary, not the main scene');
    assert.equal(attr(ancestor,'open'),undefined);
  }
  assert.equal(withAttr('data-reuse-zoom').length,3);
  assert.match(reuseMarkup,/界面图 © RxLaboratory · GFDL 1.3/);
});

test('three tabs start with only the structure panel visible',()=>{
  const tabs=withAttr('data-reuse-tab'),panels=withAttr('data-reuse-panel');
  assert.equal(tabs.length,3);assert.equal(panels.length,3);
  for(const [index,tab] of tabs.entries()){
    assert.equal(attr(tab,'role'),'tab');
    assert.equal(attr(tab,'aria-selected'),String(index===0));
    assert.equal(attr(tab,'tabindex'),index===0?'0':'-1');
    assert.equal(attr(panels[index],'role'),'tabpanel');
    assert.equal(attr(panels[index],'hidden')!==undefined,index!==0);
  }
});

test('every real-workflow step has its own explanation and document link',()=>{
  assert.equal(withAttr('data-reuse-step').length,9);
  for(const library of REUSE_LIBRARIES){
    assert.equal(library.steps.length,3);
    for(let index=0;index<3;index++){
      const step=getReuseStep(library.id,index);
      assert.equal(step.libraryId,library.id);assert.equal(step.index,index);
      assert(step.label&&step.title&&step.body&&step.detail);
      assert.match(step.docs,/^\/docs\//);
      step.title='mutated copy';
      assert.notEqual(getReuseStep(library.id,index).title,step.title);
    }
    for(const invalid of [-1,3,0.5,NaN,'1'])assert.throws(()=>getReuseStep(library.id,invalid),RangeError);
  }
  assert.throws(()=>getReuseStep('missing'),TypeError);
});

test('all explanation and supplementary links resolve to existing local documentation',async()=>{
  const links=new Set([
    ...REUSE_LIBRARIES.flatMap(library=>[library.docs,...library.steps.map(step=>step.docs)]),
    ...nodes.filter(node=>node.tagName==='a').map(node=>attr(node,'href')),
  ]);
  for(const link of links){
    assert.match(link,/^\/docs\//);
    const source='content/docs/'+link.replace(/^\/docs\//,'');
    const candidates=[source+'.mdx',source+'/index.mdx'];
    const found=await Promise.all(candidates.map(async path=>{try{await access(new URL(path,repo));return true;}catch{return false;}}));
    assert(found.some(Boolean),'missing documentation source for '+link);
  }
});

test('original screenshot enlargement has accessible controls and no duplicated character',()=>{
  assert.equal(nodes.filter(node=>node.tagName==='dialog').length,1);
  assert.equal(withAttr('data-reuse-dialog-scale').length,1);
  assert.equal(withAttr('data-reuse-dialog-close').length,1);
  assert.equal(withAttr('data-reuse-dialog-photo').length,1);
  assert.equal(attr(withAttr('data-reuse-dialog-photo')[0],'src'),undefined);
  for(const button of nodes.filter(node=>node.tagName==='button'))assert.equal(attr(button,'type'),'button');
  assert(!/<iframe|character-rig|rig-embed|https?:\/\//.test(reuseMarkup));
  assert.match(reuseMarkup,/文件读写、脚本运行均需在 AE \/ Duik 中完成/);
});

test('mount and cleanup remain instance scoped and do not emulate AE execution',async()=>{
  const source=await readFile(new URL('components/home/landing/reuse-demo.mjs',repo),'utf8');
  assert.match(source,/new WeakMap\(\)/);
  assert.match(source,/lifetime\.abort\(\)/);
  assert.match(source,/return cleanup/);
  assert.match(source,/aria-controls/);
  assert.match(source,/aria-labelledby/);
  assert.match(source,/ArrowRight/);
  assert.match(source,/ArrowLeft/);
  assert.match(source,/opener\?\.focus/);
  assert(!/\bfetch\(|\blocalStorage\b|\beval\(|new Function\(/.test(source));
});

test('styling stays local, preserves panel colors and prevents hidden panels from leaking',async()=>{
  const css=await readFile(new URL('components/home/landing/reuse-demo.css',repo),'utf8');
  assert.match(css,/\.duik-reuse-workbench \[hidden\] \{ display: none !important; \}/);
  assert.match(css,/object-fit: contain/);
  assert.match(css,/focus-visible/);
  assert.match(css,/prefers-reduced-motion/);
  assert(!/filter:\s*(?:invert|grayscale)|mix-blend-mode/.test(css));
  const {parse}=await import('postcss');
  const ast=parse(css);
  ast.walkRules(rule=>{
    for(const selector of rule.selectors)assert(selector.trim().startsWith('.duik-reuse-'),'unscoped selector: '+selector);
  });
});


test('the spatial stage uses only approved local character captures and real code snippets',async()=>{
  const manifest=JSON.parse(await readFile(new URL('public/duik-landing-assets/manifest.json',repo),'utf8'));
  assert.equal(manifest.sourceSha256,'fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a');
  const sourceUrls=new Set(manifest.scenes.map(scene=>scene.url));
  for(const [id,samples]of Object.entries(REUSE_SAMPLES)){
    assert.equal(samples.length,2);assert(Object.isFrozen(samples));
    for(const sample of samples){
      assert(Object.isFrozen(sample));
      for(const url of [sample.image,...(sample.frames||[])].filter(Boolean)){
        assert(sourceUrls.has(url),'scene not in the approved capture manifest: '+url);
        const file=await readFile(new URL('public'+url,repo));
        assert.equal(file.toString('ascii',0,4),'RIFF');assert.equal(file.toString('ascii',8,12),'WEBP');
      }
      if(id==='scripts'){assert.match(sample.code,/初始化 Duik API/);assert.match(sample.call,/^Duik\.(Rig\.arm|Automation\.wiggle)\(\);$/);}
      if(id==='animation'){assert.equal(sample.frames.length,3);assert(Object.isFrozen(sample.frames));}
    }
  }
  assert.equal(withAttr('data-reuse-stage').length,3);
  assert.equal(withAttr('data-reuse-select').length,6);
  assert.equal(withAttr('data-reuse-use').length,6);
  assert.equal(withAttr('data-reuse-save').length,3);
  assert.equal(withAttr('data-reuse-frame').length,3);
  assert.equal(nodes.filter(node=>attr(node,'type')==='range').length,0,'storyboards are discrete selections, not a playback scrubber');
  assert.deepEqual(withAttr('data-reuse-frame').map(node=>[node.tagName,attr(node,'data-reuse-frame'),attr(node,'aria-pressed')]),[['button','0','true'],['button','1','false'],['button','2','false']]);
  assert.equal(attr(withAttr('data-reuse-frame')[0].parentNode,'role'),'group');
  assert.match(attr(withAttr('data-reuse-frame')[0].parentNode,'aria-label'),/待存入/);
  assert.match(reuseMarkup,/原理演示/);assert.match(reuseMarkup,/这里只保存网页示例/);
});

test('select, save, retrieve and reset form a complete immutable in-memory cycle',()=>{
  const initial=createReuseState();
  let state=updateReuseState(initial,{type:'select',id:'separated-art'});
  assert.equal(initial.libraries.structure.selected,'upper-body');
  assert.equal(state.libraries.structure.selected,'separated-art');
  assert.equal(state.libraries.structure.applied,null,'selecting a sample must not create a received result');
  state=updateReuseState(state,{type:'save'});
  assert.deepEqual(state.libraries.structure.saved,[{id:'separated-art',frame:0}]);
  assert.deepEqual(initial.libraries.structure.saved,[]);
  state=updateReuseState(state,{type:'save'});
  assert.equal(state.libraries.structure.saved.length,1,'repeated saves update, never duplicate');
  state=updateReuseState(state,{type:'select',id:'upper-body'});
  assert.equal(state.libraries.structure.applied,null,'selecting another sample must keep the received result empty');
  state=updateReuseState(state,{type:'use',id:'separated-art'});
  assert.equal(state.libraries.structure.selected,'upper-body','retrieval must not replace the pending selection');
  assert.equal(state.libraries.structure.phase,'used');
  assert.deepEqual(state.libraries.structure.applied,{id:'separated-art',frame:0});
  state=updateReuseState(state,{type:'select',id:'upper-body'});
  assert.equal(state.libraries.structure.selected,'upper-body');
  assert.deepEqual(state.libraries.structure.applied,{id:'separated-art',frame:0},'a new draft must not erase the received result');
  assert.deepEqual(state.libraries.animation,initial.libraries.animation);
  assert.deepEqual(updateReuseState(state,{type:'reset'}),initial);
});

test('animation retrieval restores the saved storyboard frame, not the current draft',()=>{
  let state=updateReuseState(createReuseState(),{type:'tab',library:'animation'});
  state=updateReuseState(state,{type:'frame',frame:1});
  state=updateReuseState(state,{type:'save'});
  const saved=state;
  state=updateReuseState(state,{type:'select',id:'reach'});
  state=updateReuseState(state,{type:'save'});
  state=updateReuseState(state,{type:'use',id:'greeting'});
  assert.equal(state.libraries.animation.frame,0,'pending frame belongs to reach, not to the retrieved greeting');
  assert.deepEqual(state.libraries.animation.applied,{id:'greeting',frame:1});
  assert.equal(state.libraries.animation.saved.length,2);
  assert.deepEqual(saved.libraries.animation.saved,[{id:'greeting',frame:1}]);
  state=updateReuseState(state,{type:'frame',frame:2});
  state=updateReuseState(state,{type:'save'});
  assert.deepEqual(state.libraries.animation.saved.find(item=>item.id==='greeting'),{id:'greeting',frame:1});
  assert.deepEqual(state.libraries.animation.saved.find(item=>item.id==='reach'),{id:'reach',frame:2});
  assert.deepEqual(state.libraries.animation.applied,{id:'greeting',frame:1});
  assert.equal(state.libraries.animation.saved.length,2);
});

test('independent state instances and invalid events cannot leak or create synthetic assets',()=>{
  const a=createReuseState(),b=createReuseState();
  a.libraries.structure.saved.push({id:'upper-body',frame:0});
  assert.equal(b.libraries.structure.saved.length,0);
  assert.throws(()=>updateReuseState(b,{type:'use',id:'upper-body'}),/Save a sample/);
  assert.throws(()=>updateReuseState(b,{type:'select',id:'unknown'}),TypeError);
  assert.throws(()=>updateReuseState(b,{type:'tab',library:'unknown'}),TypeError);
  assert.throws(()=>updateReuseState(b,{type:'execute'}),TypeError);
  for(const frame of [-1,3,.5,NaN,'1'])assert.throws(()=>updateReuseState(b,{type:'frame',library:'animation',frame}),RangeError);
  assert.throws(()=>updateReuseState(b,{type:'frame',frame:1}),RangeError);
});

// Narrow DOM and clock adapter for deterministic mount/lifecycle regression.
// This executes production event handlers. It is not browser/layout acceptance.
class LocalTarget {
  listeners=[];
  addEventListener(type,listener,options={}){this.listeners.push({type,listener,signal:options.signal});}
  fire(type,values={}){
    const event={type,target:this,detail:1,key:'',preventDefault(){this.defaultPrevented=true;},...values};
    let target=this;
    do{for(const item of [...target.listeners])if(item.type===type&&!item.signal?.aborted)item.listener(event);target=['click','keydown','keyup','pointerdown','pointerup','pointercancel','input','focusin','focusout'].includes(type)?target.parentElement:null;}while(target);
    return event;
  }
}
class LocalElement extends LocalTarget {
  constructor(tag,document,attrs=[]){super();this.tagName=tag;this.ownerDocument=document;this.attributes=new Map(attrs.map(a=>[a.name,a.value]));this.childNodes=[];this.parentElement=null;this.style={};this.naturalWidth=1400;this.naturalHeight=1200;this._text='';this.dataset=new Proxy({}, {get:(_,key)=>this.getAttribute('data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase()))??undefined,set:(_,key,value)=>{this.setAttribute('data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase()),String(value));return true;}});}
  getAttribute(name){return this.attributes.get(name)??null;}
  setAttribute(name,value){this.attributes.set(name,String(value));}
  removeAttribute(name){this.attributes.delete(name);}
  hasAttribute(name){return this.attributes.has(name);}
  matches(selector){
    return selector.split(',').some(part=>{
      const pieces=part.trim().split(/\s+/);let current=this;
      const single=(element,pattern)=>{
        const tag=pattern.match(/^[a-z][a-z0-9-]*/i)?.[0];if(tag&&element.tagName!==tag)return false;
        for(const match of pattern.matchAll(/\.([\w-]+)/g))if(!(element.className||'').split(/\s+/).includes(match[1]))return false;
        for(const match of pattern.matchAll(/\[([^\]=]+)(?:="([^"]*)")?\]/g)){if(!element.hasAttribute(match[1])||(match[2]!==undefined&&element.getAttribute(match[1])!==match[2]))return false;}
        return true;
      };
      if(!single(current,pieces.pop()))return false;
      while(pieces.length){const parent=pieces.pop();do{current=current.parentElement;}while(current&&!single(current,parent));if(!current)return false;}
      return true;
    });
  }
  querySelectorAll(selector){const result=[];const visit=node=>{for(const child of node.childNodes){if(child.tagName!=='#text'&&child.matches(selector))result.push(child);visit(child);}};visit(this);return result;}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  closest(selector){let node=this;while(node){if(node.matches(selector))return node;node=node.parentElement;}return null;}
  contains(other){for(let node=other;node;node=node.parentElement)if(node===this)return true;return false;}
  append(child){child.parentElement=this;this.childNodes.push(child);}
  remove(){if(this.parentElement){const parent=this.parentElement;parent.childNodes=parent.childNodes.filter(child=>child!==this);this.parentElement=null;}}
  set innerHTML(html){this.childNodes=[];this._text='';for(const node of parseFragment(html).childNodes)this.append(fromParsed(node,this.ownerDocument));}
  get textContent(){return this._text+this.childNodes.map(child=>child.textContent).join('');}
  set textContent(value){this._text=String(value);this.childNodes=[];}
  focus(){this.ownerDocument.activeElement=this;this.fire('focusin');}
  showModal(){this.open=true;}
  close(){this.open=false;this.fire('close');}
  getBoundingClientRect(){const left=this.closest('[data-reuse-output]')?600:this.closest('[data-reuse-library-drop]')?300:0;return {left,top:0,right:left+160,bottom:120,width:160,height:120};}
  animate(frames,options){const record={frames,options,playState:'running',pause(){this.playState='paused';},play(){this.playState='running';},cancel(){this.playState='idle';}};this.ownerDocument.animations.push(record);return record;}
}
for(const name of ['id','className','src','href','alt','value','tabIndex'])Object.defineProperty(LocalElement.prototype,name,{get(){return this.getAttribute(name==='className'?'class':name.toLowerCase())||'';},set(value){this.setAttribute(name==='className'?'class':name.toLowerCase(),value);}});
for(const name of ['hidden','disabled','open'])Object.defineProperty(LocalElement.prototype,name,{get(){return this.hasAttribute(name);},set(value){if(value)this.setAttribute(name,'');else this.removeAttribute(name);}});
function fromParsed(node,document){const result=new LocalElement(node.tagName||'#text',document,node.attrs||[]);if(node.nodeName==='#text')result._text=node.value;for(const child of node.childNodes||[])result.append(fromParsed(child,document));return result;}
function localDOM(){
  const document=new LocalTarget();document.hidden=false;document.animations=[];
  const preference=new LocalTarget();preference.matches=false;
  const observers=[],timers=new Map();let timestamp=0,nextId=0;
  const window={AbortController,performance:{now:()=>timestamp},matchMedia:()=>preference,setTimeout(run,delay){const id=++nextId;timers.set(id,{at:timestamp+delay,run});return id;},clearTimeout(id){timers.delete(id);},IntersectionObserver:class{constructor(callback){this.callback=callback;this.disconnected=false;observers.push(this);}observe(element){this.element=element;}disconnect(){this.disconnected=true;}notify(visible,ratio=visible?1:0){this.callback([{target:this.element,isIntersecting:visible,intersectionRatio:ratio}]);}}};
  document.defaultView=window;document.createElement=tag=>new LocalElement(tag,document);
  const host=()=>{const element=new LocalElement('div',document);element.innerHTML=reuseMarkup;return element;};
  const advance=duration=>{const end=timestamp+duration;let count=0;while(true){const next=[...timers].filter(([,timer])=>timer.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;assert(++count<100,'unbounded demo loop');timestamp=next[1].at;timers.delete(next[0]);next[1].run();}timestamp=end;};
  return {document,preference,observers,timers,host,advance};
}

test('mounted selection/save/use/reset changes actual output and remains instance-local',()=>{
  const env=localDOM(),a=env.host(),b=env.host(),cleanA=mountReuse(a),cleanB=mountReuse(b);
  const root=a.querySelector('[data-reuse-root]'),panel=a.querySelector('[data-reuse-panel="structure"]');
  a.querySelector('[data-reuse-select="separated-art"]').fire('click');
  assert.equal(panel.dataset.reuseSelected,'separated-art');
  assert.equal(panel.querySelector('[data-reuse-preview]').src,REUSE_SAMPLES.structure[1].image);
  panel.querySelector('[data-reuse-save]').fire('click');
  assert.equal(panel.querySelector('[data-reuse-count]').textContent,'1 / 2');
  assert.equal(panel.querySelector('[data-reuse-save]').disabled,true);
  panel.querySelector('[data-reuse-use="separated-art"]').fire('click');
  assert.equal(panel.dataset.reusePhase,'used');
  assert.equal(panel.querySelector('[data-reuse-output-title]').textContent,'网页示例结果');
  assert.equal(panel.dataset.reuseApplied,'separated-art');
  a.querySelector('[data-reuse-select="upper-body"]').fire('click');
  assert.equal(panel.dataset.reuseSelected,'upper-body');
  assert.equal(panel.dataset.reuseApplied,'separated-art','selecting another sample must keep the received output');
  assert.equal(panel.querySelector('[data-reuse-preview]').src,REUSE_SAMPLES.structure[1].image);
  panel.querySelector('[data-reuse-save]').fire('click');
  assert.equal(panel.querySelector('[data-reuse-preview]').src,REUSE_SAMPLES.structure[1].image,'saving alone must not replace the received output');
  panel.querySelector('[data-reuse-use="upper-body"]').fire('click');
  assert.equal(panel.querySelector('[data-reuse-preview]').src,REUSE_SAMPLES.structure[0].image);
  assert.equal(b.querySelector('[data-reuse-count]').textContent,'0 / 2');
  assert.notEqual(a.querySelector('[data-reuse-tab]').id,b.querySelector('[data-reuse-tab]').id);
  panel.querySelector('[data-reuse-reset]').fire('click');assert.equal(panel.querySelector('[data-reuse-count]').textContent,'0 / 2');
  assert.equal(panel.dataset.reuseApplied,'');assert.equal(panel.querySelector('[data-reuse-output-title]').textContent,'待选预览');
  cleanA();assert.equal(root.dataset.reuseMounted,'false');
  panel.querySelector('[data-reuse-select="separated-art"]').fire('click');assert.equal(panel.dataset.reuseSelected,'upper-body');
  assert.equal(b.querySelector('[data-reuse-root]').dataset.reuseMounted,'true');cleanB();
});

test('keyboard navigation, frame restoration and native reference dialog remain usable',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host);
  host.querySelector('[data-reuse-tab="structure"]').fire('keydown',{key:'ArrowRight'});
  assert.equal(host.querySelector('[data-reuse-root]').dataset.reuseActive,'animation');
  assert.equal(env.document.activeElement.dataset.reuseTab,'animation');
  const panel=host.querySelector('[data-reuse-panel="animation"]');
  panel.querySelector('[data-reuse-frame="1"]').fire('click',{detail:0});panel.querySelector('[data-reuse-save]').fire('click');
  panel.querySelector('[data-reuse-select="reach"]').fire('click');panel.querySelector('[data-reuse-use="greeting"]').fire('click');
  assert.equal(panel.querySelector('[data-reuse-frame="0"]').getAttribute('aria-pressed'),'true');assert.equal(panel.querySelector('[data-reuse-preview]').src,REUSE_SAMPLES.animation[0].frames[1]);
  const zoom=panel.querySelector('[data-reuse-zoom]');zoom.fire('click');
  const dialog=host.querySelector('[data-reuse-dialog]');assert.equal(dialog.open,true);
  assert.equal(host.querySelector('[data-reuse-dialog-photo]').src,REUSE_LIBRARIES[1].image);
  host.querySelector('[data-reuse-dialog-scale]').fire('click');assert.equal(dialog.dataset.enlarged,'true');
  host.querySelector('[data-reuse-dialog-close]').fire('click');assert.equal(dialog.open,false);assert.equal(env.document.activeElement,zoom);
  host.querySelector('[data-reuse-tab="animation"]').fire('keydown',{key:'End'});assert.equal(host.querySelector('[data-reuse-root]').dataset.reuseActive,'scripts');
  cleanup();
});

test('pending frames and saved revisions never alter the received frame until another retrieval',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host);
  host.querySelector('[data-reuse-tab="animation"]').fire('click');
  const panel=host.querySelector('[data-reuse-panel="animation"]'),frame=value=>panel.querySelector('[data-reuse-frame="'+value+'"]');
  const output=panel.querySelector('[data-reuse-preview]'),saved=panel.querySelector('[data-reuse-use="greeting"]');
  frame(1).fire('click');panel.querySelector('[data-reuse-save]').fire('click');saved.fire('click');
  assert.equal(panel.dataset.reuseAppliedFrame,'1');assert.equal(output.src,REUSE_SAMPLES.animation[0].frames[1]);
  assert(frame(1).closest('.duik-reuse-source'),'frame controls belong to the pending source');
  frame(2).fire('click');panel.querySelector('[data-reuse-save]').fire('click');
  assert.equal(saved.querySelector('img').src,REUSE_SAMPLES.animation[0].frames[2]);
  assert.equal(saved.getAttribute('aria-pressed'),'false','a new saved revision is not the received revision');
  assert.equal(output.src,REUSE_SAMPLES.animation[0].frames[1]);
  panel.querySelector('[data-reuse-select="reach"]').fire('click');frame(1).fire('click');
  assert.equal(panel.querySelector('[data-reuse-select="reach"] img').src,REUSE_SAMPLES.animation[1].frames[1]);
  assert.equal(output.src,REUSE_SAMPLES.animation[0].frames[1],'draft playback cannot mutate the received image');
  saved.fire('click');assert.equal(output.src,REUSE_SAMPLES.animation[0].frames[2]);assert.equal(panel.dataset.reuseAppliedFrame,'2');
  assert.equal(panel.dataset.reuseSelected,'reach');assert.equal(frame(1).getAttribute('aria-pressed'),'true');
  assert.equal(panel.querySelectorAll('[data-reuse-frame][aria-pressed="true"]').length,1);
  cleanup();
});

test('received script snippets persist while selecting and saving another script',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host);
  host.querySelector('[data-reuse-tab="scripts"]').fire('click');
  const panel=host.querySelector('[data-reuse-panel="scripts"]'),code=panel.querySelector('[data-reuse-code]');
  panel.querySelector('[data-reuse-save]').fire('click');panel.querySelector('[data-reuse-use="arm-call"]').fire('click');
  panel.querySelector('[data-reuse-select="wiggle-call"]').fire('click');panel.querySelector('[data-reuse-save]').fire('click');
  assert.equal(code.textContent,REUSE_SAMPLES.scripts[0].code);
  panel.querySelector('[data-reuse-use="wiggle-call"]').fire('click');assert.equal(code.textContent,REUSE_SAMPLES.scripts[1].code);
  panel.querySelector('[data-reuse-reset]').fire('click');assert.equal(panel.dataset.reuseApplied,'');
  cleanup();
});

test('automatic entry loop pauses offscreen, resumes remaining time and yields to user state',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host),observer=env.observers[0];
  const root=host.querySelector('[data-reuse-root]'),panel=host.querySelector('[data-reuse-panel="structure"]');
  observer.notify(true);env.advance(850);
  assert.equal(panel.dataset.reusePhase,'saved');assert.equal(root.dataset.reuseDemoState,'playing');
  assert.equal(env.document.animations.length,1,'the saved sample has visible transfer feedback');
  assert.equal(env.document.animations[0].options.duration,280);
  observer.notify(false);assert.equal(root.dataset.reuseDemoState,'paused');assert.equal(env.document.animations[0].playState,'paused');
  env.advance(4000);assert.equal(panel.dataset.reusePhase,'saved');assert.equal(env.timers.size,0);
  observer.notify(true);env.advance(850);assert.equal(panel.dataset.reusePhase,'used');
  panel.querySelector('[data-reuse-select="separated-art"]').fire('click');
  env.advance(5000);assert.equal(panel.dataset.reuseSelected,'separated-art');assert.equal(panel.dataset.reusePhase,'preview');
  assert.equal(root.dataset.reuseDemoState,'playing');assert.equal(env.timers.size,1,'manual selection resumes the non-destructive illustration');
  const applied=[panel.dataset.reuseApplied,panel.dataset.reuseAppliedFrame],saved=panel.querySelector('[data-reuse-count]').textContent;
  observer.notify(false);observer.notify(true);env.advance(8000);assert.equal(panel.dataset.reuseSelected,'separated-art','resumed transfer loop must not overwrite the draft');
  assert.deepEqual([panel.dataset.reuseApplied,panel.dataset.reuseAppliedFrame],applied);assert.equal(panel.querySelector('[data-reuse-count]').textContent,saved);
  assert.equal(root.dataset.reuseDemoState,'playing');
  cleanup();assert.equal(observer.disconnected,true);assert.equal(root.querySelectorAll('.duik-reuse-transfer').length,0);
});

test('reduced motion keeps all actions functional without autoplay or transfer animations',()=>{
  const env=localDOM();env.preference.matches=true;
  const host=env.host(),cleanup=mountReuse(host);env.observers[0].notify(true);env.advance(5000);
  const panel=host.querySelector('[data-reuse-panel="structure"]');assert.equal(panel.dataset.reusePhase,'preview');assert.equal(env.timers.size,0);
  panel.querySelector('[data-reuse-save]').fire('click');panel.querySelector('[data-reuse-use="upper-body"]').fire('click');assert.equal(panel.dataset.reusePhase,'used');assert.equal(env.document.animations.length,0);assert.equal(env.timers.size,0);
  host.querySelector('[data-reuse-tab="animation"]').fire('click');
  const animation=host.querySelector('[data-reuse-panel="animation"]');animation.querySelector('[data-reuse-frame="1"]').fire('click');assert.equal(animation.dataset.reuseFrame,'1');
  animation.querySelector('[data-reuse-save]').fire('click');assert.equal(animation.querySelector('[data-reuse-count]').textContent,'1 / 2');
  cleanup();
});

test('document visibility, reduced-motion changes and remount dispose pending work',()=>{
  const env=localDOM(),host=env.host(),oldCleanup=mountReuse(host);env.observers[0].notify(true);env.advance(0);
  env.document.hidden=true;env.document.fire('visibilitychange');env.advance(4000);
  assert.equal(host.querySelector('[data-reuse-count]').textContent,'0 / 2');
  env.document.hidden=false;env.document.fire('visibilitychange');env.advance(850);assert.equal(host.querySelector('[data-reuse-count]').textContent,'1 / 2');
  env.preference.matches=true;env.preference.fire('change');assert.equal(env.timers.size,0);
  const cleanup=mountReuse(host);assert.equal(env.observers[0].disconnected,true);assert.equal(host.querySelector('[data-reuse-count]').textContent,'0 / 2');
  oldCleanup();assert.equal(host.querySelector('[data-reuse-root]').dataset.reuseMounted,'true');
  env.advance(10000);assert.equal(host.querySelector('[data-reuse-count]').textContent,'0 / 2');
  cleanup();assert.equal(env.observers[1].disconnected,true);assert.equal(env.timers.size,0);
});

test('keyboard-triggered save/use is immediate and media failure has a visible recovery',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host),panel=host.querySelector('[data-reuse-panel="structure"]');
  panel.querySelector('[data-reuse-save]').fire('click',{detail:0});panel.querySelector('[data-reuse-use="upper-body"]').fire('click',{detail:0});
  assert.equal(panel.dataset.reusePhase,'used');assert.equal(env.timers.size,0);assert.equal(env.document.animations.length,0);
  const image=panel.querySelector('[data-reuse-preview]'),message=panel.querySelector('[data-reuse-media-state]');
  image.fire('error');assert.equal(message.hidden,false);assert.match(message.textContent,/刷新页面重试/);
  image.fire('load');assert.equal(message.hidden,true);
  cleanup();
});

test('two automatic cycles run without a start button, and passive hover/focus keep them running',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host),root=host.querySelector('[data-reuse-root]'),observer=env.observers[0];
  observer.notify(true,.2);env.advance(5000);assert.equal(env.timers.size,0,'a sliver of the workbench does not start a cycle');
  observer.notify(true);env.advance(3500);assert.equal(env.document.animations.length,2);
  env.advance(3500);assert.equal(env.document.animations.length,4,'the second save/use cycle is automatic');
  root.fire('pointerenter',{pointerType:'mouse'});const count=env.document.animations.length;env.advance(5000);assert(env.document.animations.length>count,'hover is not pause');
  host.querySelector('[data-reuse-save]').focus();const focusedCount=env.document.animations.length;env.advance(5000);assert(env.document.animations.length>focusedCount,'ordinary focus is not pause');
  const stale=env.timers.values().next().value?.run;cleanup();const before=env.document.animations.length;
  stale?.();observer.notify(true);env.advance(10000);assert.equal(env.document.animations.length,before);assert.equal(env.timers.size,0);
});

test('resumed animation receipt keeps its original frame even after saving a later revision',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host),observer=env.observers[0];
  host.querySelector('[data-reuse-tab="animation"]').fire('click');
  const panel=host.querySelector('[data-reuse-panel="animation"]');
  panel.querySelector('[data-reuse-frame="1"]').fire('click');panel.querySelector('[data-reuse-save]').fire('click');panel.querySelector('[data-reuse-use="greeting"]').fire('click');
  panel.querySelector('[data-reuse-frame="2"]').fire('click');panel.querySelector('[data-reuse-save]').fire('click');
  observer.notify(true);env.advance(10000);
  assert.equal(panel.dataset.reuseFrame,'2');assert.equal(panel.dataset.reuseAppliedFrame,'1');
  assert.equal(panel.querySelector('[data-reuse-preview]').src,REUSE_SAMPLES.animation[0].frames[1]);
  assert.equal(panel.querySelector('[data-reuse-use="greeting"] img').src,REUSE_SAMPLES.animation[0].frames[2]);
  assert(env.document.animations.length>1);cleanup();
});

test('a manual storyboard choice with no receipt resumes the draft illustration without saving it',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host),observer=env.observers[0];
  observer.notify(true);host.querySelector('[data-reuse-tab="animation"]').fire('click');
  const panel=host.querySelector('[data-reuse-panel="animation"]'),frame=panel.querySelector('[data-reuse-frame="1"]');
  frame.focus();frame.fire('click',{detail:0});env.advance(10000);
  assert.equal(panel.dataset.reuseFrame,'1');assert.equal(panel.dataset.reusePhase,'preview');
  assert.equal(frame.getAttribute('aria-pressed'),'true');assert.equal(panel.dataset.reuseApplied,'');
  assert.equal(panel.querySelector('[data-reuse-count]').textContent,'0 / 2');
  assert.equal(panel.querySelector('[data-reuse-preview]').src,REUSE_SAMPLES.animation[0].frames[1]);
  assert(env.document.animations.length>=3,'a selected but unsaved draft still illustrates its preview');
  assert.equal(host.querySelector('[data-reuse-root]').dataset.reuseDemoState,'playing');
  panel.querySelector('[data-reuse-reset]').fire('click');env.advance(4000);
  assert.equal(panel.dataset.reuseFrame,'0');assert.equal(panel.dataset.reuseApplied,'');assert.equal(panel.querySelector('[data-reuse-count]').textContent,'0 / 2');
  cleanup();
});

test('held pointer and keyboard activation defer cycles, then resume after the actual operation',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host),observer=env.observers[0];
  observer.notify(true);env.advance(0);
  const root=host.querySelector('[data-reuse-root]'),panel=host.querySelector('[data-reuse-panel="structure"]');
  const select=panel.querySelector('[data-reuse-select="separated-art"]');
  select.fire('pointerdown',{pointerId:11});select.fire('pointerdown',{pointerId:12});
  env.document.fire('pointerup',{pointerId:12});env.advance(5000);
  assert.equal(panel.dataset.reusePhase,'preview');assert.equal(env.timers.size,0,'second pointer release must not release the first');
  env.document.fire('pointerup',{pointerId:11});select.fire('click');env.advance(1600);
  assert.equal(panel.dataset.reuseSelected,'separated-art');assert.equal(panel.querySelector('[data-reuse-count]').textContent,'0 / 2');
  assert.equal(env.document.animations.length,1);assert.equal(root.dataset.reuseDemoState,'playing');
  const save=panel.querySelector('[data-reuse-save]');save.fire('keydown',{key:'Enter'});save.fire('click',{detail:0});
  env.advance(5000);assert.equal(env.document.animations.length,1,'held activation retains control');
  assert.equal(panel.dataset.reusePhase,'saved');env.document.fire('keyup',{key:'Enter'});env.advance(1600);
  assert.equal(env.document.animations.length,2);assert.equal(panel.dataset.reusePhase,'saved');
  assert.equal(panel.querySelector('[data-reuse-count]').textContent,'1 / 2');assert.equal(panel.dataset.reuseApplied,'');
  select.fire('pointerdown',{pointerId:13});env.document.fire('pointercancel',{pointerId:13});
  env.advance(3400);assert.equal(root.dataset.reuseDemoState,'playing');
  cleanup();
});

test('manual transfer feedback finishes while an automatic illustration is queued',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host);env.observers[0].notify(true);
  const panel=host.querySelector('[data-reuse-panel="structure"]');
  panel.querySelector('[data-reuse-save]').fire('click');
  assert.equal(env.document.animations[0].playState,'running','resuming automatic presentation must not cancel the save feedback');
  const flight=host.querySelector('.duik-reuse-transfer');assert(flight);
  env.document.animations[0].onfinish();assert.equal(host.querySelector('.duik-reuse-transfer'),null);
  env.advance(1600);assert.equal(env.document.animations.length,2);assert.equal(panel.dataset.reusePhase,'saved');
  cleanup();
});

test('reading real references and modal evidence suspends movement until closed',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host);env.observers[0].notify(true);env.advance(850);
  const panel=host.querySelector('[data-reuse-panel="structure"]'),details=panel.querySelector('[data-reuse-reference]');
  details.open=true;details.fire('toggle');const count=env.document.animations.length;
  env.advance(5000);assert.equal(env.document.animations.length,count);assert.equal(env.timers.size,0);
  panel.querySelector('[data-reuse-zoom]').fire('click');
  details.open=false;details.fire('toggle');env.advance(5000);assert.equal(env.document.animations.length,count,'the modal remains the active reading surface');
  host.querySelector('[data-reuse-dialog]').close();env.advance(1600);
  assert.equal(env.document.animations.length,count+1,'Escape/native close resumes even when focus returns to the zoom button');
  assert.equal(panel.dataset.reusePhase,'saved');assert.equal(panel.dataset.reuseApplied,'');
  cleanup();
});

test('background cancellation releases held input without replaying stale timers on remount',()=>{
  const env=localDOM(),host=env.host(),cleanup=mountReuse(host);env.observers[0].notify(true);env.advance(0);
  const oldTimer=env.timers.values().next().value.run,panel=host.querySelector('[data-reuse-panel="structure"]');
  panel.querySelector('[data-reuse-save]').fire('pointerdown',{pointerId:5});
  env.document.hidden=true;env.document.fire('visibilitychange');env.document.hidden=false;env.document.fire('visibilitychange');
  env.advance(850);assert.equal(panel.dataset.reusePhase,'saved');
  const remount=mountReuse(host);env.observers[1].notify(true);const phase=panel.dataset.reusePhase;
  oldTimer();env.observers[0].notify(true);cleanup();assert.equal(panel.dataset.reusePhase,phase);
  assert.equal(env.timers.size,1);remount();assert.equal(env.timers.size,0);
});
