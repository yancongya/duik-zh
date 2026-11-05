// Source-only contracts. Optional isolated browser test: CATALOG_BROWSER_TEST=1 node --test scripts/test-duik-catalog.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir, mkdtemp } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { parseFragment } from 'parse5';
import { panels, tools, toolGroups, upstream, apiExamples, searchTools, normalizeQuery } from '../components/home/landing/tool-catalog.mjs';
import { catalogMarkup, apiMarkup, apiScenes, mountCatalog, mountApi } from '../components/home/landing/experience-catalog.mjs';
import {apiCinemaDuration} from '../components/home/landing/api-cinema.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourceRoot = join(root, 'components/home/landing');
const read = path => readFile(join(root, path), 'utf8');
function elements(markup) {
  const result = [];
  function visit(node) {
    if (node.tagName) result.push({ tag: node.tagName, attrs: Object.fromEntries(node.attrs.map(attribute => [attribute.name, attribute.value])) });
    node.childNodes?.forEach(visit);
  }
  visit(parseFragment(markup));
  return result;
}

test('SSR import exposes the four stable APIs without a browser global', () => {
  assert.equal(typeof document, 'undefined');
  assert.equal(typeof catalogMarkup, 'string');
  assert.equal(typeof apiMarkup, 'string');
  assert.equal(typeof mountCatalog(null), 'function');
  assert.equal(typeof mountApi(undefined), 'function');
  assert(!catalogMarkup.includes('<script'));
  assert(!apiMarkup.includes('<script'));
});

test('taxonomy follows the eight official main panels; API is not a ninth', () => {
  assert.equal(panels.length, 8);
  assert.deepEqual(panels.map(panel => panel.id), ['bones', 'constraints', 'controllers', 'automation', 'animation', 'camera', 'tools', 'command']);
  assert.equal(new Set(tools.map(tool => tool.id)).size, tools.length);
  assert(tools.every(tool => panels.some(panel => panel.id === tool.panel)));
  assert.equal(toolGroups.length, 4);
  assert.deepEqual([...new Set(tools.filter(tool => tool.panel === 'tools').map(tool => tool.group))], toolGroups.map(group => group.id));
  assert.equal(upstream.commit, '718e6e282d1ae91dc9678bb1a202ce08e862a28d');
  assert.match(catalogMarkup, /精选/);
  assert.equal(panels.find(panel => panel.id === 'automation').title, '自动化与表达式');
  assert.equal(panels.find(panel => panel.id === 'command').title, '命令行与功能库');
  assert.equal(tools.find(tool => tool.id === 'command-panel').title, '命令行面板');
});

test('directory replaces its official screenshot disclosure with one panoramic category drawing',async()=>{
  const nodes=elements(catalogMarkup);
  assert(!nodes.some(node=>Object.hasOwn(node.attrs,'data-catalog-reference')));
  assert(!nodes.some(node=>Object.hasOwn(node.attrs,'data-catalog-image')));
  assert(!catalogMarkup.includes('duik-catalog-sidebar'));assert(!catalogMarkup.includes('duik-catalog-kicker'));
  assert.equal(nodes.filter(node=>Object.hasOwn(node.attrs,'data-catalog-banner')).length,1);
  const svg=nodes.find(node=>Object.hasOwn(node.attrs,'data-catalog-banner-svg'));
  assert.equal(svg.attrs.viewBox,'0 0 1200 300');
  assert(catalogMarkup.indexOf('data-catalog-banner')<catalogMarkup.indexOf('class="duik-catalog-categories"'));
  const runtime=await read('components/home/landing/experience-catalog.mjs');
  assert(!/officialRoot|panelScreenshots|catalogPanelDimensions|data-catalog-image/.test(runtime));
});

