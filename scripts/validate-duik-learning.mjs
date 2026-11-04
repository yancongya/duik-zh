// Targeted acceptance of the learning chapter on the real root page.
import {readFile} from 'node:fs/promises';
// The generated data: module has no directory for relative static imports.
const base=(await readFile(new URL('./validate-duik-experience.mjs',import.meta.url),'utf8'))
  .replace(/^(import\b[^\n]*?\bfrom\s*)([\'"])(\.[^\'"\n]+)\2/gm,
    (_statement,prefix,_quote,path)=>prefix+JSON.stringify(new URL(path,import.meta.url).href));
const cut=base.indexOf('  report.initial=');
if(cut<0)throw Error('The host browser driver changed.');
let source=base.slice(0,cut).replace("resolve('output/duik-experience-check'+(inspect?'/inspect':''))","resolve('output/playwright/learning-paths')");
source+=String.raw`
  stage='learning';
  await step('Five tasks keep all sixteen document links with one clear next action',async()=>{
    await reveal('[data-duik-guide=learning]');
    report.learning=await evaluate('(()=>{const r=document.querySelector("[data-duik-guide=learning]");return {tabs:r.querySelectorAll("[data-guide-path]").length,next:r.querySelectorAll("[data-guide-next]").length,links:[...r.querySelectorAll("[data-guide-reading]")].map(a=>a.getAttribute("href")),panels:r.querySelectorAll("[data-guide-panel]:not([hidden])").length,reference:r.querySelector("[data-guide-reference]").open}})()');
    assert.equal(report.learning.tabs,5);assert.equal(report.learning.next,5);assert.equal(report.learning.links.length,16);assert.equal(report.learning.panels,1);assert.equal(report.learning.reference,false);
    await shot('01-learning-entry');
  });
  await step('Trusted pointer selection gives a finite 180ms transition and correct reading route',async()=>{
    await evaluate('document.querySelector("[data-duik-guide=learning]").addEventListener("click",e=>{if(!e.target.closest("[data-guide-path]"))return;const r=e.currentTarget;window.__learningClick={trusted:e.isTrusted,active:r.dataset.guideActive,input:r.dataset.guideInput,motion:r.dataset.guideMotion,animations:r.querySelector("[data-guide-panel]:not([hidden])").getAnimations().map(a=>({duration:a.effect.getTiming().duration,keyframes:a.effect.getKeyframes().map(k=>({transform:k.transform,opacity:k.opacity}))}))}})');
    await click('[data-guide-path=rig]');report.pointer=await evaluate('window.__learningClick');
    assert.equal(report.pointer.trusted,true);assert.equal(report.pointer.active,'rig');assert.equal(report.pointer.input,'pointer');assert.equal(report.pointer.animations[0]?.duration,180);
    assert.equal(await evaluate('document.querySelector("[data-guide-next=rig]").getAttribute("href")'),'/docs/guide/bones');
    await delay(250);assert.equal(await evaluate('document.querySelector("[data-duik-guide=learning]").dataset.guideMotion'),'idle');
    await click('[data-guide-path=tools]');assert.equal(await text('[data-guide-panel=tools] .duik-guide-route h4'),'或直接查看');
    assert.equal(await evaluate('document.querySelectorAll("[data-guide-panel=tools] ul a").length'),3);
    await shot('02-learning-tools');
  });
  await step('Arrow and Home/End keys switch tasks immediately and keep roving focus',async()=>{
    await focus('[data-guide-path=tools]');await key('Home');
    assert.equal(await evaluate('document.activeElement.dataset.guidePath'),'install');
    for(const id of ['rig','animation','tools','api']){await key('ArrowDown');assert.equal(await evaluate('document.activeElement.dataset.guidePath'),id);}
    assert.equal(await evaluate('document.querySelector("[data-duik-guide=learning]").dataset.guideInput'),'keyboard');
    assert.equal(await evaluate('Array.from(document.querySelectorAll("[data-guide-path]")).filter(el=>el.tabIndex===0).length'),1);
    assert.equal(await evaluate('document.querySelector("[data-guide-panel=api]").getAnimations().length'),0);
    await key('Home');await key('End');assert.equal(await evaluate('document.activeElement.dataset.guidePath'),'api');
  });
  await step('Reduced motion leaves task selection and original official reference available',async()=>{
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    try{
      await click('[data-guide-path=install]');assert.equal(await evaluate('document.querySelector("[data-duik-guide=learning]").dataset.guideMotion'),'reduced');
      assert.equal(await evaluate('document.querySelector("[data-guide-panel=install]").getAnimations().length'),0);
      await click('[data-guide-reference]>summary');
      await waitFor('document.querySelector(".duik-guide-official-preview img").complete&&document.querySelector(".duik-guide-official-preview img").naturalWidth===292','official panel image');
      assert.equal(await evaluate('document.querySelector(".duik-guide-official-preview img").height/document.querySelector(".duik-guide-official-preview img").width>1.8'),true);
      assert((await text('.duik-guide-official-preview figcaption')).includes('GFDL 1.3'));
      await click('[data-guide-reference]>summary');
    }finally{await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});}
  });
  await step('Learning disposal removes its handlers and remount restores task selection',async()=>{
    await evaluate('(async()=>{const {mountGuide}=await import("/duik-experience/guide-experience.mjs");window.__learningCleanup=mountGuide(document.querySelector("[data-duik-guide=learning]"),"learning");window.__learningCleanup()})()');
    const selected=await evaluate('document.querySelector("[data-duik-guide=learning]").dataset.guideActive');
    await click('[data-guide-path=api]');assert.equal(await evaluate('document.querySelector("[data-duik-guide=learning]").dataset.guideActive'),selected);
    await evaluate('(async()=>{const {mountGuide}=await import("/duik-experience/guide-experience.mjs");window.__learningCleanup=mountGuide(document.querySelector("[data-duik-guide=learning]"),"learning")})()');
    await click('[data-guide-path=rig]');assert.equal(await evaluate('document.querySelector("[data-duik-guide=learning]").dataset.guideActive'),'rig');
  });
  report.rootErrors=[...errors];report.rootFailedRequests=[...failedRequests];
  await step('The primary reading link opens the real local Nextra document',async()=>{
    const destination=new URL('/docs/guide/bones',url);const response=await fetch(destination,{signal:AbortSignal.timeout(60000)});assert.equal(response.status,200);
    stage='learning-document';await click('[data-guide-next=rig]');
    await waitFor('location.pathname==="/docs/guide/bones"&&!!document.querySelector("h1")','Nextra document');
    report.document=await evaluate('({path:location.pathname,title:document.title,heading:document.querySelector("h1").textContent})');
    assert(report.document.title.includes('Duik'));await shot('03-learning-document');
  });
  report.documentErrors=errors.filter(x=>x.stage==='learning-document');report.documentFailedRequests=failedRequests.filter(x=>x.stage==='learning-document');
  report.passed=failures.length===0&&report.rootErrors.length===0&&report.rootFailedRequests.length===0&&report.documentErrors.length===0;
  if(!report.passed)process.exitCode=1;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;try{await shot('failure');}catch{}}
finally{await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,checks,failures,errors,failedRequests,failure:report.failure,output:out},null,2));try{await send('Browser.close',{},null);}catch{}socket?.close();child.kill('SIGTERM');}
`;
await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
