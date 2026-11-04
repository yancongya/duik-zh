import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
const url=process.env.LANDING_URL||'http://127.0.0.1:3017/';
const response=await fetch(url);assert(response.ok,'Local preview HTTP '+response.status);
const out=resolve(process.env.LANDING_OUTPUT||'output/duik-landing-validation');
await mkdir(out,{recursive:true});
const profile=await mkdtemp(join(tmpdir(),'duik-landing-browser-'));
const child=spawn(process.env.CHROME_BIN||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--remote-debugging-port=0','--user-data-dir='+profile,'--no-first-run','--no-default-browser-check','--disable-background-networking','--enable-unsafe-swiftshader','--use-angle=swiftshader','about:blank'],{stdio:['ignore','ignore','pipe']});
let socket,session,seq=0;const pending=new Map(),errors=[],failedRequests=[],requests=[],checks=[];
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const endpoint=await new Promise((resolve,reject)=>{let log='';const timeout=setTimeout(()=>reject(Error('Chrome startup timeout')),20000);child.stderr.on('data',d=>{log+=d;const m=log.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(m){clearTimeout(timeout);resolve(m[1]);}});child.on('error',reject);});
function send(method,params={},sid=session){const id=++seq;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending.delete(id);reject(Error('CDP timeout '+method));},25000);pending.set(id,{resolve:r=>{clearTimeout(timer);resolve(r);},reject:e=>{clearTimeout(timer);reject(e);}});socket.send(JSON.stringify({id,method,params,...(sid?{sessionId:sid}:{})}));});}
async function evaluate(expression){const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;}
async function screenshot(name){const r=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(join(out,name+'.png'),Buffer.from(r.data,'base64'));}
async function click(selector){const point=await evaluate(`(()=>{const r=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()`);await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});await delay(200);}
const report={url,checks,errors,failedRequests};
try{
  socket=new WebSocket(endpoint);await new Promise((r,j)=>{socket.onopen=r;socket.onerror=j;});
  socket.onmessage=event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);if(p){pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}return;}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);if(m.method==='Runtime.consoleAPICalled'&&['error','warning'].includes(m.params.type))errors.push(m.params.args.map(x=>x.value||x.description).join(' '));if(m.method==='Network.responseReceived'&&m.params.response.status>=400)failedRequests.push({url:m.params.response.url,status:m.params.response.status});if(m.method==='Network.requestWillBeSent')requests.push(m.params.request.url);};
  const target=await send('Target.createTarget',{url:'about:blank'},null);session=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true},null)).sessionId;
  await send('Page.enable');await send('Runtime.enable');await send('Network.enable');
  await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
  await send('Page.navigate',{url});
  for(let i=0;i<80;i++){if(await evaluate('!!document.querySelector("#duik-hero-character")?.rig'))break;await delay(250);}
  await delay(1500);
  report.dom=await evaluate(`(()=>({title:document.title,hero:document.querySelector('h1')?.innerText,character:!!document.querySelector('#duik-hero-character')?.rig,bodyBackground:getComputedStyle(document.querySelector('.theme-kp')||document.body).backgroundColor,sections:[...document.querySelectorAll('main section,footer')].map(e=>({class:e.className,id:e.id,text:e.innerText.slice(0,450),height:Math.round(e.getBoundingClientRect().height),top:Math.round(e.getBoundingClientRect().top+scrollY),background:getComputedStyle(e).backgroundColor})),headings:[...document.querySelectorAll('h1,h2,h3')].map(e=>({tag:e.tagName,text:e.textContent.trim(),class:e.className})),inputs:document.querySelectorAll('textarea').length,images:[...document.images].filter(e=>e.getBoundingClientRect().width>0&&!e.complete).map(e=>e.src),links:[...document.querySelectorAll('header a')].map(e=>({text:e.innerText,href:e.getAttribute('href')}))}))()`);
  await screenshot('01-hero');
  assert(report.dom.character,'Hero component did not mount');
  if(process.env.LANDING_INSPECT!=='1'){
    assert(report.dom.character,'Hero character must load');assert.equal(report.dom.inputs,0,'prompt inputs removed');
    const before=await evaluate('document.querySelector("#duik-hero-character").rig.getState().pose');
    const point=await evaluate(`(()=>{const e=document.querySelector('#duik-hero-character').shadowRoot.querySelector('[data-control=handL]');const p=new DOMPoint(0,0).matrixTransform(e.getScreenCTM());return {x:p.x,y:p.y}})()`);
    await send('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',buttons:1,clickCount:1,...point});
    for(let i=1;i<=10;i++){await send('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:point.x+24*i/10,y:point.y-20*i/10});await delay(30);}
    await send('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:point.x+24,y:point.y-20});
    assert.notDeepEqual(await evaluate('document.querySelector("#duik-hero-character").rig.getState().pose.handL'),before.handL);checks.push('Hero uses actual character component with draggable visible controllers');
    await screenshot('02-hero-drag');await click('[data-rig-reset]');
    assert.equal(await evaluate('document.querySelector("#duik-hero-character").rig.getState().pose.head'),0);checks.push('Hero reset works');
  }
  for(const [index,section] of report.dom.sections.entries()){if(index===0)continue;await evaluate('window.scrollTo(0,'+Math.max(0,section.top+Math.min(section.height*.25,600))+')');await delay(600);await screenshot('section-'+index);}
  await evaluate('window.scrollTo(0,0)');await delay(400);
  report.externalRequests=[...new Set(requests.filter(x=>/^https?:/.test(x)&&!x.startsWith(new URL(url).origin)))];
  report.passed=process.env.LANDING_INSPECT==='1'||errors.length===0&&failedRequests.length===0;
  if(!report.passed)process.exitCode=1;
}catch(error){report.passed=false;report.failure=error.stack;process.exitCode=1;try{await screenshot('failure');}catch{}}
finally{await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,output:out},null,2));try{await send('Browser.close',{},null);}catch{}socket?.close();child.kill('SIGTERM');}
