// Read-only publishing contracts. Run after scripts/publish-duik-landing.mjs.
// Browser motion/drag verification belongs to validate-duik-landing.mjs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';
import {runInNewContext} from 'node:vm';
import {createHash} from 'node:crypto';
import {textSlots,headlineActors,headlineTools,headlineWords,headlineSummary} from '../components/home/landing/content.mjs';
import {renderExperience} from '../components/home/landing/experience-layout.mjs';
import {heroPreviews} from '../components/home/landing/preview-scenes.mjs';
import {workflowSteps} from '../components/home/landing/orientation.mjs';
import {parse,parseFragment} from 'parse5';
import {cleanTemplateHead} from './lib/landing-template-head.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const read=relative=>readFile(join(root,relative),'utf8');
const html=await read('public/landing.html');
const payload=JSON.parse(await read('public/_payload.json'));
const baseline=JSON.parse(await read('components/home/landing/baseline/_payload.json'));
const baselineHtml=await read('components/home/landing/baseline/landing.html');
const hash='d2ea4a745e1ba64aecc76bbf680458929795d2d8';

test('published landing demonstrations have no playback scrubbers or transport buttons',()=>{
  const forbidden=['data-api-progress','data-api-phase','data-api-reset'];
  const walk=node=>{
    const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
    for(const name of forbidden)assert(!Object.hasOwn(attrs,name),name+' must not return in SSR');
    if(Object.hasOwn(attrs,'data-scene-progress'))assert(Object.hasOwn(attrs,'data-tools-root'),'Tools progress is state only, not an input');
    if(node.tagName==='input'&&attrs.type==='range'){
      assert(!['time','cameraTime'].includes(attrs['data-input']));
      assert(!Object.hasOwn(attrs,'data-reuse-frame'),'storyboards are discrete choices, not a playhead');
      assert(!/进度|拖动时间/.test(attrs['aria-label']||''));
    }
    for(const child of node.childNodes||[])walk(child);
  };
  walk(parse(html));
});

test('approved asset and route remaps preserve valid Nuxt references',()=>{
  assert(payload.length>=baseline.length,'Existing indexed slots must never be removed');
  assert(payload.slice(baseline.length).every(value=>typeof value==='string'),'Only new string values may be interned');
  baseline.forEach((entry,index)=>{
    if(typeof entry==='string')return;
    if(index===10){assert.deepEqual(payload[index],[],'Remove borrowed award claims');return;}
    if(index===730){assert.deepEqual(payload[index],payload[273],'Later CTA uses the documentation link');return;}
    const allowed=new Set(index===403?['title']:baseline[129].includes(index)?['title','promtText']:entry&&typeof entry==='object'&&!Array.isArray(entry)&&Object.hasOwn(entry,'filename')?['filename','alt']:[]);
    if(!allowed.size){assert.deepEqual(payload[index],entry,'Reference slot '+index);return;}
    assert.deepEqual(Object.keys(payload[index]),Object.keys(entry),'Object shape '+index);
    for(const [key,value] of Object.entries(entry)){
      if(!allowed.has(key)){assert.deepEqual(payload[index][key],value,'Reference '+index+'.'+key);continue;}
      const reference=payload[index][key];
      assert(Number.isInteger(reference)&&reference>=0&&reference<payload.length,'Valid reference '+index+'.'+key);
      assert.equal(typeof payload[reference],'string','String target '+index+'.'+key);
    }
  });
  assert.equal(payload[15],'','Shared empty metadata cannot become an image path');
  assert.equal(payload[17],'asset','Shared asset type cannot become visible copy');
  assert.equal(payload[payload[403].title],'创作。','Visible label gets its own string reference');
  for(const [index,value] of Object.entries(textSlots))assert.equal(payload[index],value,'Text slot '+index);
});

