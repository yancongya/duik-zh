import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {parseFragment} from 'parse5';

const moduleName='tools-comparison-motion.mjs';
const source=await readFile(new URL('../components/home/landing/'+moduleName,import.meta.url),'utf8');
const gsapPath='/_nuxt/index4.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const triggerPath='/_nuxt/ScrollTrigger.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';

// The real module and exported lifecycle execute unchanged. Only dynamic import
// calls are routed to controlled local-runtime boundaries, alongside browser
// visibility/geometry adapters. This is not GPU, visual or physical-scroll proof.
function loadModule(loadRuntime){
  const ast=ts.createSourceFile(moduleName,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),edits=[];
  function visit(node){
    if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword){
      edits.push({start:node.getStart(ast),end:node.end,value:'loadRuntime('+node.arguments.map(item=>item.getText(ast)).join(',')+')'});
    }
    if(ts.canHaveModifiers(node))for(const modifier of ts.getModifiers(node)||[]){
      if(modifier.kind===ts.SyntaxKind.ExportKeyword)edits.push({start:modifier.getStart(ast),end:modifier.end,value:''});
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);let executable=source;
  for(const edit of edits.sort((a,b)=>b.start-a.start))executable=executable.slice(0,edit.start)+edit.value+executable.slice(edit.end);
  return runInNewContext(executable+'\n({comparisonCurvesMarkup,mountToolsComparisonMotion})',{loadRuntime});
}

class Events{
  listeners=new Map();
  addEventListener(type,callback){const group=this.listeners.get(type)||new Set();group.add(callback);this.listeners.set(type,group);}
  removeEventListener(type,callback){this.listeners.get(type)?.delete(callback);}
  fire(type,event={}){for(const callback of [...this.listeners.get(type)||[]])callback({type,...event});}
  count(type){return this.listeners.get(type)?.size||0;}
}
class Style{
  values=new Map();
  getPropertyValue(name){return this.values.get(name)?.value||'';}
  getPropertyPriority(name){return this.values.get(name)?.priority||'';}
  setProperty(name,value,priority=''){this.values.set(name,{value:String(value),priority});}
  removeProperty(name){const old=this.getPropertyValue(name);this.values.delete(name);return old;}
}
const kebab=name=>name.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase());

function fixture(t,{hidden=false,reduced=false,intersectionObserver=true}={}){
  const doc=new Events(),media=new Events(),observers=[],created=[],writes=[],requests=[],warnings=[];
  const progress={left:.25,right:.6};
  let resolveRuntime,rejectRuntime;
  const gate=new Promise((resolve,reject)=>{resolveRuntime=resolve;rejectRuntime=reject;});
  const paths=['left','right'].map((side,index)=>({
    dataset:{toolsComparisonCurve:side},style:new Style(),length:index===0?1000:800,
    getAttribute(name){return name==='data-tools-comparison-curve'?side:null;},
    getTotalLength(){return this.length;},
  }));
  const host={
    ownerDocument:doc,isConnected:true,
    querySelectorAll:selector=>selector==='[data-tools-comparison-curve]'?paths:[],
    // A regression cannot rebuild the shared stage or take its playback clock.
    set innerHTML(_value){throw Error('Comparison decoration must not replace tool content');},
    dataset:{toolsPreview:'manual',sceneProgress:'73',toolsCurrent:'layers'},
  };
  const runtime={
    gsap:{
      registerPlugin(){},
      set(path,values){writes.push({path,values:{...values}});for(const [name,value]of Object.entries(values))path.style.setProperty(kebab(name),value);},
    },
    ScrollTrigger:{create(options){
      const side=options.start==='top+=3% top'?'left':'right';
      const record={options,side,progress:progress[side],killed:false,kill(){this.killed=true;}};
      created.push(record);options.onRefresh?.(record);return record;
    }},
  };
  const api=loadModule(path=>{
    requests.push(path);
    assert([gsapPath,triggerPath].includes(path),'Only the two existing local animation modules may load');
    return gate.then(()=>path===gsapPath?{default:runtime.gsap}:{ScrollTrigger:runtime.ScrollTrigger});
  });
  class Observer{
    constructor(callback,options){this.callback=callback;this.options=options;this.targets=[];this.disconnected=false;observers.push(this);}
    observe(target){this.targets.push(target);}
    disconnect(){this.disconnected=true;}
  }
  Object.assign(media,{matches:reduced});Object.assign(doc,{hidden});
  doc.defaultView={matchMedia:()=>media,console:{warn:(...args)=>warnings.push(args)},...(intersectionObserver?{IntersectionObserver:Observer}:{})};
  const flush=async()=>{for(let count=0;count<8;count++)await Promise.resolve();};
  const disposers=[];
  const mount=()=>{const dispose=api.mountToolsComparisonMotion(host);disposers.push(dispose);return dispose;};
  const dispose=mount();
  t.after(()=>{for(const cleanup of disposers)cleanup();});
  return {
    api,host,doc,media,paths,observers,created,writes,requests,warnings,progress,dispose,mount,flush,
    visible(value){for(const observer of observers.filter(item=>!item.disconnected))observer.callback([{target:host,isIntersecting:value,intersectionRatio:value?1:0}]);},
    async ready(){resolveRuntime();await flush();},
    async fail(){rejectRuntime(new Error('Controlled local runtime failure'));await flush();},
    active(){return created.filter(record=>!record.killed);},
    style(index,name){return paths[index].style.getPropertyValue(name);},
  };
}

