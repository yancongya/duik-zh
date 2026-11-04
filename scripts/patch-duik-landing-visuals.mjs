#!/usr/bin/env node
/** Patch only original child visual slots; keep parent GSAP, sticky and Swiper code. */
import assert from 'node:assert/strict';
import {copyFile,mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {resolve,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(fileURLToPath(new URL('..',import.meta.url)));
const nuxt=join(root,'public/_nuxt'),backup=join(root,'output/landing-before-light');
const source=join(root,'components/home/landing'),destination=join(root,'public/duik-landing-visuals');
const canonical=join(source,'baseline/_nuxt');
const hash='d2ea4a745e1ba64aecc76bbf680458929795d2d8';
const workflow='HomeHowItWorksKP.scss_vue_type_style_index_0_src_true_lang.'+hash+'.js';
const diagrams=[['HomeCapabilitiesDiagramKP','structureVisual'],['HomeCapabilitiesDiagramKP2','controlsVisual'],['HomeCapabilitiesDiagramKP3','animationVisual']];
const digest=value=>createHash('sha256').update(value).digest('hex');
const report={scope:'Workflow visual loader and three Capabilities child diagrams only',files:[],assets:[]};
await mkdir(backup,{recursive:true});await mkdir(destination,{recursive:true});await mkdir(canonical,{recursive:true});

async function preserve(file,current){
  const target=join(backup,file);
  try{await writeFile(target,current,{flag:'wx'});}catch(error){if(error.code!=='EEXIST')throw error;}
  return target;
}
async function patch(file,transform){
  const path=join(nuxt,file),before=await readFile(path,'utf8');
  let original;
  try{original=await readFile(join(canonical,file),'utf8');}catch(error){
    if(error.code!=='ENOENT')throw error;
    original=await readFile(join(backup,file),'utf8');
    assert(!original.includes('duik-landing-visuals'),'canonical baseline must be the pre-patch original');
    await writeFile(join(canonical,file),original,{flag:'wx'});
  }
  assert(!original.includes('duik-landing-visuals'),'never patch from a generated output as canonical source');
  const after=transform(original);
  if(before!==after){await preserve(file,before);await writeFile(path,after);}
  report.files.push({file:'public/_nuxt/'+file,changed:before!==after,sha256:digest(after),baseline:'components/home/landing/baseline/_nuxt/'+file,baselineSha256:digest(original),backup:'output/landing-before-light/'+file});
}

for(const file of ['visual-scenes.mjs','visual-workflow.mjs','visual-capabilities.mjs','visual-capability-tree.mjs','visual-scenes.css','scenes.mjs']){
  await copyFile(join(source,file),join(destination,file));report.assets.push('public/duik-landing-visuals/'+file);
}
await patch(workflow,text=>{
  const oldImport='./vue3-lottie.es.'+hash+'.js',newImport='/duik-landing-visuals/visual-workflow.mjs';
  assert(text.includes('playSegments(F[m],!0)'),'original Workflow segment driver must remain');
  assert(text.includes('scrollTrigger:')&&text.includes('sticky top-0'),'original Workflow scroll/sticky skeleton must remain');
  assert.equal(text.split(oldImport).length-1,1,'exactly one private Lottie loader expected');
  assert.equal(text.split('"animation-link":"/how_it_works.json"').length-1,2,'desktop and mobile visual slots expected');
  return text.replace(oldImport,newImport).replaceAll('"animation-link":"/how_it_works.json"','"animation-link":"/duik-landing-assets/manifest.json"');
});
for(const [name,exportName]of diagrams){
  await patch(name+'.vue_vue_type_script_setup_true_lang.'+hash+'.js',text=>{
    assert(text.includes(name)||text.includes('duik-landing-visuals'),'expected original child visual or our idempotent patch');
    return '// Duik local character scene; parent motion remains in HomeCapabilitiesKP.\nexport {'+exportName+' as _} from "/duik-landing-visuals/visual-capabilities.mjs";\n';
  });
}
await writeFile(join(backup,'visual-patch-report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));

if(process.argv.includes('--verify'))await verifyHost();

async function verifyHost(){
  const url=process.env.LANDING_URL||'http://127.0.0.1:3017/';
  const output=join(root,'output/duik-visual-validation');await mkdir(output,{recursive:true});
  const profile=await mkdtemp(join(tmpdir(),'duik-visual-browser-'));
  const chrome=spawn(process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
    '--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check',
    '--disable-background-networking','--disable-component-update','--enable-unsafe-swiftshader','--use-angle=swiftshader','about:blank'
  ],{stdio:['ignore','ignore','pipe']});
  let socket,session,sequence=0;const pending=new Map(),errors=[],failedRequests=[],requests=[];
  const delay=ms=>new Promise(done=>setTimeout(done,ms));
  const evidence={url,viewport:[1440,1000],workflow:[],capabilities:[],errors,failedRequests};
  const endpoint=await new Promise((done,fail)=>{
    let log='';const timer=setTimeout(()=>fail(Error('Chrome start timeout')),20000);
    chrome.stderr.on('data',chunk=>{log+=chunk;const match=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);done(match[1]);}});chrome.on('error',fail);
  });
  function send(method,params={},sid=session){const id=++sequence;return new Promise((done,fail)=>{
    const timer=setTimeout(()=>{pending.delete(id);fail(Error('CDP timeout: '+method));},25000);
    pending.set(id,{done:value=>{clearTimeout(timer);done(value);},fail:error=>{clearTimeout(timer);fail(error);}});
    socket.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));
  });}
  async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
  async function call(fn,...args){return evaluate('('+fn.toString()+')('+args.map(value=>JSON.stringify(value)).join(',')+')');}
  async function scroll(y){return call(y=>{if(window.lenis)window.lenis.scrollTo(y,{immediate:true,force:true});else window.scrollTo(0,y);window.duikVisualScrollTrigger?.update();},y);}
  async function screenshot(name){const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(output,name+'.png'),Buffer.from(result.data,'base64'));}
  try{
    socket=new WebSocket(endpoint);await new Promise((done,fail)=>{socket.onopen=done;socket.onerror=fail;});
    socket.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const item=pending.get(data.id);if(item){pending.delete(data.id);data.error?item.fail(Error(data.error.message)):item.done(data.result);}return;}
      if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.exception?.description||data.params.exceptionDetails.text);
      if(data.method==='Runtime.consoleAPICalled'&&data.params.type==='error')errors.push(data.params.args.map(arg=>arg.value||arg.description).join(' '));
      if(data.method==='Network.responseReceived'&&data.params.response.status>=400)failedRequests.push({url:data.params.response.url,status:data.params.response.status});
      if(data.method==='Network.requestWillBeSent')requests.push(data.params.request.url);
    };
    const target=await send('Target.createTarget',{url:'about:blank'},null);session=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true},null)).sessionId;
    await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
    await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
    await send('Page.navigate',{url});await delay(1800);
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:680,y:390});
    for(let attempt=0;attempt<30;attempt++){
      const found=await call(()=>{const section=document.querySelector('.home-how-it-works-kp');if(section){window.scrollTo(0,section.getBoundingClientRect().top+scrollY+innerHeight*.4);return true;}window.scrollBy(0,600);return false;});
      await delay(200);if(found)break;
    }
    for(let attempt=0;attempt<80;attempt++){if(await call(()=>!!document.querySelector('.duik-workflow-visual')))break;await delay(150);}
    assert(await call(()=>!!document.querySelector('.duik-workflow-visual')),'Workflow must mount its new visual in the actual host');
    await call(async path=>{window.duikVisualScrollTrigger=(await import(path)).ScrollTrigger;return true;},'/_nuxt/ScrollTrigger.'+hash+'.js');
    await evaluate('window.duikVisualScrollTrigger.refresh()');await delay(300);
    const workflowTrigger=await call(()=>{const section=document.querySelector('.home-how-it-works-kp'),wrapper=section.closest('.deferred-wrapper');const trigger=window.duikVisualScrollTrigger.getAll().find(item=>item.animation?.duration()>3&&(item.trigger===section||item.trigger===wrapper));return trigger?{start:trigger.start,end:trigger.end,duration:trigger.animation.duration(),height:section.getBoundingClientRect().height,sticky:getComputedStyle(section.firstElementChild).position}:null;});
    assert(workflowTrigger,'original Workflow ScrollTrigger must remain');assert.equal(workflowTrigger.sticky,'sticky');evidence.workflowTrigger=workflowTrigger;
    for(let index=0;index<3;index++){
      await call(()=>window.duikVisualScrollTrigger.refresh());
      const current=await call(()=>{const section=document.querySelector('.home-how-it-works-kp'),wrapper=section.closest('.deferred-wrapper'),trigger=window.duikVisualScrollTrigger.getAll().find(item=>item.animation?.duration()>3&&(item.trigger===section||item.trigger===wrapper));return {start:trigger.start,end:trigger.end,duration:trigger.animation.duration()};});
      const y=current.start+(current.end-current.start)*(1+index+.4)/current.duration;
      await scroll(y);await delay(550);
      const state=await call(()=>{const node=document.querySelector('.duik-workflow-visual'),box=node.getBoundingClientRect();return {step:Number(node.dataset.duikWorkflowStep),visible:box.top<innerHeight&&box.bottom>0,caption:node.querySelector('[data-active="true"] figcaption')?.innerText,loaded:[...node.querySelectorAll('img')].every(image=>image.complete&&image.naturalWidth>0),box:{x:box.x,y:box.y,width:box.width,height:box.height}};});
      assert.equal(state.step,index,'original scroll must drive visual phase '+index);assert(state.loaded);assert(state.visible);evidence.workflow.push(state);await screenshot('workflow-'+index);
    }
    await call(()=>document.querySelector('.kp-home-capabilities-wrap')?.scrollIntoView());await delay(600);
    for(let attempt=0;attempt<60;attempt++){if(await call(()=>document.querySelectorAll('[data-duik-capability-visual]').length===3))break;await delay(150);}
    const capabilityTrigger=await call(()=>{const item=window.duikVisualScrollTrigger.getById('capabilities-master-trigger');return item?{start:item.start,end:item.end}:null;});
    assert(capabilityTrigger,'original Capabilities master ScrollTrigger must remain');evidence.capabilityTrigger=capabilityTrigger;
    const bestPositions=Object.fromEntries(['structure','controls','animation'].map(id=>[id,{visibleWidth:-1,y:capabilityTrigger.start}]));
    for(let sample=0;sample<=20;sample++){
      const y=capabilityTrigger.start+(capabilityTrigger.end-capabilityTrigger.start)*sample/25;
      await scroll(y);await delay(120);
      const visible=await call(()=>Object.fromEntries([...document.querySelectorAll('[data-duik-capability-visual]')].map(node=>{const box=node.getBoundingClientRect();return [node.dataset.duikCapabilityVisual,{visibleWidth:Math.max(0,Math.min(innerWidth,box.right)-Math.max(0,box.left)),left:box.left,top:box.top,width:box.width}];})));
      for(const id of Object.keys(bestPositions)){const result=visible[id];assert(result,'capability child '+id+' must be mounted');if(result.visibleWidth>bestPositions[id].visibleWidth)bestPositions[id]={...result,y};}
    }
    for(const id of ['structure','controls','animation']){
      const best=bestPositions[id];await scroll(best.y);await delay(350);
      const state=await call(id=>{const node=document.querySelector('[data-duik-capability-visual="'+id+'"]');return {id,text:node.innerText,images:[...node.querySelectorAll('img')].map(image=>({src:image.getAttribute('src'),loaded:image.complete&&image.naturalWidth>0})),hasOldMarketing:/Marketing|Sales|Regional|\bHR\b/.test(node.innerText)};},id);
      assert(best.visibleWidth>400,id+' visual must be visible in the original horizontal scroll');assert(state.images.every(image=>image.loaded));assert(!state.hasOldMarketing);
      evidence.capabilities.push({...state,...best});await screenshot('capability-'+id);
      if(id!=='structure'){
        await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:4,y:4});await delay(650);
        const target=await call(id=>{const figure=document.querySelector('[data-duik-capability-visual="'+id+'"] figure[tabindex]'),image=figure.querySelector('.duik-scene-alternate'),box=figure.getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2,opacity:Number(getComputedStyle(image).opacity)};},id);
        await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:target.x,y:target.y});await delay(700);
        let opacity=0;
        for(let attempt=0;attempt<25;attempt++){opacity=await call(id=>Number(getComputedStyle(document.querySelector('[data-duik-capability-visual="'+id+'"] .duik-scene-alternate')).opacity),id);if(opacity>.99)break;await delay(100);}
        assert(target.opacity<.01);assert(opacity>.99,'hover must reveal the alternate real pose');evidence.capabilities.at(-1).hover={before:target.opacity,after:opacity};await screenshot('capability-'+id+'-hover');
      }
    }
    evidence.oldWorkflowRequested=requests.some(request=>request.includes('/how_it_works.json'));
    assert(!evidence.oldWorkflowRequested,'old AI-generation Lottie must not load');
    evidence.visualResourceFailures=failedRequests.filter(item=>/duik-landing-assets|duik-landing-visuals/.test(item.url));
    assert.equal(evidence.visualResourceFailures.length,0);
    assert.equal(errors.length,0,'host must not report browser errors or hydration mismatches');
    evidence.passed=true;
  }catch(error){evidence.passed=false;evidence.failure=error.stack;process.exitCode=1;try{await screenshot('failure');}catch{}}
  finally{await writeFile(join(output,'report.json'),JSON.stringify(evidence,null,2)+'\n');console.log(JSON.stringify({output,...evidence},null,2));try{await send('Browser.close',{},null);}catch{}socket?.close();chrome.kill('SIGTERM');}
}
