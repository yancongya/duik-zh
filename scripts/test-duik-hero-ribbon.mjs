import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {parse} from 'parse5';
import {patchHeroRibbonSSR,patchHeroRibbonRuntime} from './lib/landing-hero-ribbon.mjs';
const baseline=new URL('../components/home/landing/baseline/',import.meta.url);
test('Hero balances vertical free space and gives the marquee all width between its links',async()=>{
  const css=await readFile(new URL('../components/home/landing/theme.css',import.meta.url),'utf8');
  assert.match(css,/\.kp-home-hero-main>div:first-child\{[^}]*flex:1(?:;|\})/);
  assert.match(css,/\.duik-hero-ribbon\{[^}]*grid-template-columns:auto minmax\(0,1fr\) auto;/);
  assert.match(css,/\.duik-hero-ribbon-window\{[^}]*max-width:none!important;/);
});
test('ribbon stays inside the original Hero exit track and replaces borrowed credibility',async()=>{
  const html=patchHeroRibbonSSR(await readFile(new URL('landing.html',baseline),'utf8'),'<div data-test-marquee></div>');
  let ribbon;
  const hasClass=(n,c)=>n.attrs?.some(a=>a.name==='class'&&a.value.split(/\s+/).includes(c));
  const walk=n=>{if(hasClass(n,'duik-hero-ribbon'))ribbon=n;for(const child of n.childNodes||[])walk(child)};walk(parse(html,{sourceCodeLocationInfo:true}));
  assert(ribbon);assert(hasClass(ribbon.parentNode.parentNode,'kp-home-hero-main'));
  const loc=ribbon.sourceCodeLocation,markup=html.slice(loc.startOffset,loc.endOffset);
  assert(markup.includes('认识八个主面板'));assert(markup.includes('href="#toolkit">查找工具</a>'));assert(!markup.includes('data-hero-marquee-toggle'));
  assert(!/Play video|kp-badge-swiper|images\/logos/.test(markup));
  assert.equal(patchHeroRibbonSSR(html,'<div data-test-marquee></div>'),html);
});
test('original Hero scroll fade and measured marquee are retained by the runtime patch',async()=>{
  const source=await readFile(new URL('_nuxt/HomeHeroKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js',baseline),'utf8');
  const code=patchHeroRibbonRuntime(source);
  for(const anchor of ['e.to(".kp-home-hero-main",{opacity:0,duration:25','e.set(".kp-home-hero-main",{pointerEvents:"none"},10)','s("div",Bt,[k(X(u),','href:"#toolkit"'])assert(code.includes(anchor),anchor);
  assert(!code.includes('data-hero-marquee-toggle'));
  assert.equal(patchHeroRibbonRuntime(code),code);
});
