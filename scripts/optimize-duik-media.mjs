import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

// Master layers and the approved source stay untouched. Only the exported web
// delivery copies are re-encoded. WebP MUST preserve even transparent RGB;
// sharp's default lossless WebP does not, so use libwebp's explicit -exact.
const root=process.cwd(),web=join(root,'public/riglab-project'),master=join(root,'public/duik-character/rig-v2');
const rig=JSON.parse(await readFile(join(web,'rig.json'),'utf8'));
const names=[...new Set(rig.parts.flatMap(p=>[p.src,p.thumbnail]).concat(rig.faceSupport.src,rig.eyeSupports.map(x=>x.src),'rest-assembled.png'))];
const hash=data=>createHash('sha256').update(data).digest('hex');
const rgba=buffer=>sharp(buffer).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const results=[];
const rewrites=[],run=promisify(execFile);
let webpAvailable=false;
try{await run('cwebp',['-version']);webpAvailable=true;}catch{}
await mkdir(join(web,'optimized-v1'),{recursive:true});
async function optimize(name,original,inputPath){
  assert(/^[a-z0-9-]+\.png$/.test(name),'Unexpected path in approved rig');
  const encoded=await sharp(original).png({compressionLevel:9,palette:false,adaptiveFiltering:true}).toBuffer();
  let next=encoded.length<original.length?encoded:original,extension='png';
  if(webpAvailable){const {stdout}=await run('cwebp',['-quiet','-lossless','-exact','-m','6',inputPath,'-o','-'],{encoding:'buffer',maxBuffer:16*1024*1024});if(stdout.length<next.length){next=stdout;extension='webp';}}
  const [a,b]=await Promise.all([rgba(original),rgba(next)]);
  assert.deepEqual(a.info,b.info,name+' dimensions changed');assert(a.data.equals(b.data),name+' RGBA changed');
  const filename=name.replace('.png','')+'-'+hash(next).slice(0,12)+'.'+extension;
  await writeFile(join(web,'optimized-v1',filename),next);
  rewrites.push({source:'/riglab-project/'+name,destination:'/riglab-project/optimized-v1/'+filename});
  results.push({name,output:filename,before:original.length,after:next.length,rgbaSha256:hash(a.data),sourceSha256:hash(original),outputSha256:hash(next)});
}
for(const name of names){
  const original=await readFile(join(master,name)),existing=await readFile(join(web,name));
  // Exported settings may evolve; refuse an old master rather than undo edits.
  const [a,b]=await Promise.all([rgba(original),rgba(existing)]);
  assert.deepEqual(a.info,b.info,name+' master dimensions no longer match');assert(a.data.equals(b.data),name+' master no longer matches export');
  await optimize(name,original,join(master,name));
}
await optimize('source-optimized-v1.png',await readFile(join(web,rig.source)),join(web,rig.source));
// /source.png and sourceSha256 still refer to the untouched approved bytes.
await writeFile(join(root,'components/brand/media-rewrites.json'),JSON.stringify(rewrites,null,2)+'\n');
await mkdir(join(root,'output/brand-perf-2026-11-05'),{recursive:true});
const report={kind:'lossless exact RGBA delivery copies; PNG or cwebp -lossless -exact; body bytes, not browser timing',webpAvailable,originalSourcePreserved:rig.sourceSha256,files:results,before:results.reduce((s,x)=>s+x.before,0),after:results.reduce((s,x)=>s+x.after,0)};
await writeFile(join(root,'output/brand-perf-2026-11-05/media-compression.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({files:results.length,before:report.before,after:report.after,saved:report.before-report.after,pixels:'exact RGBA'}));
