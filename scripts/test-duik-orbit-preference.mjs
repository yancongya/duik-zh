import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import ts from 'typescript';
import {orbitDocumentationFor} from '../components/home/landing/orbit.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const wrapperSource=await read('components/home/landing/orbit-vue.mjs');
const childSource=await read('public/_nuxt/duik-orbit-template.js');
const payload=JSON.parse(await read('public/_payload.json'));
const blok={
  imgsTestimonial:payload[366].map(index=>({filename:payload[payload[index].filename]})),
  listItemTestimonial:payload[405].map(index=>({title:payload[payload[index].title],description:payload[payload[index].description]})),
};
assert.equal(blok.imgsTestimonial.length,8);
assert.equal(blok.listItemTestimonial.length,5);

// Agreed seam: actual wrapper mount/media event/render/unmount -> actual
// captured child progress watcher, computed selection, selector and doc link.
// Adapt only VNode helpers, native media events and the unrelated details
// loader. No browser layout, focus delivery or visual/GPU acceptance is claimed.
function executableWrapper(){
  const ast=ts.createSourceFile('orbit-vue.mjs',wrapperSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  const edits=[];
  function visit(node){
    if(ts.isImportDeclaration(node))edits.push({start:node.getStart(ast),end:node.end,text:''});
    if(ts.isExportAssignment(node))edits.push({start:node.getStart(ast),end:node.expression.getStart(ast),text:'const exported='});
    if(ts.isCallExpression(node)&&node.expression.kind===ts.SyntaxKind.ImportKeyword){
      assert.equal(node.arguments[0].text,'./reuse-demo.mjs','Only the secondary details loader is outside this seam');
      edits.push({start:node.getStart(ast),end:node.end,text:'loadDetails()'});
    }
    ts.forEachChild(node,visit);
  }
  visit(ast);let source=wrapperSource;
  for(const edit of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,edit.start)+edit.text+source.slice(edit.end);
  return source+'\nexported';
}

const childAST=ts.createSourceFile('orbit-template.js',childSource,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
const initializers=new Map();let updateProgress,selectorProps;
function collectChild(node){
  if(ts.isVariableDeclaration(node)&&['E','H','V','I','$','L','g','P','b','de'].includes(node.name.getText(childAST)))initializers.set(node.name.getText(childAST),node.initializer.getText(childAST));
  if(ts.isCallExpression(node)&&node.expression.getText(childAST)==='B'&&node.arguments[0]?.getText(childAST)==='()=>d.mergedProgress')updateProgress=node.arguments[1].getText(childAST);
  if(ts.isObjectLiteralExpression(node)&&node.properties.some(property=>property.name?.getText(childAST)==='"data-duik-orbit-step"'))selectorProps=node.getText(childAST);
  ts.forEachChild(node,collectChild);
}
collectChild(childAST);
const docRender=childSource.match(/s\("a",\{class:"duik-orbit-doc"[\s\S]+?\["href"\]\)/)?.[0];
assert(updateProgress&&selectorProps&&docRender,'The original selection, keyboard and document expressions must exist');

function fixture(t,{progress=.7,reduced=false}={}){
  const callbacks=new Set(),emitted=[],scrollCalls=[];
  const preference={matches:reduced,addEventListener(type,callback){assert.equal(type,'change');callbacks.add(callback);},removeEventListener(type,callback){assert.equal(type,'change');callbacks.delete(callback);}};
  let disposed=false,detailsDisposals=0;
  const wrapper=runInNewContext(executableWrapper(),{
    element:(tag,props,children)=>({tag,props,children}),component:(tag,props)=>({tag,props}),
    OriginalOrbit:'OriginalOrbit',orbitClass:'orbit',orbitDetailsMarkup:'',
    matchMedia:query=>{assert.equal(query,'(prefers-reduced-motion: reduce)');return preference;},
    loadDetails:()=>Promise.resolve({mountReuse:()=>()=>{detailsDisposals++;}}),console,
  });
  const instance={...wrapper.data(),isMerged:true,mergedProgress:progress,blok,$el:{isConnected:true},$emit:(...args)=>emitted.push(args)};
  const renderedProps=()=>wrapper.render.call(instance).children[0].props;
  const context={
    d:{...renderedProps()},c:value=>({value}),C:get=>({get value(){return get();}}),
    S:{value:true},A:{value:0},u:{value:null},window:{scrollTo:options=>scrollCalls.push(options),lenis:{scrollTo:(...args)=>scrollCalls.push(args)}},
    J:{getById:()=>null},f:{to(){assert.fail('The merged manual selector must not start a standalone tween');}},
    ie:(event,index)=>{assert.equal(event,'go-to-step');renderedProps().onGoToStep(index);},
    duikOrbitDocumentFor:orbitDocumentationFor,s:(tag,props,label)=>({tag,props,label}),k:value=>value,
  };
  for(const name of ['E','H','V','I','$','L','g','P','b','de']){
    assert(initializers.has(name),'Missing captured child binding '+name);
    context[name]=runInNewContext('('+initializers.get(name)+')',context);
  }
  const onProgress=runInNewContext('('+updateProgress+')',context);
  const view=()=>{
    Object.assign(context.d,renderedProps());onProgress(context.d.mergedProgress);
    const index=context.b.value,doc=runInNewContext(docRender,context);
    return {index,title:context.H.value[index]?.title,href:doc.props.href,label:doc.label,progress:context.d.mergedProgress};
  };
  const destroy=()=>{if(disposed)return;disposed=true;instance.$el.isConnected=false;wrapper.beforeUnmount.call(instance);};
  t.after(destroy);
  return {
    emitted,scrollCalls,view,destroy,preference,
    async mount(){wrapper.mounted.call(instance);await Promise.resolve();await Promise.resolve();},
    setReduced(value){preference.matches=value;for(const callback of [...callbacks])callback({type:'change',matches:value});},
    setProgress(value){instance.mergedProgress=value;},
    choose(index,key='Enter'){
      view();const props=runInNewContext('('+selectorProps+')',{...context,i:index});
      assert.equal(props.role,'button');assert.equal(props.tabindex,0);
      let prevented=false;props.onKeydown({key,preventDefault(){prevented=true;}});
      const result=view();
      const updated=runInNewContext('('+selectorProps+')',{...context,i:index});
      return {...result,prevented,pressed:updated['aria-pressed']};
    },
    get listenerCount(){return callbacks.size;},get detailsDisposals(){return detailsDisposals;},
  };
}

test('entering reduced motion retains the visible script-library selection and document',async t=>{
  const f=fixture(t);await f.mount();
  assert.equal(f.view().index,2);
  assert.equal(f.view().href,'/docs/guide/tools/scripting/library');
  f.setReduced(true);
  assert.equal(f.view().index,2,'Changing motion preference must not replace the currently selected module');
  assert.equal(f.view().href,'/docs/guide/tools/scripting/library');
  assert.deepEqual(f.emitted,[]);
  assert.deepEqual(f.scrollCalls,[]);
});

test('the original early selection boundaries survive the switch into manual mode',async t=>{
  for(const [progress,index]of [[.45,0],[.5,0],[.516,0],[.517,1],[.617,2],[.717,3],[.817,4],[1,4],[1.4,4]]){
    await t.test('progress '+progress,async t=>{
      const f=fixture(t,{progress});await f.mount();
      const before=f.view();assert.equal(before.index,index,'Known original selection boundary');
      f.setReduced(true);
      assert.equal(f.view().index,before.index);
      assert.equal(f.view().href,before.href);
      assert.equal(f.view().title,before.title);
      assert.deepEqual(f.emitted,[]);
    });
  }
});

test('an initially reduced mount inherits the current selection rather than defaulting to the first item',async t=>{
  const f=fixture(t,{progress:.817,reduced:true});await f.mount();
  assert.equal(f.view().index,4);
  assert.equal(f.view().href,'/docs/guide/sanity');
  assert.deepEqual(f.emitted,[]);
  assert.deepEqual(f.scrollCalls,[]);
});

test('all five original selectors support Enter and Space with matching visual state and document',async t=>{
  const guides=[
    '/docs/guide/oco',
    '/docs/guide/animation/anim-library',
    '/docs/guide/tools/scripting/library',
    '/docs/guide/notes',
    '/docs/guide/sanity',
  ];
  const titles=['复用结构','收藏动作','整理脚本','留下笔记','检查工程'];
  const f=fixture(t,{reduced:true});await f.mount();
  for(const key of ['Enter',' '])for(const index of [4,0,3,1,2]){
    const selected=f.choose(index,key);
    assert(selected.prevented,'Button activation must not trigger native page scroll');
    assert(selected.pressed,'The original aria-pressed state follows manual selection');
    assert.equal(selected.index,index);
    assert.equal(selected.title,titles[index]);
    assert.equal(selected.href,guides[index]);
  }
  assert.deepEqual(f.emitted,[],'Reduced selectors must never call the parent scroll handler');
  assert.deepEqual(f.scrollCalls,[]);
});

test('duplicate reduced preference notifications do not overwrite a manual choice with parent progress',async t=>{
  const f=fixture(t);await f.mount();f.setReduced(true);f.choose(4);
  f.setProgress(.5);
  f.setReduced(true);f.setReduced(true);
  assert.equal(f.view().index,4);
  assert.equal(f.view().href,'/docs/guide/sanity');
  assert.deepEqual(f.emitted,[]);
  assert.deepEqual(f.scrollCalls,[]);
});

test('leaving reduced mode resumes current parent progress without scrolling to the manual choice',async t=>{
  const f=fixture(t);await f.mount();f.setReduced(true);f.choose(4);
  f.setProgress(.6);f.setReduced(false);
  assert.equal(f.view().progress,.6);
  assert.equal(f.view().index,1);
  assert.equal(f.view().href,'/docs/guide/animation/anim-library');
  assert.deepEqual(f.emitted,[],'Preference restoration itself does not request navigation');
  assert.deepEqual(f.scrollCalls,[]);

  f.choose(3);
  assert.deepEqual(f.emitted,[['go-to-step',3]],'Ordinary selector input still belongs to the original parent');
  assert.equal(f.view().index,1,'No invented local progress replaces parent-controlled motion');
  f.setProgress(.8);
  assert.equal(f.view().index,3);
  f.setReduced(true);
  assert.equal(f.view().index,3,'A later manual-mode entry inherits the new parent item, not the previous manual choice');
  assert.deepEqual(f.emitted,[['go-to-step',3]]);
});

test('unmount removes the preference listener and keeps the existing details cleanup',async t=>{
  const f=fixture(t);await f.mount();
  assert.equal(f.listenerCount,1);
  f.setReduced(true);f.choose(4);f.destroy();
  assert.equal(f.listenerCount,0);
  assert.equal(f.detailsDisposals,1);
  f.setReduced(false);
  assert.equal(f.view().index,4,'An event after unmount cannot mutate the former manual state');
  assert.deepEqual(f.emitted,[]);
  assert.deepEqual(f.scrollCalls,[]);
});