test('SSR inline payload exactly matches the separately requested payload',()=>{
  const match=html.match(/<script\b[^>]*id="__NUXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  assert(match,'Missing __NUXT_DATA__');
  assert.deepEqual(JSON.parse(match[1]),payload);
});

function runtimeConfig(markup){
  const script=[...markup.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('window.__NUXT__.config'));
  assert(script,'Missing Nuxt runtime config script');
  const context={window:{},location:{origin:'http://127.0.0.1:3017'}};
  runInNewContext(script[1],context,{timeout:1000});
  return JSON.parse(JSON.stringify(context.window.__NUXT__.config));
}

test('Nuxt runtime app config survives analytics removal',()=>{
  const current=runtimeConfig(html),original=runtimeConfig(baselineHtml);
  assert.equal(current.app.baseURL,'/');
  assert.deepEqual(current.app,original.app);
});

test('published head has no borrowed ownership verification or billing listener',async()=>{
  const document=parse(html);
  const head=document.childNodes.find(n=>n.tagName==='html').childNodes.find(n=>n.tagName==='head');
  for(const node of head.childNodes){
    const attrs=Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
    assert.notEqual(attrs.name,'p:domain_verify','Remove the source site ownership claim');
    assert.notEqual(attrs['data-hid'],'pricing-billing-toggle','Remove the unused global pricing listener');
  }
  const layout=await read('public/_nuxt/default-kp.'+hash+'.js');
  assert(!/p:domain_verify|pricing-billing-toggle|__pricingBillingToggle/.test(layout),'Hydration must not restore obsolete head entries');
  assert(!html.includes('window.__pricingBillingToggle'));
});

test('head cleanup is scoped, byte-preserving and safe on repeat publishing',()=>{
  const fixture='<!doctype html><html><head><title>Duik</title><meta name="p:domain_verify" content="copied"><script data-hid="pricing-billing-toggle">obsolete()</script><meta name="description" content="p:domain_verify"><script id="__NUXT_DATA__" type="application/json">["pricing-billing-toggle"]</script><script>window.__NUXT__={config:{}}</script><link rel="modulepreload" href="/_nuxt/entry.js"></head><body><svg><title>Controller</title></svg><template><script data-hid="pricing-billing-toggle">notHead()</script></template></body></html>';
  const expected=fixture.replace('<meta name="p:domain_verify" content="copied">','').replace('<script data-hid="pricing-billing-toggle">obsolete()</script>','');
  assert.equal(cleanTemplateHead(fixture),expected);
  assert.equal(cleanTemplateHead(expected),expected);
  const cleaned=cleanTemplateHead(baselineHtml);
  assert.deepEqual(runtimeConfig(cleaned),runtimeConfig(baselineHtml));
  assert.equal(cleanTemplateHead(cleaned),cleaned);
  assert.throws(()=>cleanTemplateHead('unknown'),/explicit landing head/);
});

test('translated copy cannot rename runtime script or stylesheet assets',async()=>{
  const paths=[...new Set([...html.matchAll(/\b(?:src|href)=["'](\/_nuxt\/[^"']+)["']/g)].map(m=>m[1].split('?')[0]))];
  assert(paths.length>20,'Expected copied runtime asset references');
  const missing=[];
  for(const path of paths){try{await access(join(root,'public',decodeURIComponent(path)));}catch{missing.push(path);}}
  assert.deepEqual(missing,[],'Every runtime preload/module/style must exist locally');
});

test('Hero keeps its mount slot while the second prompt becomes the API workbench',()=>{
  const slots=[...html.matchAll(/<div\b[^>]*class="duik-input-slot(?:\s[^"]*)?"[^>]*><\/div>/g)];
  assert.equal(slots.length,1,'Only Hero should use the character mount slot');
  assert.match(html,/<section id="api"/);
  const textareas=[...html.matchAll(/<textarea\b[^>]*>/g)];
  assert.equal(textareas.length,1,'Only the real scripting demo may have a textarea');
  assert.match(textareas[0][0],/data-script-code/);
});

test('Hero static sentence words match its client component',async()=>{
  const component=await read('public/_nuxt/HeroOrgHeadline.'+hash+'.js');
  const client=[...component.matchAll(/class:"kp-org-headline__word"},"([^"]+)"/g)].map(m=>m[1]);
  const server=[...html.matchAll(/<span\b[^>]*class="kp-org-headline__word"[^>]*>([^<]+)<\/span>/g)].map(m=>m[1]);
  assert.equal(client.length,3,'Expected three static words in the rotating sentence');
  assert.deepEqual(server,client,'Hoisted static words do not repair themselves during hydration');
  assert.deepEqual(client,headlineWords);
  assert.match(html,new RegExp('<h1[^>]*aria-label="'+headlineSummary+'"'));
  assert(component.includes('()=>'+JSON.stringify(headlineSummary)),'the client must preserve the same accessible sentence');
  assert(!component.includes('让角色从骨骼开始'),'the former accessible claim must not survive hydration');
});

