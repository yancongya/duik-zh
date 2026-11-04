import test from 'node:test';
import assert from 'node:assert/strict';
import {solveTwoBone} from '../public/rig-vendor/rev2d-ik.js';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const rig=JSON.parse(await readFile(new URL('../public/riglab-project/rig.json',import.meta.url),'utf8'));
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
test('original character pixels remain locked',async()=>{
 const source=await readFile(new URL('../public/riglab-project/'+rig.source,import.meta.url));
 assert.equal(createHash('sha256').update(source).digest('hex'),'fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a');
 assert.equal(rig.sourceSha256,'fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a');
 assert.equal(rig.parts.length,26);assert(rig.validation.restPixelExact);assert.equal(rig.validation.missingPixels,0);
});
for(const side of ['r','l']){
 const {shoulder:s,elbow:e,wrist:w}=rig.joints[side];
 test(side+': rest IK reconstructs the exact original elbow and wrist',()=>{
  const r=solveTwoBone(s,e,w,w,s);assert(distance(r.elbow,e)<1e-8);assert(distance(r.wrist,w)<1e-8);
 });
 test(side+': 360 bounded IK targets remain finite and keep bone lengths',()=>{
  for(let i=0;i<360;i++){const a=i*Math.PI/180,t=[w[0]+105*Math.cos(a),w[1]+105*Math.sin(a)],r=solveTwoBone(s,e,w,t,s);assert([...r.elbow,...r.wrist].every(Number.isFinite));assert(r.lengthError<1e-8);assert(r.targetError<1e-6);}
 });
 test(side+': unreachable and zero-length target vectors stay finite',()=>{
  for(const t of [s,[s[0]+5000,s[1]-5000]]){const r=solveTwoBone(s,e,w,t,s);assert(r.clamped);assert([...r.elbow,...r.wrist].every(Number.isFinite));assert(r.lengthError<1e-6);}
 });
}
test('part indices and skinning weights are valid',()=>{
 const sources=new Set();for(const p of rig.parts){assert(!sources.has(p.src));sources.add(p.src);assert.equal(p.indices.length%3,0);assert(p.indices.every(i=>Number.isInteger(i)&&i>=0&&i<rig.vertices.length));assert(p.bbox[2]>p.bbox[0]&&p.bbox[3]>p.bbox[1]);}
 for(const v of rig.vertices){assert(v.every(Number.isFinite));assert(v.slice(2).every(w=>w>=0&&w<=1));assert(Math.abs(v.slice(2).reduce((a,b)=>a+b,0)-1)<1e-5);}
});

