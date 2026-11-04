import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {parseFragment} from 'parse5';
import {toolsMarkup,mountTools} from '../components/home/landing/tools-demo.mjs';
import {TOOL_TABS,LOCKED_CHARACTER_SHA,CROP_CANVAS,INITIAL_MASK,CROP_INTRO_DURATION,SCENE_PARTS,LAYER_SCENE_RECORDS,TOOLS_PREVIEW_DURATION,createToolsPreview,advanceToolsPreview,sampleToolsPreview,sceneLayerRecords,sceneNames,createCropState,updateCropMask,dragCropCorner,cropGeometry,createCropIntro,advanceCropIntro,sampleCropIntro,freshTextSamples,renameSamples,replaceSamples,changedSampleCount,filterParts,SCRIPT_TASKS,escapeHTML} from '../components/home/landing/tools-model.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const manifest=JSON.parse(await readFile(join(root,'public/riglab-project/rig.json'),'utf8'));

test('SSR import has four real tool panels and no browser initialization',()=>{
  assert.equal(typeof toolsMarkup,'string');assert.equal(typeof mountTools,'function');
  assert.deepEqual(TOOL_TABS.map(t=>t.id),['layers','text','scripts','composition']);
  for(const tab of TOOL_TABS)assert(toolsMarkup.includes('data-tools-panel="'+tab.id+'"'));
  assert(toolsMarkup.includes('网页原理示意 · 不连接 AE 工程'));
  assert(!toolsMarkup.includes('<iframe'));
});
const allNodes=node=>[node,...(node.childNodes||[]).flatMap(allNodes)];
const attr=(node,name)=>node.attrs?.find(item=>item.name===name)?.value;
const has=(node,name)=>node.attrs?.some(item=>item.name===name);
const ancestor=(node,tag)=>{for(let p=node.parentNode;p;p=p.parentNode)if(p.tagName===tag)return p;return null;};
test('open comparison has one leading title and equal-coordinate reference marks',async()=>{
  const nodes=allNodes(parseFragment(toolsMarkup));
  const title=nodes.find(node=>has(node,'data-tools-title'));
  assert.equal(title.tagName,'h2');
  assert.equal(nodes.filter(node=>node.tagName==='h2').length,1);
  assert(nodes.indexOf(title)<nodes.findIndex(node=>attr(node,'role')==='tablist'));
  const marks=nodes.filter(node=>has(node,'data-comparison-reference'));
  assert.equal(marks.length,2);
  assert.deepEqual(marks.map(node=>attr(node,'transform')),['translate(380 240)','translate(380 240)']);
  const figures=nodes.filter(node=>['duik-tools-before','duik-tools-result'].includes(attr(node,'class')));
  assert.deepEqual(figures.map(node=>attr(allNodes(node).find(child=>child.tagName==='svg'),'viewBox')),['0 0 760 480','0 0 760 480']);
  const css=await readFile(join(root,'components/home/landing/tools-demo.css'),'utf8');
  assert.match(css,/\.duik-tools-comparison\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\);align-items:start/);
  assert.match(css,/\.duik-tools-shared-stage\{background:transparent;border-radius:0;overflow:visible/);
});
test('SSR leads with layer management and exposes no crop controls before hydration',()=>{
  const nodes=allNodes(parseFragment(toolsMarkup)),get=name=>nodes.find(node=>has(node,name));
  const text=node=>node.nodeName==='#text'?node.value:(node.childNodes||[]).map(text).join('');
  assert.equal(attr(get('data-tools-root'),'data-tools-current'),'layers');
  assert.equal(text(get('data-tools-title')),TOOL_TABS[0].title);
  assert.equal(text(get('data-tools-description')),TOOL_TABS[0].description);
  assert.equal(attr(get('data-tools-docs'),'href'),TOOL_TABS[0].docs);
  const tabs=nodes.filter(node=>has(node,'data-tools-tab'));
  assert.deepEqual(tabs.map(node=>attr(node,'data-tools-tab')),['layers','text','scripts','composition']);
  assert.deepEqual(tabs.filter(node=>attr(node,'aria-selected')==='true').map(node=>attr(node,'data-tools-tab')),['layers']);
  assert.deepEqual(nodes.filter(node=>has(node,'data-tools-panel')&&!has(node,'hidden')).map(node=>attr(node,'data-tools-panel')),['layers']);
  assert.deepEqual(nodes.filter(node=>has(node,'data-tools-control')&&!has(node,'hidden')).map(node=>attr(node,'data-tools-control')),['layers']);
  for(const node of nodes.filter(node=>['data-crop-handle','data-scene-crop-only','data-crop-mask','data-crop-boundary','data-parent-reference'].some(name=>has(node,name))))assert(has(node,'hidden'));
  assert(!has(get('data-scene-layer-labels'),'hidden'));assert(!has(get('data-scene-layer-identity'),'hidden'));
  assert.equal(text(get('data-scene-heading')),'名称与标记');assert.equal(text(get('data-scene-result')),'从示例名称开始');
});
test('one shared first-layer comparison replaces four unrelated workbenches',()=>{
  const nodes=allNodes(parseFragment(toolsMarkup)),panels=nodes.filter(node=>has(node,'data-tools-panel'));
  assert.equal(panels.length,4);
  const stage=nodes.filter(node=>has(node,'data-tools-stage'));assert.equal(stage.length,1);assert(!ancestor(stage[0],'details'));
  assert.equal(allNodes(stage[0]).filter(node=>node.tagName==='figure').length,2,'Original reference and operable result share a stage');
  assert.equal(nodes.filter(node=>has(node,'data-scene-piece')).length,4);
  assert.equal(allNodes(stage[0]).filter(node=>has(node,'data-scene-progress')).length,0,'Playback progress is internal, not a slider');
  assert.equal(attr(nodes.find(node=>has(node,'data-tools-root')),'data-scene-progress'),'0');
  assert(!toolsMarkup.includes('duik-tools-transport'));assert(!toolsMarkup.includes('data-tool-action="scene-reset"'));assert(!toolsMarkup.includes('data-tool-action="scene-spread"'));
  const sceneAttrs=['data-crop-input','data-tools-character-slot','data-text-rows','data-script-code'];
  panels.forEach((panel,index)=>{
    const children=allNodes(panel),scene=children.find(node=>has(node,sceneAttrs[index]));
    const reference=children.find(node=>has(node,'data-tools-reference'));
    assert(scene,'Missing operable scene '+index);assert(reference,'Missing reference '+index);
    assert(ancestor(scene,'details'),'Detailed workbenches are secondary to the shared stage');
    assert(!has(ancestor(scene,'details'),'open'));
    assert(children.indexOf(scene)<children.indexOf(reference));
    assert.equal(reference.tagName,'details');assert(!has(reference,'open'));
    assert(allNodes(reference).some(node=>attr(node,'class')==='duik-tools-attribution'));
  });
  assert.equal(nodes.filter(node=>node.tagName==='table').length,0,'Name comparison is not another data table');
  const ids=nodes.map(node=>attr(node,'id')).filter(Boolean);assert.equal(new Set(ids).size,ids.length);
  const handles=nodes.filter(node=>has(node,'data-crop-handle'));assert.equal(handles.length,4);
  for(const handle of handles){assert.equal(attr(handle,'tabindex'),'0');assert.equal(attr(handle,'role'),'button');assert(attr(handle,'aria-label').includes('方向键'));}
});
test('deterministic timeline sampling stays separate from the mounted automatic loop',()=>{
  let preview=createToolsPreview();assert.equal(preview.phase,'idle');
  assert.deepEqual(advanceToolsPreview(preview,'visible'),preview,'Visibility never starts playback');
  assert.deepEqual(advanceToolsPreview(preview,'play',{allowed:false}),preview);
  preview=advanceToolsPreview(preview,'play');preview=advanceToolsPreview(preview,'tick',{delta:900});
  const paused=advanceToolsPreview(preview,'stop');assert.equal(paused.phase,'paused');
  assert.deepEqual(advanceToolsPreview(paused,'tick',{delta:60000}),paused);
  assert.deepEqual(advanceToolsPreview(paused,'visible'),paused,'Returning to view never resumes playback');
  preview=advanceToolsPreview(paused,'play');assert.equal(preview.elapsed,900);
  preview=advanceToolsPreview(preview,'tick',{delta:TOOLS_PREVIEW_DURATION});assert.equal(preview.phase,'complete');
  assert.deepEqual(advanceToolsPreview(preview,'tick',{delta:60000}),preview);
  assert.equal(advanceToolsPreview(preview,'play').elapsed,0,'Only an explicit replay returns to the beginning');
  for(const progress of [-1,0,.48,1,2,NaN]){const manual=advanceToolsPreview(preview,'seek',{progress,allowed:false});assert.equal(manual.phase,'manual');assert(manual.elapsed>=0&&manual.elapsed<=TOOLS_PREVIEW_DURATION);}
  assert.deepEqual(advanceToolsPreview(preview,'reset'),createToolsPreview());
});
test('all tools share the before, action and result sequence without mutating source artwork',()=>{
  const before=sampleToolsPreview(createToolsPreview()),after=sampleToolsPreview({elapsed:TOOLS_PREVIEW_DURATION});
  assert.deepEqual(before,{progress:0,spread:0,step:'before',renamed:0,used:false});
  assert.deepEqual(after,{progress:1,spread:1,step:'after',renamed:4,used:true});
  assert.equal(sampleToolsPreview({elapsed:TOOLS_PREVIEW_DURATION*.5}).step,'working');
  const original=structuredClone(SCENE_PARTS),names=sceneNames('镜头_');
  assert.deepEqual(names.map(part=>part.name),['镜头_01','镜头_02','镜头_03','镜头_04']);
  assert.deepEqual(SCENE_PARTS,original);
  assert.deepEqual(names.map(part=>[part.id,part.dx,part.dy]),SCENE_PARTS.map(part=>[part.id,part.dx,part.dy]));
});
test('layer naming fixtures expose Duik metadata, not invented image recognition or AE layer types',()=>{
  const original=structuredClone(LAYER_SCENE_RECORDS);
  assert.deepEqual(LAYER_SCENE_RECORDS.map(record=>record.id),SCENE_PARTS.map(part=>part.id));
  assert(LAYER_SCENE_RECORDS.every(record=>record.type==='美术'&&record.sourceName.startsWith('Art_')));
  for(const progress of [0,.32,.5,.7,1]){
    const preview=advanceToolsPreview(createToolsPreview(),'seek',{progress}),records=sceneLayerRecords(preview);
    assert.equal(records.filter(record=>record.tagged).length,sampleToolsPreview(preview).renamed);
    for(const record of records)assert.equal(record.displayName,record.tagged?record.name:record.sourceName);
  }
  assert.deepEqual(LAYER_SCENE_RECORDS,original);
  const records=sceneLayerRecords({elapsed:TOOLS_PREVIEW_DURATION});records[0].group='不应写回';
  assert.equal(sceneLayerRecords({elapsed:TOOLS_PREVIEW_DURATION})[0].group,'片头');
});
test('layer labels and selected metadata remain inside the existing comparison figure',()=>{
  const nodes=allNodes(parseFragment(toolsMarkup)),identity=nodes.find(node=>has(node,'data-scene-layer-identity'));
  assert(identity);assert(!has(identity,'hidden'));assert.equal(ancestor(identity,'figure')?.attrs.find(item=>item.name==='class')?.value,'duik-tools-result');
  assert(!ancestor(identity,'details'));assert.equal(nodes.filter(node=>has(node,'data-scene-layer-label')).length,4);
  assert.deepEqual(allNodes(identity).filter(node=>has(node,'data-scene-layer-field')).map(node=>attr(node,'data-scene-layer-field')),['name','group','side','type']);
  assert(toolsMarkup.includes('不识别图像'));assert(toolsMarkup.includes('不复现 Duik 的命名算法'));
});
test('official images stay proportional, local, attributed and secondary',()=>{
  const nodes=allNodes(parseFragment(toolsMarkup));
  const images=nodes.filter(node=>node.tagName==='img');assert.equal(images.length,4);
  for(const image of images){
    assert(attr(image,'src').startsWith('/duik-experience/official/duik/tools/'));
    assert(Number(attr(image,'width'))>0);assert(Number(attr(image,'height'))>0);
    assert(has(ancestor(image,'details'),'data-tools-reference'));
  }
});
test('crop actually changes boundary dimensions without moving parent-space artwork',()=>{
  const before=createCropState(),after={...before,cropped:true};
  const a=cropGeometry(before),b=cropGeometry(after);
  assert.deepEqual(a.bounds,{x:0,y:0,width:640,height:400});
  assert.deepEqual(b.bounds,INITIAL_MASK);assert(b.areaSaved>0);
  assert.deepEqual(a.reference,b.reference);
  for(const point of [{x:0,y:0},{x:320,y:200},{x:400,y:116}]){
    assert.equal(a.childOrigin.x+a.contentOffset.x+point.x,b.childOrigin.x+b.contentOffset.x+point.x);
    assert.equal(a.childOrigin.y+a.contentOffset.y+point.y,b.childOrigin.y+b.contentOffset.y+point.y);
  }
});
test('dragging each crop corner changes its true geometry and preserves the opposite corner',()=>{
  const original=createCropState();
  const se=dragCropCorner(original,'se',{x:430,y:300});
  assert.deepEqual(se.mask,{x:144,y:64,width:286,height:236});
  const nw=dragCropCorner(original,'nw',{x:180,y:90});
  assert.deepEqual(nw.mask,{x:180,y:90,width:316,height:246});
  assert.equal(nw.mask.x+nw.mask.width,original.mask.x+original.mask.width);
  assert.equal(nw.mask.y+nw.mask.height,original.mask.y+original.mask.height);
  const ne=dragCropCorner(original,'ne',{x:520,y:100});
  assert.deepEqual(ne.mask,{x:144,y:100,width:376,height:236});
  const sw=dragCropCorner(original,'sw',{x:100,y:360});
  assert.deepEqual(sw.mask,{x:100,y:64,width:396,height:296});
  assert.deepEqual(original.mask,INITIAL_MASK);
});
test('crop range is finite, nonempty, constrained and resettable',()=>{
  for(const patch of [{x:-100,y:-10,width:999,height:999},{x:999,y:999,width:-8,height:-9},{x:NaN,y:Infinity,width:NaN,height:Infinity}]){
    const state=updateCropMask(createCropState(),patch),m=state.mask;
    assert(Object.values(m).every(Number.isFinite));assert(m.width>=80);assert(m.height>=64);
    assert(m.x>=0&&m.x+m.width<=CROP_CANVAS.width);assert(m.y>=0&&m.y+m.height<=CROP_CANVAS.height);
    assert.deepEqual(cropGeometry({...state,cropped:true}).reference,{x:380,y:240});
  }
  assert.deepEqual(createCropState(),{mask:{...INITIAL_MASK},cropped:false});
});
test('crop entrance plays once, pauses without time advancing, and resumes from the same model',()=>{
  let state=createCropIntro();assert.equal(state.phase,'idle');
  state=advanceCropIntro(state,'start');state=advanceCropIntro(state,'tick',700);
  assert.deepEqual(state,{phase:'running',elapsed:700});
  const paused=advanceCropIntro(state,'pause'),snapshot=sampleCropIntro(paused.elapsed);
  assert.deepEqual(advanceCropIntro(paused,'tick',60000),paused);
  state=advanceCropIntro(paused,'resume');assert.deepEqual(sampleCropIntro(state.elapsed),snapshot);
  state=advanceCropIntro(state,'tick',CROP_INTRO_DURATION);assert.equal(state.phase,'complete');
  for(const event of ['start','pause','resume','tick'])assert.deepEqual(advanceCropIntro(state,event,900),state);
});
test('pointer/focus/keyboard takeover and reduced-motion are terminal for the automatic entrance',()=>{
  for(const phase of ['idle','running','paused']){
    const state=advanceCropIntro({phase,elapsed:400},'takeover');assert.equal(state.phase,'taken-over');
    for(const event of ['start','resume','tick'])assert.deepEqual(advanceCropIntro(state,event,999),state);
    assert.deepEqual(createCropState(),{mask:{...INITIAL_MASK},cropped:false},'Manual reset does not reset the entrance state');
  }
  const reduced=createCropIntro({reducedMotion:true});assert.equal(reduced.phase,'skipped');
  assert.deepEqual(advanceCropIntro(reduced,'start'),reduced);assert.deepEqual(advanceCropIntro(reduced,'tick',999),reduced);
  const midRun=advanceCropIntro({phase:'running',elapsed:1000},'skip');assert.equal(midRun.phase,'skipped');
  assert.equal(advanceCropIntro(midRun,'resume').elapsed,1000);
});
test('entrance samples animate a real corner then crop without displacing the composition content',()=>{
  assert.deepEqual(sampleCropIntro(0),createCropState());
  assert.deepEqual(sampleCropIntro(1500).mask,{x:144,y:64,width:304,height:244});
  assert.equal(sampleCropIntro(1949).cropped,false);assert.equal(sampleCropIntro(1950).cropped,true);
  const origin={x:CROP_CANVAS.x,y:CROP_CANVAS.y};
  for(const time of [-1,0,450,1000,1500,1950,2700,60000,NaN,Infinity]){
    const model=sampleCropIntro(time),g=cropGeometry(model);
    assert(Object.values(model.mask).every(Number.isFinite));
    assert.equal(g.childOrigin.x+g.contentOffset.x,origin.x);assert.equal(g.childOrigin.y+g.contentOffset.y,origin.y);
    assert.deepEqual(g.reference,{x:380,y:240});
  }
  assert.equal(advanceCropIntro({phase:'running',elapsed:200},'tick',-500).elapsed,200);
  assert.equal(advanceCropIntro({phase:'running',elapsed:200},'tick',NaN).elapsed,200);
});
test('layer filtering uses the locked 26 PNG entries and preserves character-side labels',()=>{
  assert.equal(manifest.sourceSha256,LOCKED_CHARACTER_SHA);assert.equal(manifest.parts.length,26);
  const before=JSON.stringify(manifest.parts),left=filterParts(manifest.parts,'','左臂');
  assert.deepEqual(left.map(p=>p.id),['sleeve-l','upper-l','fore-l','hand-l']);
  assert.equal(filterParts(manifest.parts,'fore-l')[0].label,'左前臂（抬起）');
  assert.equal(filterParts(manifest.parts,'无匹配').length,0);assert.equal(filterParts(manifest.parts).length,26);
  assert.equal(JSON.stringify(manifest.parts),before);
});
test('batch naming is deterministic, immutable and supports undo snapshots',()=>{
  const before=freshTextSamples(),snapshot=structuredClone(before),after=renameSamples(before,{prefix:'镜头A_',start:7});
  assert.deepEqual(after.map(r=>r.name),['镜头A_07','镜头A_08','镜头A_09','镜头A_10']);
  assert.equal(changedSampleCount(before,after,'name'),4);assert.deepEqual(before,snapshot);
  assert.equal(after[0].expression,before[0].expression,'No implicit expression rewriting');
  const history=[snapshot];let current=after;current=history.pop();assert.deepEqual(current,freshTextSamples());
});
test('find/replace edits only the chosen sample field, literally and reversibly',()=>{
  const before=freshTextSamples();
  const names=replaceSamples(before,{find:'角色',replacement:'镜头A',scope:'name'});
  assert.equal(names[0].name,'镜头A_左上臂');assert.equal(names[0].expression,before[0].expression);
  const expressions=replaceSamples(before,{find:'角色',replacement:'$&<新角色>',scope:'expression'});
  assert.equal(expressions[0].expression,'thisComp.layer("$&<新角色>_左上臂").transform.position');
  assert.equal(expressions[0].name,before[0].name);
  const source=replaceSamples(before,{find:'角色',replacement:'人物',scope:'source'});assert.equal(source[0].source,'人物向左挥手');
  assert.deepEqual(replaceSamples(before,{find:'',replacement:'x'}),before);
  assert.throws(()=>replaceSamples(before,{scope:'__proto__'}),/Unknown text scope/);
});
test('all task links map to local documentation files and code is editable text, not evaluated',async()=>{
  const routes=new Set([...TOOL_TABS.map(t=>t.docs),...SCRIPT_TASKS.map(t=>t.docs),'/docs/guide/tools/composition/settings','/docs/guide/tools/text/search-replace']);
  for(const route of routes){const path=join(root,'content',route.slice(1));let exists=true;try{await access(path+'.mdx');}catch{try{await access(join(path,'index.mdx'));}catch{exists=false;}}assert(exists,'Missing documentation '+route);}
  const api=await readFile(join(root,'content/docs/advanced/api/duik-features.mdx'),'utf8');assert(api.includes('Duik.Rig.arm()'));
  assert(SCRIPT_TASKS[1].code.includes('Duik.Rig.arm();'));assert(SCRIPT_TASKS[1].code.includes(String.fromCharCode(10)));
  const source=await readFile(join(root,'components/home/landing/tools-demo.mjs'),'utf8');
  assert(!/\beval\s*\(|new\s+Function\s*\(/.test(source));assert(source.includes('clipboard.writeText'));assert(source.includes('复制未获许可'));
});
test('user-provided names remain escaped when rendered in before/after scenes',()=>{
  const value='<img src=x onerror=alert(1)> & " \' ';
  assert.equal(escapeHTML(value),'&lt;img src=x onerror=alert(1)&gt; &amp; &quot; &#39; ');
});
test('implementation uses the unique rig and exposes cleanup for listeners and observers',async()=>{
  const source=await readFile(join(root,'components/home/landing/tools-demo.mjs'),'utf8');
  assert(source.includes("import('../character-rig.js')"));
  for(const call of ['getParts()','selectPart(','setVisible(','setActive(','character.ready','life.abort()','observer?.disconnect()','character?.remove()'])assert(source.includes(call),call);
  assert(!source.includes('getContext('),'No second renderer');
});
test('runtime binds immediate takeover, offscreen pauses, reduced motion, and animation teardown',async()=>{
  const source=await readFile(join(root,'components/home/landing/tools-demo.mjs'),'utf8');
  for(const contract of ["on(root,'input'",'capture:true','cancelPreviewFrame()','cancelAnimationFrame(previewFrame)','cancelFeedback()','visibilitychange',"advanceToolsPreview(preview,'stop')",'prefers-reduced-motion: reduce',"if(id==='layers'&&layerWorkbench.open)ensureRig()",'observer?.observe(stage)','generation!==previewGeneration','mounted.has(root)','mounted.delete(root)']){assert(source.includes(contract),contract);}
  assert(source.includes('!event?.detail||reducedMotion'),'Keyboard actions do not play ornamental feedback');
  assert(source.includes('if(drag||sceneDrag||event.button!==0||event.isPrimary===false)return'),'Drag rejects a second pointer');
  assert(!toolsMarkup.includes('data-scene-play'),'Presentation has no playback button');
  assert(!source.includes('data-tools-supplement'),'No obsolete hidden interaction gate');
  assert(!source.includes('setInterval('),'No indefinite demo timer');
  const css=await readFile(join(root,'components/home/landing/tools-demo.css'),'utf8');
  assert(!/transition\s*:\s*all\b/.test(css));assert(!/\binfinite\b/.test(css));
  assert(css.includes('@media(prefers-reduced-motion:reduce)'));assert(css.includes('@media(hover:hover)'));
});

// This minimal DOM adapter exercises the real controller and complete event
// order. It deliberately does not claim browser layout, trusted input or WebGL.
class AdapterTarget{
  listeners=[];
  addEventListener(type,run,options={}){this.listeners.push({type,run,options});}
  fire(type,values={}){
    const event={type,target:this,button:0,isPrimary:true,pointerId:1,clientX:0,clientY:0,detail:type==='click'?1:0,key:'',preventDefault(){this.defaultPrevented=true;},...values};
    const path=[];for(let node=this;node;node=node.parentElement)path.push(node);
    const dispatch=(target,capture)=>{for(const item of [...target.listeners])if(item.type===type&&Boolean(item.options.capture)===capture&&!item.options.signal?.aborted)item.run(event);};
    for(const target of [...path].reverse())dispatch(target,true);
    for(const target of path)dispatch(target,false);
    return event;
  }
}
const dataAttribute=key=>'data-'+String(key).replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
class AdapterElement extends AdapterTarget{
  constructor(tag,document,attrs=[]){super();this.tagName=tag.toUpperCase();this.ownerDocument=document;this.attributes=new Map(attrs.map(item=>[item.name,item.value]));this.children=[];this.parentElement=null;this._text='';this.captures=new Set();this.dataset=new Proxy({}, {get:(_,key)=>this.getAttribute(dataAttribute(key))??undefined,set:(_,key,value)=>{this.setAttribute(dataAttribute(key),value);return true;}});}
  setAttribute(key,value){this.attributes.set(key,String(value));}
  getAttribute(key){return this.attributes.get(key)??null;}
  removeAttribute(key){this.attributes.delete(key);}
  hasAttribute(key){return this.attributes.has(key);}
  matches(selector){return selector.split(',').some(part=>{const match=part.trim().match(/^([a-z][\w-]*)?(?:\[([^=\]]+)(?:="([^"]*)")?\])?$/);return match&&(!match[1]||this.tagName===match[1].toUpperCase())&&(!match[2]||(this.hasAttribute(match[2])&&(match[3]===undefined||this.getAttribute(match[2])===match[3])));});}
  closest(selector){for(let node=this;node;node=node.parentElement)if(node.matches(selector))return node;return null;}
  contains(target){for(let node=target;node;node=node.parentElement)if(node===this)return true;return false;}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  append(...children){for(const child of children){child.parentElement=this;this.children.push(child);}}
  set innerHTML(html){this.children=[];this._text='';this.append(...parseFragment(html).childNodes.map(node=>adaptNode(node,this.ownerDocument)));}
  get textContent(){return this._text+this.children.map(child=>child.textContent).join('');}
  set textContent(value){this.children=[];this._text=String(value);}
  get value(){return this._value??this.getAttribute('value')??(this.tagName==='SELECT'?this.querySelector('option')?.value:this.tagName==='TEXTAREA'?this.textContent:'')??'';}
  set value(value){this._value=String(value);}
  focus(){this.ownerDocument.activeElement=this;this.fire('focusin');}
  select(){this.selected=true;}
  setPointerCapture(id){this.captures.add(id);}
  hasPointerCapture(id){return this.captures.has(id);}
  releasePointerCapture(id){this.captures.delete(id);}
  getScreenCTM(){return {inverse:()=>({})};}
  remove(){if(this.parentElement)this.parentElement.children=this.parentElement.children.filter(child=>child!==this);}
}
for(const name of ['hidden','disabled','open'])Object.defineProperty(AdapterElement.prototype,name,{get(){return this.hasAttribute(name);},set(value){if(value)this.setAttribute(name,'');else this.removeAttribute(name);}});
for(const name of ['id','href','tabIndex'])Object.defineProperty(AdapterElement.prototype,name,{get(){return this.getAttribute(name.toLowerCase())||'';},set(value){this.setAttribute(name.toLowerCase(),value);}});
function adaptNode(node,document){const element=new AdapterElement(node.tagName||'#text',document,node.attrs||[]);if(node.nodeName==='#text')element._text=node.value;element.append(...(node.childNodes||[]).map(child=>adaptNode(child,document)));return element;}
function controllerFixture(t){
  const document=new AdapterTarget(),media=new AdapterTarget(),frames=new Map(),history=[],observers=[],copied=[];let now=0,next=0;
  document.hidden=false;media.matches=false;
  document.defaultView=Object.assign(new AdapterTarget(),{AbortController,matchMedia:()=>media,requestAnimationFrame(run){const id=++next;frames.set(id,run);history.push(run);return id;},cancelAnimationFrame:id=>frames.delete(id),IntersectionObserver:class{constructor(run){this.run=run;this.targets=[];this.disconnected=false;observers.push(this);}observe(target){this.targets.push(target);}disconnect(){this.disconnected=true;}},DOMPoint:class{constructor(x,y){this.x=x;this.y=y;}matrixTransform(){return this;}},navigator:{clipboard:{writeText:async value=>{copied.push(value);}}}});
  const host=new AdapterElement('div',document);host.innerHTML=toolsMarkup;
  const cleanup=mountTools(host),root=host.querySelector('[data-tools-root]');t.after(cleanup);
  const $=selector=>root.querySelector(selector);
  const visible=value=>{for(const observer of observers)if(!observer.disconnected)observer.run(observer.targets.map(target=>({target,isIntersecting:value,intersectionRatio:value?1:0})));};
  const advance=milliseconds=>{for(let elapsed=0;elapsed<milliseconds;elapsed+=50){now+=50;const pending=[...frames];frames.clear();for(const [,run]of pending)run(now);}};
  const click=selector=>{const element=$(selector);element.fire('pointerdown');element.focus();element.fire('click');return element;};
  return {host,root,$,document,media,frames,history,copied,cleanup,visible,advance,click};
}
test('controller loops without a transport and passive hover, focus or keys do not pause it',t=>{
  const f=controllerFixture(t);assert.equal(mountTools(f.root),f.cleanup);assert.equal(f.frames.size,0);
  assert.equal(f.$('[data-scene-play]'),null);assert.equal(f.$('input[data-scene-progress]'),null);f.visible(true);assert.equal(f.frames.size,1);
  assert.equal(f.root.dataset.toolsPreview,'running');f.advance(900);
  const progress=Number(f.root.dataset.sceneProgress);assert(progress>0&&progress<100);
  f.root.fire('pointerenter');f.$('[data-tools-tab="layers"]').focus();f.$('[data-scene-piece="title"]').focus();
  f.root.fire('keydown',{key:'Tab'});f.root.fire('keydown',{key:'Escape'});
  assert.equal(f.root.dataset.toolsPreview,'running');assert.equal(f.frames.size,1);f.advance(500);assert(Number(f.root.dataset.sceneProgress)>progress);
  f.root.fire('pointerleave');assert.equal(f.frames.size,1);f.advance(TOOLS_PREVIEW_DURATION);assert.equal(f.root.dataset.toolsPreview,'running');assert(Number(f.root.dataset.sceneProgress)<100);assert.equal(f.frames.size,1);
  f.advance(10000);assert.equal(f.frames.size,1);
});
test('the default layer scene automatically labels and reverses without a click or preloaded character',t=>{
  const f=controllerFixture(t),field=key=>f.$('[data-scene-layer-field="'+key+'"]');
  assert.equal(f.root.dataset.toolsCurrent,'layers');assert.equal(f.$('[data-tools-title]').textContent,TOOL_TABS[0].title);
  assert.equal(f.$('[data-tools-docs]').href,'/docs/guide/tools/layers');
  assert.equal(f.$('[data-tools-tab="layers"]').getAttribute('aria-selected'),'true');
  assert(!f.$('[data-tools-panel="layers"]').hidden);assert(f.$('[data-tools-panel="composition"]').hidden);
  assert(f.$('[data-crop-handle="nw"]').hidden);assert(!f.$('[data-scene-layer-labels]').hidden);
  assert.equal(field('name').textContent,'Art_片头_Duik');
  assert(!f.$('[data-tools-workbench="layers"]').open);assert.equal(f.$('[data-tools-character-slot]').children.length,0);
  f.visible(true);assert.equal(f.root.dataset.toolsPreview,'running');f.advance(3350);
  assert.equal(f.root.dataset.sceneProgress,'100');assert.equal(f.root.dataset.toolsPreview,'running');
  assert.deepEqual(['name','group','side','type'].map(key=>field(key).textContent),['Duik 字样','片头','无','美术']);
  assert.equal(f.$('[data-scene-piece="title"]').getAttribute('transform'),'translate(-8 132)');
  assert.equal(f.$('[data-scene-result]').textContent,'四层已整理');f.advance(3300);
  assert.equal(f.root.dataset.sceneProgress,'0');assert.equal(field('name').textContent,'Art_片头_Duik');
  assert.equal(field('type').textContent,'未整理');assert.equal(f.$('[data-scene-piece="title"]').getAttribute('transform'),'translate(0 0)');
  assert.equal(f.frames.size,1);assert.equal(f.root.dataset.toolsCurrent,'layers');
});
test('the final composition entry retains direct crop controls and returns to the default layer scene',t=>{
  const f=controllerFixture(t);f.visible(true);f.click('[data-tools-tab="composition"]');
  assert.equal(f.root.dataset.toolsCurrent,'composition');assert(!f.$('[data-crop-handle="nw"]').hidden);
  assert(!f.$('[data-tools-panel="composition"]').hidden);assert(f.$('[data-scene-layer-identity]').hidden);
  f.click('[data-tool-action="crop-after"]');assert.equal(f.$('[data-crop-size]').textContent,'352 × 272');
  f.click('[data-tools-tab="layers"]');f.root.fire('pointerleave');assert.equal(f.root.dataset.toolsPreview,'running');
  assert.equal(f.root.dataset.toolsCurrent,'layers');assert(f.$('[data-crop-handle="nw"]').hidden);
  assert(!f.$('[data-scene-layer-identity]').hidden);assert.equal(f.$('[data-tools-docs]').href,'/docs/guide/tools/layers');
});
test('controller gates reduced-motion, background and stage visibility then resumes without losing progress',t=>{
  const f=controllerFixture(t);f.visible(true);f.advance(700);const before=f.root.dataset.sceneProgress;
  f.visible(false);assert.equal(f.root.dataset.toolsPreview,'paused');assert.equal(f.frames.size,0);f.visible(true);assert.equal(f.frames.size,1);assert.equal(f.root.dataset.sceneProgress,before);
  f.document.hidden=true;f.document.fire('visibilitychange');assert.equal(f.frames.size,0);f.document.hidden=false;f.document.fire('visibilitychange');assert.equal(f.frames.size,1);
  f.media.matches=true;f.media.fire('change',{matches:true});assert.equal(f.frames.size,0);
  f.click('[data-tools-tab="composition"]');f.click('[data-tool-action="crop-after"]');assert.equal(f.root.dataset.sceneProgress,'100');assert.equal(f.root.dataset.toolsPreview,'manual');
  f.media.matches=false;f.media.fire('change',{matches:false});assert.equal(f.frames.size,1);
  const stale=[...f.frames.values()][0];f.cleanup();const snapshot=f.root.dataset.toolsPreview;stale(5000);f.click('[data-tool-action="crop-reset"]');assert.equal(f.root.dataset.toolsPreview,snapshot);assert.equal(f.frames.size,0);
});
test('controller keeps the artwork fixed for crop/name changes and exposes direct layer control',t=>{
  const f=controllerFixture(t);f.visible(true);f.click('[data-tools-tab="composition"]');const reference=f.$('[data-parent-reference]').getAttribute('transform');
  f.advance(1700);
  const numbers=selector=>f.$(selector).getAttribute('transform').match(/-?\d+(?:\.\d+)?/g).map(Number),origin=numbers('[data-crop-origin]'),offset=numbers('[data-crop-offset]');
  assert.equal(origin[0]+offset[0],60);assert.equal(origin[1]+offset[1],40);assert.equal(f.$('[data-parent-reference]').getAttribute('transform'),reference);
  f.click('[data-tools-tab="layers"]');assert(!f.$('[data-tools-workbench="layers"]').open);assert.equal(f.$('[data-tools-character-slot]').children.length,0);
  f.advance(3350);const piece=f.$('[data-scene-piece="title"]');assert.equal(piece.getAttribute('transform'),'translate(-8 132)');
  piece.fire('keydown',{key:'ArrowRight'});assert.equal(piece.getAttribute('transform'),'translate(-6 132)');piece.fire('keydown',{key:'Home'});assert.equal(piece.getAttribute('transform'),'translate(-8 132)');
  f.click('[data-tool-action="scene-isolate"]');assert.equal(f.$('[data-scene-piece="circle"]').getAttribute('opacity'),'.12');
  f.click('[data-tools-tab="text"]');const prefix=f.$('[data-scene-prefix]');prefix.value='动画_';prefix.fire('input');assert.equal(f.$('[data-scene-name="0"]').textContent,'动画_01');assert.equal(piece.getAttribute('transform'),'translate(0 0)');assert.equal(f.frames.size,0);
});
test('layer metadata follows automatic progress, actual edits and reverse playback',t=>{
  const f=controllerFixture(t);f.visible(true);f.click('[data-tools-tab="layers"]');
  const field=key=>f.$('[data-scene-layer-field="'+key+'"]').textContent;
  const label=id=>f.$('[data-scene-layer-label="'+id+'"]');
  assert(!f.$('[data-scene-layer-identity]').hidden);assert.equal(field('name'),'Art_片头_Duik');assert.equal(field('group'),'未整理');
  f.advance(1700);
  assert.equal(label('stem').dataset.tagged,'true');assert.equal(label('circle').dataset.tagged,'true');assert.equal(label('title').dataset.tagged,'false');
  assert.equal(field('type'),'未整理');f.click('[data-scene-select="circle"]');
  assert.deepEqual(['name','group','side','type'].map(field),['橙色形状','片头','右','美术']);assert.equal(f.frames.size,1,'Choosing a layer does not stop automatic playback');
  const piece=f.$('[data-scene-piece="circle"]');piece.fire('keydown',{key:'ArrowRight'});
  assert.equal(label('circle').getAttribute('transform'),piece.getAttribute('transform'),'Name stays attached to its dragged artwork');
  f.click('[data-tool-action="scene-isolate"]');assert.equal(label('stem').getAttribute('opacity'),'.12');assert.equal(label('circle').getAttribute('opacity'),'1');
  assert.equal(f.frames.size,0,'An actual held adjustment key owns the pose');f.document.fire('keyup',{key:'ArrowRight'});assert.equal(f.frames.size,1);
  f.advance(1700);assert.equal(field('type'),'美术');assert.equal(f.$('[data-scene-result]').textContent,'四层已整理');
  f.advance(3300);assert.equal(field('name'),'Art_片头_R_橙色形状');assert.equal(field('type'),'未整理');assert.equal(label('circle').dataset.tagged,'false');
  f.click('[data-tools-tab="text"]');assert(f.$('[data-scene-layer-identity]').hidden);assert(f.$('[data-scene-layer-labels]').hidden);
  f.click('[data-tools-tab="layers"]');f.click('[data-tool-action="scene-layout-reset"]');assert.equal(field('name'),'Art_片头_R_橙色形状');assert.equal(field('type'),'未整理');assert.equal(label('circle').getAttribute('transform'),'translate(0 0)');
});
test('layer labeling cannot keep progressing after takeover, offscreen, reduced-motion or unmount',t=>{
  const f=controllerFixture(t);f.visible(true);f.click('[data-tools-tab="layers"]');f.root.fire('pointerleave');f.advance(1700);
  const identity=f.$('[data-scene-layer-identity]');
  const before=identity.textContent;f.visible(false);f.advance(4000);assert.equal(identity.textContent,before);assert.equal(f.frames.size,0);
  f.visible(true);assert.equal(f.frames.size,1);f.advance(200);f.click('[data-scene-select="dot"]');f.$('[data-scene-piece="dot"]').fire('pointerdown',{clientX:398,clientY:116});
  const selected=identity.textContent;f.advance(4000);assert.equal(identity.textContent,selected);assert.equal(f.frames.size,0);
  f.media.matches=true;f.media.fire('change',{matches:true});assert.equal(f.frames.size,0);
  f.media.matches=false;f.media.fire('change',{matches:false});f.root.fire('pointerleave');f.advance(1000);const stale=[...f.frames.values()][0];
  f.cleanup();const last=identity.textContent;stale(60000);assert.equal(identity.textContent,last);assert.equal(f.frames.size,0);
});
test('accepted drag pauses only while captured and rejects a second pointer release',t=>{
  const f=controllerFixture(t);f.visible(true);f.advance(1700);const piece=f.$('[data-scene-piece="circle"]'),svg=f.$('[data-crop-svg]');
  const progress=f.root.dataset.sceneProgress,stale=[...f.frames.values()][0];piece.fire('pointerdown',{pointerId:7,clientX:354,clientY:208});
  assert.equal(f.frames.size,0);assert(svg.hasPointerCapture(7));stale(50000);assert.equal(f.root.dataset.sceneProgress,progress);
  piece.fire('pointerdown',{pointerId:9,clientX:354,clientY:208});svg.fire('pointerup',{pointerId:9});assert.equal(f.frames.size,0);
  svg.fire('pointermove',{pointerId:7,clientX:378,clientY:196});const changed=piece.getAttribute('transform');
  assert.deepEqual([Number(piece.dataset.sceneOffsetX),Number(piece.dataset.sceneOffsetY)],[24,-12]);
  svg.fire('pointerup',{pointerId:7});assert.equal(f.frames.size,1);assert(!svg.hasPointerCapture(7));
  f.advance(200);assert.notEqual(piece.getAttribute('transform'),changed);assert.equal(f.root.dataset.toolsPreview,'running');
  assert.deepEqual([Number(piece.dataset.sceneOffsetX),Number(piece.dataset.sceneOffsetY)],[24,-12],'Automatic transforms do not overwrite the actual user drag');
  const progressBefore=f.root.dataset.sceneProgress;f.click('[data-tool-action="scene-layout-reset"]');assert.equal(f.root.dataset.sceneProgress,progressBefore,'Restoring layout is not replay/reset of the clock');
  assert.deepEqual([Number(piece.dataset.sceneOffsetX),Number(piece.dataset.sceneOffsetY)],[0,0]);
});
test('passive parameter focus keeps playing; editing holds until change or blur then resumes',t=>{
  const f=controllerFixture(t);f.visible(true);f.click('[data-tools-tab="text"]');const input=f.$('[data-scene-prefix]');
  input.focus();f.advance(500);assert.equal(f.root.dataset.toolsPreview,'running');assert(Number(f.root.dataset.sceneProgress)>0);
  input.value='测试_';input.fire('input');assert.equal(f.frames.size,0);assert.equal(f.root.dataset.sceneProgress,'100');
  f.advance(4000);assert.equal(f.$('[data-scene-name="0"]').textContent,'测试_01');assert.equal(f.root.dataset.sceneProgress,'100');
  input.fire('change');assert.equal(f.frames.size,1);f.advance(500);assert(Number(f.root.dataset.sceneProgress)<100);
  input.value='另一个_';input.fire('input');assert.equal(f.frames.size,0);input.fire('focusout');assert.equal(f.frames.size,1);
});
test('window blur releases real key ownership but descendant blur cannot',t=>{
  const f=controllerFixture(t);f.visible(true);const piece=f.$('[data-scene-piece="title"]');piece.fire('keydown',{key:'ArrowRight'});assert.equal(f.frames.size,0);
  f.document.defaultView.fire('blur',{target:piece});assert.equal(f.frames.size,0);
  f.document.defaultView.fire('blur');assert.equal(f.frames.size,1);
});
test('script scene takes and copies real text, never claims execution, and clears stale copy eligibility',async t=>{
  const f=controllerFixture(t);f.visible(true);f.click('[data-tools-tab="scripts"]');assert(f.$('[data-tool-action="scene-copy"]').disabled);
  f.click('[data-tool-action="scene-use"]');assert.equal(f.$('[data-scene-code]').textContent,'value;');f.click('[data-tool-action="scene-copy"]');await Promise.resolve();assert.deepEqual(f.copied,['value;']);
  f.click('[data-scene-task="editor"]');assert(f.$('[data-tool-action="scene-copy"]').disabled);f.click('[data-tool-action="scene-use"]');assert.equal(f.$('[data-scene-code]').textContent,'Duik.Rig.arm();');assert.match(f.$('[data-scene-status]').textContent,/初始化 API/);
});
