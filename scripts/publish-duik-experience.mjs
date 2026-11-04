#!/usr/bin/env node
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,copyFile,cp,access} from 'node:fs/promises';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {parse} from 'parse5';
import {renderExperience} from '../components/home/landing/experience-layout.mjs';
import {patchCapabilityLayoutRuntime,patchCapabilityLayoutSSR} from './lib/landing-capability-layout.mjs';
import {patchCapabilityLinksRuntime,patchOrbitLinksRuntime,patchCapabilityLinksSSR} from './lib/landing-capability-links.mjs';
import {patchCapabilityResizeRuntime,patchCapabilityResizeSSR} from './lib/landing-capability-resize.mjs';
import {patchCapabilitySelectionRuntime} from './lib/landing-capability-selection.mjs';
import {patchCapabilityKeyboardRuntime} from './lib/landing-capability-keyboard.mjs';
import {wrapOrbitSSR,orbitDecorativeAlt} from '../components/home/landing/orbit.mjs';
import {patchOrbitIconsRuntime,patchOrbitIconsSSR,patchOrbitImageAltsRuntime} from './lib/landing-orbit-presentation.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const source=join(root,'components/home/landing'),pub=join(root,'public'),destination=join(pub,'duik-experience');
const hash='d2ea4a745e1ba64aecc76bbf680458929795d2d8';
const files=['experience-layout.mjs','experience-vue.mjs','experience-mount.mjs','experience-shell.css','experience-catalog.mjs','experience-catalog.css','tool-catalog.mjs','tools-demo.mjs','tools-demo.css','tools-model.mjs','motion-demo.mjs','motion-demo.css','motion-model.mjs','content.mjs','guide-experience.mjs','guide-experience.css','reuse-demo.mjs','reuse-demo.css','orientation.mjs','orientation.css','orbit.mjs','orbit-vue.mjs','orbit.css','api-cinema.mjs','api-cinema.css','hero-marquee.mjs','hero-marquee.css'];
files.push('tools-comparison-motion.mjs','rig-diagnostics.mjs','capability-keyboard.mjs');
for(const file of files)await access(join(source,file));
await mkdir(destination,{recursive:true});
for(const file of files)await copyFile(join(source,file),join(destination,file));
await cp(join(source,'icons'),join(destination,'icons'),{recursive:true});
await cp(join(source,'official-media'),join(destination,'official'),{recursive:true});
await writeFile(join(destination,'site.webmanifest'),JSON.stringify({name:'Duik Ángela 非官方中文指南',short_name:'Duik 中文',start_url:'/',display:'browser',background_color:'#f8f6f0',theme_color:'#f8f6f0',icons:[{src:'/duik-experience/icons/controller.svg',sizes:'any',type:'image/svg+xml'}]},null,2)+'\n');
const modules=[
  ['HomeHowItWorksKP.scss_vue_type_style_index_0_src_true_lang.'+hash+'.js','workflow','_'],
  ['HomeFaqKP.'+hash+'.js','catalog','default'],
  ['FooterKP.'+hash+'.js','footer','default'],
  ['HomeDifferenceKP.'+hash+'.js','tools','default'],
  ['HomeCapabilitiesTestimonialKP.'+hash+'.js','libraries','default'],
  ['HomePricingKP.'+hash+'.js','api','default'],
  ['HomeContactKP.vue_vue_type_script_setup_true_lang.'+hash+'.js','faq','_'],
  ['HomeCapabilitiesDiagramKP.vue_vue_type_script_setup_true_lang.'+hash+'.js','animation','_'],
  ['HomeCapabilitiesDiagramKP2.vue_vue_type_script_setup_true_lang.'+hash+'.js','automation','_'],
  ['HomeCapabilitiesDiagramKP3.vue_vue_type_script_setup_true_lang.'+hash+'.js','camera','_'],
];
for(const [file,kind,name]of modules){
  const baseline=join(source,'baseline/_nuxt',file);
  try{await access(baseline);}catch{
    const old=await readFile(join(pub,'_nuxt',file),'utf8');
    assert(!old.includes('/duik-experience/'),'Restore missing original before publishing '+file);
    await mkdir(dirname(baseline),{recursive:true});await writeFile(baseline,old,{flag:'wx'});
  }
  const code=kind==='libraries'?'// Preserve Linearity\'s orbit and its merged-progress contract.\nexport {default} from "/duik-experience/orbit-vue.mjs";\n':'// Duik task-specific experience; shared SSR and client markup.\nimport {makeExperience} from "/duik-experience/experience-vue.mjs";\nconst view=makeExperience('+JSON.stringify(kind)+');\nexport {view as '+name+'};\n';
  await writeFile(join(pub,'_nuxt',file),code);
}
// Restore the original flight-in, orbit selection and outgoing quarter turn.
// These phases used to be shortened while their child was replaced by a shelf,
// leaving a parent timeline with no visual consumer for mergedProgress.
const orbitFile='HomeCapabilitiesTestimonialKP.'+hash+'.js';
let orbitCode=await readFile(join(source,'baseline/_nuxt',orbitFile),'utf8');
const interval='F=Pe(()=>{K.value=(K.value+1)%O.value.length},2500)';
assert.equal(orbitCode.split(interval).length-1,1,'Unknown orbit title interval');
orbitCode=orbitCode.replace(interval,'F=null')
  .replaceAll('/images/testimonial/logo_testi.svg','/duik-experience/icons/controller.svg')
  .replaceAll('Testimonial Logo','Duik 控制器');