test('search handles Chinese, English, whitespace, full-width input, groups, and misses', () => {
  assert.equal(normalizeQuery('  ＷＩＧＧＬＥ   '), 'wiggle');
  assert.deepEqual(searchTools('wiggle').map(tool => tool.id), ['wiggle']);
  assert.deepEqual(searchTools('裁剪').map(tool => tool.id), ['crop']);
  assert.deepEqual(searchTools('AUTO-RIG', 'bones').map(tool => tool.id), ['auto-rig']);
  assert(searchTools('脚本').every(tool => tool.panel === 'tools'));
  assert.equal(searchTools('qzz_unknown_xxx').length, 0);
  assert.equal(searchTools('wiggle', 'camera').length, 0);
  assert.equal(searchTools('').length, tools.length);
  assert.equal(searchTools('合成', 'tools').length, 2);
});

test('directory opens on search and four useful results beneath its purpose-built panoramic artwork', () => {
  const nodes=elements(catalogMarkup);
  const index=nodes.find(node=>Object.hasOwn(node.attrs,'data-catalog-index'));
  assert.equal(index.tag,'div');assert(!Object.hasOwn(index.attrs,'hidden'));
  const selectors=nodes.filter(node=>Object.hasOwn(node.attrs,'data-catalog-panel')&&node.attrs['data-catalog-panel']!=='all');
  assert.deepEqual(selectors.map(node=>node.attrs['data-catalog-panel']),panels.map(panel=>panel.id));
  assert.equal(tools.length,33);
  assert.equal(nodes.filter(node=>node.tag==='img'&&node.attrs.src.startsWith('/duik-experience/icons/')).length,8);
  assert.equal(nodes.filter(node=>Object.hasOwn(node.attrs,'data-catalog-result')).length,4);
  assert(!nodes.some(node=>Object.hasOwn(node.attrs,'data-catalog-art')));
  assert(!nodes.some(node=>node.tag==='img'&&node.attrs.src.includes('/wall/')));
  const tree=parseFragment(catalogMarkup);
  function checkVisibility(node,closed=false){
    const attrs=Object.fromEntries((node.attrs||[]).map(item=>[item.name,item.value]));
    const next=closed||Object.hasOwn(attrs,'hidden')||(node.tagName==='details'&&!Object.hasOwn(attrs,'open'));
    if(Object.hasOwn(attrs,'data-catalog-query')||Object.hasOwn(attrs,'data-catalog-results'))assert(!next,'Search and results must be available without opening a disclosure');
    node.childNodes?.forEach(child=>checkVisibility(child,next));
  }
  checkVisibility(tree);
});

