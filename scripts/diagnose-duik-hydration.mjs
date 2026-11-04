// Isolated browser diagnostic: enrich Vue's production hydration warning through
// CDP response interception. Never writes the served runtime or landing assets.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));
process.env.LANDING_INSPECT='1';
process.env.LANDING_OUTPUT??=join(root,'output/duik-landing-independent/hydration');
const entryName='entry.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
let validator=await readFile(join(root,'scripts/validate-duik-landing.mjs'),'utf8');
let entry=await readFile(join(root,'public/_nuxt',entryName),'utf8');
const replacements=[
  ['I.data!==w.children&&(ro(),I.data=w.children)','I.data!==w.children&&(window.__hm("text-node",I,w),ro(),I.data=w.children)'],
  ['for(fe&&!Pu(I,1)&&ro();fe;)','for(fe&&!Pu(I,1)&&(window.__hm("extra-server-children",I,w),ro());fe;)'],
  ['(Pu(I,0)||ro(),I.textContent=w.children)','(Pu(I,0)||(window.__hm("element-text",I,w),ro()),I.textContent=w.children)'],
  ['N||(N=!0,Pu(L,1)||ro())','N||(N=!0,Pu(L,1)||(window.__hm("missing-server-child",L,re),ro()))'],
  ['(ro(),u(w.anchor=l("]"),F,G),G)','(window.__hm("fragment-end",I,w),ro(),u(w.anchor=l("]"),F,G),G)'],
  ['if(YA(I,w)||ro(),w.el=null,x)','if(YA(I,w)||(window.__hm("node-kind",I,w),ro()),w.el=null,x)'],
];
for(const [from,to] of replacements){
  if(!entry.includes(from))throw Error('Runtime version changed; missing diagnostic anchor: '+from);
  entry=entry.replace(from,to);
}
const body=Buffer.from(entry).toString('base64');
const handler='if(m.method==="Fetch.requestPaused"){send("Fetch.fulfillRequest",{requestId:m.params.requestId,responseCode:200,responseHeaders:[{name:"Content-Type",value:"application/javascript"}],body:'+JSON.stringify(body)+'}).catch(e=>errors.push(String(e)));return;}';
function patch(from,to){
  if(!validator.includes(from))throw Error('Validator changed; missing diagnostic anchor: '+from);
  validator=validator.replace(from,to);
}
patch('if(m.id){const p=pending.get(m.id);',handler+'if(m.id){const p=pending.get(m.id);');
const tracking='window.__mismatches=[];window.__hm=(kind,node,vnode)=>{const type=v=>typeof v?.type==="string"?v.type:typeof v?.type==="symbol"?String(v.type):v?.type?.name||v?.type?.__name||typeof v?.type;window.__mismatches.push({kind,type:type(vnode),path:[node?.parentElement?.tagName,node?.parentElement?.className,node?.tagName,node?.className].join(" / "),server:(node?.outerHTML||node?.textContent||node?.data||"").slice(0,2200),client:typeof vnode?.children==="string"?vnode.children:Array.isArray(vnode?.children)?vnode.children.map(v=>({type:type(v),text:typeof v?.children==="string"?v.children:undefined})).slice(0,16):String(vnode?.children)});};';
patch("await send('Page.navigate',{url});","await send('Fetch.enable',{patterns:[{urlPattern:'*"+entryName+"',requestStage:'Request'}]});await send('Page.addScriptToEvaluateOnNewDocument',{source:"+JSON.stringify(tracking)+"});await send('Page.navigate',{url});");
patch("await screenshot('01-hero');","report.hydration=await evaluate('window.__mismatches');await screenshot('01-hero');");
// A diagnostic run is deliberately not a motion acceptance pass.
patch('for(const [index,section] of report.dom.sections.entries())','for(const [index,section] of [])');
patch("report.passed=process.env.LANDING_INSPECT==='1'||errors.length===0&&failedRequests.length===0;",'report.diagnosticOnly=true;report.passed=errors.length===0&&failedRequests.length===0;');
patch('report.failure=error.stack','report.failure=error.name+": "+error.message');
patch('console.log(JSON.stringify({...report,output:out},null,2))','console.log(JSON.stringify({errors,failedRequests,mismatchCount:report.hydration?.length,passed:report.passed,failure:report.failure,externalRequests:report.externalRequests,output:out},null,2))');
await import('data:text/javascript;base64,'+Buffer.from(validator).toString('base64'));