test('Hero initial pill labels match the shared content source',()=>{
  const expected={person:headlineActors[0].name,team:headlineTools[0].name,asset:headlineTools[0].assets[0].label};
  for(const [variant,label] of Object.entries(expected)){
    const pattern=new RegExp('<button[^>]*class="kp-pill--'+variant+'[^>]*>[\\s\\S]*?<span[^>]*class="kp-pill__label"[^>]*>([^<]*)<\\/span>');
    assert.equal(html.match(pattern)?.[1],label,'Initial '+variant+' pill must hydrate without repair');
  }
});

test('landing starts in Chinese with explicit light theme',()=>{
  const opening=html.match(/<html\b[^>]*>/)?.[0];
  assert(opening,'Missing html root');
  assert.match(opening,/\blang="zh-CN"/);
  assert.match(opening,/\bdata-duik-theme="light"/);
});

test('source adapters match the published browser assets byte for byte',async()=>{
  const pairs=[['hero-slot.mjs','_nuxt/HeroInputKP.vue_vue_type_script_setup_true_lang.'+hash+'.js'],['content.mjs','duik-landing-content.js'],['adapter.js','duik-landing.js'],['theme.css','duik-landing.css']];
  for(const [source,target] of pairs)assert.equal(await read('public/'+target),await read('components/home/landing/'+source),'Unpublished source '+source);
});

test('the nine adapted roots and retained orbit share SSR and client contracts',async()=>{
  for(const kind of ['workflow','faq','footer','tools','catalog','api','animation','automation','camera']){
    const rendered=renderExperience(kind);
    assert(html.includes(rendered),'Missing current shared markup: '+kind);
    assert.equal(html.split(rendered).length-1,1,'Duplicate section '+kind);
  }
  const {orbitDetailsMarkup}=await import('../components/home/landing/orbit.mjs');
  assert(html.includes(orbitDetailsMarkup),'Reuse workbench is secondary to the original orbit');
  assert(html.includes('id="reuse" class="duik-orbit-section w-screen flex-none"'));
  const files=['experience-layout.mjs','experience-vue.mjs','experience-mount.mjs','experience-shell.css','experience-catalog.mjs','experience-catalog.css','tool-catalog.mjs','tools-demo.mjs','tools-demo.css','tools-model.mjs','motion-demo.mjs','motion-demo.css','motion-model.mjs','content.mjs','orientation.mjs','orientation.css','guide-experience.mjs','guide-experience.css','reuse-demo.mjs','reuse-demo.css','orbit.mjs','orbit-vue.mjs','orbit.css','api-cinema.mjs','api-cinema.css'];
  for(const file of [...files,'tools-comparison-motion.mjs'])assert.equal(await read('components/home/landing/'+file),await read('public/duik-experience/'+file),'Unpublished experience '+file);
  const catalog=await read('public/_nuxt/HomeFaqKP.'+hash+'.js');
  assert.match(catalog,/makeExperience\("catalog"\)/);
  assert.match(catalog,/view as default/);
  const api=await read('public/_nuxt/HomePricingKP.'+hash+'.js');
  assert.match(api,/makeExperience\("api"\)/);assert.match(api,/view as default/);
  const faq=await read('public/_nuxt/HomeContactKP.vue_vue_type_script_setup_true_lang.'+hash+'.js');
  assert.match(faq,/makeExperience\("faq"\)/);assert.match(faq,/view as _/);
  assert(html.indexOf(renderExperience('api'))<html.indexOf(renderExperience('catalog')));
  assert(html.indexOf(renderExperience('catalog'))<html.indexOf(renderExperience('faq')));
});

