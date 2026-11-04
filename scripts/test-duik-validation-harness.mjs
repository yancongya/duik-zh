import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

const wrapperNames=['workflow','api','learning','reuse','motion-scenes'];
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const host=await readFile(new URL('./validate-duik-experience.mjs',import.meta.url),'utf8');
const reuseFragment=await readFile(new URL('./validate-duik-reuse-checks.inc',import.meta.url),'utf8');

// Run only the existing source builder. Never evaluate its browser driver:
// replace the final data: import with a return before invoking this function.
async function buildDriver(name){
  const url=new URL('./validate-duik-'+name+'.mjs',import.meta.url);
  let builder=await readFile(url,'utf8');
  const launch="await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));";
  assert.equal(builder.split(launch).length,2,'Expected one isolated driver launch');
  builder=builder.replace("import {readFile} from 'node:fs/promises';",'')
    .replaceAll('import.meta.url','moduleURL').replace(launch,'return source;');
  return new AsyncFunction('readFile','Buffer','moduleURL',builder)(readFile,Buffer,url.href);
}

function staticImports(source){
  const tree=ts.createSourceFile('driver.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  assert.equal(tree.parseDiagnostics.length,0,'Generated browser driver must remain valid JavaScript');
  return tree.statements.filter(ts.isImportDeclaration).map(node=>node.getText(tree));
}

test('negative control: the original relative import cannot link from a data URL',async()=>{
  const imports=staticImports(host).join('\n');
  await assert.rejects(import('data:text/javascript;base64,'+Buffer.from(imports).toString('base64')),
    error=>error.code==='ERR_UNSUPPORTED_RESOLVE_REQUEST');
});

for(const name of wrapperNames)test(name+' driver imports link without starting its browser body',async()=>{
  const driver=await buildDriver(name),imports=staticImports(driver);
  assert.equal(imports.length,staticImports(host).length);
  const imported=await import('data:text/javascript;base64,'+Buffer.from(imports.join('\n')+'\nexport {guidePaths};').toString('base64'));
  assert.equal(imported.guidePaths.length,5);
  assert(driver.includes("await send('Page.navigate',{url})"),'Real browser body is retained, not executed here');
});

function reuseLifecycle(source){
  const start=source.indexOf('  const reuseDetails=');
  const end=source.indexOf("  await reuseStep('Reuse ",start);
  assert(start>=0&&end>start,'Reuse steps need a shared real-details lifecycle');
  return source.slice(start,end);
}

async function exerciseReuse(source,{fail=false,skip=false,modalFailure=false}={}){
  let open=false,invoked=false,dialogOpen=false,references=[];
  const events=[];
  const details='#reuse > .duik-orbit-details';
  const query=selector=>'document.querySelector('+JSON.stringify(selector)+')';
  const evaluate=async expression=>{
    if(expression===query('[data-reuse-dialog]')+'?.open')return dialogOpen;
    if(expression.includes('querySelectorAll("#reuse [data-reuse-reference][open]")'))return [...references];
    assert.equal(expression,query(details)+'.open');
    return open;
  };
  const click=async selector=>{
    if(dialogOpen)throw Error('modal blocks summary');
    if(selector==='[data-reuse-panel="scripts"] [data-reuse-reference] > summary'){
      references=[];events.push('close-reference');return;
    }
    assert.equal(selector,details+' > summary');
    open=!open;events.push(open?'open':'close');
  };
  const waitFor=async expression=>{
    assert.equal(expression,query(details)+'.open==='+open);
    events.push('settled:'+open);
  };
  const step=async(name,fn)=>{if(!skip)await fn();};
  const key=async value=>{assert.equal(value,'Escape');dialogOpen=false;events.push('close-dialog');};
  const reuseIn=(id,child)=>'[data-reuse-panel="'+id+'"] '+child;
  const revealHorizontal=async selector=>{assert.equal(selector,'#reuse');events.push('reveal');};
  const run=new AsyncFunction('step','revealHorizontal','assert','evaluate','query','click','waitFor','key','reuseIn',
    reuseLifecycle(source)+'\nreturn reuseStep;');
  const reuseStep=await run(step,revealHorizontal,assert,evaluate,query,click,waitFor,key,reuseIn);
  let error;
  try{await reuseStep('case',async()=>{assert(open);invoked=true;events.push('body');if(modalFailure){dialogOpen=true;references=['scripts'];}if(fail||modalFailure)throw Error('fixture failure');});}
  catch(value){error=value;}
  return {open,invoked,events,error,dialogOpen,references};
}

function reducedCallback(source){
  const tree=ts.createSourceFile('driver.mjs',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
  let result;
  function visit(node){
    if(ts.isCallExpression(node)&&node.expression.getText(tree)==='reuseStep'&&
      node.arguments[0]?.text==='Reduced motion retains save/use and keyboard tabs with no moving transfer')result=node.arguments[1].getText(tree);
    ts.forEachChild(node,visit);
  }
  visit(tree);assert(result);return result;
}

for(const [name,source] of [['host',host],['reuse fragment',reuseFragment]]){
  test(name+' opens and closes the actual detail around selected Reuse checks',async()=>{
    const result=await exerciseReuse(source);
    assert.equal(result.error,undefined);assert.equal(result.open,false);assert.equal(result.invoked,true);
    assert.deepEqual(result.events,['reveal','open','settled:true','body','close','settled:false']);
  });
  test(name+' closes the detail after failure and does nothing for filtered-out checks',async()=>{
    const failure=await exerciseReuse(source,{fail:true});
    assert.equal(failure.error?.message,'fixture failure');assert.equal(failure.open,false);
    assert.deepEqual(failure.events.slice(-2),['close','settled:false']);
    const skipped=await exerciseReuse(source,{skip:true});
    assert.equal(skipped.error,undefined);assert.equal(skipped.invoked,false);assert.deepEqual(skipped.events,[]);
  });
  test(name+' dismisses a modal and inner reference before closing a failed workbench',async()=>{
    const failure=await exerciseReuse(source,{modalFailure:true});
    assert.equal(failure.error?.message,'fixture failure');assert.equal(failure.open,false);
    assert.equal(failure.dialogOpen,false);assert.deepEqual(failure.references,[]);
    assert.deepEqual(failure.events.slice(-4),['close-dialog','close-reference','close','settled:false']);
  });
  test(name+' reduced-motion check selects its own tab and restores preference after failure',async()=>{
    const media=[],clicks=[];
    const send=async(method,params)=>{assert.equal(method,'Emulation.setEmulatedMedia');media.push(params.features[0].value);};
    const click=async selector=>{clicks.push(selector);throw Error('fixture click failure');};
    await assert.rejects(new AsyncFunction('send','click','reuseIn','await ('+reducedCallback(source)+')();')(
      send,click,(id,child)=>'[data-reuse-panel="'+id+'"] '+child),/fixture click failure/);
    assert.deepEqual(clicks,['[data-reuse-tab="structure"]']);
    assert.deepEqual(media,['reduce','no-preference']);
  });
}

test('host and focused Reuse checks share details and snapshot-state assertions',()=>{
  const start=host.indexOf("{\n  const reusePanel="),end=host.indexOf("    await step('The closing story",start);
  const fragmentStart=reuseFragment.indexOf("{\n  const reusePanel=");
  assert(start>=0&&end>start&&fragmentStart>=0);
  assert.equal(host.slice(start,end).trim(),reuseFragment.slice(fragmentStart).trim());
  const source=host.slice(start,end);
  assert.equal((source.match(/await reuseStep\(/g)||[]).length,7);
  assert(!source.includes('querySelectorAll("#reuse details[open]")'));
  assert(source.includes('dataset.reuseApplied'));
  assert(source.includes('dataset.reuseAppliedFrame'));
});