test('SSR emits the exact two template paths without hiding the tools or requiring JS',()=>{
  const api=loadModule(()=>{throw Error('Markup cannot load browser dependencies');});
  const markup=api.comparisonCurvesMarkup(),nodes=[];
  const visit=node=>{nodes.push(node);for(const child of node.childNodes||[])visit(child);};visit(parseFragment(markup));
  const attrs=node=>Object.fromEntries((node.attrs||[]).map(item=>[item.name,item.value]));
  const paths=nodes.filter(node=>node.tagName==='path');assert.equal(paths.length,2);
  assert.deepEqual(paths.map(node=>attrs(node)['data-tools-comparison-curve']),['left','right']);
  assert.deepEqual(paths.map(node=>attrs(node).d),[
    'M832.004 45.0059C794.251 302.86 583.997 800.189 45.0039 726.672',
    'M832.012 732.188C635.636 750.492 203.309 638.682 45.0117 45.0111',
  ]);
  assert(paths.every(node=>attrs(node).stroke==='currentColor'&&attrs(node)['stroke-width']==='79.02'));
  assert(!markup.includes('opacity:0')&&!markup.includes('display:none'));
});

test('entering the section restores the two local scroll drawings without pinning or taking tool state',async t=>{
  const f=fixture(t);assert.equal(f.requests.length,0);
  const state={...f.host.dataset};f.visible(true);await f.ready();
  assert.equal(f.active().length,2,'The two original scroll paths should activate when visible');
  assert.deepEqual(f.requests,[gsapPath,triggerPath]);
  assert.deepEqual(f.active().map(record=>[record.options.start,record.options.end]),[
    ['top+=3% top','bottom+=40% bottom'],['top-=60% top','bottom bottom'],
  ]);
  assert(f.active().every(record=>record.options.pin===undefined&&record.options.pinSpacing===undefined&&record.options.scrub===true));
  assert.equal(f.style(0,'stroke-dashoffset'),'750');assert.equal(f.style(1,'stroke-dashoffset'),'320');
  assert.deepEqual(f.host.dataset,state);
});

test('offscreen and background suspend drawing; returning samples current scroll without replay',async t=>{
  const f=fixture(t);f.visible(true);await f.ready();
  const old=f.active()[0],offset=f.style(0,'stroke-dashoffset');
  f.visible(false);assert.equal(f.active().length,0);
  old.progress=.9;old.options.onUpdate(old);assert.equal(f.style(0,'stroke-dashoffset'),offset);
  f.progress.left=.8;f.visible(true);assert.equal(f.active().length,2);
  assert(Math.abs(Number(f.style(0,'stroke-dashoffset'))-200)<1e-8);
  f.doc.hidden=true;f.doc.fire('visibilitychange');assert.equal(f.active().length,0);
  const count=f.writes.length;old.options.onRefresh(old);assert.equal(f.writes.length,count);
  f.progress.left=.4;f.doc.hidden=false;f.doc.fire('visibilitychange');
  assert.equal(f.active().length,2);assert.equal(f.style(0,'stroke-dashoffset'),'600');
  assert.equal(f.host.dataset.sceneProgress,'73');
});

