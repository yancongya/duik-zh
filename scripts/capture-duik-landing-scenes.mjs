#!/usr/bin/env node
/** Export stills from the approved layered rig. Never regenerates character art. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {mkdir,mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';

const base=process.env.RIG_URL||'http://127.0.0.1:3020/rig-embed.html';
const manifestURL=process.env.RIG_MANIFEST||'/project/rig.json';
const output=resolve('public/duik-landing-assets');
const approvedSource='public/duik-character/source/character-selected-v1.png';
const sourceSha256='fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a';
const width=1400,height=1200;
const captureDocument='<!doctype html><html><head><meta charset="utf-8"><link rel="icon" href="data:,"><title>Isolated rig capture</title></head><body></body></html>';
const scenes=[
  {id:'character-rest',title:'同一个角色，从原图出发',alt:'已确认角色由 26 张独立透明图层在原坐标精确拼接',controls:false,mode:'assembled',pose:{}},
  {id:'layers-exploded',title:'拆分清楚，绑定才有依据',alt:'角色的头发、五官、身体和双臂等 26 张真实透明图层分开展示',controls:false,mode:'exploded',pose:{}},
  {id:'bones-controls',title:'让骨骼和控制器各司其职',alt:'同一个角色显示参考风格的彩色骨骼与 12 个姿态控制器',controls:true,mode:'assembled',pose:{}},
  {id:'ik-pose',title:'移动手部，理解 IK',alt:'左手目标改变后，上臂与前臂通过 IK 联动的角色姿态',controls:true,mode:'assembled',pose:{handL:[-40,-70],handR:[20,-15],body:1.2,head:-3,wristL:8}},
  {id:'expression-detail',title:'头部、表情与发梢',alt:'同一个角色的头部、表情、视线和发梢控制细节',controls:true,mode:'assembled',pose:{head:3,gaze:.5,brow:.35,smile:.6,hairL:1.6,hairR:-1.2},crop:[170,-50,900,800]},
  {id:'animation-pose',title:'从一个姿态开始动画',alt:'保持同一角色造型的轻微侧身抬手姿态，展现绑定后的表达能力',controls:false,mode:'assembled',pose:{handL:[40,-45],handR:[-8,12],body:-1.5,head:4,gaze:.4,smile:.45,hairL:-1.5,hairR:1.2,wristL:-10}}
];
assert.equal(createHash('sha256').update(await readFile(approvedSource)).digest('hex'),sourceSha256,'approved source must not change');
assert((await fetch(base)).ok,'standalone rig server must be running');
await mkdir(output,{recursive:true});
const profile=await mkdtemp(join(tmpdir(),'duik-scene-capture-'));
const chrome=spawn(process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',[
  '--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run',
  '--no-default-browser-check','--disable-background-networking','--disable-component-update',
  '--enable-unsafe-swiftshader','--use-angle=swiftshader','about:blank'
],{stdio:['ignore','ignore','pipe']});
let ws,session,sequence=0;
const pending=new Map(),errors=[],failedRequests=[];
const endpoint=await new Promise((done,fail)=>{
  let log='';const timer=setTimeout(()=>fail(Error('Chrome start timeout: '+log.slice(-500))),20000);
  chrome.stderr.on('data',chunk=>{log+=chunk;const match=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timer);done(match[1]);}});
  chrome.on('error',fail);
});
function send(method,params={},sid=session){
  const id=++sequence;
  return new Promise((done,fail)=>{
    const timeout=setTimeout(()=>{pending.delete(id);fail(Error('CDP timeout '+method));},30000);
    pending.set(id,{done:value=>{clearTimeout(timeout);done(value);},fail:error=>{clearTimeout(timeout);fail(error);}});
    ws.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));
  });
}
async function evaluate(expression){
  const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails)throw Error(result.exceptionDetails.exception?.description||result.exceptionDetails.text);
  return result.result.value;
}
async function mountCapture(options){
  await import('/character-rig.js');
  document.body.replaceChildren();document.body.style.cssText='margin:0;background:transparent';
  const element=document.createElement('character-rig');element.id='capture-rig';
  element.setAttribute('src',options.manifest);element.setAttribute('interaction','none');element.setAttribute('controls','visible');
  element.style.cssText='display:block;width:'+options.width+'px;height:'+options.height+'px';
  document.body.append(element);window.captureRig=await element.ready;
  await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
  const state=window.captureRig.getState();
  const bytes=await(await fetch(state.source)).arrayBuffer();
  const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  return {partCount:state.partCount,sourceSha256:state.sourceSha256,actualSourceSha256:digest,restValidation:state.restValidation};
}
async function captureScene(scene){
  const element=document.getElementById('capture-rig'),api=window.captureRig;
  api.reset();api.configure({interaction:'none',showControls:scene.controls,showMesh:false,showLabels:false});
  api.setMode(scene.mode);api.setPose(scene.pose);
  await new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done)));
  const state=api.getState(),source=element.shadowRoot.querySelector('#rigCanvas');
  const canvas=document.createElement('canvas');canvas.width=source.width;canvas.height=source.height;
  const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);
  const overlay=element.shadowRoot.querySelector('#controls');
  if(scene.controls){
    const svg=overlay.cloneNode(true);svg.setAttribute('width',String(canvas.width));svg.setAttribute('height',String(canvas.height));
    svg.querySelectorAll('text,title').forEach(node=>node.remove());
    const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));
    try{const image=new Image();image.src=url;await image.decode();ctx.drawImage(image,0,0,canvas.width,canvas.height);}finally{URL.revokeObjectURL(url);}
  }
  if(scene.mode==='exploded'){
    ctx.font='16px system-ui';ctx.fillStyle='#625b4e';ctx.textAlign='center';ctx.textBaseline='top';
    for(const label of element.shadowRoot.querySelectorAll('.stage-label'))ctx.fillText(label.textContent,parseFloat(label.style.left)/100*canvas.width,parseFloat(label.style.top)/100*canvas.height);
  }
  let result=canvas;
  if(scene.crop){
    const [x,y,w,h]=scene.crop,[cx,cy,cw,ch]=state.camera;
    result=document.createElement('canvas');result.width=1050;result.height=Math.round(1050*h/w);
    result.getContext('2d').drawImage(canvas,(x-cx)/cw*canvas.width,(y-cy)/ch*canvas.height,w/cw*canvas.width,h/ch*canvas.height,0,0,result.width,result.height);
  }
  const pixels=result.getContext('2d').getImageData(0,0,result.width,result.height).data;
  let visible=0,transparent=0;
  for(let i=3;i<pixels.length;i+=4){if(pixels[i]>0)visible++;else transparent++;}
  return {data:result.toDataURL('image/webp',.92),width:result.width,height:result.height,visiblePixels:visible,transparentPixels:transparent,
    sourceSha256:state.sourceSha256,partCount:state.partCount,finiteVertices:state.finiteVertices,webglError:state.webglError,
    restPixelExact:state.restValidation.restPixelExact,controlCount:overlay.querySelectorAll('[data-control]').length,
    maxBoneLengthError:Math.max(state.arms.l.lengthError,state.arms.r.lengthError),camera:state.camera,pose:state.pose};
}
const results=[];
try{
  ws=new WebSocket(endpoint);await new Promise((done,fail)=>{ws.onopen=done;ws.onerror=fail;});
  ws.onmessage=event=>{
    const data=JSON.parse(event.data);
    if(data.id){const item=pending.get(data.id);if(item){pending.delete(data.id);data.error?item.fail(Error(data.error.message)):item.done(data.result);}}
    else if(data.method==='Fetch.requestPaused')send('Fetch.fulfillRequest',{requestId:data.params.requestId,responseCode:200,responseHeaders:[{name:'Content-Type',value:'text/html; charset=utf-8'}],body:Buffer.from(captureDocument).toString('base64')}).catch(error=>errors.push(error.message));
    else if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.exception?.description||data.params.exceptionDetails.text);
    else if(data.method==='Runtime.consoleAPICalled'&&data.params.type==='error')errors.push(data.params.args.map(arg=>arg.description||arg.value).join(' '));
    else if(data.method==='Network.responseReceived'&&data.params.response.status>=400)failedRequests.push({url:data.params.response.url,status:data.params.response.status});
    else if(data.method==='Network.loadingFailed'&&!data.params.canceled)failedRequests.push({error:data.params.errorText,type:data.params.type});
  };
  const target=await send('Target.createTarget',{url:'about:blank'},null);
  session=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true},null)).sessionId;
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  // Only replace this isolated Chrome tab's document. Every module, manifest and
  // texture still loads from the real local server; no demo-page callbacks race capture.
  await send('Fetch.enable',{patterns:[{urlPattern:base,resourceType:'Document',requestStage:'Request'}]});
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url:base});
  for(let attempt=0;attempt<100;attempt++){
    if(await evaluate('document.readyState === "complete"'))break;
    await new Promise(done=>setTimeout(done,100));
  }
  const initial=await evaluate('('+mountCapture.toString()+')('+JSON.stringify({width,height,manifest:manifestURL})+')');
  assert.equal(initial.partCount,26);assert.equal(initial.actualSourceSha256,sourceSha256);assert(initial.restValidation.restPixelExact);
  for(const scene of scenes){
    const {data,...validation}=await evaluate('('+captureScene.toString()+')('+JSON.stringify(scene)+')');
    assert.equal(validation.sourceSha256,sourceSha256);assert(validation.finiteVertices);assert.equal(validation.webglError,0);
    assert(validation.maxBoneLengthError<1e-5);assert(validation.visiblePixels>5000);assert(validation.transparentPixels>5000);
    assert.equal(validation.controlCount,scene.controls?12:0);assert(data.startsWith('data:image/webp;base64,'));
    const file=scene.id+'.webp';await writeFile(join(output,file),Buffer.from(data.split(',')[1],'base64'));
    results.push({...scene,url:'/duik-landing-assets/'+file,...validation});
    console.log(file+' '+validation.width+'x'+validation.height+' alpha verified');
  }
  const cards=results.map(scene=>'<article><div class="art"><img src="'+scene.id+'.webp" alt="'+scene.alt+'"></div><span>'+scene.id+'</span><h2>'+scene.title+'</h2><p>'+scene.alt+'</p></article>').join('');
  const html='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Duik 同角色分镜</title><style>*{box-sizing:border-box}body{margin:0;padding:40px;background:#f6f4ef;color:#243327;font-family:system-ui,sans-serif}h1{margin:0 0 8px;font-size:32px}.intro{color:#626b61;margin:0 0 28px}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}article{background:#fff;border:1px solid #d9dfd3;border-radius:18px;overflow:hidden;padding:16px}.art{height:330px;border-radius:10px;background:#f2f2e9;display:flex;align-items:center;justify-content:center}.art img{width:100%;height:100%;object-fit:contain}span{display:block;margin-top:14px;color:#598363;font-size:12px;letter-spacing:.04em}h2{font-size:18px;margin:8px 0}p{font-size:13px;line-height:1.6;color:#657066;margin:0}</style><h1>同一个角色 · 六个学习片段</h1><p class="intro">从已确认角色、26 张透明图层与真实控制器运行时导出。不是新生成的替代角色。</p><main>'+cards+'</main></html>';
  await writeFile(join(output,'index.html'),html);
  // The standalone rig server does not publish these output files. Embed capture bytes
  // in this isolated review document, without issuing temporary 404 requests.
  const dataURLs=Object.fromEntries(await Promise.all(results.map(async scene=>[scene.id+'.webp','data:image/webp;base64,'+(await readFile(join(output,scene.id+'.webp'))).toString('base64')])));
  const previewHTML=html.replace('<meta charset="utf-8">','<meta charset="utf-8"><link rel="icon" href="data:,">').replace(/src="([^"]+\.webp)"/g,(_,file)=>'src="'+dataURLs[file]+'"');
  const frameTree=await send('Page.getFrameTree');
  await send('Page.setDocumentContent',{frameId:frameTree.frameTree.frame.id,html:previewHTML});
  await evaluate('Promise.all(Array.from(document.images,image=>image.decode()))');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1160,deviceScaleFactor:1,mobile:false});
  const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(join(output,'contact-sheet.png'),Buffer.from(screenshot.data,'base64'));
  assert.equal(errors.length,0,'capture must not produce browser errors: '+JSON.stringify(errors));
  assert.equal(failedRequests.length,0,'rig inputs must load locally without failed requests: '+JSON.stringify(failedRequests));
  await writeFile(join(output,'manifest.json'),JSON.stringify({schemaVersion:1,source:approvedSource,sourceSha256,generatedAt:new Date().toISOString(),generator:'scripts/capture-duik-landing-scenes.mjs',provenance:'Local WebGL rendering of approved 26-layer rig plus its actual SVG control overlay; no AI regeneration.',rigValidation:initial,scenes:results,browserErrors:errors,resourceFailures:failedRequests},null,2)+'\n');
  console.log(JSON.stringify({output,scenes:results.length,sourceSha256,rigValidation:initial},null,2));
}finally{
  try{await send('Browser.close',{},null);}catch{}
  ws?.close();chrome.kill('SIGTERM');
}