function catalogFixture() {
  const navigations=[];
  const target = (attrs={}) => {
    const handlers=new Map();
    return {attrs,handlers,dataset:{},value:'',
      addEventListener(type,handler){if(!handlers.has(type))handlers.set(type,new Set());handlers.get(type).add(handler);},
      removeEventListener(type,handler){handlers.get(type)?.delete(handler);},
      emit(type,props={}){const event={target:this,detail:0,preventDefault(){this.defaultPrevented=true;},...props};for(const handler of handlers.get(type)||[])handler(event);return event;},
      getAttribute(name){return this.attrs[name];},setAttribute(name,value){this.attrs[name]=String(value);},hasAttribute(name){return Object.hasOwn(this.attrs,name);},
      matches(selector){if(selector.startsWith('.'))return (this.attrs.class||'').split(' ').includes(selector.slice(1));return selector==='button'?this.attrs.tag==='button':selector.startsWith('[')&&Object.hasOwn(this.attrs,selector.slice(1,-1));},
      closest(selector){return this.matches(selector)?this:null;},focus(){doc.activeElement=this;},querySelector(){return null;},
      click(){navigations.push(this.attrs.href);}
    };
  };
  const doc={...target(),hidden:false};
  const buttons=[...panels.map(panel=>panel.id),'all'].map(id=>{
    const button=target({tag:'button','data-catalog-panel':id,'aria-pressed':String(id==='bones')});button.dataset.catalogPanel=id;return button;
  });
  const map=new Map();
  for(const name of ['query','results','clear','index','title','summary','guide','count'])map.set('[data-catalog-'+name+']',target({['data-catalog-'+name]:''}));
  map.get('[data-catalog-clear]').attrs.tag='button';
  const results=map.get('[data-catalog-results]');
  let markup='',links=[],reset;
  Object.defineProperty(results,'innerHTML',{get:()=>markup,set(value){
    markup=value;
    links=elements(value).filter(node=>Object.hasOwn(node.attrs,'data-catalog-result')).map(node=>target(node.attrs));
    reset=elements(value).some(node=>Object.hasOwn(node.attrs,'data-catalog-reset'))?target({tag:'button','data-catalog-reset':''}):null;
  }});
  results.querySelector=()=>links[0]||null;
  results.querySelectorAll=()=>links;
  results.contains=node=>links.includes(node);
  const surface={...target({'data-duik-catalog':''}),ownerDocument:doc,contains:()=>true,
    querySelector(selector){return selector.includes('aria-pressed')?buttons.find(button=>button.attrs['aria-pressed']==='true'):map.get(selector)||null;},
    querySelectorAll(selector){return selector.startsWith('.duik-catalog-categories')?buttons.slice(0,8):buttons;}
  };
  doc.defaultView={matchMedia(){throw Error('Reading selections must not request a motion lifecycle');}};
  const host={querySelector:()=>surface};
  return {host,surface,doc,map,buttons,results,navigations,
    get links(){return links;},
    get reset(){return reset;},
    query(value){map.get('[data-catalog-query]').value=value;surface.emit('input',{target:map.get('[data-catalog-query]')});},
    choose(index,detail=1){surface.emit('click',{target:buttons[index],detail});},
    key(target,key,props={}){return surface.emit('keydown',{target,key,...props});},
    submit(){return surface.emit('submit',{target:target({class:'duik-catalog-search'})});}
  };
}

test('panel selection updates the visible context, results and all-tools state',()=>{
  const context=catalogFixture(),{surface,map}=context;
  const cleanup=mountCatalog(context.host);
  assert.equal(context.links.length,4);
  for(const [index,panel] of panels.entries()){
    context.choose(index);
    assert.equal(surface.dataset.catalogActive,panel.id);
    assert.equal(map.get('[data-catalog-title]').textContent,panel.title);
    assert.equal(map.get('[data-catalog-guide]').href,panel.href);
    assert.deepEqual(context.links.map(link=>link.attrs.href),tools.filter(tool=>tool.panel===panel.id).map(tool=>tool.href));
    if(panel.id==='tools')assert.equal(elements(context.results.innerHTML).filter(node=>node.attrs.class==='duik-catalog-group').length,4);
  }
  context.choose(8);
  assert.equal(surface.dataset.catalogActive,'all');
  assert.equal(map.get('[data-catalog-title]').textContent,'全部工具');
  assert.equal(map.get('[data-catalog-guide]').href,'/docs/getting-started/first-look');
  assert.equal(context.links.length,33);
  assert.equal(context.buttons.filter(button=>button.attrs['aria-pressed']==='true').length,1);
  cleanup();
});

test('search, filter, clear and empty recovery retain every tool without injecting user input',()=>{
  const context=catalogFixture(),{surface,map}=context;
  const cleanup=mountCatalog(context.host);
  context.query('  ＷＩＧＧＬＥ  ');
  assert.equal(surface.dataset.catalogActive,'all');
  assert.deepEqual(context.links.map(link=>link.attrs.href),['/docs/guide/automation/wiggle']);
  assert.equal(map.get('[data-catalog-clear]').disabled,false);
  context.choose(8);assert.equal(context.links.length,33);assert.equal(map.get('[data-catalog-query]').value,'');
  context.query('wiggle');
  context.choose(5);
  assert.equal(context.links.length,0);assert(context.reset);
  surface.emit('click',{target:context.reset});
  assert.equal(context.links.length,33);assert.equal(context.doc.activeElement,map.get('[data-catalog-query]'));
  context.query('<img src=x onerror=alert(1)>');
  assert.equal(context.links.length,0);assert(!context.results.innerHTML.includes('onerror'));
  assert.match(map.get('[data-catalog-count]').textContent,/onerror/);
  surface.emit('click',{target:map.get('[data-catalog-clear]')});
  assert.equal(map.get('[data-catalog-query]').value,'');assert.equal(context.links.length,33);
  assert.equal(map.get('[data-catalog-clear]').disabled,true);
  cleanup();
});

