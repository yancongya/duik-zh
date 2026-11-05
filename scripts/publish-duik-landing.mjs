import {readFile,writeFile,mkdir,copyFile,access} from 'node:fs/promises';
import path from 'node:path';
import {parse,parseFragment} from 'parse5';
import ts from 'typescript';
import {textSlots,learningMarkup,headlineActors,headlineTools,headlineWords,headlineSummary,heroStageMarkup} from '../components/home/landing/content.mjs';
import {characterScenes} from '../components/home/landing/scenes.mjs';
import {heroPreviews} from '../components/home/landing/preview-scenes.mjs';
import {heroWallScenes,publishHeroWallAssets} from '../components/home/landing/hero-wall-scenes.mjs';
import {patchHeroWallSSR,patchHeroWallRuntime,patchHeroWallIntroSSR} from './lib/landing-hero-wall.mjs';
import {patchLandingVisualSSR,landingVisualStyleHref} from './lib/landing-visual-ssr.mjs';
import {patchLightBackground} from './lib/landing-background.mjs';
import {patchGlowLifecycle} from './lib/landing-glow.mjs';
import {patchNavigationSSR,patchNavigationRuntime} from './lib/landing-navigation.mjs';
import {patchHeroRibbonSSR,patchHeroRibbonRuntime} from './lib/landing-hero-ribbon.mjs';
import {patchHeroMarqueeRuntime,renderHeroMarqueeSSR} from './lib/landing-hero-marquee.mjs';
import {cleanTemplateHead} from './lib/landing-template-head.mjs';
import {brandLinks} from '../components/brand/logo.mjs';
const root=process.cwd(),pub=path.join(root,'public'),source=path.join(root,'components/home/landing');
const slot='_nuxt/HeroInputKP.vue_vue_type_script_setup_true_lang.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const learningSlot='_nuxt/HomePricingKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const runtime='_nuxt/entry.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const layout='_nuxt/default-kp.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const difference='_nuxt/HomeDifferenceKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const hero='_nuxt/HomeHeroKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const headlineModule='_nuxt/HeroOrgHeadline.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const backgroundModule='_nuxt/WebGLBackgroundCore.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const glowModule='_nuxt/GlowingEdgeOverlayCore.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const headerModule='_nuxt/HeaderKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const marqueeModule='_nuxt/LogoMarqueeKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const baseline=path.join(source,'baseline');
const recovery=path.join(root,'output/landing-before-light');
await mkdir(baseline,{recursive:true});
for(const name of ['landing.html','_payload.json',slot,learningSlot,runtime,layout,difference,hero,headlineModule,backgroundModule,headerModule,marqueeModule,'duik-preview.js','duik-preview.css']){
  const dst=path.join(baseline,name);
  try{await access(dst);}catch{
    let from=path.join(recovery,name);
    try{await access(from);}catch{
      from=path.join(pub,name);
      if(name==='landing.html'&&(await readFile(from,'utf8')).includes('/duik-landing.css'))throw Error('Missing immutable landing baseline; restore the source snapshot before publishing');
    }
    await mkdir(path.dirname(dst),{recursive:true});await copyFile(from,dst);
  }
}
// Always derive from the pre-adaptation capture, never from a previously published page.
let html=await readFile(path.join(baseline,'landing.html'),'utf8');
const payload=JSON.parse(await readFile(path.join(baseline,'_payload.json'),'utf8'));
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\"','&quot;').replaceAll("'",'&#39;');
const replacements=new Map();
const imageReplacements=new Map(),extraText={};
const scenes=Object.values(characterScenes);
if(heroWallScenes.length!==payload[40].length||heroWallScenes.length!==payload[129].length)throw Error('Hero wall assets must map every captured slot.');
await publishHeroWallAssets({root,outputDir:path.join(pub,'duik-experience/wall')});
await mkdir(path.join(pub,'duik-experience/previews'),{recursive:true});
for(const preview of heroPreviews){const target=path.join(pub,preview.src.slice(1));await mkdir(path.dirname(target),{recursive:true});await copyFile(path.join(source,"official-media",preview.sourceFile),target);}
await writeFile(path.join(pub,'duik-experience/previews/manifest.json'),JSON.stringify({type:'official-documentation-panels',source:'components/home/landing/preview-scenes.mjs',notCurrentSessionCaptures:true,items:heroPreviews.map(({svg,...item})=>item)},null,2));
for(const [slot,value] of Object.entries({...textSlots,...extraText})){
  const old=payload[slot];if(typeof old!=='string')throw Error('Invalid text slot '+slot);
  if(old!==value&&old.length>0){
    replacements.set(old,value);
    const before=old.split('\n'),after=value.split('\n');
    if(before.length===after.length)before.forEach((line,i)=>{if(line.length)replacements.set(line,after[i]);});
  }
  payload[slot]=value;
}
const intern=value=>{let i=payload.indexOf(value);if(i<0){i=payload.length;payload.push(value);}return i;};
// Several captured cards share a title/description string reference. Give each
// feature its own interned value; never overwrite those shared payload strings.
for(const [i,index] of payload[129].entries()){
  payload[index].title=intern(heroWallScenes[i].title);
  payload[index].promtText=intern(heroWallScenes[i].description);
}
// Repair the historical shared empty-string slot. Never use shared empty metadata
// for an image path: it also represents URL ids, labels, alt text and header flags.
payload[15]='';
payload[274]='/docs';payload[279]='/docs/getting-started/install';
payload[403].title=intern('创作。');
payload[35]=''; // This guide has no Linearity promo-video modal.
payload[10]=[]; // No borrowed awards or endorsement claims.
payload[728]='#f8f6f0';
payload[734]=characterScenes.controllers.src;
payload[730]={...payload[273]};
for(const [before,after] of Object.entries({
  '角色绑定与动画':textSlots[37].split('\n')[0],
  '从骨骼开始，完成可控动作。':textSlots[37].split('\n')[1],
  '准备分层角色素材，为绑定建立清晰起点。':textSlots[294],
  '连接骨骼、约束与控制器，让角色结构便于调整。':textSlots[297],
  '调整姿势与关键帧，把时间留给角色表演。':textSlots[300],
  'Watch the 60-second demo':'查看安装与入门指南',
  'asset':'创作。'
}))replacements.set(before,after);
const orbitSceneIds=['character-paper','animation-library','script-library','text-detail','composition-detail','layer-detail','motion-spacing','controller-symbols'];
for(const [i,index] of [...payload[40],327,...payload[366]].entries()){
  const asset=payload[index],orbitIndex=i-payload[40].length-1;
  const orbitScene=heroWallScenes.find(scene=>scene.id===orbitSceneIds[orbitIndex]);
  // The orbit itself supplies the movement. Static local posters keep its
  // nested artwork still when scroll stops, offscreen or in reduced motion.
  const scene=i<payload[40].length?heroWallScenes[i]:i===payload[40].length?characterScenes.layers:{...orbitScene,src:orbitScene.reducedMotionSrc};
  if(!asset||typeof asset.filename!=='number')throw Error('Unknown image asset '+index);
  imageReplacements.set(payload[asset.filename],scene.src);
  asset.filename=intern(scene.src);asset.alt=intern(scene.alt);
}
// Intro lightbox items point at the same artwork, without altering their wrappers.
for(const [i,index] of payload[129].entries()){const asset=payload[payload[index].image],scene=heroWallScenes[i];imageReplacements.set(payload[asset.filename],scene.src);asset.filename=intern(scene.src);asset.alt=intern(scene.alt);}
// Only replace actual text nodes. Copy containing Pricing/Capabilities must never
// rename module URLs, CSS classes, asset attributes, or the flattened payload graph.
const patches=[];
const localizedText=value=>{const key=value.trim();return replacements.has(key)?value.replace(key,replacements.get(key)):value;};
function visit(node){
  if(['script','style'].includes(node.tagName))return;
  const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
  for(const attr of node.attrs||[]){
    if(!['src','srcset','href','alt','content'].includes(attr.name))continue;
    let next=attr.value;
    const metaName=attrs.name||attrs.property;
    if(node.tagName==='meta'&&attr.name==='content'){
      if(['title','og:title','twitter:title'].includes(metaName))next=payload[736];
      if(['description','og:description','twitter:description'].includes(metaName))next=payload[739];
      if(['og:image','twitter:image'].includes(metaName))next=characterScenes.controllers.src;
      if(metaName==='theme-color')next='#f8f6f0';
    }
    if(node.tagName==='link'&&attrs.rel==='canonical'&&attr.name==='href')next='/';
    for(const [before,after] of imageReplacements){next=next.replaceAll(before,after).replaceAll(encodeURIComponent(before),encodeURIComponent(after));}
    if(attr.name==='alt'&&next==='/duik-preview-assets/hero-22.svg')next='角色分层与绑定示意';
    if(attr.name==='href'&&(/cloud.linearity.io|form.typeform.com/.test(next)||next.startsWith('//duik-preview-assets'))){
      const text=n=>n.nodeName==='#text'?localizedText(n.value):(n.childNodes||[]).map(text).join('');
      next=text(node).includes('查看安装方法')?'/docs/getting-started/install':'/docs';
    }
    const loc=node.sourceCodeLocation?.attrs?.[attr.name];
    if(loc&&next!==attr.value)patches.push({start:loc.startOffset,end:loc.endOffset,value:attr.name+'="'+escape(next)+'"'});
  }
  if(node.nodeName==='#text'&&node.sourceCodeLocation){
    const key=node.value.trim();
    let next=localizedText(node.value);
    if(node.parentNode?.tagName==='title'&&node.parentNode.parentNode?.tagName==='head')next=payload[736];
    if(/^\d+ x \d+$/.test(key)&&node.parentNode?.attrs?.some(a=>a.name==='data-v-727aab41'))next='400 x 400';
    if(next!==node.value)patches.push({start:node.sourceCodeLocation.startOffset,end:node.sourceCodeLocation.endOffset,value:escape(next)});
  }
  for(const child of node.childNodes||[])visit(child);
}
visit(parse(html,{sourceCodeLocationInfo:true}));
for(const patch of patches.sort((a,b)=>b.start-a.start))html=html.slice(0,patch.start)+patch.value+html.slice(patch.end);
// HTML has original hero JPGs; the baseline payload already contains old SVG
// remaps. Match this gallery by stable DOM order, not by payload filename text.
html=patchHeroWallSSR(html,heroWallScenes);
html=patchHeroWallIntroSSR(html,payload[37],payload[payload[payload[281].at(-1)].title]);
html=html.replace(/(<script[^>]*id="__NUXT_DATA__"[^>]*>)[\s\S]*?(<\/script>)/,(_,start,end)=>start+JSON.stringify(payload).replaceAll('<','\\u003c')+end);
// Match the already-localized rotating headline's initial SSR state. Its timing,
// pill transitions and event handlers stay in the original component.
html=html.replace(/<h1 class="kp-org-headline[\s\S]*?<\/h1>/,headline=>headline
  .replace(/aria-label="[^"]*"/,'aria-label="'+escape(headlineSummary)+'"')
  .replace(/>Let</g,'>'+headlineWords[0]+'<').replace(/>from</g,'>'+headlineWords[1]+'<').replace(/>create</g,'>'+headlineWords[2]+'<')
  .replaceAll('Susan',headlineActors[0].name).replaceAll('Marketing',headlineTools[0].name)
  .replaceAll('>骨骼<','>'+headlineTools[0].name+'<')
  .replaceAll('Q4 Event Slides',headlineTools[0].assets[0].label)
  .replaceAll('/images/hero-avatars/03.webp',headlineActors[0].avatar));
