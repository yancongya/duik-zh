import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {brand,brandManifest,renderLogo} from '../components/brand/logo.mjs';
import {renderBrandGuide} from '../components/brand/guide.mjs';

const root=fileURLToPath(new URL('../',import.meta.url)),out=join(root,'public',brand.base);
await mkdir(out,{recursive:true});
const assets=[];
async function emit(file,buffer){
  await writeFile(join(out,file),buffer);
  assets.push({file,bytes:Buffer.byteLength(buffer),sha256:createHash('sha256').update(buffer).digest('hex')});
}
for(const color of ['color','mono','reverse']){
  const suffix=color==='color'?'':`-${color}`,svg=renderLogo({color});
  await emit(`logo${suffix}.svg`,svg);
  for(const size of brand.sizes)await emit(`logo${suffix}-${size}.png`,await sharp(Buffer.from(svg)).resize(size,size).png({compressionLevel:9}).toBuffer());
}
for(const motion of ['intro','loader','loop'])await emit(`logo-${motion}.svg`,renderLogo({motion}));
await emit('maskable-512.png',await sharp(Buffer.from(renderLogo({maskable:true}))).resize(512,512).png({compressionLevel:9}).toBuffer());
await emit('apple-touch-icon.png',await sharp(Buffer.from(renderLogo())).resize(180,180).flatten({background:brand.colors.paper}).png({compressionLevel:9}).toBuffer());
// ICO directory with three actual PNG frames, not a PNG renamed to .ico.
const frames=await Promise.all([16,32,48].map(size=>readFile(join(out,`logo-${size}.png`))));
const header=Buffer.alloc(6+16*frames.length);header.writeUInt16LE(1,2);header.writeUInt16LE(frames.length,4);
let offset=header.length;
frames.forEach((frame,i)=>{const at=6+16*i,size=[16,32,48][i];header[at]=size;header[at+1]=size;header.writeUInt16LE(1,at+4);header.writeUInt16LE(32,at+6);header.writeUInt32LE(frame.length,at+8);header.writeUInt32LE(offset,at+12);offset+=frame.length;});
await emit('favicon.ico',Buffer.concat([header,...frames]));
await copyFile(join(out,'favicon.ico'),join(root,'public/favicon.ico'));
await copyFile(join(out,'logo-32.png'),join(root,'public/favicon-32x32.png'));
await writeFile(join(root,'public/site.webmanifest'),JSON.stringify(brandManifest)+'\n');
await writeFile(join(root,'public/brand.html'),renderBrandGuide());
await copyFile(join(root,'components/brand/guide.js'),join(root,'public/brand/guide.js'));
await copyFile(join(root,'components/brand/perf-observer.js'),join(root,'public/duik-perf-observer.js'));
await writeFile(join(out,'tokens.json'),JSON.stringify(brand,null,2)+'\n');
await writeFile(join(out,'sources.json'),JSON.stringify({kind:'Approved A derivative for this unofficial Chinese guide; not an official RxLaboratory identity',upstream:{repository:'RxLaboratory/Duik',revision:'718e6e282d1ae91dc9678bb1a202ce08e862a28d',paths:['src-docs/home-html/duik.png','src-docs/aep/jissse/Duik parenting/(Footage)/DUIK_logo_full_dark-300x300.png'],credit:'RxLaboratory and contributors'},canonical:'components/brand/logo.mjs',assets},null,2)+'\n');
console.log(JSON.stringify({brand:brand.base,assets:assets.length,bytes:assets.reduce((s,a)=>s+a.bytes,0)}));