test('keyboard category navigation, search result focus and Enter use the existing document routes',()=>{
  const context=catalogFixture(),{buttons,map,doc,navigations}=context;
  const cleanup=mountCatalog(context.host);
  context.key(buttons[0],'ArrowLeft');assert.equal(doc.activeElement,buttons[7]);
  context.key(buttons[7],'Home');assert.equal(doc.activeElement,buttons[0]);
  context.key(buttons[0],'End');assert.equal(doc.activeElement,buttons[7]);
  context.key(buttons[7],'ArrowDown');assert.equal(doc.activeElement,buttons[0]);
  context.key(buttons[0],'ArrowRight',{isComposing:true});assert.equal(doc.activeElement,buttons[0]);
  context.key(buttons[0],'ArrowRight',{ctrlKey:true});assert.equal(doc.activeElement,buttons[0]);
  const input=map.get('[data-catalog-query]');context.query('动画');
  context.key(input,'ArrowUp');assert.equal(doc.activeElement,context.links.at(-1));
  context.key(doc.activeElement,'ArrowDown');assert.equal(doc.activeElement,context.links[0]);
  const escaped=context.key(doc.activeElement,'Escape');
  assert(escaped.defaultPrevented);assert.equal(doc.activeElement,input);assert.equal(input.value,'');
  assert(context.submit().defaultPrevented);assert.equal(navigations.length,0);
  context.query('crop');assert(context.submit().defaultPrevented);
  assert.deepEqual(navigations,['/docs/guide/tools/composition/crop']);
  cleanup();
});

