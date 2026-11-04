import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import ts from 'typescript';
import { runInNewContext } from 'node:vm';
import { parse } from 'parse5';
import { heroWallScenes } from '../components/home/landing/hero-wall-scenes.mjs';
import { patchHeroWallSSR, patchHeroWallRuntime, patchHeroWallIntroSSR } from './lib/landing-hero-wall.mjs';
import { heroWallIntro, textSlots } from '../components/home/landing/content.mjs';

const read = name => readFile(new URL('../' + name, import.meta.url), 'utf8');
const baseline = await read('components/home/landing/baseline/landing.html');
const published = await read('public/landing.html');
const payload = JSON.parse(await read('public/_payload.json'));
const adapter = await read('components/home/landing/adapter.js');
const adapterTree = ts.createSourceFile('adapter.js', adapter, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const wallMount = adapterTree.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'mountWallMotion');
assert(wallMount, 'The real wall lifecycle entry point must exist');

// Execute the production function with controlled observer deliveries. These
// tests prove lifecycle decisions, not browser visibility or image decoding.
function wallHarness({ reduced = false, hidden = false } = {}) {
  class Events {
    listeners = new Map();
    addEventListener(type, listener, { signal } = {}) {
      if (signal?.aborted) return;
      const listeners = this.listeners.get(type) || new Set();
      listeners.add(listener); this.listeners.set(type, listeners);
      signal?.addEventListener('abort', () => listeners.delete(listener), { once: true });
    }
    emit(type, fields = {}) {
      const event = { type, target: this, ...fields };
      for (const listener of [...(this.listeners.get(type) || [])]) listener(event);
    }
    listenerCount(type) { return this.listeners.get(type)?.size || 0; }
  }
  function image(id, parentElement) {
    return {
      id, parentElement,
      get isConnected() { return this.parentElement?.isConnected || false; },
      closest(selector) { assert.equal(selector, 'picture'); return this.parentElement; },
    };
  }
  function picture(id) {
    const element = { id, dataset: {}, isConnected: true };
    const writes = [];
    let media = 'all';
    const source = {
      parentElement: element,
      get media() { return media; },
      set media(value) { media = value; writes.push(value); },
    };
    const item = { element, img: image(id + '-image', element), source, writes };
    element.querySelector = selector => selector === 'img' ? item.img : selector === '[data-duik-wall-playback]' ? source : null;
    return item;
  }
  const pictures = [picture('first'), picture('second')];
  const wall = {
    dataset: {},
    querySelectorAll(selector) {
      assert.equal(selector, '[data-duik-wall-playback]');
      return pictures.map(item => item.source);
    },
    contains(node) { return pictures.some(item => item.element === node || item.img === node || item.source === node); },
  };
  const body = { children: [], append(element) { this.children.push(element); element.parentElement = this; } };
  const document = Object.assign(new Events(), {
    hidden, body,
    querySelector(selector) { assert.equal(selector, '.kp-home-hero-thumbnails-list'); return wall; },
    createElement(tag) {
      assert.equal(tag, 'button');
      return Object.assign(new Events(), {
        dataset: {}, attributes: new Map(), removed: false,
        setAttribute(name, value) { this.attributes.set(name, value); },
        getAttribute(name) { return this.attributes.get(name) ?? null; },
        remove() { this.removed = true; body.children = body.children.filter(element => element !== this); },
      });
    },
  });
  const preference = Object.assign(new Events(), { matches: reduced });
  const window = new Events(), intersections = [], mutations = [];
  class IntersectionObserver {
    observed = new Set(); observations = []; unobserved = []; disconnects = 0;
    constructor(callback) { this.callback = callback; intersections.push(this); }
    observe(target) { this.observed.add(target); this.observations.push(target); }
    unobserve(target) { this.observed.delete(target); this.unobserved.push(target); }
    disconnect() { this.disconnects++; this.observed.clear(); }
    deliver(...entries) { this.callback(entries); }
    queue(...entries) { return () => this.callback(entries); }
  }
  class MutationObserver {
    disconnects = 0;
    constructor(callback) { this.callback = callback; mutations.push(this); }
    observe(target) { assert.equal(target, wall); this.target = target; }
    disconnect() { this.disconnects++; this.target = null; }
    deliver() { this.callback([{ type: 'childList', target: wall }]); }
    queue() { return () => this.deliver(); }
  }
  const mount = runInNewContext('(' + wallMount.getText(adapterTree) + ')', {
    document, AbortController, IntersectionObserver, MutationObserver,
    matchMedia(query) { assert.equal(query, '(prefers-reduced-motion: reduce)'); return preference; },
    addEventListener: window.addEventListener.bind(window),
  });
  mount();
  const button = body.children[0], boxes = intersections[0], observer = mutations[0];
  return {
    mount, wall, pictures, body, button, document, preference, window, boxes, observer, intersections, mutations,
    entry(item, isIntersecting) { return { target: item.img, isIntersecting }; },
    intersect(item, isIntersecting) { boxes.deliver(this.entry(item, isIntersecting)); },
    setHidden(value) { document.hidden = value; document.emit('visibilitychange'); },
    setReduced(value) { preference.matches = value; preference.emit('change'); },
    replace(index, { notify = true } = {}) {
      const previous = pictures[index]; previous.element.isConnected = false;
      pictures[index] = picture(previous.element.id + '-hydrated');
      if (notify) observer.deliver();
      return { previous, replacement: pictures[index] };
    },
    replaceImage(index) {
      const item = pictures[index], previous = item.img;
      previous.parentElement = null;
      item.img = image(previous.id + '-hydrated', item.element);
      observer.deliver();
      return { previous, replacement: item.img };
    },
    pagehide(persisted) { window.emit('pagehide', { persisted }); },
  };
}