test('orientation is a quiet bridge with the real workspace available on request',async()=>{
  const {orientationMarkup,workflowMarkup}=await import('../components/home/landing/orientation.mjs');
  const images=[],links=[],headings=[],details=[];
  function visit(n,reference=false){
    const attrs=Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));
    reference ||= n.tagName==='details';
    if(n.tagName==='details')details.push(attrs);
    if(n.tagName==='img')images.push({attrs,reference});
    if(n.tagName==='a')links.push(attrs.href);
    if(n.tagName==='h2')headings.push(n);
    for(const c of n.childNodes||[])visit(c,reference);
  }
  visit(parseFragment(orientationMarkup));
  assert.equal(headings.length,1);assert.equal(details.length,1);
  assert(!Object.hasOwn(details[0],'open'),'References do not occupy the first reading layer');
  assert.equal(images.length,1);assert(images.every(image=>image.reference));
  const image=images[0].attrs;
  const bytes=await readFile(join(root,'components/home/landing/official-media/duik/individual-panels.png'));
  assert.equal(Number(image.width),bytes.readUInt32BE(16));assert.equal(Number(image.height),bytes.readUInt32BE(20));
  assert.equal(image.loading,'lazy');
  assert(links.includes('/docs/getting-started/first-look'));
  assert(links.includes('/docs/misc/doc-license'));
  assert(orientationMarkup.includes('RxLaboratory'));
  assert(workflowMarkup.includes('从分层素材'));
  assert(!workflowMarkup.includes('从一张角色'));
});

test('binding panels reserve their real PNG dimensions before lazy loading',async()=>{
  for(const step of workflowSteps){
    const png=await readFile(join(root,'components/home/landing/official-media',step.image));
    assert.equal(step.width,png.readUInt32BE(16),step.id+' width');
    assert.equal(step.height,png.readUInt32BE(20),step.id+' height');
  }
  const first=workflowSteps[0];
  assert(renderExperience('workflow').includes('width="'+first.width+'" height="'+first.height+'"'),'Reserve image geometry before anchor positioning');
  const css=await read('components/home/landing/orientation.css');
  assert(css.includes('.duik-workflow-panel{min-height:475px;'),'Width/height attributes alone do not reserve space when the image CSS sets both to auto');
});

test('legacy preview assets retain six pinned official panels for compatibility',async()=>{
  assert.equal(heroPreviews.length,6);
  assert.equal(new Set(heroPreviews.map(x=>x.sourceFile)).size,6);
  for(const preview of heroPreviews){
    const origin=await readFile(join(root,'components/home/landing/official-media',preview.sourceFile));
    const published=await readFile(join(root,'public',preview.src));
    assert.deepEqual(published,origin);
    assert.equal(origin.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
    assert(preview.alt.includes('官方文档'));
  }
  const route=await read('app/.netlify/images/route.ts');
  assert(route.includes("'/duik-experience/previews/'"));
  assert(!html.includes('>让角色动起来。</span>'),'Do not leave the superseded SSR subtitle');
  assert(html.includes('>'+textSlots[37].split('\n')[0]+'</span>'));
  assert(html.includes('>'+textSlots[37].split('\n')[1]+'</span>'));
});

test('root-only navigation styles survive Vue reactive header class updates',async()=>{
  const css=await read('components/home/landing/theme.css');
  assert(css.includes('header[data-duik-ready=true]>:not(.duik-site-nav){display:none!important}'));
  assert(!css.includes('.duik-root-header>'),'Vue rewrites header class on scroll');
  assert(!css.includes('] header>:not'),'Do not hide semantic section headers');
});

test('SSR title and social titles share the full Duik product positioning',async()=>{
  const titles=[],svgTitles=[],social=[];
  const text=n=>n.value||(n.childNodes||[]).map(text).join('');
  function visit(n){
    const attrs=Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));
    if(n.tagName==='title')(n.namespaceURI==='http://www.w3.org/2000/svg'?svgTitles:titles).push(text(n));
    if(n.tagName==='meta'&&['title','og:title','twitter:title'].includes(attrs.name||attrs.property))social.push(attrs.content);
    for(const c of n.childNodes||[])visit(c);
  }
  visit(parseFragment(html));
  assert.deepEqual(titles,[textSlots[736]]);
  assert(svgTitles.every(title=>title!==textSlots[736]),'Document metadata must not overwrite accessible SVG titles');
  assert(social.length>=2);assert(social.every(title=>title===textSlots[736]));
  assert.equal(payload[736],textSlots[736]);
  const runtime=await read('public/_nuxt/default-kp.'+hash+'.js');
  assert(runtime.includes('u.blok?.content.meta_title'));
  assert(runtime.includes('lt=""'),'Do not append the template brand after hydration');
});