test('catalog selection is immediate with idempotent mounting and complete event cleanup',async()=>{
  const context=catalogFixture(),{surface}=context;
  const cleanup=mountCatalog(context.host);assert.equal(mountCatalog(surface),cleanup);
  context.choose(2,0);assert.equal(surface.dataset.catalogActive,'controllers');
  assert.equal(surface.dataset.catalogInput,'keyboard');
  context.choose(4,1);assert.equal(surface.dataset.catalogActive,'animation');
  cleanup();cleanup();
  assert([...surface.handlers.values()].every(handlers=>handlers.size===0));
  context.choose(0);assert.equal(surface.dataset.catalogActive,'animation');
  const next=mountCatalog(context.host);assert.notEqual(next,cleanup);
  cleanup();assert.equal(mountCatalog(surface),next);
  context.choose(0);assert.equal(surface.dataset.catalogActive,'bones');next();
  const runtime=await read('components/home/landing/experience-catalog.mjs');
  assert(!/\.animate\(|setInterval\s*\(|setTimeout\s*\(|requestAnimationFrame|IntersectionObserver/.test(runtime));
});

test('every catalog and API link resolves to a real local MDX route', async () => {
  const routes = new Set([...panels, ...tools, ...apiExamples].map(item => item.href));
  for (const node of elements(catalogMarkup + apiMarkup)) if (node.tag === 'a' && node.attrs.href) routes.add(node.attrs.href);
  for (const route of routes) {
    assert(route.startsWith('/docs/'), 'Unexpected route: ' + route);
    const relative = route.replace(/^\/docs\//, '');
    const candidates = ['content/docs/' + relative + '.mdx', 'content/docs/' + relative + '/index.mdx'];
    const exists = await Promise.all(candidates.map(path => access(join(root, path)).then(() => true, () => false)));
    assert(exists.some(Boolean), 'Missing document: ' + route);
  }
});

test('static markup supplies keyboard labels, status feedback, and an AE boundary', () => {
  const nodes = elements(catalogMarkup);
  assert.equal(nodes.filter(node => Object.hasOwn(node.attrs, 'data-catalog-panel')).length, 9);
  assert.equal(nodes.filter(node => node.attrs['aria-pressed'] === 'true').length, 1);
  assert(nodes.some(node => node.attrs.role === 'search'));
  assert(nodes.some(node => node.tag === 'input' && node.attrs.type === 'search'));
  assert(nodes.some(node => node.attrs.role === 'status'));
  assert(nodes.filter(node => node.tag === 'img' && node.attrs.src.startsWith('/duik-experience/icons/')).every(node => node.attrs.alt === ''));
  assert(!nodes.some(node => node.tag === 'img' && node.attrs.src.startsWith('/duik-experience/official/')));
  assert(nodes.some(node => node.tag === 'svg' && Object.hasOwn(node.attrs,'data-catalog-banner-svg') && node.attrs['aria-label'].startsWith('骨骼')));
  assert(!nodes.some(node => node.tag === 'header'), 'Do not inherit global landing header replacement rules');
  assert(!catalogMarkup.includes('⌘'), 'Use the local official SVG, not a platform-dependent command glyph');
  assert(nodes.some(node => node.attrs.class === 'duik-catalog-all-icon' && node.attrs['aria-hidden'] === 'true'));
  assert.match(catalogMarkup, /只打开本地文档|这里打开本地文档/);
  assert.match(apiMarkup, /不会在浏览器中执行 AE 操作/);
});

test('API snippets are genuine source-backed calls with explicit prerequisites', async () => {
  assert.deepEqual(apiExamples.map(example => example.call), ['Duik.Rig.arm();', 'Duik.Automation.wiggle();', 'Duik.Constraint.autoParent();']);
  for (const example of apiExamples) {
    assert(example.prerequisite);
    const document = await read('content' + example.href + '.mdx');
    assert(document.includes(example.call), 'Call must exist in local source documentation: ' + example.call);
  }
  assert.match(apiMarkup, /DuAEF.init/);
  assert.match(apiMarkup, /DuAEF.enterRunTime/);
  assert.match(apiMarkup, /DuScriptUI.showUI/);
  assert.match(apiMarkup, /不是完整独立脚本/);
  const runtime = await read('components/home/landing/api-cinema.mjs');
  assert(!/eval\s*\(|new Function\s*\(/.test(runtime));
});

test('official SVG source bytes and provenance are pinned; no executable or remote drawing content', async () => {
  const provenance = JSON.parse(await read('components/home/landing/icons/sources.json'));
  assert.equal(provenance.commit, upstream.commit);
  assert.equal(provenance.documentLicense, 'GFDL-1.3');
  const panelFiles = ['bone.svg', 'constraints.svg', 'controller.svg', 'automation.svg', 'animation.svg', 'camera.svg', 'tools.svg', 'cmd.svg'];
  const additionalSources = {
    'oco.svg': 'src-docs/docs/img/duik/icons/oco.svg',
    'library.svg': 'src-docs/docs/img/duik/icons/library.svg',
    'file.svg': 'src-docs/docs/img/duik/icons/file.svg',
    'dusan-check.svg': 'src-docs/docs/img/dusan/check.svg',
  };
  assert.deepEqual(panels.map(panel => panel.icon + '.svg'), panelFiles, 'Task icons must not replace or expand the eight main-panel icons');
  const expectedFiles = [...panelFiles, ...Object.keys(additionalSources)].sort();
  assert.deepEqual(Object.keys(provenance.files).sort(), expectedFiles);
  assert.deepEqual(Object.keys(provenance.sourcePaths).sort(), expectedFiles);
  assert.deepEqual((await readdir(join(sourceRoot, 'icons'))).filter(filename => filename.endsWith('.svg')).sort(), expectedFiles, 'Every canonical SVG needs a pinned provenance record');
  for (const filename of expectedFiles) {
    assert.equal(provenance.sourcePaths[filename], additionalSources[filename] || 'src-docs/docs/img/duik/icons/' + filename, filename);
    const bytes = await readFile(join(sourceRoot, 'icons', filename));
    const svg = bytes.toString('utf8');
    assert.equal(createHash('sha256').update(bytes).digest('hex'), provenance.files[filename], filename);
    assert.match(svg, /viewBox="[^"]+"/);
    assert.match(svg, /xmlns="http:\/\/www.w3.org\/2000\/svg"/);
    assert(!/<(?:script|image|foreignObject|filter)\b/i.test(svg), filename);
    assert(!/\son[a-z]+\s*=/i.test(svg), filename);
    assert(!/(?:href|xlink:href)="(?:https?:|data:)/i.test(svg), filename);
  }
});

test('API uses one geometric stage with three truthful tasks and closed technical detail', () => {
  const nodes = elements(apiMarkup);
  assert.deepEqual(Object.keys(apiScenes), apiExamples.map(item => item.id));
  assert.equal(nodes.filter(node => Object.hasOwn(node.attrs, 'data-api-scene')).length, 3);
  assert.equal(nodes.filter(node => Object.hasOwn(node.attrs, 'data-api-example')).length, 3);
  assert.equal(nodes.filter(node => Object.hasOwn(node.attrs, 'data-api-phase')).length, 0);
  assert.equal(nodes.filter(node => Object.hasOwn(node.attrs, 'data-api-progress')).length, 0);
  assert(nodes.some(node => node.tag === 'details' && node.attrs.class === 'duik-api-reference' && !Object.hasOwn(node.attrs, 'open')));
  assert(nodes.some(node => node.tag === 'title' && Object.hasOwn(node.attrs, 'data-api-description')));
  assert(!apiMarkup.includes('duik-api-editor'));
  assert(!apiMarkup.includes('duik-api-filebar'));
  assert(apiMarkup.includes('功能关系示意，不执行 AE 操作。'));
  assert(nodes.filter(node => node.tag === 'img').every(node => node.attrs.width && node.attrs.height));
});

test('API explanatory timeline is finite, locally owned, and cancellable', async () => {
  const runtime = await read('components/home/landing/api-cinema.mjs');
  assert.equal(apiCinemaDuration,4200);
  assert(runtime.includes('view.IntersectionObserver'));
  assert(runtime.includes('document.hidden'));
  assert(runtime.includes("reduced?.addEventListener('change', onReduced)"));
  assert(runtime.includes("document.removeEventListener('visibilitychange', onVisibility)"));
  assert(runtime.includes('animation.cancel()'));
  assert(!runtime.includes('iterations: Infinity'));
  assert(!/setInterval\s*\(/.test(runtime));
});

test('CSS stays locally scoped and respects reduced motion', async () => {
  const css = await read('components/home/landing/experience-catalog.css');
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /var\(--duik-ink/);
  assert.match(css, /mask:url\('\/duik-experience\/icons\/cmd\.svg'\)/);
  assert.match(css, /\[data-catalog-active=all\] \.duik-catalog-group h4/);
  assert.match(css, /\[data-catalog-active=tools\] \.duik-catalog-group h4/);
  assert(!/(^|})\s*(?:html|body|header|footer|a|button)\s*[{,]/m.test(css));
});

test('isolated real browser: filtering, keyboard, idempotency, cleanup, copy success and refusal', { skip: process.env.CATALOG_BROWSER_TEST !== '1', timeout: 45000 }, async () => {
  const allowed = new Map([
    ['/duik-experience/experience-catalog.mjs', 'experience-catalog.mjs'],
    ['/duik-experience/catalog-banner.mjs', 'catalog-banner.mjs'],
    ['/duik-experience/api-cinema.mjs', 'api-cinema.mjs'],
    ['/duik-experience/api-cinema.css', 'api-cinema.css'],
    ['/duik-experience/orientation.mjs', 'orientation.mjs'],
    ['/duik-experience/tool-catalog.mjs', 'tool-catalog.mjs'],
    ['/duik-experience/experience-catalog.css', 'experience-catalog.css'],
    ...panels.map(panel => ['/duik-experience/icons/' + panel.icon + '.svg', 'icons/' + panel.icon + '.svg']),
    ['/duik-experience/official/duik/home.png','official-media/duik/home.png'],
    ['/duik-experience/official/duik/tools/script-editor.png','official-media/duik/tools/script-editor.png'],
  ]);
  const page = '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><link rel="stylesheet" href="/duik-experience/experience-catalog.css"><link rel="stylesheet" href="/duik-experience/api-cinema.css"></head><body><main id="catalog-host">' + catalogMarkup + '</main><aside id="api-host">' + apiMarkup + '</aside><script type="module">import {mountCatalog,mountApi} from "/duik-experience/experience-catalog.mjs"; window.mountCatalog=mountCatalog;window.mountApi=mountApi;window.catalogCleanup=mountCatalog(document.querySelector("#catalog-host"));window.apiCleanup=mountApi(document.querySelector("#api-host"));window.catalogReady=true;</script></body></html>';
  const server = createServer(async (request, response) => {
    const path = new URL(request.url, 'http://localhost').pathname;
    if (path === '/') { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end(page); return; }
    if (path.startsWith('/docs/')) { response.setHeader('Content-Type', 'text/html; charset=utf-8'); response.end('<h1>Document route reached</h1>'); return; }
    if (path === '/favicon.ico') { response.writeHead(204); response.end(); return; }
    const file = allowed.get(path);
    if (!file) { response.writeHead(404); response.end(); return; }
    try { response.setHeader('Content-Type', file.endsWith('.mjs') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : file.endsWith('.webp') ? 'image/webp' : file.endsWith('.png') ? 'image/png' : 'image/svg+xml'); response.end(await readFile(join(sourceRoot, file))); } catch { response.writeHead(404); response.end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const profile = await mkdtemp(join(tmpdir(), 'duik-catalog-browser-'));
  const chrome = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--remote-debugging-port=0', '--user-data-dir=' + profile, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
  let socket, session, sequence = 0;
  const pending = new Map(), errors = [];
  const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
  function send(method, params = {}, sessionId = session) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(Error('CDP timeout: ' + method)); }, 10000);
      pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject: error => { clearTimeout(timer); reject(error); } });
      socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }));
    });
  }
  async function evaluate(expression) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  try {
    const endpoint = await new Promise((resolve, reject) => {
      let log = '';
      const timer = setTimeout(() => reject(Error('Chrome startup timeout')), 12000);
      chrome.stderr.on('data', data => { log += data; const match = log.match(/DevTools listening on (ws:\/\/[^\s]+)/); if (match) { clearTimeout(timer); resolve(match[1]); } });
      chrome.once('error', error => { clearTimeout(timer); reject(error); });
      chrome.once('exit', code => { clearTimeout(timer); reject(Error('Chrome exited: ' + code)); });
    });
    socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
    socket.onmessage = event => {
      const message = JSON.parse(event.data);
      if (message.id) { const item = pending.get(message.id); if (item) { pending.delete(message.id); message.error ? item.reject(Error(message.error.message)) : item.resolve(message.result); } }
      else if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    };
    const target = await send('Target.createTarget', { url: 'about:blank' }, null);
    session = (await send('Target.attachToTarget', { targetId: target.targetId, flatten: true }, null)).sessionId;
    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.navigate', { url: origin });
    for (let count = 0; count < 60; count++) { if (await evaluate('window.catalogReady === true')) break; await delay(50); }
    assert.equal(await evaluate('window.catalogReady'), true);
    assert.match(await evaluate('getComputedStyle(document.querySelector(".duik-catalog-all-icon")).maskImage'), /\/duik-experience\/icons\/cmd\.svg/);
    assert.equal(await evaluate('document.querySelectorAll("[data-catalog-result]").length'), 4);
    await evaluate('window.catalogCleanup = mountCatalog(document.querySelector("#catalog-host")); window.apiCleanup = mountApi(document.querySelector("#api-host"));');
    assert.equal(await evaluate('document.querySelectorAll("[data-duik-catalog]").length'), 1);
    assert.equal(await evaluate('document.querySelectorAll("[data-duik-api]").length'), 1);
    await evaluate('document.querySelector(".duik-api-reference").open=true;');
    await evaluate('document.querySelector("[data-catalog-panel=tools]").click()');
    assert.equal(await evaluate('document.querySelectorAll(".duik-catalog-group").length'), 4);
    await evaluate('var input = document.querySelector("[data-catalog-query]"); input.value="wiggle";input.dispatchEvent(new Event("input",{bubbles:true}));input.focus();');
    assert.equal(await evaluate('document.querySelectorAll("[data-catalog-result]").length'), 1);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown' });
    assert.equal(await evaluate('document.activeElement.getAttribute("href")'), '/docs/guide/automation/wiggle');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape' });
    assert.equal(await evaluate('document.activeElement.matches("[data-catalog-query]") && document.activeElement.value === ""'), true);
    await evaluate('input.value="qzz_unknown_xxx";input.dispatchEvent(new Event("input",{bubbles:true}));');
    assert.equal(await evaluate('!!document.querySelector("[data-catalog-reset]")'), true);
    await evaluate('document.querySelector("[data-catalog-reset]").click()');
    assert.equal(await evaluate('document.querySelectorAll("[data-catalog-result]").length'), tools.length);
    await evaluate('input.value="<img src=x onerror=alert(1)>";input.dispatchEvent(new Event("input",{bubbles:true}));');
    assert.equal(await evaluate('document.querySelector("[data-catalog-count]").children.length'), 0);
    await evaluate('document.querySelector("[data-api-example=wiggle]").click();Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async value=>{window.copiedSnippet=value;}}});document.querySelector("[data-api-copy]").click();');
    await delay(20);
    assert.equal(await evaluate('window.copiedSnippet'), 'Duik.Automation.wiggle();');
    assert.match(await evaluate('document.querySelector("[data-api-feedback]").textContent'), /已复制/);
    await evaluate('navigator.clipboard.writeText=async()=>{throw Error("denied")};document.querySelector("[data-api-copy]").click();');
    await delay(20);
    assert.match(await evaluate('document.querySelector("[data-api-feedback]").textContent'), /复制失败/);
    assert.equal(await evaluate('document.querySelector("[data-api-copy]").disabled'), false);
    await evaluate('window.apiCleanup();document.querySelector("[data-api-example=arm]").click();');
    assert.equal(await evaluate('document.querySelector("[data-api-code]").textContent'), 'Duik.Automation.wiggle();');
    await evaluate('window.catalogCleanup();document.querySelector("[data-catalog-panel=bones]").click();');
    assert.equal(await evaluate('document.querySelector("[data-catalog-panel=all]").getAttribute("aria-pressed")'), 'true');
    await evaluate('Promise.all([...document.images].map(image=>{image.loading="eager";return image.decode();}))');
    assert.equal(await evaluate('[...document.images].every(image=>image.complete&&image.naturalWidth>0)'), true);
    await evaluate('mountCatalog(document.querySelector("#catalog-host"));input.value="crop";input.dispatchEvent(new Event("input",{bubbles:true}));input.focus();');
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'ArrowDown', code: 'ArrowDown' });
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    for (let count = 0; count < 30; count++) { if ((await evaluate('location.pathname')).startsWith('/docs/')) break; await delay(30); }
    assert.equal(await evaluate('location.pathname'), '/docs/guide/tools/composition/crop');
    assert.deepEqual(errors, []);
  } finally {
    try { if (socket?.readyState === WebSocket.OPEN) await send('Browser.close', {}, null); } catch {}
    socket?.close();
    chrome.kill('SIGTERM');
    for (const item of pending.values()) item.reject(Error('Browser test finished'));
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
});
