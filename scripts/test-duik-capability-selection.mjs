import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import gsap from '../public/_nuxt/index4.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
import {patchCapabilityLayoutRuntime} from './lib/landing-capability-layout.mjs';
import {patchCapabilityLinksRuntime,patchOrbitLinksRuntime} from './lib/landing-capability-links.mjs';
import {patchCapabilityResizeRuntime} from './lib/landing-capability-resize.mjs';
import {patchCapabilitySelectionRuntime} from './lib/landing-capability-selection.mjs';
import {patchCapabilityKeyboardRuntime} from './lib/landing-capability-keyboard.mjs';
import {orbitDocumentationFor} from '../components/home/landing/orbit.mjs';

const hash='d2ea4a745e1ba64aecc76bbf680458929795d2d8';
const parentName='HomeCapabilitiesKP.'+hash+'.js';
const childName='HomeCapabilitiesTestimonialKP.'+hash+'.js';
const readBaseline=name=>readFile(new URL('../components/home/landing/baseline/_nuxt/'+name,import.meta.url),'utf8');
const originalParent=await readBaseline(parentName);
const originalChild=await readBaseline(childName);
const priorProduction=patchCapabilityResizeRuntime(patchCapabilityLinksRuntime(patchCapabilityLayoutRuntime(originalParent)));
// Keep an executable negative control after the production fix is published.
// Only the selection fix is omitted; resize/layout/link adapters remain real.
const diagnostic=process.env.DUIK_CAPABILITY_SELECTION_ORIGINAL==='1';
const parentCode=diagnostic?priorProduction:patchCapabilitySelectionRuntime(priorProduction);

function capturedComponent(source,filename,context){
  const ast=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  let executable=source,exported;
  for(const node of [...ast.statements].reverse()){
    if(ts.isExportDeclaration(node)){
      exported=node.exportClause.elements.find(item=>item.name.text==='default')?.propertyName?.text;
      executable=executable.slice(0,node.getStart(ast))+executable.slice(node.end);
    }
    if(ts.isImportDeclaration(node))executable=executable.slice(0,node.getStart(ast))+executable.slice(node.end);
  }
  assert(exported,'The captured parent must export a default component');
  return runInNewContext(executable+'\n'+exported,context);
}

