import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
import {brand,brandLinks,brandMetadata,renderLogo} from '../components/brand/logo.mjs';
const read=file=>readFile(new URL('../'+file,import.meta.url),'utf8');
const code=await read('components/brand/boot.js');

test('approved A geometry and all colors derive from one source',async()=>{
  for(const color of ['color','mono','reverse']){
    const suffix=color==='color'?'':`-${color}`;
    assert.equal(await read(`public/brand/v1/logo${suffix}.svg`),renderLogo({color}));
    for(const size of brand.sizes){
      const actual=await sharp(fileURLToPath(new URL(`../public/brand/v1/logo${suffix}-${size}.png`,import.meta.url))).raw().toBuffer();
      const expected=await sharp(Buffer.from(renderLogo({color}))).resize(size,size).raw().toBuffer();
      assert(actual.equals(expected),`${color} ${size}px`);
    }
  }
  const base=renderLogo();assert(base.includes('M58 137a70 70'));assert(!base.includes('<style>'));
  assert(renderLogo({motion:'intro'}).includes('.loop{animation:none}'));
  assert(renderLogo({motion:'loader'}).includes('animation-delay:1800ms'));
  assert(renderLogo({motion:'loop'}).includes('animation-delay:0ms'));
});

test('landing SSR and hydrated head and Nextra share the formal icon',async()=>{
  const html=await read('public/landing.html');
  const runtime=await read('public/_nuxt/default-kp.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js');
  for(const link of brandLinks){assert(html.includes(`href="${link.href}"`));assert(runtime.includes(link.href));}
  assert.equal(brandMetadata.icons.icon[0].url,'/brand/v1/logo.svg');
  assert.equal((html.match(/id="duik-boot"/g)||[]).length,1);
  assert(html.indexOf('id="duik-boot"')<html.indexOf('id="__nuxt"'));
  assert(html.includes('data-duik-boot-style'));assert(html.includes('data-duik-boot-script'));
  assert(!/<link\b[^>]*rel="icon"[^>]*href="\/duik-experience\/icons\/controller.svg"/.test(html));
});