function assertPlayback(item, running) {
  assert.equal(item.source.media, running ? 'not all' : 'all');
  assert.equal(item.element.dataset.wallMotion, running ? 'playing' : 'poster');
}

function wallImages(html) {
  const result = [];
  function visit(node, inside = false) {
    const attrs = Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));
    inside ||= (attrs.class || '').split(' ').includes('kp-home-hero-thumbnails-list');
    if (inside && node.tagName === 'img' && (attrs.class || '').includes('will-change-transform')) result.push(attrs);
    for (const child of node.childNodes || []) visit(child, inside);
  }
  visit(parse(html));
  return result;
}
test('wall intro forms one sentence and matches the captured Vue title conditional',()=>{
  const phases=payload[payload[7].introTitleList].map(index=>payload[payload[index].title]);
  const descriptions=payload[payload[7].introDescriptionList].map(index=>payload[payload[index].title]);
  assert.deepEqual(phases,heroWallIntro.phases.map(phase=>phase.title));
  assert.deepEqual(descriptions,heroWallIntro.phases.map(phase=>phase.description));
  assert.equal(payload[37],textSlots[37]);
  assert.equal(payload[37].split('\n')[0].replace(phases.at(-1),''),'');
  const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');
  let heading;const introWords=[],introDescriptions=[],labels=[];
  function visit(n,inside=false){
    const classes=(n.attrs?.find(a=>a.name==='class')?.value||'').split(' ');
    inside ||= classes.includes('kp-home-hero-intro');
    if(inside){
      if(n.tagName==='h2')heading=n;
      if(classes.includes('hero-word-el'))introWords.push(text(n));
      if(classes.includes('kp-hero-desc-text'))introDescriptions.push(text(n));
      if(classes.includes('kp-hero-label-text'))labels.push(text(n));
    }
    for(const c of n.childNodes||[])visit(c,inside);
  }
  visit(parse(published));
  assert.deepEqual(introWords,phases);assert.deepEqual(introDescriptions,descriptions);
  assert.deepEqual(labels,['','','']);
  const rows=heading.childNodes.filter(n=>n.tagName==='div');
  assert.equal(rows.length,2,'Only the rotating phrase and the common suffix remain');
  assert.equal(text(rows[1]),heroWallIntro.suffix);
  assert(!/拆分图层|从角色绑定/.test(text(heading)));
});
test('intro SSR patch handles both Vue prefix branches and refuses an unknown structure',()=>{
  const empty=patchHeroWallIntroSSR(baseline,'日常创作\n都能更顺手。','日常创作');
  assert(empty.includes('<!---->'));
  const prefix=patchHeroWallIntroSSR(baseline,'A & B 日常创作\n都能更顺手。','日常创作');
  assert(prefix.includes('A &amp; B'));
  assert.throws(()=>patchHeroWallIntroSSR('<h2>unrecognized</h2>','日常创作','日常创作'),/Missing hero intro prefix/);
});
test('wall SSR and hydrated payload point at the same 22 local scenes', () => {
  const images = wallImages(published);
  assert.equal(images.length, 22);
  assert.equal(heroWallScenes.length, 22);
  assert.equal(new Set(heroWallScenes.map(scene => scene.src)).size, 22);
  for (const [index, image] of images.entries()) {
    const scene = heroWallScenes[index];
    assert.equal(new URL(image.src, 'http://localhost').searchParams.get('url'), scene.src);
    assert.equal(image.alt, scene.alt);
    assert.equal(payload[payload[payload[40][index]].filename], scene.src);
    const lightbox = payload[payload[129][index]];
    assert.equal(payload[payload[lightbox.image].filename], scene.src);
    assert.equal(payload[lightbox.title], scene.title);
    assert.equal(payload[lightbox.promtText], scene.description);
    assert(!image.srcset.includes('linearity'));
  }
});
test('wall patch preserves the original geometry and animation hooks', () => {
  const old = wallImages(baseline), patched = wallImages(patchHeroWallSSR(baseline, heroWallScenes));
  assert.equal(old.length, patched.length);
  for (const [index, image] of old.entries()) {
    for (const [key, value] of Object.entries(image)) {
      if (['src', 'srcset', 'alt'].includes(key)) continue;
      assert.equal(patched[index][key], value, key + ' must not change');
    }
  }
  assert.throws(() => patchHeroWallSSR(baseline, heroWallScenes.slice(1)), /gallery|Gallery/);
});
test('wall SVGs are local, self-contained, and reduced-motion aware', async () => {
  assert.equal(heroWallScenes.filter(scene=>scene.src.endsWith('.svg')).length,22);
  for (const scene of heroWallScenes) {
    assert(scene.src.startsWith('/duik-experience/wall/'));
    if (scene.src.endsWith('.webp')) {
      const bytes = await readFile(new URL('../public' + scene.src, import.meta.url));
      assert.equal(bytes.toString('ascii', 0, 4), 'RIFF');
      assert.equal(bytes.toString('ascii', 8, 12), 'WEBP');
      continue;
    }
    const svg = await read('public' + scene.src);
    assert(svg.includes('<svg'));
    assert(!/<(?:script|foreignObject|iframe)/i.test(svg));
    assert(!/<image\b/i.test(svg),'Dynamic covers must not embed screenshots or raster pictures');
    assert(svg.includes('@keyframes'),'Every feature cover has purposeful motion');
    assert(!/(?:href|src)=["']https?:/i.test(svg));
    assert(!/linearity|energy drink|stock photo/i.test(svg));
    if (svg.includes('@keyframes')) assert(svg.includes('prefers-reduced-motion'));
    assert(scene.reducedMotionSrc?.endsWith('.webp'));
    await access(new URL('../public' + scene.reducedMotionSrc, import.meta.url));
  }
});
test('every SSR cover starts with a static playback source',()=>{
  const tree=parse(published);let posters=0;
  function visit(node){if(node.tagName==='source'&&node.attrs.some(a=>a.name==='data-duik-wall-playback')){posters++;assert.equal(node.attrs.find(a=>a.name==='media')?.value,'all');}for(const c of node.childNodes||[])visit(c);}
  visit(tree);assert.equal(posters,22);
});
test('wall lifecycle loops each visible image with no playback UI', () => {
  const h = wallHarness(), [first, second] = h.pictures;
  assert.deepEqual([...h.boxes.observed], [first.img, second.img]);
  assert.equal(h.body.children.length, 0,'no floating playback control is created');
  assertPlayback(first, false); assertPlayback(second, false);
  h.intersect(first, true);
  assertPlayback(first, true); assertPlayback(second, false);
  h.intersect(second, true); h.intersect(first, false);
  assertPlayback(first, false); assertPlayback(second, true);
  h.intersect(second, false);
  assertPlayback(second, false);
  h.mount();
  assert.equal(h.body.children.length, 0, 'Repeated mount must not create playback UI');
  assert.equal(h.intersections.length, 1); assert.equal(h.mutations.length, 1);
});
test('wall automatically resumes after visibility, reduced-motion, and offscreen round trips', () => {
  const h = wallHarness(), [first, second] = h.pictures;
  h.intersect(first, true); h.intersect(second, true);
  h.setHidden(true); h.setReduced(true); h.intersect(first, false); h.intersect(second, false);
  h.setHidden(false); h.setReduced(false); h.intersect(first, true);
  assertPlayback(first, true); assertPlayback(second, false);
  h.setHidden(true); assertPlayback(first, false);
  h.setHidden(false); assertPlayback(first, true);
  h.setReduced(true);
  assertPlayback(first, false);
  h.setReduced(false);
  assertPlayback(first, true); assertPlayback(second, false);
});
test('wall initial hidden or reduced preference keeps intersecting covers static until allowed', () => {
  for (const options of [{ hidden: true }, { reduced: true }]) {
    const h = wallHarness(options), first = h.pictures[0];
    h.intersect(first, true); assertPlayback(first, false);
    h.setHidden(false); h.setReduced(false); assertPlayback(first, true);
  }
});
test('wall hydration replacements release old image observations and wait for the replacement visibility', () => {
  const h = wallHarness();
  h.intersect(h.pictures[0], true);
  const { previous, replacement } = h.replace(0);
  assert.deepEqual(h.boxes.unobserved, [previous.img]);
  assert.deepEqual([...h.boxes.observed], [h.pictures[1].img, replacement.img]);
  assertPlayback(replacement, false);
  h.intersect(replacement, true);
  assertPlayback(replacement, true);
  h.observer.deliver();
  assert.deepEqual(h.boxes.unobserved, [previous.img], 'Repeated discovery must not observe or remove a node twice');
  assert.equal(h.boxes.observed.size, 2);
});
test('wall ignores an intersection already queued for a picture removed during hydration', () => {
  const h = wallHarness(), first = h.pictures[0];
  const queued = h.boxes.queue(h.entry(first, true));
  const { replacement } = h.replace(0);
  const writesBefore = first.writes.length;
  queued();
  assert.equal(h.body.children.length, 0, 'A detached cover must not recreate playback UI');
  assert.equal(first.writes.length, writesBefore, 'An unobserved picture must not be restarted by stale delivery');
  assertPlayback(replacement, false);
});
test('wall reobserves a new image inside the same picture and rejects the previous image queued entry', () => {
  const h = wallHarness(), first = h.pictures[0], picture = first.element;
  h.intersect(first, true);
  const queued = h.boxes.queue(h.entry(first, true));
  const { previous, replacement } = h.replaceImage(0);
  assert.equal(first.element, picture, 'Hydration preserves the picture and its playback source');
  assert.deepEqual(h.boxes.unobserved, [previous]);
  assert.equal(h.boxes.observed.has(previous), false);
  assert.equal(h.boxes.observed.has(replacement), true);
  assertPlayback(first, false);
  queued();
  assertPlayback(first, false);
  h.intersect(first, true);
  assertPlayback(first, true);
  h.observer.deliver();
  assert.deepEqual(h.boxes.observations, [previous, h.pictures[1].img, replacement]);
});
test('wall pagehide preserves cached pages and disposes listeners and observers on final exit', () => {
  const h = wallHarness(), first = h.pictures[0];
  h.intersect(first, true);
  h.pagehide(true);
  assert.equal(h.boxes.disconnects, 0); assert.equal(h.observer.disconnects, 0);
  assert.equal(h.document.listenerCount('visibilitychange'), 1);
  assert.equal(h.preference.listenerCount('change'), 1);
  assert.equal(h.window.listenerCount('pagehide'), 1);
  h.setHidden(true); h.setHidden(false);
  assertPlayback(first, true);
  h.pagehide(false);
  assert.equal(h.boxes.disconnects, 1); assert.equal(h.observer.disconnects, 1);
  assert.equal(h.boxes.observed.size, 0); assert.equal(h.body.children.length, 0);
  assert.equal(h.document.listenerCount('visibilitychange'), 0);
  assert.equal(h.preference.listenerCount('change'), 0);
  assert.equal(h.window.listenerCount('pagehide'), 0);
  const writesBefore = first.writes.length;
  h.setHidden(true); h.setReduced(true); h.pagehide(false);
  assert.equal(first.writes.length, writesBefore, 'Disposed event listeners must not write playback state');
  assert.equal(h.boxes.disconnects, 1);
});
test('wall ignores an intersection already queued before final pagehide', () => {
  const h = wallHarness(), first = h.pictures[0];
  const queued = h.boxes.queue(h.entry(first, true));
  h.pagehide(false);
  const writesBefore = first.writes.length;
  queued();
  assert.equal(first.writes.length, writesBefore, 'A late observer delivery must not mutate a disposed wall');
  assert.equal(h.body.children.length, 0);
});
test('wall ignores a mutation callback queued before final pagehide without observing new images', () => {
  const h = wallHarness(), first = h.pictures[0];
  h.intersect(first, true);
  const queued = h.observer.queue();
  h.pagehide(false);
  const { replacement } = h.replace(0, { notify: false });
  const previousWrites = first.writes.length, secondWrites = h.pictures[1].writes.length;
  const observations = h.boxes.observations.length;
  queued();
  assert.equal(h.boxes.observed.size, 0);
  assert.equal(h.boxes.observations.length, observations, 'Disposed discovery must not observe replacement images');
  assert.equal(first.writes.length, previousWrites);
  assert.equal(h.pictures[1].writes.length, secondWrites);
  assert.equal(replacement.writes.length, 0, 'Disposed discovery must not initialize replacement playback');
  assert.equal(h.body.children.length, 0);
});
test('module titles and concise purposes are permanent, below-cover captions',()=>{
  const captions=[];function visit(n){if(n.attrs?.some(a=>a.name==='class'&&a.value==='duik-wall-caption'))captions.push(n);for(const c of n.childNodes||[])visit(c);}visit(parse(published));
  const text=n=>n.nodeName==='#text'?n.value:(n.childNodes||[]).map(text).join('');
  assert.equal(captions.length,22);
  captions.forEach((caption,i)=>{const spans=caption.childNodes.filter(n=>n.tagName==='span');assert.deepEqual(spans.map(text),[heroWallScenes[i].title,heroWallScenes[i].summary]);assert(heroWallScenes[i].summary.length<=26);assert.deepEqual(spans.map(span=>span.attrs.find(attr=>attr.name==='class').value),['duik-wall-title','duik-wall-summary']);});
});
test('all feature covers are semantic links to existing local documentation', async () => {
  const links = [], sources = [];
  function visit(node) {
    const attrs = Object.fromEntries((node.attrs || []).map(attr => [attr.name, attr.value]));
    if (attrs['data-duik-wall-guide']) { assert.equal(node.tagName, 'a'); links.push(attrs); }
    if (node.tagName === 'source' && attrs.media === '(prefers-reduced-motion: reduce)') sources.push(attrs);
    for (const child of node.childNodes || []) visit(child);
  }
  visit(parse(published));
  assert.equal(links.length, 22);
  assert.equal(sources.length, 22);
  for (const [index, link] of links.entries()) {
    const scene = heroWallScenes[index];
    assert.equal(link.href, scene.guide);
    assert.equal(link['aria-label'], scene.title + ' · 阅读文档');
    assert.equal(sources[index].srcset, scene.reducedMotionSrc || scene.src);
    const route = scene.guide.replace(/^\/docs\//, '');
    const candidates = ['content/docs/' + route + '.mdx', 'content/docs/' + route + '/index.mdx'];
    assert((await Promise.all(candidates.map(async file => { try { await access(new URL('../' + file, import.meta.url)); return true; } catch { return false; } }))).some(Boolean), 'Missing documentation: ' + scene.guide);
  }
});
test('runtime patch keeps native links and suppresses only a drag-release click', async () => {
  const baselineCode = await read('components/home/landing/baseline/_nuxt/HomeHeroKP.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js');
  const code = patchHeroWallRuntime(baselineCode, heroWallScenes);
  const tree = ts.createSourceFile('hero.js', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.deepEqual(tree.parseDiagnostics, []);
  const declarations = {};
  function visit(node) {
    if (ts.isVariableDeclaration(node) && ['Ne', 'Pe', 'ee', 'lo', 'no'].includes(node.name.getText(tree))) declarations[node.name.getText(tree)] = node.initializer.getText(tree);
    ts.forEachChild(node, visit);
  }
  visit(tree);
  assert.equal(declarations.lo, '{"class":"duik-wall-title"}');
  assert.equal(declarations.no, '{"class":"duik-wall-summary"}');
  const click = declarations.Ne;
  for (const [dragging, detail, expected] of [[false, 1, false], [true, 1, true], [true, 0, false]]) {
    const context = { Q: dragging, prevented: false, detail };
    runInNewContext('(' + click + ')(0,{detail,preventDefault(){prevented=true},stopPropagation(){}})', context);
    assert.equal(context.prevented, expected);
  }
  assert(!declarations.Ne.includes('pe.value'), 'Wall click must no longer open the borrowed modal');
  assert(declarations.ee.includes('dataset.duikDragClick="true"'), 'Record the drag before capture-phase click routing');
  assert(declarations.ee.includes('delete document.documentElement.dataset.duikDragClick'), 'Clear the drag marker after the release event');
  assert(!code.includes('AI-generated'));
  assert(code.includes('duikWallFeatures[o].guide'));
  assert(code.includes('prefers-reduced-motion: reduce'));
  const adapter = await read('components/home/landing/adapter.js');
  assert(adapter.includes("anchor.matches('a[data-duik-wall-guide]')&&document.documentElement.dataset.duikDragClick==='true'"));
});