// Execute the child's actual prop watcher and computed selection, not a copied
// approximation of its rounding. Its original eight images/five content items
// are the fixture data; the document link is the production render expression.
function capturedOrbitSelection(){
  const child=patchOrbitLinksRuntime(originalChild);
  const ast=ts.createSourceFile(childName,child,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  let update,selection;
  const visit=node=>{
    if(ts.isCallExpression(node)&&node.expression.getText(ast)==='B'
      &&node.arguments[0]?.getText(ast)==='()=>d.mergedProgress')update=node.arguments[1].getText(ast);
    if(ts.isVariableDeclaration(node)&&node.name.getText(ast)==='b'
      &&ts.isCallExpression(node.initializer)&&node.initializer.expression.getText(ast)==='C')selection=node.initializer.arguments[0].getText(ast);
    ts.forEachChild(node,visit);
  };
  visit(ast);
  const link=child.match(/s\("a",\{class:"duik-orbit-doc"[\s\S]+?\["href"\]\)/)?.[0];
  assert(update&&selection&&link,'Expected the original orbit selection and adapted link expressions');
  const context={d:{isMerged:true,mergedProgress:0},g:{value:0},P:{value:0},$:{value:5},L:{value:45},I:{value:4}};
  const onProgress=runInNewContext('('+update+')',context);
  const selected=runInNewContext('('+selection+')',context);
  return progress=>{
    context.d.mergedProgress=progress;onProgress(progress);
    const index=selected();
    const anchor=runInNewContext(link,{
      s:(tag,props,label)=>({tag,props,label}),S:{value:true},b:{value:index},A:{value:0},
      duikOrbitDocumentFor:orbitDocumentationFor,
    });
    return {index,href:anchor.props.href,phase:context.g.value};
  };
}

class Events{
  listeners=new Map();
  addEventListener(type,callback){const group=this.listeners.get(type)||new Set();group.add(callback);this.listeners.set(type,group);}
  removeEventListener(type,callback){this.listeners.get(type)?.delete(callback);}
  emit(type){for(const callback of [...this.listeners.get(type)||[]])callback({type});}
}

// Agreed seam: real parent setup/render onGoToStep -> scroll boundary -> real
// shipped GSAP timeline -> mergedProgress -> actual child selection/link.
// Geometry, the Vue commit queue and physical ScrollTrigger/Lenis completion
// are adapted. This proves selection arithmetic, not browser motion or layout.
function fixture(t,{transport='lenis',start=2400,span=10731.6,initialSize={}}={}){
  const win=new Events(),refs=[],mounts=[],unmounts=[],frames=new Map(),ticks=[],active=new Set(),scrollCalls=[];
  const size={width:1440,height:900,container:1344,inner:500,list:3500,...initialSize};
  const extent={start,span};
  let nextFrame=0,desktop=true,disposed=false,currentOwner=null;
  class Element{
    constructor(kind){this.kind=kind;this.style={};this.attributes=new Map();this.x=0;this.strokeDashoffset=0;this.strokeDasharray=0;}
    getBoundingClientRect(){return {width:this.kind==='inner'?size.inner:this.kind==='list'?size.list:this.kind==='container'?size.container:size.width,height:size.height};}
    setAttribute(name,value){this.attributes.set(name,String(value));}
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
  Object.assign(win,{
    getComputedStyle:()=>({paddingRight:'0'}),
    scrollTo:options=>scrollCalls.push({target:options.top,transport:'native',options}),
    ...(transport==='lenis'?{lenis:{scrollTo:(target,options)=>scrollCalls.push({target,transport:'lenis',options})}}:{}),
  });
  Object.defineProperties(win,{innerWidth:{get:()=>size.width},innerHeight:{get:()=>size.height}});
  const triggers={
    getById:id=>[...active].find(record=>record.options.id===id),
    refresh(){for(const record of active){record.start=extent.start;record.end=extent.start+extent.span;}},
  };
  const engine={
    registerPlugin(){},set:gsap.set,
    context(run){
      const owner={records:[]},previous=currentOwner;currentOwner=owner;
      let context;try{context=gsap.context(run);}finally{currentOwner=previous;}
      return {revert(){context.revert();for(const record of owner.records)active.delete(record);}};
    },
    matchMedia:()=>({add(_query,run){if(size.width>=1024)run();return this;}}),
    timeline({scrollTrigger}){
      const timeline=gsap.timeline({paused:true});
      const record={options:scrollTrigger,timeline,start:extent.start,end:extent.start+extent.span};
      active.add(record);currentOwner?.records.push(record);return timeline;
    },
  };
  const ref=value=>{const item={value};refs.push(item);return item;};
  const vnode=(tag,props,children)=>({tag,props,children});
  const context={
    window:win,document:{querySelector:selector=>desktop?nodes[selector]||null:null},HTMLElement:Element,M:engine,oe:triggers,
    Xe:value=>value,T:ref,Ye:()=>({hasInteracted:{value:true}}),
    at:get=>({get value(){return get();}}),nt:()=>({public:{PUBLIC_ENV:'production'}}),
    Fe(){},Ze:callback=>mounts.push(callback),et:callback=>unmounts.push(callback),K:value=>value,
    console:{log(){}},requestAnimationFrame:callback=>{const id=++nextFrame;frames.set(id,callback);return id;},
    cancelAnimationFrame:id=>frames.delete(id),duikCapabilityNextTick:()=>new Promise(resolve=>ticks.push(resolve)),
    Ne:'text',Ue:'diagram1',je:'diagram2',qe:'diagram3',Ve:'border',re:'orbit',Ge:'swiper',Je:'slide',Qe:'pagination',
    t(){},d:vnode,r:vnode,A:vnode,o:vnode,i:()=>null,tt:value=>value,it:value=>value,
    le:value=>value,ce:value=>value,_:value=>value&&typeof value==='object'&&'value'in value?value.value:value,
    ue:'fragment',pe:(items,callback)=>items.map(callback),c:callback=>callback,
  };
  const component=capturedComponent(parentCode,parentName,context);
  const render=component.setup({blok:{listItems:[]}});
  const commit=()=>{desktop=refs[3].value;refs[4].value=desktop?svg:null;refs[5].value=desktop?path:null;};
  const orbitNode=()=>{
    const find=node=>{
      if(!node||typeof node!=='object')return null;
      if(node.tag==='orbit')return node;
      for(const child of Array.isArray(node.children)?node.children:[]){const found=find(child);if(found)return found;}
      return null;
    };
    const node=find(render({},[]));assert(node,'The real parent render must contain its orbit child');return node;
  };
  const settle=async()=>{
    for(let count=0;frames.size||ticks.length;count++){
      assert(count<20,'Resize scheduling must settle');
      const callbacks=[...frames.values()];frames.clear();for(const callback of callbacks)callback();
      commit();for(const resolve of ticks.splice(0))resolve();await Promise.resolve();await Promise.resolve();
    }
  };
  const selectOrbit=capturedOrbitSelection();
  t.after(()=>{if(disposed)return;disposed=true;for(const unmount of unmounts)unmount();gsap.ticker.sleep();});
  commit();
  return {
    scrollCalls,active,
    mount(){for(const mount of mounts)mount();commit();triggers.refresh();gsap.ticker.sleep();},
    async resize(values,newExtent={}){Object.assign(size,values);Object.assign(extent,newExtent);win.emit('resize');await settle();},
    choose(index){
      const before=scrollCalls.length;orbitNode().props.onGoToStep(index);
      assert.equal(scrollCalls.length,before+1,'The rendered event must request one scroll');
      const scroll=scrollCalls.at(-1),record=triggers.getById('capabilities-master-trigger');
      assert(Number.isFinite(scroll.target),'The scroll destination must be finite');
      record.timeline.totalProgress((scroll.target-record.start)/(record.end-record.start),false);
      const progress=orbitNode().props.mergedProgress;
      return {...selectOrbit(progress),progress,target:scroll.target,transport:scroll.transport};
    },
  };
}

test('selecting the fifth orbit item settles on its own label and engineering-check guide',t=>{
  const f=fixture(t);f.mount();
  const result=f.choose(4);
  assert.equal(result.index,4,`Fifth item settled on index ${result.index} at orbit phase ${result.phase}`);
  assert.equal(result.href,'/docs/guide/sanity');
});

const expectedGuides=[
  '/docs/guide/oco',
  '/docs/guide/animation/anim-library',
  '/docs/guide/tools/scripting/library',
  '/docs/guide/notes',
  '/docs/guide/sanity',
];

function assertAllSelections(f,label){
  // Returning from item five also catches stale selection when scrubbing back.
  for(const index of [4,0,3,1,2,4]){
    const result=f.choose(index);
    assert.equal(result.index,index,`${label}: selected ${index}, settled ${result.index} at phase ${result.phase}`);
    assert.equal(result.href,expectedGuides[index],`${label}: the selected item and guide must agree`);
  }
}

test('all five selections and their guides survive short, normal and long trigger extents',async t=>{
  for(const [label,start,span]of [
    ['short',320,6200],
    ['normal',2400,10731.6],
    ['long',8700,24000],
  ])await t.test(label,t=>{
    const f=fixture(t,{start,span});f.mount();
    assertAllSelections(f,label);
    assert(f.scrollCalls.every(call=>call.transport==='lenis'));
  });
});

test('the rendered selectors use the resized timeline and current trigger boundaries after interaction',async t=>{
  // The inherited offset happens to work on this long track. The negative
  // control must fail after resize, not short-circuit before exercising it.
  const f=fixture(t,{span:24000});f.mount();
  assertAllSelections(f,'before resize');
  await f.resize({width:1280,height:720,container:1184,inner:440,list:3000},{start:4700,span:8000});
  assert.equal(f.active.size,1,'Resize must not leave a stale selection owner');
  assertAllSelections(f,'short desktop');
  await f.resize({width:1728,height:1117,container:1632,inner:620,list:3900},{start:7300,span:13200});
  assert.equal(f.active.size,1);
  assertAllSelections(f,'large desktop');
});

test('native smooth-scroll fallback settles on the same item and document as Lenis',t=>{
  const f=fixture(t,{transport:'native',start:2800,span:6200});f.mount();
  assertAllSelections(f,'native fallback');
  assert(f.scrollCalls.every(call=>call.transport==='native'&&call.options.behavior==='smooth'));
});

test('the publisher transform is idempotent and changes only the invalid fixed pixel offset',()=>{
  const fixed=patchCapabilitySelectionRuntime(priorProduction);
  assert.equal(fixed,priorProduction.replace('-(u===0?200:u*180)',''));
  assert.equal(patchCapabilitySelectionRuntime(fixed),fixed);
});

test('unknown, duplicate and mixed selection mappings fail closed',()=>{
  const fixed=patchCapabilitySelectionRuntime(priorProduction);
  assert.throws(()=>patchCapabilitySelectionRuntime('unknown capture'),/Unknown capability selection mapping/);
  assert.throws(()=>patchCapabilitySelectionRuntime(priorProduction.replace('u*180','u*181')),/Unknown capability selection mapping/);
  assert.throws(()=>patchCapabilitySelectionRuntime(priorProduction+'\n'+priorProduction),/Unknown capability selection mapping/);
  assert.throws(()=>patchCapabilitySelectionRuntime(fixed+'\n'+fixed),/Duplicated capability selection mapping/);
  assert.throws(()=>patchCapabilitySelectionRuntime(fixed+'\n'+priorProduction),/Mixed capability selection mappings/);
});

test('the published parent is byte-identical to all five production transformations',{
  skip:diagnostic?'Negative control intentionally omits the selection fix; publication is not its failure signal':false,
},async()=>{
  const published=await readFile(new URL('../public/_nuxt/'+parentName,import.meta.url));
  const expected=Buffer.from(patchCapabilityKeyboardRuntime(parentCode),'utf8');
  assert.equal(published.equals(expected),true,
    'The actual public parent must contain the exact layout, links, resize, selection and keyboard transformations; run the normal landing publisher');
  assert.equal(await readFile(new URL('../public/duik-experience/capability-keyboard.mjs',import.meta.url),'utf8'),
    await readFile(new URL('../components/home/landing/capability-keyboard.mjs',import.meta.url),'utf8'));
});
