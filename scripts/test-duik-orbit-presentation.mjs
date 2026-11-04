import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {parse} from 'parse5';
import {orbitIconProps,renderOrbitIcon} from '../components/home/landing/orbit.mjs';
import {patchOrbitIconsRuntime,patchOrbitIconsSSR,patchOrbitImageAltsRuntime} from './lib/landing-orbit-presentation.mjs';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const original=await read('components/home/landing/baseline/_nuxt/HomeCapabilitiesTestimonialKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js');
const html=await read('components/home/landing/baseline/landing.html');
const attrs=node=>Object.fromEntries((node.attrs||[]).map(a=>[a.name,a.value]));
function collect(node,predicate){return [...(predicate(node)?[node]:[]),...(node.childNodes||[]).flatMap(child=>collect(child,predicate))];}

test('only desktop/mobile icon expressions change; original orbit and progress border remain intact',()=>{
  const changed=patchOrbitIconsRuntime(original);
  assert.equal(patchOrbitIconsRuntime(changed),changed);
  assert(!changed.includes('ic-kp-testi'));
  assert(changed.includes('"stroke-dashoffset":le*(1-fe(i))'));
  assert(changed.includes('rotate(${l}deg) translate(43.125rem) rotate(${-l}deg) scale(${v})'));
  const render='s("span",duikOrbitIconProps(i),null,16)';
  assert.equal(changed.split(render).length-1,2);
  for(let i=0;i<5;i++){
    const result=runInNewContext(render,{i,duikOrbitIconProps:orbitIconProps,s:(tag,props)=>({tag,props})});
    assert.equal(result.tag,'span');
    assert.deepEqual(result.props,orbitIconProps(i));
  }
});

test('SSR five icons use the same contract without consuming the fourteen original images',()=>{
  const changed=patchOrbitIconsSSR(html);
  assert.equal(patchOrbitIconsSSR(changed),changed);
  const nodes=collect(parse(changed),node=>Object.hasOwn(attrs(node),'data-duik-orbit-icon'));
  assert.equal(nodes.length,5);
  for(const [i,node] of nodes.entries()){
    const actual=attrs(node);delete actual['data-v-775aae4b'];
    assert.deepEqual(actual,orbitIconProps(i));
    assert(changed.includes(renderOrbitIcon(i)));
  }
  const orbit=collect(parse(changed),node=>(attrs(node).class||'').split(/\s+/).includes('home-testimonial-capabilities-kp'))[0];
  assert.equal(collect(orbit,node=>node.tagName==='img').length,14);
  assert.equal((html.match(/<img\b/g)||[]).length,(changed.match(/<img\b/g)||[]).length);
});

test('partial runtime or SSR presentation mappings fail closed',()=>{
  assert.throws(()=>patchOrbitIconsRuntime('// duikOrbitIconProps\n'+original),/Missing orbit icon import/);
  const changed=patchOrbitIconsRuntime(original);
  assert.throws(()=>patchOrbitIconsRuntime(changed+original),/Mixed orbit icon mappings/);
  assert.throws(()=>patchOrbitIconsRuntime('unknown'),/Unknown original orbit icon render/);
  assert.throws(()=>patchOrbitIconsSSR(patchOrbitIconsSSR(html).replace('data-duik-orbit-icon','data-unknown-icon')),/Partially adapted orbit icons/);
});

test('already published SSR rejects drift in the shared icon mapping',()=>{
  const changed=patchOrbitIconsSSR(html);
  for(const [before,after] of [
    ['data-duik-orbit-icon="oco"','data-duik-orbit-icon="wrong-icon"'],
    ['--duik-orbit-icon:url(/duik-experience/icons/oco.svg);','--duik-orbit-icon:url(/duik-experience/icons/file.svg);'],
    [' style="--duik-orbit-icon:url(/duik-experience/icons/oco.svg);"',''],
    ['class="duik-orbit-icon"','class="unrelated-icon"'],
  ]){
    assert.throws(()=>patchOrbitIconsSSR(changed.replace(before,after)),/Invalid existing orbit icon mapping/);
  }
});

test('Chinese word boxes eliminate the margin outside yPercent without changing title motion',async()=>{
  const css=await read('components/home/landing/orbit.css');
  assert.match(css,/\.duik-orbit-section \.home-testimonial-capabilities-kp \.word-el-3d\{line-height:1\.2!important;margin-bottom:0\}/);
  assert(!/\.word-el-3d\{[^}]*transform/.test(css));
  assert.match(css,/mask-mode:alpha/);
  assert.match(css,/\[data-duik-orbit-step\] svg rect\{stroke:var\(--duik-accent\)\}/);
  assert.match(css,/\.swiper-slide \.duik-orbit-icon\{opacity:\.5\}/);
  assert.match(css,/\.swiper-slide-active \.duik-orbit-icon\{opacity:1;background:var\(--duik-accent\)\}/);
});

test('published initial icons and runtime use the shared local presentation',async()=>{
  const published=await read('public/landing.html');
  assert(patchOrbitIconsSSR(published)===published,'Publish the shared SSR icon mapping before testing the public output');
  assert.equal(patchOrbitIconsRuntime(await read('public/_nuxt/duik-orbit-template.js')),await read('public/_nuxt/duik-orbit-template.js'));
  assert.equal(await read('public/duik-experience/orbit.css'),await read('components/home/landing/orbit.css'));
});

test('orbit decorative images do not announce the former testimonial business',async()=>{
  const published=await read('public/landing.html');
  const orbit=collect(parse(published),node=>(attrs(node).class||'').split(/\s+/).includes('home-testimonial-capabilities-kp'))[0];
  const images=collect(orbit,node=>node.tagName==='img').map(attrs);
  assert.equal(images.length,14,'Keep logo, eight orbit images and five selector thumbnails');
  assert(images.every(image=>image.alt!=='testimonial'));
  assert.deepEqual(images.slice(6,9).map(image=>image.alt),['','',''],'The final three orbit fillers are decorative');
  assert(images.slice(1,6).every(image=>image.alt.length>0),'Keep the five functional image labels');
  const runtime=await read('public/_nuxt/duik-orbit-template.js');
  assert(!runtime.includes('alt:r.title||"testimonial"'));
  assert(runtime.includes('alt:r.title||""'));
  assert.equal(patchOrbitImageAltsRuntime(runtime),runtime,'Published mapping is complete');
});

test('decorative alt patch only changes the original fallback and rejects drift',()=>{
  const changed=patchOrbitImageAltsRuntime(original);
  assert.equal(changed.replace('alt:r.title||""','alt:r.title||"testimonial"'),original);
  assert.equal(patchOrbitImageAltsRuntime(changed),changed);
  assert.throws(()=>patchOrbitImageAltsRuntime('unknown'),/Unknown original orbit image alt/);
  assert.throws(()=>patchOrbitImageAltsRuntime(changed+original),/Mixed orbit image alt mappings/);
  assert.throws(()=>patchOrbitImageAltsRuntime(changed+changed),/Incomplete orbit image alt mapping/);
});
