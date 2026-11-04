import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse} from 'parse5';
import {patchNavigationSSR,patchNavigationRuntime} from './lib/landing-navigation.mjs';
import {patchCapabilityLayoutSSR} from './lib/landing-capability-layout.mjs';
import {navMarkup,textSlots} from '../components/home/landing/content.mjs';
const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const baseline=await read('components/home/landing/baseline/landing.html');
test('first-paint navigation is the same light markup consumed by Vue',()=>{
  const patched=patchNavigationSSR(baseline);let header;
  function visit(n){if(n.tagName==='header'&&n.attrs?.some(a=>a.name==='data-duik-ready'))header=n;for(const c of n.childNodes||[])visit(c);}
  visit(parse(patched,{sourceCodeLocationInfo:true}));
  const loc=header.sourceCodeLocation;
  assert.equal(patched.slice(loc.startTag.endOffset,loc.endTag.startOffset),navMarkup);
  assert(!patched.slice(loc.startOffset,loc.endOffset).includes('blur-overlay'));
  assert.equal(patchNavigationSSR(patched),patched);
});
test('navigation retains original scroll hide and unmount while owning first render',async()=>{
  const original=await read('components/home/landing/baseline/_nuxt/HeaderKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js');
  const code=patchNavigationRuntime(original);
  assert(code.includes('innerHTML:duikNavMarkup'));
  assert(code.includes('module.mountNavigation(L.value)'));
  assert(code.includes('duikDisposeNavigation?.()'));
  assert(code.includes('e<n&&(f.value=!1)'));
  assert.equal(patchNavigationRuntime(code),code);
});
test('all capability title lines come from their payload slots, never old business copy',()=>{
  const titles=[344,352,359].map(i=>textSlots[i]);
  const html=patchCapabilityLayoutSSR(baseline,titles);
  const headings=[];
  const hasClass=(n,c)=>n.attrs?.some(a=>a.name==='class'&&a.value.split(/\s+/).includes(c));
  function visit(n,insideCard=false){
    insideCard ||= hasClass(n,'duik-capability-card');
    if(insideCard&&hasClass(n,'h2')){
      const span=n.childNodes.find(child=>child.tagName==='span'),loc=span.sourceCodeLocation;
      headings.push(html.slice(loc.startTag.endOffset,loc.endTag.startOffset));
    }
    for(const child of n.childNodes||[])visit(child,insideCard);
  }
  visit(parse(html,{sourceCodeLocationInfo:true}));
  assert.deepEqual(headings,titles.map(title=>title.replaceAll('\n','<br>')));
  assert.equal(patchCapabilityLayoutSSR(html,titles),html);
});
