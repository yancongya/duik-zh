import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {parse} from 'parse5';
import {patchCapabilityLinksRuntime,patchOrbitLinksRuntime,patchCapabilityLinksSSR} from './lib/landing-capability-links.mjs';
import {patchCapabilityLayoutSSR} from './lib/landing-capability-layout.mjs';
import {orbitDocumentation,orbitDocumentationFor,renderOrbitDocumentation} from '../components/home/landing/orbit.mjs';

const root=new URL('../',import.meta.url),hash='d2ea4a745e1ba64aecc76bbf680458929795d2d8';
const read=path=>readFile(new URL(path,root),'utf8');
const attrs=n=>Object.fromEntries((n.attrs||[]).map(a=>[a.name,a.value]));
const all=(node,predicate)=>[...(predicate(node)?[node]:[]),...(node.childNodes||[]).flatMap(child=>all(child,predicate))];
const text=node=>node.nodeName==='#text'?node.value:(node.childNodes||[]).map(text).join('');
const original=await read('components/home/landing/baseline/_nuxt/HomeCapabilitiesKP.'+hash+'.js');
const orbit=await read('components/home/landing/baseline/_nuxt/HomeCapabilitiesTestimonialKP.'+hash+'.js');

test('remove only capability CTA data, leaving original measurements and desktop/mobile render branches intact',()=>{
  const changed=patchCapabilityLinksRuntime(original);
  const before='ctaOutlineText:s.ctaOutlineText||"",ctaOutlineLink:s.ctaOutlineLink||null,ctaPrimaryText:s.ctaPrimaryText||"",ctaPrimaryLink:s.ctaPrimaryLink||null';
  assert.equal(changed,original.replace(before,'ctaOutlineText:"",ctaOutlineLink:null,ctaPrimaryText:"",ctaPrimaryLink:null'));
  assert.equal(patchCapabilityLinksRuntime(changed),changed);
  assert.throws(()=>patchCapabilityLinksRuntime('unknown template'),/Unknown capability CTA mapping/);
});

test('SSR replaces exactly four repeated CTA groups and is idempotent',async()=>{
  const html=patchCapabilityLayoutSSR(await read('components/home/landing/baseline/landing.html'));
  const changed=patchCapabilityLinksSSR(html);
  assert.equal(patchCapabilityLinksSSR(changed),changed);
  assert.equal(changed.split(renderOrbitDocumentation()).length-1,1);
  const dom=parse(changed);
  const sections=all(dom,node=>(attrs(node).class||'').split(/\s+/).some(c=>['duik-capability-card','home-testimonial-capabilities-kp'].includes(c)));
  assert.equal(sections.length,4);
  for(const section of sections)assert.equal(all(section,node=>node.tagName==='a'&&(attrs(node).class||'').split(/\s+/).includes('btn-group')).length,0);
  assert.equal(all(dom,node=>node.tagName==='a'&&(attrs(node).class||'').split(/\s+/).includes('btn-group')).length,all(parse(html),node=>node.tagName==='a'&&(attrs(node).class||'').split(/\s+/).includes('btn-group')).length-8,'Do not remove Hero or other global CTAs');
});

test('the actual orbit link render follows the original selected item and mobile swiper',()=>{
  const changed=patchOrbitLinksRuntime(orbit);
  assert.equal(patchOrbitLinksRuntime(changed),changed);
  assert(!changed.includes('o.blok?.testiCtaOutlineLink'));
  const render=changed.match(/s\("a",\{class:"duik-orbit-doc"[\s\S]+?\["href"\]\)/)?.[0];
  assert(render);
  for(const desktop of [true,false])for(let index=0;index<5;index++){
    const result=runInNewContext(render,{s:(tag,props,label)=>({tag,props,label}),S:{value:desktop},b:{value:desktop?index:0},A:{value:desktop?0:index},duikOrbitDocumentFor:orbitDocumentationFor});
    assert.equal(result.tag,'a');
    assert.equal(result.props.href,orbitDocumentation[index].href);
    assert.equal(result.label,orbitDocumentation[index].label);
    assert.equal(result.props['data-duik-orbit-doc'],'');
  }
});

test('unknown or partially adapted SSR CTA structure fails closed rather than introducing a hydration mismatch',async()=>{
  const html=patchCapabilityLayoutSSR(await read('components/home/landing/baseline/landing.html'));
  assert.throws(()=>patchCapabilityLinksSSR(html.replaceAll('gap-[.8rem]','gap-[0.8rem]')),/Missing adapted orbit documentation link/);
  const partial=html.replace('md:mt-[2rem] mt-[1.6rem] justify-center lg:justify-start','md:mt-[2rem] mt-[1.6rem] justify-center lg:justify-start unknown');
  assert.throws(()=>patchCapabilityLinksSSR(partial),/Partially adapted capability CTAs/);
  const changed=patchCapabilityLinksSSR(html);
  assert.throws(()=>patchCapabilityLinksSSR(changed.replace('data-duik-orbit-doc=""','')),/Missing adapted orbit documentation link/);
});

test('runtime idempotence rejects isolated markers or mixed old/new mappings',()=>{
  assert.throws(()=>patchOrbitLinksRuntime('// data-duik-orbit-doc\n'+orbit),/Incomplete orbit documentation render/);
  const changed=patchOrbitLinksRuntime(orbit);
  assert.throws(()=>patchOrbitLinksRuntime(changed.replace(/^import[^\n]+\n/,'')),/Missing or duplicated orbit documentation import/);
  assert.throws(()=>patchOrbitLinksRuntime(changed+'\n'+orbit),/Mixed orbit CTA mappings/);
  assert.throws(()=>patchCapabilityLinksRuntime(original+'\nctaOutlineText:"",ctaOutlineLink:null,ctaPrimaryText:"",ctaPrimaryLink:null'),/Mixed capability CTA mappings/);
});

test('every orbit context link has a local guide and SSR starts on the first selection',async()=>{
  assert.equal(orbitDocumentation.length,5);
  for(const doc of orbitDocumentation){
    await access(new URL('content'+doc.href+'.mdx',root)).catch(()=>access(new URL('content'+doc.href+'/index.mdx',root)));
  }
  assert.equal(renderOrbitDocumentation(),renderOrbitDocumentation(0));
  assert.equal(orbitDocumentationFor(-1),orbitDocumentation[0]);
});

test('published SSR retains motion guides and the initial Hero install link is correct before hydration',async()=>{
  const dom=parse(await read('public/landing.html'));
  const cards=all(dom,node=>(attrs(node).class||'').split(/\s+/).includes('duik-capability-card'));
  assert.equal(cards.length,3);
  for(const [i,card] of cards.entries()){
    const links=all(card,node=>node.tagName==='a');
    assert(!links.some(a=>['/docs','/docs/getting-started/install'].includes(attrs(a).href)));
    assert(links.some(a=>attrs(a).href===['/docs/guide/animation/interpolation','/docs/guide/automation/wiggle','/docs/guide/camera/camera-2d'][i]));
  }
  const hero=all(dom,node=>(attrs(node).class||'').split(/\s+/).includes('kp-home-hero-main'))[0];
  assert(hero);
  const install=all(hero,node=>node.tagName==='a'&&text(node).includes('查看安装方法'));
  assert.equal(install.length,1);
  assert.equal(attrs(install[0]).href,'/docs/getting-started/install');
  const anchor=all(dom,node=>Object.hasOwn(attrs(node),'data-duik-orbit-doc'));
  assert.equal(anchor.length,1);
  assert.equal(attrs(anchor[0]).href,orbitDocumentation[0].href);
});