for(const [from,to]of [
  ['let q=null;','let q=null,duikOrbitVisibility=null;'],
  ['J.create({trigger:_.value','duikOrbitVisibility=J.create({trigger:_.value'],
  ['q&&q.revert(),F&&clearInterval(F)','q&&q.revert(),duikOrbitVisibility&&duikOrbitVisibility.kill(),F&&clearInterval(F)'],
  ['Ue=["onClick"]','Ue=["onClick","onKeydown","aria-pressed","data-duik-orbit-step"]'],
  ['onClick:Ze=>de(i)},[s("div",We','role:"button",tabindex:0,"aria-pressed":b.value===i,"data-duik-orbit-step":i,onKeydown:Ze=>{if(Ze.key==="Enter"||Ze.key===" "){Ze.preventDefault();de(i)}},onClick:Ze=>de(i)},[s("div",We'],
]){
  assert.equal(orbitCode.split(from).length-1,1,'Unknown original orbit lifecycle: '+from);
  orbitCode=orbitCode.replace(from,to);
}
await writeFile(join(pub,'_nuxt/duik-orbit-template.js'),patchOrbitImageAltsRuntime(patchOrbitIconsRuntime(patchOrbitLinksRuntime(orbitCode))));
const parentFile='HomeCapabilitiesKP.'+hash+'.js';
const parentBaseline=join(source,'baseline/_nuxt',parentFile);
try{await access(parentBaseline);}catch{await copyFile(join(pub,'_nuxt',parentFile),parentBaseline);}
const parentCode=await readFile(parentBaseline,'utf8');
for(const anchor of ['se=Math.max(0,ye-ie+xe+K(420,"rem"))','f*1.6+w','D=1.8,W='])assert(parentCode.includes(anchor),'Missing original orbit phase: '+anchor);
await writeFile(join(pub,'_nuxt',parentFile),patchCapabilityKeyboardRuntime(patchCapabilitySelectionRuntime(patchCapabilityResizeRuntime(patchCapabilityLinksRuntime(patchCapabilityLayoutRuntime(parentCode))))));
let html=patchCapabilityResizeSSR(await readFile(join(pub,'landing.html'),'utf8'));
const payload=JSON.parse(await readFile(join(pub,'_payload.json'),'utf8'));
const orbitAssets=[{src:'/duik-experience/icons/controller.svg',alt:'Duik 控制器'},...payload[366].map((index,i)=>({src:payload[payload[index].filename],alt:i<5?payload[payload[payload[405][i]].title]:orbitDecorativeAlt}))];
function labelOrbitControls(original){
  const edits=[];let index=0;
  function walk(node){
    const classes=node.attrs?.find(attr=>attr.name==='class')?.value||'';
    if(node.tagName==='div'&&classes.startsWith('relative flex flex-row items-start p-[1.25rem]')){
      const loc=node.sourceCodeLocation.startTag;
      const tag=original.slice(loc.startOffset,loc.endOffset).replace(/\s(?:role|tabindex|aria-pressed|data-duik-orbit-step)="[^"]*"/g,'');
      edits.push({start:loc.startOffset,end:loc.endOffset,value:tag.slice(0,-1)+' role="button" tabindex="0" aria-pressed="'+classes.includes('bg-gradient-to-b')+'" data-duik-orbit-step="'+index+++'">'});
    }
    for(const child of node.childNodes||[])walk(child);
  }
  walk(parse(original,{sourceCodeLocationInfo:true}));
  // The capture, like the original component's first render, uses the mobile
  // swiper until its media query mounts. Do not insert a different SSR branch.
  if(index===0)assert.equal((original.match(/data-swiper-slide-index="\d"/g)||[]).length,5,'Expected five initial orbit slides');
  else assert.equal(index,5,'Expected five original orbit selectors');
  for(const edit of edits.sort((a,b)=>b.start-a.start))original=original.slice(0,edit.start)+edit.value+original.slice(edit.end);
  return original;
}
function localizeOrbitImages(original){
  let index=0;
  const localized=original.replace(/<img\b[^>]*>/g,tag=>{
    const asset=orbitAssets[index<9?index:index-8];assert(asset,'Unexpected extra orbit image');index++;
    const src='/.netlify/images?'+(index===1?'':'fm=webp&amp;')+'url='+encodeURIComponent(asset.src);
    return tag.replace(/\b(?:src|srcset|alt)="[^"]*"/g,attribute=>attribute.startsWith('alt=')?'alt="'+asset.alt+'"':attribute.startsWith('srcset=')?'srcset="'+src+' 1x, '+src+' 2x"':'src="'+src+'"');
  });
  assert.equal(index,14,'Expected logo, eight orbit images and five selector thumbnails');return labelOrbitControls(localized);
}
const patches=[],counts={};
const attrs=n=>Object.fromEntries((n.attrs||[]).map(x=>[x.name,x.value]));
function contains(node,className){return (attrs(node).class||'').split(/\s+/).includes(className)||(node.childNodes||[]).some(c=>contains(c,className));}
function visit(node){
  const a=attrs(node),classes=(a.class||'').split(/\s+/);let kind;
  if(a['data-duik-motion'])kind=a['data-duik-motion'];
  else if(a['data-duik-capability-visual'])kind={structure:'animation',controls:'automation',animation:'camera'}[a['data-duik-capability-visual']];
  else if(node.tagName==='footer'&&(a.id==='about'||Object.hasOwn(a,'data-v-4e708f7f')))kind='footer';
  else if(classes.includes('duik-product-orientation'))kind='workflow';
  else if(a.id==='faq')kind='faq';
  else if(node.tagName==='section'){
    if(classes.includes('home-how-it-works-kp'))kind='workflow';
    else if(Object.hasOwn(a,'data-v-de37c414'))kind='faq';
    else if(a.id==='toolkit'||a.id==='pricing')kind='catalog';
    else if(a.id==='api')kind='api';
    else if(a.id==='tools'||contains(node,'duik-pose-slot'))kind='tools';
    else if(a.id==='reuse'||classes.includes('home-testimonial-capabilities-kp'))kind='libraries';
    else if(classes.includes('md:py-[6.25rem]')&&contains(node,'duik-input-slot'))kind='api';
  }
  if(kind){
    assert(node.sourceCodeLocation,'Missing source location for '+kind);
    const l=node.sourceCodeLocation;
    let rendered=renderExperience(kind);
    if(kind==='libraries'){
      // On repeat publication, extract the original child, never wrap the prior
      // wrapper again. The original SSR/Vue geometry and styles stay identical.
      const original=classes.includes('home-testimonial-capabilities-kp')?node:(node.childNodes||[]).find(child=>(attrs(child).class||'').includes('home-testimonial-capabilities-kp'));
      assert(original?.sourceCodeLocation,'Missing original orbit SSR root');
      const location=original.sourceCodeLocation;
      rendered=wrapOrbitSSR(localizeOrbitImages(html.slice(location.startOffset,location.endOffset)));
    }
    patches.push({start:l.startOffset,end:l.endOffset,kind,html:rendered});counts[kind]=(counts[kind]||0)+1;return;
  }
  for(const child of node.childNodes||[])visit(child);
}
visit(parse(html,{sourceCodeLocationInfo:true}));
for(const kind of ['workflow','faq','footer','tools','libraries','catalog','api','animation','automation','camera'])assert.equal(counts[kind],1,'Expected one '+kind+' owned slot');
// Keep the original three host positions, but finish the story before reading:
// API demonstration -> tool directory / learning -> FAQ. Sorting makes direct
// republishing idempotent even when the input already uses the new order.
const closingOrder=['api','catalog','faq'];
patches.filter(patch=>closingOrder.includes(patch.kind)).sort((a,b)=>a.start-b.start).forEach((patch,index)=>{patch.html=renderExperience(closingOrder[index]);});
for(const patch of patches.sort((a,b)=>b.start-a.start))html=html.slice(0,patch.start)+patch.html+html.slice(patch.end);
html=html.replace(/<link\b[^>]*data-duik-experience-style[^>]*>/g,'');
const styles=['experience-shell.css','experience-catalog.css','tools-demo.css','motion-demo.css','guide-experience.css','reuse-demo.css','orientation.css','orbit.css','api-cinema.css','hero-marquee.css'];
html=html.replace('</head>',styles.map(file=>'<link rel="stylesheet" href="/duik-experience/'+file+'" data-duik-experience-style>').join('')+'</head>');
html=patchCapabilityLayoutSSR(html,payload[payload[337].listItems].map(index=>payload[payload[index].title]));
await writeFile(join(pub,'landing.html'),patchOrbitIconsSSR(patchCapabilityLinksSSR(html)));
console.log(JSON.stringify({published:true,source:'components/home/landing',sections:counts,files:files.length,rootRoute:'/',character:'preserved'}));