test('local identity and restored orbit retain the original progress consumer',async()=>{
  assert(html.includes('href="/duik-experience/icons/controller.svg"'));
  assert(!html.includes('href="/favicon-32x32.png'));
  const manifest=JSON.parse(await read('public/duik-experience/site.webmanifest'));
  assert(manifest.name.includes('非官方'));
  assert.equal(manifest.icons[0].src,'/duik-experience/icons/controller.svg');
  const parent=await read('public/_nuxt/HomeCapabilitiesKP.'+hash+'.js');
  assert(parent.includes('capabilities-master-trigger'),'Preserve the original horizontal driver');
  assert(parent.includes('se=Math.max(0,ye-ie+xe+K(420,"rem"))'));
  assert(parent.includes('f*1.6+w'));
  assert(parent.includes('D=1.8,W='),'Retain the orbit selection interval now its visual consumer is restored');
  const template=await read('public/_nuxt/duik-orbit-template.js');
  assert(template.includes('rotate(${l}deg) translate(43.125rem) rotate(${-l}deg) scale(${v})'));
  assert(template.includes('d.mergedProgress'));
  assert(!template.includes('F=Pe('),'No unattended repeating headline timer');
  assert(template.includes('"aria-pressed":b.value===i'));
  assert(template.includes('Ze.key==="Enter"||Ze.key===" "'),'Original selectors must remain keyboard operable');
  const wrapper=await read('public/duik-experience/orbit-vue.mjs');
  assert(wrapper.includes('mergedProgress:progress'));assert(wrapper.includes("this.$emit('go-to-step',step)"));
  const orbit=html.slice(html.indexOf('<section id="reuse"'),html.indexOf('<details class="duik-orbit-details"'));
  assert(!orbit.includes('assets.linearity.io'));assert(!orbit.includes('logo_testi'));
  assert.equal((orbit.match(/<img\b/g)||[]).length,14);
  assert.equal((orbit.match(/data-swiper-slide-index="\d"/g)||[]).length,5,'SSR preserves the original pre-mount mobile branch');
});

test('new navigation, learning cards, and footer resolve to real Nextra pages',async()=>{
  const content=await read('components/home/landing/content.mjs');
  const adapter=await read('components/home/landing/adapter.js');
  const routes=new Set([...content.concat(adapter).matchAll(/href=["'](\/docs[^"'?#]*)["']/g)].map(m=>m[1]));
  for(const route of ['/docs/guide/bones','/docs/guide/constraints','/docs/guide/animation'])routes.add(route);
  const missing=[];
  for(const route of routes){
    const path=route.replace(/^\/docs\/?/,'').replace(/\/$/,'');
    const choices=path?['content/docs/'+path+'.mdx','content/docs/'+path+'/index.mdx']:['content/docs/index.mdx'];
    let found=false;
    for(const candidate of choices){try{await access(join(root,candidate));found=true;break;}catch{}}
    if(!found)missing.push(route);
  }
  assert(routes.size>=9,'Expected the complete documentation route set');
  assert.deepEqual(missing,[],'Landing must not advertise missing documentation');
});

test('Hero embeds the approved real character with visible controls',async()=>{
  const adapter=await read('components/home/landing/adapter.js');
  assert.match(adapter,/<character-rig\b[^>]*id="duik-hero-character"[^>]*src="\/riglab-project\/rig.json"[^>]*controls="visible"/);
  const rig=JSON.parse(await read('public/riglab-project/rig.json'));
  const source=await readFile(join(root,'public/riglab-project',rig.source));
  assert.equal(createHash('sha256').update(source).digest('hex'),'fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a');
  assert.equal(rig.parts.length,26);
  assert.equal(rig.validation.restPixelExact,true);
});

test('binding narrative mounts the approved rig and keeps official instructions secondary',async()=>{
  const {workflowMarkup,workflowViews,workflowParts}=await import('../components/home/landing/orientation.mjs');
  assert.deepEqual(workflowViews.map(v=>v.mode),['assembled','assembled','assembled']);
  assert(workflowMarkup.includes('data-workflow-layer-stack'),'Transparent layers own the new exploded camera, not the old thumbnail grid');
  assert(workflowMarkup.includes('data-workflow-camera'));
  assert.equal(workflowParts.length,4);
  assert(workflowMarkup.includes('data-workflow-rig-host'));
  assert(workflowMarkup.includes('<details class="duik-workflow-reference">'));
  assert(!workflowMarkup.includes('<details open'));
  const source=await readFile(new URL('../components/home/landing/orientation.mjs',import.meta.url),'utf8');
  assert(source.includes("element.setAttribute('src','/riglab-project/rig.json')"));
  assert(source.includes('rig.getParts()'));
  assert(source.includes('rig.setMode(view.mode)'));
});