function fixture({ready,hidden=false,reduced=false,hash=''}={}){
  let now=0,next=0,callback,disconnected=false,removed=0;
  const timers=new Map(),image={src:'/brand/v1/logo.svg'};
  const win=new EventTarget(),doc=new EventTarget(),media=new EventTarget();media.matches=reduced;
  const stage={dataset:{rigState:ready}};
  const root={dataset:{},querySelector:()=>image,setAttribute(k,v){this[k]=v;},removeAttribute(k){delete this[k];if(k==='data-active')delete this.dataset.active;},remove(){removed++;}};
  Object.assign(doc,{hidden,body:{},documentElement:{dataset:{}},getElementById:()=>root,querySelector:()=>stage});
  vm.runInNewContext(code,{window:win,document:doc,location:{hash},matchMedia:()=>media,Date:{now:()=>now},
    MutationObserver:class{constructor(fn){callback=fn;}observe(){}disconnect(){disconnected=true;}},
    setTimeout(fn,ms){timers.set(++next,{at:now+ms,fn});return next;},clearTimeout:id=>timers.delete(id)});
  const tick=ms=>{const end=now+ms;for(;;){const entry=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!entry||entry[1].at>end)break;const[id,t]=entry;now=t.at;timers.delete(id);t.fn();}now=end;};
  return{win,doc,root,image,media,tick,get removed(){return removed;},get disconnected(){return disconnected;},get pending(){return timers.size;},setState(state){stage.dataset.rigState=state;callback?.();},late(){callback?.();}};
}
test('warm-cache readiness still completes the approved entrance and a soft handoff',()=>{
  const f=fixture({ready:'ready'});assert.equal(f.root.dataset.active,'true');assert.equal(f.removed,0);
  assert.equal(f.doc.documentElement.dataset.duikEntry,'pending');
  f.tick(1799);assert.equal(f.root.dataset.state,'loading');f.tick(1);assert.equal(f.doc.documentElement.dataset.duikBoot,'ready');assert.equal(f.root.dataset.state,'exiting');assert.equal(f.removed,0);
  f.tick(139);assert.equal(f.doc.documentElement.dataset.duikEntry,'pending');f.tick(1);assert.equal(f.doc.documentElement.dataset.duikEntry,'revealing');
  f.tick(679);assert.equal(f.removed,0);f.tick(1);assert.equal(f.removed,1);
  f.tick(500);assert.equal(f.pending,0);assert.equal(f.doc.documentElement.dataset.duikEntry,undefined);f.tick(10000);assert.equal(f.removed,1);
});
test('pending shows intro/loop only until actual hero readiness',()=>{
  const f=fixture({ready:'loading'});assert.equal(f.root.dataset.active,'true');assert.equal(f.image.src,'/brand/v1/logo-loader.svg');f.tick(2600);assert.equal(f.root.dataset.active,'true');
  f.setState('ready');assert.equal(f.root.dataset.state,'exiting');assert.equal(f.image.src,'/brand/v1/logo-loader.svg','Do not snap to a static frame during fade');assert(f.disconnected);f.tick(820);assert.equal(f.removed,1);f.late();assert.equal(f.removed,1);
});
test('timeout, late success and failure never strand or restart loader',()=>{
  for(const reason of ['timeout','error']){const f=fixture({ready:'loading'});f.tick(200);if(reason==='timeout')f.tick(4800);else f.setState('error');assert.equal(f.doc.documentElement.dataset.duikBoot,reason);f.setState('ready');f.tick(10000);assert.equal(f.removed,1);assert.equal(f.pending,0);assert.equal(f.root.dataset.active,undefined);}
});
test('reduce, deep links and hidden initial tabs bypass the intro',()=>{
  for(const options of [{reduced:true},{hash:'#workflow'},{hidden:true}]){const f=fixture(options);assert.equal(f.removed,1);assert.equal(f.pending,0);}
});
test('real input, preference changes, background and pagehide release pending loader',()=>{
  for(const type of ['pointerdown','keydown','wheel','touchstart','pagehide','visibilitychange','change']){
    const f=fixture({ready:'loading'});f.tick(200);
    if(type==='visibilitychange'){f.doc.hidden=true;f.doc.dispatchEvent(new Event(type));}
    else if(type==='change'){f.media.matches=true;f.media.dispatchEvent(new Event(type));}
    else f.win.dispatchEvent(new Event(type));
    f.tick(420);assert.equal(f.removed,1);assert.equal(f.root.dataset.active,undefined);assert.equal(f.pending,0);
  }
});
test('BFCache events cannot replay an ended intro',()=>{
  const f=fixture({ready:'loading'});f.tick(200);f.win.dispatchEvent(new Event('pagehide'));f.tick(420);const e=new Event('pageshow');Object.defineProperty(e,'persisted',{value:true});f.win.dispatchEvent(e);f.setState('loading');f.tick(10000);assert.equal(f.removed,1);assert.equal(f.pending,0);
});
test('input/background/reduce can cancel every exit and stagger phase without hidden Hero residue',()=>{
  for(const elapsed of [1800,1940,2400,2650,3100]){
    for(const type of ['pointerdown','keydown','wheel','hashchange','pagehide','visibilitychange','change']){
      const f=fixture({ready:'ready'});f.tick(elapsed);
      if(type==='visibilitychange'){f.doc.hidden=true;f.doc.dispatchEvent(new Event(type));}
      else if(type==='change'){f.media.matches=true;f.media.dispatchEvent(new Event(type));}
      else f.win.dispatchEvent(new Event(type));
      assert.equal(f.removed,1,`${elapsed} ${type}`);assert.equal(f.pending,0);assert.equal(f.doc.documentElement.dataset.duikEntry,undefined);
      f.tick(10000);f.late();assert.equal(f.removed,1);assert.equal(f.doc.documentElement.dataset.duikEntry,undefined);
    }
  }
});
test('Hero choreography owns only child presentation, not the original scroll transforms',async()=>{
  const css=await read('components/brand/boot.css');
  assert(css.includes('duik-boot-lens 820ms'));
  assert(css.includes('duik-hero-focus 900ms'));
  for(const delay of [70,140,210,280])assert(css.includes(`--duik-entry-delay: ${delay}ms`));
  assert(css.includes('@media (prefers-reduced-motion: reduce)'));
  assert(!css.includes('backdrop-filter'));
  assert(!/\.kp-home-hero-main-input-wrap\s*\{/.test(css));
  assert(!/\.kp-home-hero-main\s*\{/.test(css));
  const html=await read('public/landing.html');assert(html.includes(css));assert(html.includes(code));
});
test('fallback poster has exact original RGBA and original hash stays intact',async()=>{
  const a=await sharp(fileURLToPath(new URL('../public/riglab-project/source.png',import.meta.url))).ensureAlpha().raw().toBuffer();
  const routes=JSON.parse(await read('components/brand/media-rewrites.json'));
  assert(!routes.some(x=>x.source==='/riglab-project/source.png'));
  const route=routes.find(x=>x.source==='/riglab-project/source-optimized-v1.png');
  const b=await sharp(fileURLToPath(new URL('../public'+route.destination,import.meta.url))).ensureAlpha().raw().toBuffer();assert(a.equals(b));
});