let headlineCode=await readFile(path.join(baseline,headlineModule),'utf8');
const headlineTree=ts.createSourceFile('headline.js',headlineCode,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),headlineEdits=[];
let headlinePalette;
const findHeadline=node=>{
  if(ts.isVariableDeclaration(node)&&node.name.getText(headlineTree)==='M'&&ts.isArrayLiteralExpression(node.initializer))headlinePalette=node.initializer.elements.map(item=>item.text);
  if(ts.isVariableDeclaration(node)&&['L','d'].includes(node.name.getText(headlineTree))&&ts.isArrayLiteralExpression(node.initializer))headlineEdits.push({start:node.initializer.getStart(headlineTree),end:node.initializer.end,value:JSON.stringify(node.name.getText(headlineTree)==='L'?headlineActors:headlineTools)});
  if(ts.isVariableDeclaration(node)&&node.name.getText(headlineTree)==='z'&&ts.isCallExpression(node.initializer)&&node.initializer.getText(headlineTree).includes('让角色从骨骼开始'))headlineEdits.push({start:node.initializer.getStart(headlineTree),end:node.initializer.end,value:node.initializer.expression.getText(headlineTree)+'(()=>'+JSON.stringify(headlineSummary)+')'});
  ts.forEachChild(node,findHeadline);
};findHeadline(headlineTree);
if(headlineEdits.length!==3)throw Error('Unrecognized rotating headline data or accessible summary');
for(const edit of headlineEdits.sort((a,b)=>b.start-a.start))headlineCode=headlineCode.slice(0,edit.start)+edit.value+headlineCode.slice(edit.end);
for(const [index,before] of ['让','用','完成'].entries()){
  const anchor='class:"kp-org-headline__word"},'+JSON.stringify(before);
  if(headlineCode.split(anchor).length!==2)throw Error('Unrecognized headline connector: '+before);
  headlineCode=headlineCode.replace(anchor,'class:"kp-org-headline__word"},'+JSON.stringify(headlineWords[index]));
}
await writeFile(path.join(pub,headlineModule),headlineCode);
// Payload strings are shared across captured sections (for example Marketing).
// Resolve each pill by its DOM role, after those general copy replacements.
if(!headlinePalette?.length)throw Error('Missing original headline tint palette');
const actorTint=headlinePalette[[...headlineActors[0].name].reduce((sum,char)=>sum+char.charCodeAt(0),0)%headlinePalette.length];
const initialPills={person:{label:headlineActors[0].name,tint:actorTint},team:{label:headlineTools[0].name,tint:headlineTools[0].tint},asset:{label:headlineTools[0].assets[0].label}};
html=html.replace(/<h1 class="kp-org-headline[\s\S]*?<\/h1>/,headline=>{
  const edits=[];
  function walk(node,pill){
    const attrs=Object.fromEntries((node.attrs||[]).map(attr=>[attr.name,attr.value]));
    const variant=attrs.class?.match(/\bkp-pill--(person|team|asset)\b/)?.[1];
    if(variant)pill=initialPills[variant];
    const loc=node.sourceCodeLocation;
    if(pill&&loc){
      if(attrs.class?.split(' ').includes('kp-pill__label')&&!('data-label' in attrs))edits.push({start:loc.startTag.endOffset,end:loc.endTag.startOffset,value:escape(pill.label)});
      for(const attr of node.attrs||[]){
        const next=attr.name==='data-label'?pill.label:attr.name==='style'&&pill.tint?attr.value.replace(/--kp-pill-tint:[^;]*/,`--kp-pill-tint:${pill.tint}`):attr.value;
        const range=loc.attrs?.[attr.name];
        if(range&&next!==attr.value)edits.push({start:range.startOffset,end:range.endOffset,value:attr.name+'="'+escape(next)+'"'});
      }
    }
    for(const child of node.childNodes||[])walk(child,pill);
  }
  walk(parseFragment(headline,{sourceCodeLocationInfo:true}));
  for(const edit of edits.sort((a,b)=>b.start-a.start))headline=headline.slice(0,edit.start)+edit.value+headline.slice(edit.end);
  return headline;
});
for(const [variant,icon] of [['team','ic-settings'],['asset','ic-people']]){
  const code=await readFile(path.join(pub,'_nuxt/'+icon+'.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js'),'utf8');
  const ast=ts.createSourceFile('icon.js',code,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);let markup='';
  const paths=[];
  const collect=n=>{
    if(ts.isStringLiteral(n)&&n.text.startsWith('<')&&n.text.length>markup.length)markup=n.text;
    if(ts.isCallExpression(n)&&n.arguments[0]?.text==='path'&&ts.isObjectLiteralExpression(n.arguments[1])){
      const attributes=n.arguments[1].properties.map(p=>{
        if(!ts.isPropertyAssignment(p)||!ts.isStringLiteral(p.initializer))throw Error('Unexpected dynamic icon path: '+icon);
        const name=ts.isStringLiteral(p.name)?p.name.text:p.name.getText(ast);
        return name+'="'+escape(p.initializer.text)+'"';
      });paths.push('<path '+attributes.join(' ')+'></path>');
    }
    ts.forEachChild(n,collect);
  };collect(ast);
  if(!markup)markup=paths.join('');
  if(!markup)throw Error('No SSR icon geometry found for '+icon);
  html=html.replace(new RegExp('(<button[^>]*class="kp-pill--'+variant+'[^>]*>[\\s\\S]*?<svg[^>]*>)[\\s\\S]*?(<\\/svg>)'),(_,start,end)=>start+markup+end);
}
// Structural SSR patches mirror the handful of components changed below.
const structural=[];
let differenceClass='';
let differenceCode=await readFile(path.join(baseline,difference),'utf8');
const tree=ts.createSourceFile('difference.js',differenceCode,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS);
let poseCall;
function inspect(node){
  if(ts.isVariableDeclaration(node)&&node.name.getText(tree)==='Me')differenceClass=node.initializer.properties.find(p=>p.name?.getText(tree)==='class')?.initializer.text;
  if(ts.isCallExpression(node)&&node.expression.getText(tree)==='r'&&node.arguments[1]?.getText(tree)==='Me')poseCall=node;
  ts.forEachChild(node,inspect);
}
inspect(tree);
if(!differenceClass||!poseCall)throw Error('Unrecognized comparison visual slot');
differenceCode='import DuikPose from "./duik-pose-slot.js";'+differenceCode.slice(0,poseCall.getStart(tree))+'u(DuikPose)'+differenceCode.slice(poseCall.end);
for(const [before,after] of [['Pixelated','分层结构'],['Bitmap.jpg','原角色素材'],['1 layer','26 个透明图层']])differenceCode=differenceCode.replaceAll(JSON.stringify(before),JSON.stringify(after));
await writeFile(path.join(pub,difference),differenceCode);
let differenceSeen=0;
function structuralVisit(node){
  const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
  const loc=node.sourceCodeLocation;
  if(loc&&attrs.class===differenceClass&&++differenceSeen===2){structural.push({start:loc.startOffset,end:loc.endOffset,value:'<div class="duik-pose-slot"></div>'});return;}
  for(const c of node.childNodes||[])structuralVisit(c);
}
structuralVisit(parse(html,{sourceCodeLocationInfo:true}));
for(const p of structural.sort((a,b)=>b.start-a.start))html=html.slice(0,p.start)+p.value+html.slice(p.end);
html=html.replaceAll('>Pixelated<','>分层结构<').replaceAll('>Bitmap.jpg<','>原角色素材<').replaceAll('>1 layer<','>26 个透明图层<');
let heroCode=await readFile(path.join(baseline,hero),'utf8');
heroCode=patchHeroRibbonRuntime(heroCode);
heroCode=patchHeroWallRuntime(heroCode,heroWallScenes);
const legacyLabel='r.label||"Real Outputs"';
if(heroCode.split(legacyLabel).length!==2)throw Error('Missing hero label fallback anchor');
heroCode=heroCode.replace(legacyLabel,'r.label||""');
await writeFile(path.join(pub,hero),heroCode);
html=html.replace(/<section\b[^>]*id="pricing"[^>]*>[\s\S]*?<\/section>/,'<section id="pricing" class="duik-learning">'+learningMarkup+'</section>');
await writeFile(path.join(pub,'_payload.json'),JSON.stringify(payload));
// Replace precisely the two shared input-component roots, including their SSR markup.
const stack=[],ranges=[];
for(const match of html.matchAll(/<div\b[^>]*>|<\/div>|<textarea\b/g)){
  if(match[0].startsWith('<div'))stack.push({start:match.index,tag:match[0],input:false});
  else if(match[0]==='</div>'){const node=stack.pop();if(node?.input)ranges.push({...node,end:match.index+6});}
  else{const node=stack.findLast(node=>node.tag.includes('max-w-[35.6875rem]'));if(node)node.input=true;}
}
for(const r of ranges.reverse()){const tag=r.tag.replace('flex flex-col items-center gap-[1.25rem] w-full max-w-[35.6875rem] mx-auto relative z-20','duik-input-slot');html=html.slice(0,r.start)+tag+heroStageMarkup+'</div>'+html.slice(r.end);}
html=html.replace(/<html([^>]*)>/,(_,attrs)=>'<html'+attrs.replace(/\s(?:lang|data-duik-theme)="[^"]*"/g,'')+' lang="zh-CN" data-duik-theme="light">');
html=html.replace(/<link[^>]*href="\/duik-preview.css"[^>]*>/g,'').replace(/<script[^>]*src="\/duik-preview.js"[^>]*><\/script>/g,'');
html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,tag=>/googletagmanager|lemlist|cookiebot/i.test(tag)&&!/__NUXT_DATA__|__NUXT__/.test(tag)?'':tag);
html=cleanTemplateHead(html);
html=html.replace(/<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>/g,'');
html=html.replace(/<link\b[^>]*rel="alternate"[^>]*>/g,'');
html=html.replace(/<link\b[^>]*rel="(?:icon|shortcut icon|apple-touch-icon|manifest)"[^>]*>/g,'');
html=html.replace('</head>',brandLinks.map(link=>'<link '+Object.entries(link).map(([key,value])=>`${key}="${value}"`).join(' ')+'>').join('')+'</head>');
html=html.replace(/(<script>window\.__NUXT__=[\s\S]*?)(<\/script>)/,(_,start,end)=>start+';window.__NUXT__.config.public.SITE_URL=location.origin;window.__NUXT__.config.public.cookiebotId="";window.__NUXT__.config.public.NUXT_PUBLIC_GTM_ID="";window.__NUXT__.config.public.mixpanelToken="";'+end);
if(!html.includes('window.__NUXT__')){
  const original=await readFile(path.join(baseline,'landing.html'),'utf8');
  const config=[...original.matchAll(/<script\b[^>]*>[\s\S]*?<\/script>/g)].find(m=>m[0].includes('window.__NUXT__'));
  if(!config)throw Error('Missing runtime config');
  html=html.replace('</body>',config[0]+'</body>');
}
if(!html.includes('href="/duik-landing.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/duik-landing.css"></head>');
// The measured marquee is lazy-loaded, but its SSR layout must not wait for JS.
if(!html.includes('href="/_nuxt/LogoMarqueeKP-DfAlyzly.css"'))html=html.replace('</head>','<link rel="stylesheet" href="/_nuxt/LogoMarqueeKP-DfAlyzly.css"></head>');
html=patchLandingVisualSSR(html);
html=html.replace('</head>','<link rel="stylesheet" href="'+landingVisualStyleHref+'" data-duik-visual-styles></head>');
// The copied marketing analytics/chat plugins do not belong to the local guide.
// Keep every rendering/router plugin and required Nuxt config intact.
let entry=await readFile(path.join(baseline,runtime),'utf8');
const replaceBetween=(start,end,replacement)=>{
  const a=entry.indexOf(start),b=entry.indexOf(end,a+start.length);
  if(a<0||b<0)throw Error('Unrecognized runtime boundary: '+start);
  entry=entry.slice(0,a)+replacement+entry.slice(b);
};
replaceBetween('fJ=Tt(()=>{const e=_r();','dJ=()=>','fJ=Tt(()=>{}),');
replaceBetween('pJ=Tt(()=>{',';var $o={}','pJ=Tt(()=>{})');
replaceBetween('const Kre=Tt(()=>{','qre=Tt(', 'const Kre=Tt(()=>({provide:{mixpanel:{track(){},identify(){},register(){},reset(){},people:{set(){}}}}})),');
await writeFile(path.join(pub,runtime),entry);
let layoutCode=await readFile(path.join(baseline,layout),'utf8');
// The captured template includes a viewport-sized, near-invisible "B". It has
// no content purpose and misleadingly wins LCP over the visible page. Remove
// the exact SSR/client node, not other aria-hidden decoration or SVG titles.
const sentinelNodes=[];
const findSentinel=node=>{if(node.tagName==='p'&&node.attrs?.some(a=>a.name==='style'&&a.value.includes('font-size: 200vw'))&&node.childNodes?.some(n=>n.value?.trim()==='B'))sentinelNodes.push(node);for(const child of node.childNodes||[])findSentinel(child);};
findSentinel(parse(html,{sourceCodeLocationInfo:true}));
if(sentinelNodes.length!==1)throw Error('Unknown template paint sentinel');
const sentinelLocation=sentinelNodes[0].sourceCodeLocation;
html=html.slice(0,sentinelLocation.startOffset)+ '<!---->'+html.slice(sentinelLocation.endOffset);
const sentinelStart=layoutCode.indexOf('N("p",{"aria-hidden":"true",style:Re(`');
const sentinelEnd=layoutCode.indexOf(')}," B ",4)',sentinelStart);
if(sentinelStart<0||sentinelEnd<0||!layoutCode.slice(sentinelStart,sentinelEnd).includes('font-size: 200vw'))throw Error('Unknown client paint sentinel');
layoutCode=layoutCode.slice(0,sentinelStart)+'te("",!0)'+layoutCode.slice(sentinelEnd+')}," B ",4)'.length);
layoutCode=layoutCode.replace('lt=" | Linearity"','lt=""').replace('lang:_e,class:"theme-kp"','lang:"zh-CN",class:"theme-kp"');
const layoutTree=ts.createSourceFile('layout.js',layoutCode,ts.ScriptTarget.Latest,true,ts.ScriptKind.JS),layoutEdits=[];
const findHead=node=>{
  if(ts.isCallExpression(node)&&node.expression.getText(layoutTree)==='xe'&&ts.isObjectLiteralExpression(node.arguments[0])){
    for(const property of node.arguments[0].properties){
      const name=property.name?.getText(layoutTree);
      if(name==='link')layoutEdits.push({start:property.getStart(layoutTree),end:property.end,value:'link:[{rel:"canonical",href:r.public.SITE_URL+"/"},...'+JSON.stringify(brandLinks)+']'});
      if(name==='script')layoutEdits.push({start:property.getStart(layoutTree),end:property.end,value:'script:[{type:"application/ld+json",innerHTML:JSON.stringify({"@context":"https://schema.org","@type":"WebSite",name:"Duik Ángela 非官方中文文档",inLanguage:"zh-CN",url:r.public.SITE_URL})}]'});
    }
  }
  ts.forEachChild(node,findHead);
};findHead(layoutTree);
if(layoutEdits.length!==2)throw Error('Unrecognized page metadata boundary');
for(const edit of layoutEdits.sort((a,b)=>b.start-a.start))layoutCode=layoutCode.slice(0,edit.start)+edit.value+layoutCode.slice(edit.end);
await writeFile(path.join(pub,layout),layoutCode);
await writeFile(path.join(pub,backgroundModule),patchLightBackground(await readFile(path.join(baseline,backgroundModule),'utf8')));
await writeFile(path.join(pub,glowModule),patchGlowLifecycle(await readFile(path.join(baseline,glowModule),'utf8')));
await writeFile(path.join(pub,marqueeModule),patchHeroMarqueeRuntime(await readFile(path.join(baseline,marqueeModule),'utf8')));
await writeFile(path.join(pub,headerModule),patchNavigationRuntime(await readFile(path.join(baseline,headerModule),'utf8')));
html=patchNavigationSSR(html);
html=patchHeroRibbonSSR(html,renderHeroMarqueeSSR());
const bootStyle=await readFile(path.join(root,'components/brand/boot.css'),'utf8');
const bootScript=await readFile(path.join(root,'components/brand/boot.js'),'utf8');
html=html.replace('</head>',`<style data-duik-boot-style>${bootStyle}</style></head>`);
// A sibling of the hydration root. Never gate Nuxt or steal focus/scroll.
html=html.replace(/<body\b[^>]*>/,tag=>tag+'<div id="duik-boot" aria-hidden="true"><img src="/brand/v1/logo.svg" width="96" height="96" alt=""><p role="status">正在准备创作舞台</p></div><script data-duik-boot-script>'+bootScript+'</script>');
html=html.replace('</head>','<script>if(["127.0.0.1","localhost","[::1]"].includes(location.hostname)&&new URLSearchParams(location.search).get("perf")==="1"){const s=document.createElement("script");s.src="/duik-perf-observer.js";document.head.append(s)}</script></head>');
await writeFile(path.join(pub,'landing.html'),html);
for(const [from,to] of [['hero-slot.mjs',slot],['learning-slot.mjs',learningSlot],['pose-slot.mjs','_nuxt/duik-pose-slot.js'],['content.mjs','duik-landing-content.js'],['adapter.js','duik-landing.js'],['theme.css','duik-landing.css']])await copyFile(path.join(source,from),path.join(pub,to));
console.log(JSON.stringify({published:true,replacedInputs:ranges.length,baseline,rootRoute:'/',runtime:'preserved',theme:'light'}));
