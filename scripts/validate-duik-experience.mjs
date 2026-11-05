// Targeted acceptance of the actual published host. One 1440x1000 desktop only.
// CDP input is real. Scroll through the retained Lenis owner, never native jumps.
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
import {guidePaths} from '../components/home/landing/guide-experience.mjs';
const url=process.env.LANDING_URL||'http://127.0.0.1:3017/';
const inspect=process.argv.includes('--inspect'),out=process.env.LANDING_CHECK_OUTPUT?resolve(process.env.LANDING_CHECK_OUTPUT):resolve('output/duik-experience-check'+(inspect?'/inspect':''));
await mkdir(out,{recursive:true});
const profile=await mkdtemp(join(tmpdir(),'duik-experience-browser-'));
const child=spawn(process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-unsafe-swiftshader','--use-angle=swiftshader','about:blank'],{stdio:['ignore','ignore','pipe']});
let socket,session,seq=0,stage='root';const pending=new Map(),errors=[],failedRequests=[],requests=[],documentResponses=[],checks=[],failures=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const endpoint=await new Promise((resolve,reject)=>{let log='';const timer=setTimeout(()=>reject(Error('Chrome startup timeout')),20000);child.stderr.on('data',d=>{log+=d;const match=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);resolve(match[1]);}});child.on('error',reject);});
function send(method,params={},sid=session){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},25000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject:error=>{clearTimeout(timer);reject(error);}});socket.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));});}
async function evaluate(expression){const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);return result.result.value;}
async function shot(name){const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(out,name+'.png'),Buffer.from(result.data,'base64'));}
const query=selector=>'document.querySelector('+JSON.stringify(selector)+')';
const text=selector=>evaluate(query(selector)+'.textContent');
const rect=selector=>evaluate(query(selector)+'.getBoundingClientRect().toJSON()');
async function scroll(y){await evaluate('window.lenis.scrollTo('+JSON.stringify(Math.max(0,y))+',{immediate:true,force:true});new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)))');}
async function stableHit(selector){return evaluate('(async()=>{const e='+query(selector)+';if(!e)throw Error("Missing target: "+'+JSON.stringify(selector)+');let last,stable=0,lastHit;for(let frame=0;frame<90;frame++){await new Promise(requestAnimationFrame);const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);stable=last&&Math.abs(r.x-last.x)<.15&&Math.abs(r.y-last.y)<.15?stable+1:0;last={x:r.x,y:r.y};lastHit={rect:r.toJSON(),point:{x,y},hit:h?{tag:h.tagName,class:h.className,id:h.id}:null,valid:!!(h&&e.contains(h)),stable,frame};if(stable>=2&&lastHit.valid&&x>0&&x<innerWidth&&y>0&&y<innerHeight)return lastHit;}throw Error("Unstable or obstructed hit target: "+'+JSON.stringify(selector)+'+" "+JSON.stringify(lastHit))})()');}
async function revealHorizontal(selector){
  const info=await evaluate('(async()=>{const {ScrollTrigger}=await import("/_nuxt/ScrollTrigger.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js");const t=ScrollTrigger.getById("capabilities-master-trigger");if(!t)throw Error("Missing capabilities-master-trigger");return {start:t.start,end:t.end}})()');
  let low=info.start,high=info.end,best=null;
  for(let i=0;i<22;i++){
    const y=(low+high)/2;await scroll(y);const r=await rect(selector),delta=r.x+r.width/2-720;
    if(!best||Math.abs(delta)<best.delta)best={y,delta:Math.abs(delta),rect:r};
    if(Math.abs(delta)<1.5)break;if(delta>0)low=y;else high=y;
  }
  await scroll(best.y);return {trigger:info,...best,hit:await stableHit(selector)};
}
const revealMotion=kind=>revealHorizontal('[data-motion-demo="'+kind+'"]');
async function reveal(selector){
  // Do not scroll an already reachable control. Re-solving the entire pinned
  // gallery before every click can outlast a one-shot animation and turn a
  // requested Stop into a new Play, which is a harness race, not user input.
  const reachable=await evaluate('(()=>{const e='+query(selector)+';if(!e)return false;const r=e.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2,h=document.elementFromPoint(x,y);return r.width>0&&r.height>0&&x>0&&x<innerWidth&&y>0&&y<innerHeight&&!!h&&e.contains(h)})()');
  if(reachable)return stableHit(selector);
  if(await evaluate('!!'+query(selector)+'?.closest("dialog[open]")'))return stableHit(selector);
  if(await evaluate('!!'+query(selector)+'?.closest("#reuse")')){await revealHorizontal("#reuse");return stableHit(selector);}
  const motion=await evaluate(query(selector)+'?.closest("[data-motion-demo]")?.dataset.motionDemo');
  if(motion){const r=await rect(selector);if(r.x<4||r.right>1436||r.y<4||r.bottom>996)await revealMotion(motion);}
  else {const y=await evaluate('(()=>{const r='+query(selector)+'.getBoundingClientRect();return scrollY+r.y-Math.min(380,(innerHeight-r.height)/2)})()');await scroll(y);}
  return stableHit(selector);
}
async function click(selector){const hit=await reveal(selector);await send('Input.dispatchMouseEvent',{type:'mouseMoved',...hit.point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...hit.point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...hit.point});await delay(160);return hit;}
async function key(keyName,code=keyName){const virtual={Home:36,End:35,ArrowLeft:37,ArrowUp:38,ArrowRight:39,ArrowDown:40,Enter:13,Escape:27}[keyName];await send('Input.dispatchKeyEvent',{type:'keyDown',key:keyName,code,...(virtual?{windowsVirtualKeyCode:virtual,nativeVirtualKeyCode:virtual}:{}),...(keyName==='Enter'?{text:'\r',unmodifiedText:'\r'}:{})});await send('Input.dispatchKeyEvent',{type:'keyUp',key:keyName,code,...(virtual?{windowsVirtualKeyCode:virtual,nativeVirtualKeyCode:virtual}:{})});await delay(100);}
async function fill(selector,value){await reveal(selector);await evaluate('(()=>{const e='+query(selector)+';e.focus({preventScroll:true});e.select()})()');await send('Input.insertText',{text:value});await delay(100);}
async function focus(selector){await reveal(selector);await evaluate(query(selector)+'.focus({preventScroll:true})');}
async function waitFor(expression,description,attempts=100){for(let i=0;i<attempts;i++){try{if(await evaluate(expression))return;}catch{}await delay(150);}throw Error('Timeout: '+description);}
const skippedChecks=[],checkFilter=process.env.LANDING_CHECK_FILTER?new RegExp(process.env.LANDING_CHECK_FILTER):null;
async function step(name,fn){if(checkFilter&&!checkFilter.test(name)){skippedChecks.push(name);return;}try{await fn();checks.push(name);console.log('PASS '+name);}catch(error){const message=error.name+': '+error.message;failures.push({name,message});console.log('FAIL '+name+' '+message);try{await shot('failure-'+failures.length);}catch{}}}
const report={url,viewport:{width:1440,height:1000},filter:process.env.LANDING_CHECK_FILTER||null,skippedChecks,checks,failures,errors,failedRequests,clickEvidence:{}};
try{
  socket=new WebSocket(endpoint);await new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
  socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}return;}if(m.method==='Runtime.exceptionThrown')errors.push({stage,type:'exception',text:m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text});if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))errors.push({stage,type:m.params.type,text:m.params.args.map(x=>x.value||x.description).join(' ')});if(m.method==='Network.responseReceived'&&m.params.response.status>=400)failedRequests.push({stage,url:m.params.response.url,status:m.params.response.status});if(m.method==='Network.responseReceived'&&m.params.type==='Document')documentResponses.push({stage,url:m.params.response.url,status:m.params.response.status});if(m.method==='Network.requestWillBeSent')requests.push({stage,url:m.params.request.url});};
  const target=await send('Target.createTarget',{url:'about:blank'},null);session=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true},null)).sessionId;
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url});await send('Page.bringToFront');await waitFor('!!document.querySelector("#duik-hero-character")?.rig&&!!window.lenis','Hero and Lenis');await delay(1500);
  report.initial=await evaluate('({title:document.title,lang:document.documentElement.lang,background:getComputedStyle(document.documentElement).backgroundColor,hero:document.querySelector("h1")?.innerText,experienceMounts:[...document.querySelectorAll("[data-experience-mounted]")].map(e=>({kind:e.dataset.experienceMounted,rect:e.getBoundingClientRect().toJSON()})),motions:[...document.querySelectorAll("[data-motion-demo]")].map(e=>({kind:e.dataset.motionDemo,mounted:e.dataset.motionMounted,rect:e.getBoundingClientRect().toJSON()})),docLinks:[...document.querySelectorAll(".duik-site-nav a")].map(e=>({text:e.innerText,href:e.getAttribute("href")}))})');
  await shot('00-initial');
  report.brand=await evaluate('({icons:[...document.head.querySelectorAll("link[rel*=icon]")].map(e=>({rel:e.rel,href:e.href})),manifest:document.querySelector("link[rel=manifest]")?.href})');
  if(!inspect){
    await step('Root initializes ten owned experiences without hydration or initialization errors',async()=>{
      assert.equal(report.initial.experienceMounts.length,10);assert.equal(report.initial.motions.length,3);assert(report.initial.motions.every(m=>m.mounted==='true'));
      assert.equal(errors.length,0,JSON.stringify(errors));assert.equal(failedRequests.length,0,JSON.stringify(failedRequests));
    });
    await step('Hydrated head retains local Duik controller icon and project manifest',async()=>{
      assert(report.brand.icons.length>0);assert(report.brand.icons.some(icon=>icon.href.endsWith('/controller.svg')));
      assert(report.brand.icons.every(icon=>icon.href.startsWith(new URL(url).origin)));assert(!JSON.stringify(report.brand).toLowerCase().includes('linearity'));
      report.brand.manifestData=await evaluate('(async()=>{const response=await fetch(document.querySelector("link[rel=manifest]").href);if(!response.ok)throw Error("Manifest HTTP "+response.status);return response.json()})()');
      assert(report.brand.manifestData.name.includes('Duik'));
    });
    await step('Hero real control drag changes pose with controllers always visible',async()=>{
      await scroll(0);const character='document.querySelector("#duik-hero-character")';
      const before=await evaluate(character+'.rig.getState().pose');
      const point=await evaluate('(()=>{const e='+character+'.shadowRoot.querySelector("[data-control=handL]");const p=new DOMPoint(0,0).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y}})()');
      const outer=await evaluate('document.elementFromPoint('+point.x+','+point.y+')?.tagName');assert.equal(outer,'CHARACTER-RIG');
      await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...point});
      for(let i=1;i<=8;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:point.x+20*i/8,y:point.y-16*i/8});await delay(25);}
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:point.x+20,y:point.y-16});
      assert.notDeepEqual(await evaluate(character+'.rig.getState().pose.handL'),before.handL);await shot('01-hero-drag');
      assert.equal(await evaluate('document.querySelectorAll("[data-rig-reset],[data-rig-controls]").length'),0);
      assert.equal(await evaluate(character+'.getAttribute("controls")'),'visible');
    });
    await step('Header efficiency-tools anchor scrolls through Lenis to the real section',async()=>{
      await scroll(0);report.clickEvidence.toolsNavigation=await click('.duik-site-nav a[href="#tools"]');
      await waitFor('location.hash==="#tools"&&Math.abs(document.querySelector("#tools").getBoundingClientRect().top-84)<2&&Math.abs(window.lenis.velocity)<.1','Header #tools anchor');
      report.toolsNavigation=await evaluate('({hash:location.hash,top:document.querySelector("#tools").getBoundingClientRect().top,scrollY,lenisTarget:window.lenis.targetScroll})');await shot('01b-tools-navigation');
    });
{
  const toolsRoot='[data-tools-root]';
  const tools=child=>toolsRoot+' '+child;
  const toolsPanel=id=>tools('[data-tools-panel="'+id+'"]');
  const toolsType=async(selector,value)=>{await focus(selector);await evaluate(query(selector)+'.select()');await send('Input.insertText',{text:value});};
  const toolsReadCrop=()=>evaluate('(()=>{const r='+query(toolsRoot)+';const matrix=e=>{const m=e.getCTM();return [m.a,m.b,m.c,m.d,m.e,m.f]};const dimensions=e=>Object.fromEntries(["x","y","width","height"].map(k=>[k,Number(e.getAttribute(k))]));return {mask:dimensions(r.querySelector("[data-crop-mask]")),boundary:dimensions(r.querySelector("[data-crop-boundary]")),reference:matrix(r.querySelector("[data-parent-reference]")),art:matrix(r.querySelector("[data-crop-art]")),preview:r.dataset.toolsPreview,progress:Number(r.dataset.sceneProgress),mode:r.querySelector("[data-crop-scene]").dataset.cropMode}})()');
  const toolsReadPreview=()=>evaluate('(()=>{const r='+query(toolsRoot)+';return {phase:r.dataset.toolsPreview,tool:r.dataset.toolsCurrent,progress:Number(r.dataset.sceneProgress),step:r.querySelector("[data-tools-stage]").dataset.sceneStep,playbackButtons:r.querySelectorAll("[data-scene-play]").length,progressControls:r.querySelectorAll("input[data-scene-progress],.duik-tools-transport").length}})()');
  const toolsWorkbench=async(id,open=true)=>{const selector=tools('[data-tools-workbench="'+id+'"]');if(await evaluate(query(selector)+'.open')!==open)await click(selector+' > summary');await waitFor(query(selector)+'.open==='+open,'Tools '+id+' workbench '+(open?'opens':'closes'));};
  const toolsPress=async point=>{await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,...point});};
  const releaseTools=async()=>{const before=await evaluate('scrollY');await toolsPress({x:2,y:2});const after=await evaluate('scrollY');assert(Math.abs(after-before)<2,'Giving the scene back must not move the page');return {before,after};};

  await step('Tools leads with automatic layer management and keeps detailed workbenches and references closed',async()=>{
    await reveal(tools('[data-tools-stage]'));
    assert.equal((await toolsReadPreview()).tool,'layers','The first visit must not need a tab click to reach layer management');
    assert.equal(await evaluate(query(tools('[data-tools-tab="layers"]'))+'.getAttribute("aria-selected")'),'true');
    assert.equal(await evaluate(query(tools('[data-tools-docs]'))+'.getAttribute("href")'),'/docs/guide/tools/layers');
    assert.deepEqual(await evaluate('[...'+query(toolsRoot)+'.querySelectorAll("[data-tools-tab]")].map(tab=>tab.dataset.toolsTab)'),['layers','text','scripts','composition']);
    const structure=await evaluate('(()=>{const r='+query(toolsRoot)+',s=r.querySelector("[data-tools-stage]");const detailed=["[data-crop-input]","[data-tools-character-slot]","[data-text-rows]","[data-script-code]"];return {stages:r.querySelectorAll("[data-tools-stage]").length,stageInDetails:!!s?.closest("details"),figures:s?.querySelectorAll("figure").length,pieces:s?.querySelectorAll("[data-scene-piece]").length,controls:[...s.querySelectorAll("[data-tools-control]")].map(c=>({id:c.dataset.toolsControl,visible:!c.hidden})),progressControls:s?.querySelectorAll("input[data-scene-progress],.duik-tools-transport").length,panels:[...r.querySelectorAll("[data-tools-panel]")].map((p,i)=>{const work=p.querySelector(detailed[i]),d=p.querySelector("[data-tools-reference]");return {id:p.dataset.toolsPanel,visible:!p.hidden,work:!!work,workInDetails:!!work?.closest("details"),workOpen:work?.closest("details")?.open,reference:!!d,referenceOpen:d?.open,workFirst:!!(work&&d&&(work.compareDocumentPosition(d)&Node.DOCUMENT_POSITION_FOLLOWING))}}),references:r.querySelectorAll("[data-tools-reference]").length,boundary:r.querySelector(".duik-tools-footer").textContent}})()');
    assert.deepEqual(structure.panels.map(p=>p.id),['composition','layers','text','scripts']);
    assert.equal(structure.stages,1);assert.equal(structure.stageInDetails,false);assert.equal(structure.figures,2);assert.equal(structure.pieces,4);assert.equal(structure.progressControls,0);
    assert.deepEqual(structure.controls.map(c=>c.id),['composition','layers','text','scripts']);assert.equal(structure.controls.filter(c=>c.visible).length,1);
    assert.equal(structure.references,4);assert.equal(structure.panels.filter(p=>p.visible).length,1);
    assert(structure.panels.every(p=>p.work&&p.workInDetails&&!p.workOpen&&p.reference&&!p.referenceOpen&&p.workFirst));
    assert(structure.boundary.includes('不连接 AE 工程'));report.toolsStructure=structure;
  });

  await step('Tools tab changes start their authored demonstration without a player or progress slider',async()=>{
    const original=await evaluate(query(tools('.duik-tools-before svg > g:not([data-scene-crop-only])'))+'.outerHTML');report.toolsAutomaticTabs=[];
    for(const id of ['composition','layers','text','scripts']){
      await click(tools('[data-tools-tab="'+id+'"]'));await reveal(tools('[data-tools-stage]'));
      await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','Tools '+id+' starts without playback input');
      const before=await toolsReadPreview();assert.equal(before.tool,id);assert.equal(before.progressControls,0);assert.equal(before.playbackButtons,0);
      await waitFor(query(tools('[data-tools-stage]'))+'.dataset.sceneStep==="after"','Tools '+id+' reaches its result automatically');const result=await toolsReadPreview();
      assert.equal(result.phase,'running');assert.equal(result.step,'after');
      assert.equal(await evaluate(query(tools('.duik-tools-before svg > g:not([data-scene-crop-only])'))+'.outerHTML'),original,'Tool states never rewrite the original artwork');
      report.toolsAutomaticTabs.push({id,before,result});
    }
  });

  await step('Tools automatically traverses both directions without playback buttons or a reset cut',async()=>{
    await click(tools('[data-tools-tab="text"]'));await click(tools('[data-tools-tab="layers"]'));
    await reveal(tools('[data-tools-stage]'));const scroll=await releaseTools();
    await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','visible Tools automatic loop');
    assert.equal((await toolsReadPreview()).playbackButtons,0);assert.equal((await toolsReadPreview()).progressControls,0);
    await evaluate('(()=>{const root='+query(toolsRoot)+',surface=root.querySelector("[data-tools-stage]");window.__toolsPreviewSteps=[surface.dataset.sceneStep];window.__toolsPreviewProgress=[];const observer=new MutationObserver(()=>{const step=surface.dataset.sceneStep;if(window.__toolsPreviewSteps.at(-1)!==step)window.__toolsPreviewSteps.push(step);window.__toolsPreviewProgress.push(Number(root.dataset.sceneProgress))});observer.observe(root,{attributes:true,subtree:true,attributeFilter:["data-scene-step","data-scene-progress"]});window.__removeToolsPreviewProbe=()=>observer.disconnect()})()');
    try{
      await waitFor('window.__toolsPreviewSteps.includes("after")&&window.__toolsPreviewSteps.at(-1)==="before"','Tools result returns through the authored sequence');
      const steps=await evaluate('window.__toolsPreviewSteps'),progress=await evaluate('window.__toolsPreviewProgress');
      assert(['before','working','after'].every(value=>steps.includes(value)));assert(progress.some((value,i)=>i&&value<progress[i-1]));
      assert.equal((await toolsReadPreview()).phase,'running');report.toolsPreview={steps,progress,scroll};
    }finally{await evaluate('window.__removeToolsPreviewProbe?.()');}
  });

  await step('Tools yields to real parameter edits but not hover or passive focus and resumes after offscreen return',async()=>{
    await click(tools('[data-tools-tab="text"]'));
    await reveal(tools('[data-tools-stage]'));await releaseTools();await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','Tools loop visible');
    await focus(tools('[data-scene-prefix]'));const focused=await toolsReadPreview();assert.equal(focused.phase,'running');
    await waitFor('Number('+query(toolsRoot)+'.dataset.sceneProgress)!=='+focused.progress,'Passive focus does not stop the loop');
    await toolsType(tools('[data-scene-prefix]'),'演示_');const manual=await toolsReadPreview();assert.equal(manual.phase,'manual');assert.equal(manual.progress,100);
    await delay(250);assert.deepEqual(await toolsReadPreview(),manual,'Actual field editing owns the scene until it finishes');
    await releaseTools();await reveal(tools('[data-tools-stage]'));const visibleScroll=await evaluate('scrollY');
    await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"&&Number('+query(toolsRoot)+'.dataset.sceneProgress)>0','Tools loop resumes when editing finishes');
    await scroll(0);await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="paused"','Tools physical offscreen pauses');
    const offscreen=await toolsReadPreview();await delay(200);assert.deepEqual(await toolsReadPreview(),offscreen);
    await scroll(visibleScroll);await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','Tools actual stage loops again');
    const returned=await toolsReadPreview();await waitFor('Number('+query(toolsRoot)+'.dataset.sceneProgress)!=='+returned.progress,'Tools returns to motion');
    report.toolsTakeover={focused,manual,offscreen,returned,scope:'trusted field editing and actual Lenis scroll; not physical background-tab acceptance'};
    await toolsType(tools('[data-scene-prefix]'),'片头_');await releaseTools();
  });

  await step('Tools real pointer crop changes bounds without moving artwork or parent reference',async()=>{
    // This step also works when selected on its own by LANDING_CHECK_FILTER.
    await click(tools('[data-tools-tab="composition"]'));
    await click(tools('[data-tool-action="crop-reset"]'));
    const hit=await reveal(tools('[data-crop-handle="se"]')),p=hit.point,before=await toolsReadCrop();
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...p});
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...p});
    for(let i=1;i<=8;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:p.x+32*i/8,y:p.y-24*i/8});
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:p.x+32,y:p.y-24});
    const dragged=await toolsReadCrop();assert(dragged.mask.width>before.mask.width);assert(dragged.mask.height<before.mask.height);
    assert.equal(dragged.mask.x,before.mask.x);assert.equal(dragged.mask.y,before.mask.y);
    assert.deepEqual(dragged.reference,before.reference);assert.deepEqual(dragged.art,before.art);
    await click(tools('[data-tool-action="crop-after"]'));const cropped=await toolsReadCrop();
    assert.deepEqual(cropped.boundary,dragged.mask);assert.equal(cropped.mode,'after');
    assert.deepEqual(cropped.reference,before.reference);assert.deepEqual(cropped.art,before.art);
    assert.equal(await text(tools('[data-crop-size]')),dragged.mask.width+' × '+dragged.mask.height);
    await click(tools('[data-tool-action="crop-before"]'));assert.equal(await text(tools('[data-crop-size]')),'640 × 400');
    await click(tools('[data-tool-action="crop-reset"]'));const reset=await toolsReadCrop();
    assert.deepEqual(reset.mask,before.mask);assert.deepEqual(reset.art,before.art);assert.deepEqual(reset.reference,before.reference);
    report.toolsCrop={hit,before,dragged,cropped,reset};
  });

  await step('Tools corner keys move exactly 2 px or Shift 10 px and tabs preserve immediate access',async()=>{
    await click(tools('[data-tools-tab="composition"]'));await click(tools('[data-tool-action="crop-reset"]'));
    await focus(tools('[data-crop-handle="se"]'));const before=await toolsReadCrop();await key('ArrowRight');
    const normal=await toolsReadCrop();assert.equal(normal.mask.width,before.mask.width+2);assert.equal(normal.mask.height,before.mask.height);
    await send('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40,nativeVirtualKeyCode:40,modifiers:8});
    await send('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40,nativeVirtualKeyCode:40,modifiers:8});
    const shifted=await toolsReadCrop();assert.equal(shifted.mask.height,normal.mask.height+10);assert.equal(shifted.mask.width,normal.mask.width);
    await delay(350);assert.deepEqual((await toolsReadCrop()).mask,shifted.mask,'The resumed loop cannot overwrite the user-adjusted mask');
    await reveal(tools('[data-tools-stage]'));await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','The loop resumes after the adjustment key is released');
    await focus(tools('[data-tools-tab="layers"]'));await key('End');
    assert.equal(await evaluate(query(tools('[data-tools-tab="composition"]'))+'.getAttribute("aria-selected")'),'true');
    await key('Home');assert.equal(await evaluate(query(toolsPanel('layers'))+'.hidden'),false);
    await click(tools('[data-tools-tab="composition"]'));
    await click(tools('[data-tool-action="crop-reset"]'));
  });

  await step('Tools shared layer pieces accept real drag and keyboard movement with a fixed original reference',async()=>{
    await click(tools('[data-tools-tab="layers"]'));await click(tools('[data-tool-action="scene-layout-reset"]'));
    const piece=tools('[data-scene-piece="title"]'),original=await evaluate(query(tools('.duik-tools-before svg'))+'.outerHTML');
    const read=()=>evaluate('(()=>{const p='+query(piece)+';return {transform:p.getAttribute("transform"),selected:p.getAttribute("aria-pressed"),offset:[Number(p.dataset.sceneOffsetX),Number(p.dataset.sceneOffsetY)]}})()');
    await reveal(tools('[data-tools-stage]'));await waitFor(query(tools('[data-tools-stage]'))+'.dataset.sceneStep==="after"','The automatic layer result is available for direct manipulation');
    const hit=await stableHit(piece),point=hit.point;
    await send('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...point});
    const before=await read(),held=await toolsReadPreview();let dragged;
    try{
      assert.equal(held.phase,'manual');await delay(180);assert.deepEqual(await toolsReadPreview(),held,'Accepted pointer ownership stops the demonstration');
      for(let i=1;i<=6;i++)await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:point.x+24*i/6,y:point.y-12*i/6});
      dragged=await read();assert.equal(dragged.selected,'true');assert(dragged.offset[0]>before.offset[0]);assert(dragged.offset[1]<before.offset[1]);
    }finally{await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',buttons:0,clickCount:1,x:point.x+24,y:point.y-12});}
    await waitFor(query(toolsRoot)+'.dataset.toolsPreview==="running"','The layer loop resumes after pointer release');
    // Focus the still-visible shape without relocating the document while it is moving.
    await evaluate(query(piece)+'.focus({preventScroll:true})');await key('Home');const reset=await read();assert.deepEqual(reset.offset,[0,0]);
    await key('ArrowRight');const keyed=await read();assert.equal(keyed.offset[0],reset.offset[0]+2);assert.equal(keyed.offset[1],reset.offset[1]);
    await click(tools('[data-tool-action="scene-isolate"]'));assert.equal(await evaluate(query(tools('[data-scene-piece="circle"]'))+'.getAttribute("opacity")'),'.12');
    assert.equal(await evaluate(query(tools('.duik-tools-before svg'))+'.outerHTML'),original);assert.equal(await evaluate(query(tools('[data-tools-workbench="layers"]'))+'.open'),false);
    report.toolsLayerScene={before,dragged,reset,keyed,hit,held,scope:'real pointer input and user offsets separate from automatic scene transforms; webpage geometry, not AE automatic layer alignment'};await click(tools('[data-tool-action="scene-layout-reset"]'));
    assert.deepEqual((await read()).offset,[0,0]);assert.equal((await toolsReadPreview()).phase,'running');
  });

  await step('Tools filters and hides actual 26 PNG parts without changing the chosen pose',async()=>{
    await click(tools('[data-tools-tab="layers"]'));
    await toolsWorkbench('layers');
    try{
    const character=tools('[data-tools-character-slot] character-rig'),rig=query(character)+'.rig';
    await waitFor('!!'+query(character)+'?.rig','Tools approved character');
    assert.equal(await evaluate(rig+'.getState().partCount'),26);
    assert.equal(await evaluate(rig+'.getState().sourceSha256'),'fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a');
    await click(tools('[data-tool-action="layer-all"]'));await click(tools('[data-tool-action="layer-pose"]'));await click(tools('[data-tool-action="layer-left"]'));
    assert.equal(await evaluate(query(toolsRoot)+'.querySelectorAll("[data-part-select]").length'),4);
    assert.equal(await evaluate(rig+'.getState().selected'),'fore-l');const pose=await evaluate(rig+'.getState().pose');
    await evaluate('window.__duikToolsVisiblePixels='+rig+'.capture()');
    await click(tools('[data-part-visibility="fore-l"]'));
    assert.equal(await evaluate(rig+'.getState().visibleParts.includes("fore-l")'),false);
    assert.deepEqual(await evaluate(rig+'.getState().pose'),pose);
    await waitFor('window.__duikToolsVisiblePixels!=='+rig+'.capture()','Hiding the actual PNG changes pixels');
    await toolsType(tools('[data-layer-query]'),'fore-l');assert.equal(await evaluate(query(toolsRoot)+'.querySelectorAll("[data-part-select]").length'),1);
    assert.deepEqual(await evaluate(rig+'.getState().pose'),pose);
    await click(tools('[data-part-visibility="fore-l"]'));assert.equal(await evaluate(rig+'.getState().visibleParts.includes("fore-l")'),true);
    await toolsType(tools('[data-layer-query]'),'no-such-part-xyz');assert.equal(await evaluate(query(toolsRoot)+'.querySelectorAll("[data-part-select]").length'),0);
    await click(tools('[data-tool-action="layer-clear"]'));assert.equal(await evaluate(query(toolsRoot)+'.querySelectorAll("[data-part-select]").length'),26);
    assert.deepEqual(await evaluate(rig+'.getState().pose'),pose);report.toolsLayers={partCount:26,pose,selected:'fore-l'};
    await click(tools('[data-tool-action="layer-reset"]'));
    }finally{await toolsWorkbench('layers',false);}
  });

  await step('Tools name flow applies and undoes real samples and escapes replacement markup',async()=>{
    await click(tools('[data-tools-tab="text"]'));
    await toolsType(tools('[data-scene-prefix]'),'片头B_');
    assert.deepEqual(await evaluate('[...'+query(toolsRoot)+'.querySelectorAll("[data-scene-name]")].map(e=>e.textContent)'),['片头B_01','片头B_02','片头B_03','片头B_04']);
    assert.equal((await toolsReadPreview()).phase,'manual');await toolsWorkbench('text');
    try{
    await click(tools('[data-tool-action="text-reset"]'));await click(tools('[data-tool-action="text-rename-mode"]'));
    const firstBefore=tools('[data-text-rows] li:first-child .duik-tools-name-before'),firstResult=tools('[data-text-rows] li:first-child [data-text-result]');
    await toolsType(tools('[data-text-prefix]'),'镜头B_');await toolsType(tools('[data-text-start]'),'7');
    assert.equal(await text(firstBefore),'角色_左上臂');assert.equal(await text(firstResult),'镜头B_07');
    await click(tools('[data-tool-action="text-apply"]'));assert.equal(await text(firstResult),'镜头B_07');
    assert.equal(await evaluate(query(tools('[data-tool-action="text-apply"]'))+'.disabled'),true);
    await click(tools('[data-tool-action="text-undo"]'));assert.equal(await text(firstBefore),'角色_左上臂');
    await click(tools('[data-tool-action="text-replace-mode"]'));await toolsType(tools('[data-text-find]'),'角色');
    const replacement='<img src=x onerror="window.__duikToolsTextExecuted=1">';await evaluate('window.__duikToolsTextExecuted=0');
    await toolsType(tools('[data-text-replacement]'),replacement);await click(tools('[data-tool-action="text-apply"]'));
    assert.equal(await text(firstResult),replacement+'_左上臂');
    assert.equal(await evaluate(query(tools('[data-text-rows]'))+'.querySelectorAll("img,script").length'),0);
    assert.equal(await evaluate('window.__duikToolsTextExecuted'),0);
    await click(tools('[data-tool-action="text-undo"]'));assert.equal(await text(firstBefore),'角色_左上臂');
    await toolsType(tools('[data-text-replacement]'),'镜头A');await click(tools('[data-tool-action="text-reset"]'));
    }finally{await toolsWorkbench('text',false);}
  });

  await step('Tools script drafts survive task switches and clipboard copy never executes them',async()=>{
    await click(tools('[data-tools-tab="scripts"]'));
    await click(tools('[data-scene-task="expression"]'));assert.equal(await evaluate(query(tools('[data-tool-action="scene-copy"]'))+'.disabled'),true);
    await click(tools('[data-tool-action="scene-use"]'));assert.equal(await text(tools('[data-scene-code]')),'value;');
    await click(tools('[data-scene-task="editor"]'));assert.equal(await evaluate(query(tools('[data-tool-action="scene-copy"]'))+'.disabled'),true);
    await click(tools('[data-tool-action="scene-use"]'));assert.equal(await text(tools('[data-scene-code]')),'Duik.Rig.arm();');assert((await text(tools('[data-scene-status]'))).includes('初始化 API'));
    await send('Browser.grantPermissions',{origin:new URL(url).origin,permissions:['clipboardReadWrite','clipboardSanitizedWrite']},null);
    await click(tools('[data-tool-action="scene-copy"]'));assert.equal(await evaluate('navigator.clipboard.readText()'),'Duik.Rig.arm();');
    await toolsWorkbench('scripts');
    try{
    await click(tools('[data-script-task="editor"]'));
    const code='// Browser acceptance: text only\nwindow.__duikToolsCodeExecuted = 1;\nDuik.Rig.arm();';
    await evaluate('window.__duikToolsCodeExecuted=0');await toolsType(tools('[data-script-code]'),code);
    await click(tools('[data-script-task="expression"]'));await toolsType(tools('[data-script-code]'),'value + 10;');
    await click(tools('[data-script-task="editor"]'));assert.equal(await evaluate(query(tools('[data-script-code]'))+'.value'),code);
    await click(tools('[data-script-task="expression"]'));assert.equal(await evaluate(query(tools('[data-script-code]'))+'.value'),'value + 10;');
    await click(tools('[data-tool-action="script-reset"]'));await click(tools('[data-script-task="editor"]'));
    await send('Browser.grantPermissions',{origin:new URL(url).origin,permissions:['clipboardReadWrite','clipboardSanitizedWrite']},null);
    await click(tools('[data-tool-action="script-copy"]'));assert.equal(await evaluate('navigator.clipboard.readText()'),code);
    assert((await text(tools('[data-script-status]'))).includes('未执行'));assert.equal(await evaluate('window.__duikToolsCodeExecuted'),0);
    await click(tools('[data-tool-action="script-reset"]'));
    }finally{await toolsWorkbench('scripts',false);}
  });

  await step('Each Tools reference opens a real proportional local image with provenance',async()=>{
    report.toolsReferences=[];
    for(const id of ['composition','layers','text','scripts']){
      await click(tools('[data-tools-tab="'+id+'"]'));const reference=tools('[data-tools-reference="'+id+'"]');
      assert.equal(await evaluate(query(reference)+'.open'),false);await click(reference+' > summary');
      await waitFor(query(reference+' img')+'.complete&&'+query(reference+' img')+'.naturalWidth>0','Tools '+id+' reference image');
      const image=await evaluate('(()=>{const d='+query(reference)+',i=d.querySelector("img"),r=i.getBoundingClientRect();return {src:i.getAttribute("src"),width:i.naturalWidth,height:i.naturalHeight,declaredWidth:Number(i.getAttribute("width")),declaredHeight:Number(i.getAttribute("height")),renderedWidth:r.width,renderedHeight:r.height,credit:d.querySelector(".duik-tools-attribution").textContent,docs:d.querySelector(".duik-tools-official-links a").getAttribute("href")}})()');
      assert(image.src.startsWith('/duik-experience/official/duik/tools/'));assert.equal(image.width,image.declaredWidth);assert.equal(image.height,image.declaredHeight);
      assert(Math.abs(image.renderedWidth/image.renderedHeight-image.width/image.height)<.015,'Official screenshot keeps its aspect ratio');
      assert(image.credit.includes('RxLaboratory'));assert(image.credit.includes('GFDL 1.3'));assert(image.docs.startsWith('/docs/guide/tools/'));
      report.toolsReferences.push({id,...image});await click(reference+' > summary');
    }
  });

  await step('Reduced-motion Tools stays still on this page and keeps direct keyboard control',async()=>{
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    try{
      await waitFor('matchMedia("(prefers-reduced-motion: reduce)").matches','Tools reduced-motion media');
      await click(tools('[data-tools-tab="composition"]'));await click(tools('[data-tool-action="crop-reset"]'));
      const before=await toolsReadCrop();assert.equal(before.preview,'idle');assert.equal((await toolsReadPreview()).playbackButtons,0);
      await delay(450);assert.deepEqual((await toolsReadCrop()).mask,before.mask);
      await focus(tools('[data-crop-handle="se"]'));await key('ArrowLeft');const after=await toolsReadCrop();
      assert.equal(after.mask.width,before.mask.width-2);
      await click(tools('[data-tool-action="crop-after"]'));const cropped=await toolsReadCrop(),sought=await toolsReadPreview();assert.equal(sought.progress,100);assert.equal(sought.phase,'manual');assert.equal(sought.playbackButtons,0);assert.equal(sought.progressControls,0);assert.deepEqual(cropped.boundary,cropped.mask);
      assert.equal(await evaluate(query(toolsRoot)+'.getAnimations({subtree:true}).filter(a=>a.playState==="running").length'),0);
      report.toolsReducedMotion={scope:'same-page media change and trusted keyboard input; no cold-navigation or physical background-tab claim',before,after,sought};
      await click(tools('[data-tool-action="crop-reset"]'));
    }finally{
      await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
      await waitFor('!matchMedia("(prefers-reduced-motion: reduce)").matches','Tools motion preference restored');
    }
  });
}
    await step('Catalog category, search, empty state and keyboard focus work',async()=>{
      const initial=await evaluate('(()=>{const input=document.querySelector("[data-catalog-query]"),r=input.getBoundingClientRect();return{searchVisible:r.width>0&&r.height>0&&getComputedStyle(input).visibility!=="hidden",closedDetails:!!input.closest("details:not([open])"),wallImages:[...document.querySelectorAll("[data-duik-catalog] img")].filter(i=>i.getAttribute("src")?.includes("/wall/")).length}})()');
      assert(initial.searchVisible);assert.equal(initial.closedDetails,false);assert.equal(initial.wallImages,0);
      await click('[data-catalog-panel="tools"]');assert((await text('[data-catalog-title]')).includes('通用工具'));assert.equal(await evaluate('document.querySelectorAll("[data-catalog-results] .duik-catalog-group").length'),4);
      await click('[data-catalog-panel="all"]');assert.equal(await text('[data-catalog-title]'),'全部工具');assert.equal(await evaluate('document.querySelectorAll("[data-catalog-result]").length'),33);
      await fill('[data-catalog-query]','没有这个工具XYZ');assert(await evaluate('!!document.querySelector("[data-catalog-reset]")'));await shot('06-catalog-empty');await click('[data-catalog-reset]');
      await fill('[data-catalog-query]','裁剪');assert.equal(await evaluate('document.querySelectorAll("[data-catalog-result]").length'),1);await key('ArrowDown');assert(await evaluate('document.activeElement.hasAttribute("data-catalog-result")'));await key('Escape');assert.equal(await evaluate(query('[data-catalog-query]')+'.value'),'');await shot('07-catalog');
    });
    await step('API task selection and real clipboard contain the documented call',async()=>{
      const choices=await evaluate('[...document.querySelectorAll("[data-api-example]")].map(e=>({id:e.dataset.apiExample,text:e.innerText}))');report.apiChoices=choices;
      for(const choice of choices.slice(0,2)){await click('[data-api-example="'+choice.id+'"]');const code=await text('[data-api-code]');assert(/^Duik\./.test(code));await click('[data-api-copy]');assert.equal(await evaluate('navigator.clipboard.readText()'),code);assert((await text('[data-api-feedback]')).includes('已复制'));}
      await shot('08-api');
    });
    for(const kind of ['animation','automation','camera'])await step('Horizontal '+kind+' demo receives real input in its original pinned region',async()=>{
      const scope='[data-motion-demo="'+kind+'"]';report.clickEvidence[kind]=await revealMotion(kind);
      const release=async()=>{const before=await evaluate('scrollY');for(const type of ['mouseMoved','mousePressed','mouseReleased'])await send('Input.dispatchMouseEvent',{type,x:2,y:2,...(type==='mouseMoved'?{}:{button:'left',buttons:type==='mousePressed'?1:0,clickCount:1})});const after=await evaluate('scrollY');assert(Math.abs(after-before)<2);report.clickEvidence[kind].release={before,after};};
      assert.equal(await evaluate(query(scope)+'.querySelectorAll("[data-action=play]").length'),0);
      assert.equal(await evaluate(query(scope)+'.dataset.view'),'demo');
      await click(scope+' [data-motion-view=reference]');await waitFor(query(scope+' [data-motion-reference] img')+'.naturalWidth>0','official '+kind+' reference');
      await shot('09-reference-'+kind);await click(scope+' [data-motion-view=demo]');await click(scope+' [data-action=reset]');
      if(kind==='animation'){
        const old=await evaluate(query(scope)+'.dataset.progress');await click(scope+' [data-ease="linear"]');assert.equal(await evaluate(query(scope)+'.dataset.mode'),'linear');assert.notEqual(await evaluate(query(scope)+'.dataset.progress'),old);
        await focus(scope+' [data-input="time"]');await key('End');assert.equal(await evaluate(query(scope)+'.dataset.time'),'1.00');await click(scope+' [data-action="reset"]');assert.equal(await evaluate(query(scope)+'.dataset.time'),'0.32');
        await release();await waitFor(query(scope)+'.dataset.playing==="true"&&'+query(scope)+'.dataset.time!=="0.32"','interpolation automatically advances');await focus(scope+' [data-input="time"]');await key('End');assert.equal(await evaluate(query(scope)+'.dataset.playing'),'false');
      }else if(kind==='automation'){
        await focus(scope+' [data-input="amplitude"]');await key('Home');assert.equal(await evaluate(query(scope)+'.dataset.offset'),'0.00');await release();await waitFor(query(scope)+'.dataset.playing==="true"','zero-amplitude automatic loop');await delay(300);assert.equal(await evaluate(query(scope)+'.dataset.offset'),'0.00');await click(scope+' [data-action="reset"]');assert.equal(await evaluate(query(scope+' [data-input="amplitude"]')+'.value'),'32');
      }else{
        const hit=await reveal(scope+' [data-camera-drag]'),p=hit.point;await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...p});await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:p.x+65,y:p.y-25});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:p.x+65,y:p.y-25});
        assert.notEqual(await evaluate(query(scope)+'.dataset.viewX'),'0.00');const transforms=await evaluate('[...document.querySelectorAll('+JSON.stringify(scope+' [data-depth]')+')].map(e=>e.getAttribute("transform"))');assert.equal(new Set(transforms).size,3);await click(scope+' [data-action="reset"]');assert.equal(await evaluate(query(scope)+'.dataset.viewX'),'0.00');
      }
      await shot('09-motion-'+kind);
    });
    await step('Official documentation resources have local PNG bytes, not missing-image placeholders',async()=>{
      report.officialMedia=await evaluate('(async()=>{const manifest=await (await fetch("/duik-experience/official/sources.json")).json();const results=[];for(const item of manifest.assets){const r=await fetch("/duik-experience/official/"+item.file);const b=new Uint8Array(await r.arrayBuffer());results.push({file:item.file,status:r.status,type:r.headers.get("content-type"),png:b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71})}return results})()');
      assert.equal(report.officialMedia.length,23);assert(report.officialMedia.every(x=>x.status===200&&x.png&&x.type.includes('image/png')));
    });
    await step('Binding stages use the approved character with authentic references available on demand',async()=>{
      await reveal('#inside-ae h2');await shot('11-inside-ae');
      await reveal('[data-workflow-art]');await waitFor('!!document.querySelector("[data-workflow-rig-host] character-rig")?.rig','live workflow character');
      assert.equal(await evaluate(query('.duik-workflow-reference')+'.open'),false);
      for(let i=0;i<3;i++){await click('button[data-workflow-step="'+i+'"]');assert.equal(await evaluate(query('[data-duik-workflow]')+'.dataset.workflowStep'),String(i));}
      const character=await evaluate('document.querySelector("[data-workflow-rig-host] character-rig").rig.getState()');
      assert.equal(character.partCount,26);assert.equal(character.sourceSha256,'fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a');assert.equal(character.interaction,'drag');
      await click('.duik-workflow-reference > summary');await waitFor('document.querySelector(".duik-workflow-panel img").complete&&document.querySelector(".duik-workflow-panel img").naturalWidth>0','workflow panel reference');
      await click('.duik-workflow-reference > summary');await reveal('[data-workflow-art]');await shot('12-workflow');
    });
{
  const reusePanel=id=>'[data-reuse-panel="'+id+'"]';
  const reuseIn=(id,child)=>reusePanel(id)+' '+child;
  const reuseRoot='[data-reuse-root]';
  const reuseDetails='#reuse > .duik-orbit-details';
  // Open the real secondary workbench only for checks selected by the filter.
  // Closing it in finally also restores the original orbit after a failure.
  const reuseStep=(name,fn)=>step(name,async()=>{
    await revealHorizontal('#reuse');
    assert.equal(await evaluate(query(reuseDetails)+'.open'),false,'Reuse workbench starts closed');
    try{
      await click(reuseDetails+' > summary');
      await waitFor(query(reuseDetails)+'.open===true','Reuse workbench opens');
      await fn();
    }finally{
      // A failed zoom check may leave a native modal above the summary.
      if(await evaluate(query('[data-reuse-dialog]')+'?.open'))await key('Escape');
      const references=await evaluate('[...document.querySelectorAll("#reuse [data-reuse-reference][open]")].map(e=>e.closest("[data-reuse-panel]").dataset.reusePanel)');
      for(const id of references)await click(reuseIn(id,'[data-reuse-reference] > summary'));
      if(await evaluate(query(reuseDetails)+'.open'))await click(reuseDetails+' > summary');
      await waitFor(query(reuseDetails)+'.open===false','Reuse workbench closes');
    }
  });
  const releaseReuse=async()=>{
    // Ordinary mouse hover and keyboard focus do not gate the presentation.
    // Only actual held activation, open evidence and visibility can defer it.
    await waitFor(query(reuseRoot)+'.dataset.reuseVisible==="true"','reuse presentation is mostly visible');
  };
  const receiptSnapshot=()=>evaluate('(()=>{const p='+query(reusePanel('animation'))+';return {selected:p.dataset.reuseSelected,frame:p.dataset.reuseFrame,applied:{id:p.dataset.reuseApplied,frame:p.dataset.reuseAppliedFrame},src:p.querySelector("[data-reuse-preview]").src,saved:[...p.querySelectorAll("[data-reuse-use]")].filter(e=>!e.hidden).map(e=>({id:e.dataset.reuseUse,src:e.querySelector("img")?.src}))}})()');
  await reuseStep('Reuse keeps the original orbit first and opens its optional sample workbench',async()=>{
    assert.equal(await evaluate(query(reuseRoot)+'.querySelectorAll("[data-reuse-play],[data-reuse-demo]").length'),0);
    assert.equal(await evaluate(query(reuseRoot)+'.querySelectorAll("input[type=range]").length'),0);
    assert.equal(await evaluate(query(reuseRoot)+'.querySelectorAll("button[data-reuse-frame]").length'),3);
    assert.equal(await evaluate(query(reuseRoot)+'.querySelectorAll("[aria-live=polite],[role=status]").length'),0,'automatic cycles must not repeatedly announce status');
    await evaluate('(()=>{const p=document.querySelector("[data-reuse-panel=structure]");window.__reuseCyclePhases=[p.dataset.reusePhase];const observer=new MutationObserver(()=>{if(window.__reuseCyclePhases.at(-1)!==p.dataset.reusePhase)window.__reuseCyclePhases.push(p.dataset.reusePhase)});observer.observe(p,{attributes:true,attributeFilter:["data-reuse-phase"]});window.__removeReuseCycleProbe=()=>observer.disconnect()})()');
    try{
      await releaseReuse();
      await waitFor('window.__reuseCyclePhases.filter(phase=>phase==="used").length>=2','two automatic save/retrieve cycles');
      report.reuseAutomaticPhases=await evaluate('window.__reuseCyclePhases');
    }finally{await evaluate('window.__removeReuseCycleProbe?.()');}
    await click('[data-reuse-tab="structure"]');
    await click(reuseIn('structure','[data-reuse-reset]'));
    assert.equal(await evaluate('document.querySelectorAll("#reuse [data-reuse-stage]").length'),3);
    assert.equal(await evaluate('document.querySelectorAll("#reuse character-rig").length'),0);
    assert.equal(await evaluate('document.querySelectorAll("#reuse [data-reuse-reference][open]").length'),0);
    await waitFor(query(reuseIn('structure','[data-reuse-preview]'))+'.naturalWidth>0','approved local structure capture');
    assert.equal(await text(reuseIn('structure','[data-reuse-count]')),'0 / 2');
    assert((await text('.duik-reuse-boundary')).includes('这里只保存网页示例'));
    await shot('reuse-spatial-stage');
  });
  await reuseStep('Selected source saves, transfers and retrieves in the webpage sample library',async()=>{
    await click('[data-reuse-tab="structure"]');await click(reuseIn('structure','[data-reuse-reset]'));
    await click(reuseIn('structure','[data-reuse-select="separated-art"]'));
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reuseSelected'),'separated-art');
    assert((await evaluate(query(reuseIn('structure','[data-reuse-preview]'))+'.src')).endsWith('/layers-exploded.webp'));
    await click(reuseIn('structure','[data-reuse-save]'));
    assert.equal(await text(reuseIn('structure','[data-reuse-count]')),'1 / 2');
    assert.equal(await evaluate(query(reuseIn('structure','[data-reuse-save]'))+'.disabled'),true);
    await click(reuseIn('structure','[data-reuse-select="upper-body"]'));
    await click(reuseIn('structure','[data-reuse-use="separated-art"]'));
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reusePhase'),'used');
    assert.equal(await text(reuseIn('structure','[data-reuse-output-title]')),'网页示例结果');
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reuseSelected'),'upper-body');
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reuseApplied'),'separated-art');
    await shot('reuse-retrieved-structure');
  });
  await reuseStep('Animation receipt loops visually without changing its saved frame and yields to manual control',async()=>{
    await click('[data-reuse-tab="animation"]');
    await click(reuseIn('animation','[data-reuse-reset]'));
    await focus(reuseIn('animation','[data-reuse-frame="1"]'));await key('Enter');
    assert.equal(await evaluate(query(reusePanel('animation'))+'.dataset.reuseFrame'),'1');
    await click(reuseIn('animation','[data-reuse-save]'));
    await click(reuseIn('animation','[data-reuse-select="reach"]'));
    await click(reuseIn('animation','[data-reuse-save]'));
    await click(reuseIn('animation','[data-reuse-use="greeting"]'));
    assert.equal(await text(reuseIn('animation','[data-reuse-count]')),'2 / 2');
    assert.equal(await evaluate(query(reusePanel('animation'))+'.dataset.reuseFrame'),'0');
    assert.equal(await evaluate(query(reusePanel('animation'))+'.dataset.reuseAppliedFrame'),'1');
    assert((await evaluate(query(reuseIn('animation','[data-reuse-preview]'))+'.src')).endsWith('/animation-pose.webp'));
    const before=await receiptSnapshot();
    await evaluate('(()=>{const root=document.querySelector("[data-reuse-root]");window.__reuseTransfers=0;const observer=new MutationObserver(entries=>{for(const entry of entries)for(const node of entry.addedNodes)if(node.matches?.(".duik-reuse-transfer"))window.__reuseTransfers++});observer.observe(root,{childList:true,subtree:true});window.__removeReuseProbe=()=>observer.disconnect()})()');
    try{
      await releaseReuse();await waitFor('window.__reuseTransfers>=2','two automatic receipt transfers');
      report.reuseReceiptLoop={before,after:await receiptSnapshot(),transfers:await evaluate('window.__reuseTransfers')};
      assert.deepEqual(report.reuseReceiptLoop.after,before,'looping the illustration never mutates selected, saved, or received frame');
      await focus(reuseIn('animation','[data-reuse-frame="2"]'));await key('Enter');
      const selected=await receiptSnapshot(),transfers=await evaluate('window.__reuseTransfers');
      await waitFor('window.__reuseTransfers>'+transfers,'automatic illustration resumes after storyboard selection while focus remains');
      assert.deepEqual(await receiptSnapshot(),selected,'resuming never changes the selected, saved or received snapshots');
      assert.equal(selected.frame,'2');assert.deepEqual(selected.applied,{id:'greeting',frame:'1'});
      assert.equal(await evaluate(query(reuseIn('animation','[data-reuse-frame="2"]'))+'.getAttribute("aria-pressed")'),'true');
    }finally{await evaluate('window.__removeReuseProbe?.()');}
    assert.equal(await evaluate(query(reusePanel('animation'))+'.dataset.reuseApplied'),'greeting');
    assert.equal(await evaluate(query(reusePanel('animation'))+'.dataset.reuseAppliedFrame'),'1');
    await shot('reuse-storyboard');
  });
  await reuseStep('Script reuse retrieves the documented code without claiming execution',async()=>{
    await click('[data-reuse-tab="scripts"]');
    await click(reuseIn('scripts','[data-reuse-select="wiggle-call"]'));await click(reuseIn('scripts','[data-reuse-save]'));
    await click(reuseIn('scripts','[data-reuse-select="arm-call"]'));await click(reuseIn('scripts','[data-reuse-use="wiggle-call"]'));
    assert((await text(reuseIn('scripts','[data-reuse-code]'))).includes('Duik.Automation.wiggle();'));
    assert((await text(reuseIn('scripts','[data-reuse-sample-note]'))).includes('网页不执行脚本'));
    await shot('reuse-script-sample');
  });
  await reuseStep('Authentic references occupy the same stage and support enlargement and keyboard return',async()=>{
    report.reuseReferences=[];
    for(const id of ['structure','animation','scripts']){
      await click('[data-reuse-tab="'+id+'"]');
      const before=await rect(reusePanel(id));
      await click(reuseIn(id,'[data-reuse-reference] > summary'));
      await waitFor(query(reuseIn(id,'[data-reuse-zoom] img'))+'.naturalWidth>0','real '+id+' panel');
      assert.equal(await evaluate('getComputedStyle('+query(reuseIn(id,'[data-reuse-stage]'))+').visibility'),'hidden');
      const after=await rect(reusePanel(id));assert(Math.abs(before.height-after.height)<2,'reference must not resize pinned host');
      await click(reuseIn(id,'[data-reuse-step="1"]'));assert.equal(await evaluate(query(reusePanel(id))+'.dataset.reuseCurrentStep'),'1');
      await click('[data-reuse-zoom="'+id+'"]');assert.equal(await evaluate(query('[data-reuse-dialog]')+'.open'),true);
      await click('[data-reuse-dialog-scale]');assert.equal(await evaluate(query('[data-reuse-dialog]')+'.dataset.enlarged'),'true');
      await key('Escape');assert.equal(await evaluate(query('[data-reuse-dialog]')+'.open'),false);
      assert.equal(await evaluate('document.activeElement.dataset.reuseZoom'),id);
      const href=await evaluate(query(reuseIn(id,'[data-reuse-step-docs]'))+'.getAttribute("href")');
      const response=await fetch(new URL(href,url),{signal:AbortSignal.timeout(60000)});
      report.reuseReferences.push({href,status:response.status});
      await click(reuseIn(id,'[data-reuse-reference] > summary'));
    }
    assert(report.reuseReferences.every(item=>item.status===200));
  });
  await reuseStep('Reuse automatic loop suspends offscreen and resumes without overwriting user state',async()=>{
    await click('[data-reuse-tab="structure"]');await click(reuseIn('structure','[data-reuse-reset]'));
    await click(reuseIn('structure','[data-reuse-save]'));await click(reuseIn('structure','[data-reuse-use="upper-body"]'));
    await releaseReuse();await waitFor(query(reuseRoot)+'.dataset.reuseDemoState==="playing"','automatic receipt loop starts');
    await scroll(0);await waitFor(query(reuseRoot)+'.dataset.reuseVisible==="false"','reuse offscreen');
    const phase=await evaluate(query(reusePanel('structure'))+'.dataset.reusePhase');await delay(1900);
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reusePhase'),phase);
    assert.equal(await evaluate(query(reuseRoot)+'.dataset.reuseDemoState'),'paused');
    await revealHorizontal('#reuse');await releaseReuse();await waitFor(query(reuseRoot)+'.dataset.reuseDemoState==="playing"','reuse automatic loop resumes');
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reusePhase'),'used');
    await click(reuseIn('structure','[data-reuse-select="separated-art"]'));await delay(1000);
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reuseSelected'),'separated-art');
  });
  await reuseStep('Reduced motion retains save/use and keyboard tabs with no moving transfer',async()=>{
    await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
    try{
    await click('[data-reuse-tab="structure"]');
    await click(reuseIn('structure','[data-reuse-reset]'));
    await focus('[data-reuse-tab="structure"]');await key('End');assert.equal(await evaluate(query(reuseRoot)+'.dataset.reuseActive'),'scripts');
    await key('Home');assert.equal(await evaluate(query(reuseRoot)+'.dataset.reuseActive'),'structure');
    await focus(reuseIn('structure','[data-reuse-save]'));await key('Enter');
    await focus(reuseIn('structure','[data-reuse-use="upper-body"]'));await key('Enter');
    assert.equal(await evaluate(query(reusePanel('structure'))+'.dataset.reusePhase'),'used');
    assert.equal(await evaluate(query(reuseRoot)+'.querySelectorAll(".duik-reuse-transfer").length'),0);
    const dimensions=await evaluate('(()=>{const stage='+query(reuseIn('structure','[data-reuse-stage]'))+';return {width:stage.clientWidth,scrollWidth:stage.scrollWidth,overflow:document.documentElement.scrollWidth-innerWidth}})()');
    assert(dimensions.scrollWidth<=dimensions.width+1);assert(dimensions.overflow<=1);report.reuseGeometry=dimensions;
    await shot('reuse-reduced-motion');
    }finally{await send('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});}
  });
}
    await step('The closing story flows from directory and learning to FAQ and the final action',async()=>{
      report.closingOrder=await evaluate('Array.from(document.querySelectorAll("[data-experience-mounted]")).map(e=>e.dataset.experienceMounted).filter(k=>["api","catalog","faq","footer"].includes(k))');
      assert.deepEqual(report.closingOrder,['catalog','faq','footer']);
      assert.equal(await evaluate('document.querySelectorAll("[data-catalog-reference],[data-catalog-image]").length'),0);
      assert.equal(await evaluate('document.querySelectorAll("[data-guide-faq-group]:not([hidden]) [data-guide-faq-item]").length'),4);
      assert.equal(await evaluate('document.querySelectorAll("[data-guide-faq-item][open]").length'),0);
      assert.equal(await evaluate('document.querySelector(".duik-guide-primary-link").getAttribute("href")'),'/docs/getting-started/install');
    });
    await step('Directory categories switch a panoramic illustration without an official screenshot panel',async()=>{
      report.catalogBanners=[];
      for(const panel of ['tools','bones']){
        await click('[data-catalog-panel='+panel+']');
        const state=await evaluate('(()=>{const banner=document.querySelector("[data-catalog-banner]"),svg=banner.querySelector("svg"),box=svg.getBoundingClientRect();return{active:banner.dataset.catalogBannerActive,visible:[...banner.querySelectorAll("[data-catalog-banner-scene]")].filter(g=>!g.hasAttribute("hidden")).map(g=>g.dataset.catalogBannerScene),ratio:box.width/box.height,guide:document.querySelector("[data-catalog-guide]").getAttribute("href"),screenshots:document.querySelectorAll("[data-catalog-reference],[data-catalog-image]").length}})()');
        assert.equal(state.active,panel);assert.deepEqual(state.visible,[panel]);assert(Math.abs(state.ratio-4)<.01);assert.equal(state.screenshots,0);assert(state.guide.startsWith('/docs/'));report.catalogBanners.push(state);
      }
      await reveal('[data-duik-catalog]');await shot('12b-directory');
    });
    await step('Five learning tasks, grouped FAQ and non-official footer remain operable',async()=>{
      assert.equal(await evaluate('[...document.querySelectorAll("[data-duik-guide=learning] img")].filter(i=>i.getAttribute("src")?.includes("/wall/")).length'),0);
      assert.equal(await evaluate('document.querySelectorAll("[data-guide-reading]").length'),16);
      report.learningTasks=[];
      for(const path of guidePaths){
        await click('[data-guide-path="'+path.id+'"]');
        assert.equal(await evaluate(query('[data-guide-path="'+path.id+'"]')+'.getAttribute("aria-selected")'),'true');
        const state=await evaluate('(()=>{const panels=[...document.querySelectorAll("[data-guide-panel]")].filter(p=>!p.hidden),p=panels[0],r=p?.getBoundingClientRect();return{visiblePanels:panels.length,id:p?.dataset.guidePanel,width:r?.width,height:r?.height,next:p?.querySelector("[data-guide-next]")?.getAttribute("href"),routes:[...p.querySelectorAll("[data-guide-reading]")].map(a=>a.getAttribute("href"))}})()');
        assert.equal(state.visiblePanels,1);assert.equal(state.id,path.id);assert(state.width>0&&state.height>0);assert.equal(state.next,path.steps[0].href);assert.deepEqual(state.routes,path.steps.map(step=>step.href));
        report.learningTasks.push(state);
      }
      await shot('13-learning');await click('[data-guide-faq-filter=about]');await click('[data-guide-faq-item=scope] summary');assert(await evaluate('document.querySelector("[data-guide-faq-item=scope]").open'));await shot('14-faq');await click('[data-guide-faq-collapse]');assert.equal(await evaluate('document.querySelectorAll(".duik-guide-faq-item[open]").length'),0);
      await reveal('.duik-guide-endplate');await shot('15-footer');assert((await text('.duik-guide-legal')).includes('非官方'));assert((await text('.duik-guide-legal')).includes('GFDL'));
    });
    await step('Scrolled navigation retains only Duik links, not the borrowed logo or login',async()=>{
      await reveal('[data-catalog-query]');
      report.scrolledHeader=await evaluate('(()=>{const header=document.querySelector("header[data-duik-ready=true]");return {className:header.className,navCount:header.querySelectorAll(".duik-site-nav").length,children:[...header.children].map(e=>({tag:e.tagName,nav:e.matches(".duik-site-nav"),display:getComputedStyle(e).display})),text:header.innerText}})()');
      assert.equal(report.scrolledHeader.navCount,1);
      assert(report.scrolledHeader.children.every(e=>e.nav||e.display==='none'));
      assert(!/Log in|Sign up|Linearity/i.test(report.scrolledHeader.text));
    });
    report.rootNetwork={errors:errors.filter(e=>e.stage==='root'),failedRequests:failedRequests.filter(e=>e.stage==='root'),externalRequests:[...new Set(requests.filter(r=>r.stage==='root'&&/^https?:/.test(r.url)&&!r.url.startsWith(new URL(url).origin)).map(r=>r.url))]};
    await step('Catalog keyboard Enter opens the actual Nextra documentation route',async()=>{
      await fill('[data-catalog-query]','裁剪');await key('ArrowDown');report.documentationTarget=await evaluate('document.activeElement.getAttribute("href")');assert.equal(report.documentationTarget,'/docs/guide/tools/composition/crop');stage='docs';await key('Enter');await waitFor('location.pathname==="/docs/guide/tools/composition/crop"&&!!document.querySelector("main h1")','Nextra crop document');report.documentation=await evaluate('({path:location.pathname,title:document.title,h1:document.querySelector("main h1")?.innerText})');await delay(600);await shot('10-documentation');
    });
  }
  const external=scope=>[...new Set(requests.filter(r=>r.stage===scope&&/^https?:/.test(r.url)&&!r.url.startsWith(new URL(url).origin)).map(r=>r.url))];
  const docsStep='Catalog keyboard Enter opens the actual Nextra documentation route';
  report.rootHome={checks:checks.filter(name=>name!==docsStep),failures:failures.filter(f=>f.name!==docsStep),errors:errors.filter(e=>e.stage==='root'),failedRequests:failedRequests.filter(e=>e.stage==='root'),externalRequests:external('root')};
  report.rootHome.passed=!report.failure&&report.rootHome.failures.length===0&&report.rootHome.errors.length===0&&report.rootHome.failedRequests.length===0&&report.rootHome.externalRequests.length===0;
  const navigationResponse=documentResponses.find(r=>r.stage==='docs'&&new URL(r.url).pathname==='/docs/guide/tools/composition/crop');
  report.docsNavigation={attempted:!inspect&&!skippedChecks.includes(docsStep),passed:(inspect||skippedChecks.includes(docsStep))?null:checks.includes(docsStep)&&navigationResponse?.status===200,response:navigationResponse,...report.documentation};
  report.docsResources={errors:errors.filter(e=>e.stage==='docs'),failedRequests:failedRequests.filter(e=>e.stage==='docs'),externalRequests:external('docs'),scopeNote:'Documentation media localization is outside the landing-page acceptance scope; all resource details remain visible.'};
  report.docsResources.passed=report.docsResources.errors.length===0&&report.docsResources.failedRequests.length===0&&report.docsResources.externalRequests.length===0;
  report.docsResourcesPassed=report.docsResources.passed;
  report.externalRequests=[...external('root').map(value=>'root '+value),...external('docs').map(value=>'docs '+value)];
  report.scope='Actual homepage interactions, local homepage resources, and a real HTTP 200 Nextra navigation. Documentation resources are audited separately, not silently ignored.';
  if(checkFilter)report.scope="Filtered checks only: "+process.env.LANDING_CHECK_FILTER+". Skipped checks are not passes. "+report.scope;
  report.scopedPass=report.rootHome.passed&&(inspect||!report.docsNavigation.attempted||report.docsNavigation.passed)&&(inspect||checks.length>0);report.passed=report.scopedPass;
  if(!report.scopedPass)process.exitCode=1;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;try{await shot('failure');}catch{}}
finally{await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({passed:report.passed,scopedPass:report.scopedPass,rootHome:report.rootHome,docsNavigation:report.docsNavigation,docsResources:report.docsResources,failures,initial:inspect?report.initial:undefined,brand:report.brand,output:out},null,2));try{await send('Browser.close',{},null);}catch{}socket?.close();child.kill('SIGTERM');}
