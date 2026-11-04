#!/usr/bin/env node
// Explicit, pinned documentation assets. Never crawl the official website.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=fileURLToPath(new URL('../',import.meta.url));
const revision='718e6e282d1ae91dc9678bb1a202ce08e862a28d';
const base=`https://raw.githubusercontent.com/RxLaboratory/Duik/${revision}/src-docs/docs/img/`;
const destination=join(root,'components/home/landing/official-media');
const assets=[
 ['duik/home.png','getting-started/first-look'],
 ['duik/top-bar.png','getting-started/first-look'],
 ['duik/individual-panels.png','getting-started/first-look'],
 ['duik/bones/bones_panel.png','guide/bones'],
 ['duik/bones/toolbar.png','guide/bones'],
 ['duik/constraints/constraints-panel.png','guide/constraints'],
 ['duik/controllers/panel.png','guide/controllers'],
 ['duik/animation/animation-panel.png','guide/animation'],
 ['duik/animation/temporal-interpolation.png','guide/animation/interpolation'],
 ['duik/automation/panel.png','guide/automation'],
 ['duik/automation/wiggle-effect.png','guide/automation/wiggle'],
 ['duik/cameras/camera-panel.png','guide/camera'],
 ['duik/cameras/2d-camera-effect.png','guide/camera/camera-2d'],
 ['duik/tools/comp-tools.png','guide/tools'],
 ['duik/tools/layer-tools.png','guide/tools'],
 ['duik/tools/text-tools.png','guide/tools'],
 ['duik/tools/script-tools.png','guide/tools'],
 ['duik/tools/rename.png','guide/tools/text/rename'],
 ['duik/tools/script-editor.png','guide/tools/scripting/script-editor'],
 ['duik/cmd.png','guide/cmd'],
 ['duik/oco/oco_panel.png','guide/oco'],
 ['duik/animation/anim-library.png','guide/animation/anim-library'],
 ['duik/tools/script-lib.png','guide/tools/scripting/library'],
];
const records=[];
for(const [file,guide] of assets){
 const target=join(destination,file);let buffer;
 try{buffer=await readFile(target);}catch(error){
  if(error.code!=='ENOENT')throw error;
  const response=await fetch(base+file,{signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`${file}: HTTP ${response.status}`);
  buffer=Buffer.from(await response.arrayBuffer());
  if(buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Not a PNG: '+file);
  await mkdir(dirname(target),{recursive:true});await writeFile(target,buffer,{flag:'wx'});
 }
 if(buffer.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('Invalid existing PNG: '+file);
 const record={file,source:base+file,guide:'/docs/'+guide,width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20),bytes:buffer.length,sha256:createHash('sha256').update(buffer).digest('hex')};
 records.push(record);console.log(`${file}: ${record.width}x${record.height}, ${record.bytes} bytes`);
}
await writeFile(join(destination,'sources.json'),JSON.stringify({revision,checked:'2026-11-01',kind:'Unmodified official documentation screenshots; not generated mockups or current AE-session captures',attribution:'Nicolas “Duduf” Dufresne / RxLaboratory and contributors',licenseContext:'Upstream documentation GFDL 1.3; retain original attribution, see NOTICE.md and LICENSE-GFDL-1.3.md',assets:records},null,2)+'\n');
console.log(`Recorded ${records.length} official assets. Publication is a separate step.`);