test('initially hidden and reduced-motion states keep complete static paths without loading a runtime',async t=>{
  const f=fixture(t,{hidden:true,reduced:true});f.visible(true);
  assert.equal(f.requests.length,0);assert.equal(f.style(0,'stroke-dasharray'),'none');assert.equal(f.style(0,'stroke-dashoffset'),'0');
  f.media.matches=false;f.media.fire('change',{matches:false});assert.equal(f.requests.length,0);
  f.doc.hidden=false;f.doc.fire('visibilitychange');await f.ready();assert.equal(f.active().length,2);
  const old=f.active()[0];f.media.matches=true;f.media.fire('change',{matches:true});
  assert.equal(f.active().length,0);assert.equal(f.style(0,'stroke-dashoffset'),'0');assert.equal(f.style(0,'opacity'),'1');
  old.progress=.1;old.options.onUpdate(old);assert.equal(f.style(0,'stroke-dashoffset'),'0');
  assert.equal(f.host.dataset.toolsPreview,'manual');
});

test('disposing during local module loading prevents late triggers, mutations and listeners',async t=>{
  const f=fixture(t);f.visible(true);assert.equal(f.requests.length,2);
  f.dispose();await f.ready();
  assert.equal(f.created.length,0);assert.equal(f.writes.length,0);
  assert.equal(f.doc.count('visibilitychange'),0);assert.equal(f.media.count('change'),0);
  assert(f.observers.every(observer=>observer.disconnected));
  f.observers[0].callback([{target:f.host,isIntersecting:true}]);assert.equal(f.created.length,0);
});

test('mounting is idempotent, disposal is final, and a new mount cannot inherit the old callback owner',async t=>{
  const f=fixture(t);assert.equal(f.mount(),f.dispose);assert.equal(f.observers.length,1);
  f.visible(true);await f.ready();const old=f.active()[0];
  f.dispose();f.dispose();assert.equal(f.active().length,0);assert.equal(f.style(0,'stroke-dashoffset'),'');
  const next=f.mount();assert.notEqual(next,f.dispose);f.visible(true);await f.flush();
  assert.equal(f.active().length,2);assert.equal(f.doc.count('visibilitychange'),1);
  const count=f.writes.length;old.progress=.95;old.options.onUpdate(old);assert.equal(f.writes.length,count);
});

test('a failed local runtime keeps readable complete paths and does not retry on every visibility update',async t=>{
  const f=fixture(t);f.visible(true);await f.fail();
  assert.equal(f.active().length,0);assert.equal(f.style(0,'stroke-dashoffset'),'0');assert.equal(f.style(1,'opacity'),'1');
  assert.equal(f.warnings.length,1);f.visible(false);f.visible(true);assert.equal(f.requests.length,2);
  assert.equal(f.host.dataset.sceneProgress,'73');
});

test('path refresh remeasures its own geometry and a missing observer uses the same guarded lifecycle',async t=>{
  const f=fixture(t,{intersectionObserver:false});await f.ready();assert.equal(f.active().length,2);
  f.paths[0].length=1500;const first=f.active()[0];first.progress=.75;first.options.onRefresh(first);
  assert.equal(f.style(0,'stroke-dasharray'),'1500');assert.equal(f.style(0,'stroke-dashoffset'),'375');
});

test('comparison mount failure keeps the tools usable and their disposer reachable',async()=>{
  const integration=await readFile(new URL('../components/home/landing/experience-mount.mjs',import.meta.url),'utf8');
  const ast=ts.createSourceFile('experience-mount.mjs',integration,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const importNodes=ast.statements.filter(ts.isImportDeclaration);
  let executable=integration;
  for(const node of [...importNodes].reverse())executable=executable.slice(0,node.getStart(ast))+executable.slice(node.end);
  executable=executable.replace('export function mountExperience','function mountExperience');
  const warnings=[];let stopped=0;
  const mount=runInNewContext(executable+';mountExperience',{
    mountToolsCinema:()=>()=>{stopped++;},
    mountToolsComparisonMotion:()=>{throw new Error('Missing comparison paths');},
  });
  const host={dataset:{},ownerDocument:{defaultView:{console:{warn:(...args)=>warnings.push(args)}}}};
  const dispose=mount(host,'tools');
  assert.equal(typeof dispose,'function');assert.equal(stopped,0);
  assert.equal(host.dataset.experienceMounted,'tools');assert.equal(warnings.length,1);
  dispose();assert.equal(stopped,1);assert.equal(host.dataset.experienceMounted,undefined);
});
