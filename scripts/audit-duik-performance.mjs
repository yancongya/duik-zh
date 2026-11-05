import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';
import {homedir} from 'node:os';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {get} from 'node:http';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';

const root=process.cwd(),out=join(root,'output/brand-perf-2026-11-05'),origin='http://127.0.0.1:3017';
const hash=x=>createHash('sha256').update(x).digest('hex');
const {collectStaticAudit}=await import(pathToFileURL(join(process.env.WEB_PERF_SKILL_ROOT||join(homedir(),'.codex/skills/web-perf'),'scripts/lib.mjs')));
const staticAudit=await collectStaticAudit({projectRoot:root,buildDir:'public'});
const identity={head:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),dirtyDiffSha256:hash(execFileSync('git',['diff','--binary'],{maxBuffer:64*1024*1024})),lockSha256:hash(await readFile('package-lock.json')),landingSha256:hash(await readFile('public/landing.html')),brandSourceSha256:hash(await readFile('components/brand/logo.mjs')),buildId:await readFile('.next/BUILD_ID','utf8').catch(()=>null)};
function request(path){return new Promise((resolve,reject)=>{const req=get(origin+path,{headers:{'Accept-Encoding':'gzip'}},res=>{const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>{const body=Buffer.concat(chunks);resolve({path,status:res.statusCode,headers:res.headers,transferBodyBytes:body.length,body:res.headers['content-encoding']==='gzip'?gunzipSync(body):body});});});req.setTimeout(15000,()=>req.destroy(Error('Request timeout')));req.on('error',reject);});}
const main=[];
for(const path of ['/','/_nuxt/entry.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js','/_nuxt/WebGLBackgroundCore.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js','/riglab-project/rig.json','/brand/v1/logo.svg','/favicon.ico','/site.webmanifest','/brand.html']){
  const {body,...response}=await request(path);assert.equal(response.status,200,path);main.push({...response,decodedBytes:body.length,sha256:hash(body)});
}
const map=JSON.parse(await readFile('components/brand/media-rewrites.json','utf8')),images=[];
for(const route of map){const {body,...response}=await request(route.source);assert.equal(response.status,200);const expected=await readFile(join(root,'public',route.destination));assert.equal(hash(body),hash(expected),route.source);assert.match(response.headers['content-type'],/^image\/(png|webp)/);images.push({source:route.source,destination:route.destination,bytes:body.length,match:true});}
await mkdir(out,{recursive:true});
const report={evidence:'Static skill audit + local production HTTP, not browser metrics or deployment proof',origin,identity,staticAudit,http:main,imageRoutes:images};
await writeFile(join(out,'static-http-final.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({identity,requests:main.map(x=>({path:x.path,decoded:x.decodedBytes,transfer:x.transferBodyBytes,encoding:x.headers['content-encoding']||'identity'})),imageRoutes:images.length,staticFindings:staticAudit.findings.length},null,2));
