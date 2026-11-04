import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { parseFragment } from 'parse5';
import { apiCinemaMarkup, apiCinemaDuration, apiCinemaTracks, apiScenes, mountApiCinema, createApiCinemaPlayback } from '../components/home/landing/api-cinema.mjs';
import { apiExamples } from '../components/home/landing/tool-catalog.mjs';

function visit(node, result = []) { if (node.tagName) result.push(node); for (const child of node.childNodes || []) visit(child, result); return result; }
const attrs = node => Object.fromEntries((node.attrs || []).map(({name,value}) => [name,value]));
function fixture() {
  let time = apiCinemaDuration, id = 0, permitted = true, running = false;
  const queued = new Map(), all = new Map(), paints = [], states = [];
  const driver = createApiCinemaPlayback({
    requestFrame(callback) { const next = ++id; queued.set(next, callback); all.set(next, callback); return next; },
    cancelFrame(key) { queued.delete(key); },
    readTime: () => time,
    seekTime: value => { time = value; },
    run: () => { running = true; }, halt: () => { running = false; },
    allowed: () => permitted,
    onProgress: value => paints.push(value), onState: (state, progress) => states.push({state, progress}),
  });
  return { driver, queued, all, paints, states, get running() { return running; }, set permitted(value) { permitted = value; }, frame(value) { time = value; const entries = [...queued]; queued.clear(); entries.forEach(([, callback]) => callback()); } };
}

test('cinema alternates through the same authored sequence without a final-frame cut', () => {
  const f = fixture();
  f.driver.seek(0);
  assert.equal(f.driver.play(), true);
  assert.equal(f.driver.progress, 0);
  f.frame(apiCinemaDuration * .35);
  assert.equal(f.driver.progress, .35);
  f.frame(apiCinemaDuration);
  assert.equal(f.driver.progress, 1);
  assert.equal(f.driver.playing, true);
  assert.equal(f.running, true);
  assert.equal(f.queued.size, 1);
  f.frame(apiCinemaDuration * 1.5);assert.equal(f.driver.progress, .5);
  f.frame(apiCinemaDuration * 2);assert.equal(f.driver.progress, 0);
  f.frame(apiCinemaDuration * 2.5);assert.equal(f.driver.progress, .5);
  f.driver.destroy();
  const count = f.paints.length;
  for (const callback of f.all.values()) callback();
  assert.equal(f.paints.length, count);
});

test('pause preserves progress, rejects stale frames and resumes from that point', () => {
  const f = fixture();
  f.driver.play(); f.frame(apiCinemaDuration * .48);
  const stale = [...f.queued.values()][0];
  f.driver.pause();
  assert.equal(f.driver.progress, .48);
  assert.equal(f.queued.size, 0);
  stale();
  assert.equal(f.driver.progress, .48);
  f.driver.play();
  assert.equal(f.driver.progress, .48);
  assert.equal(f.queued.size, 1);
  f.frame(apiCinemaDuration * .7);
  assert.equal(f.driver.progress, .7);
});

test('scrubbing interrupts playback, clamps input and invalidates an in-flight callback', () => {
  const f = fixture();
  f.driver.play();
  const stale = [...f.queued.values()][0];
  f.driver.seek(.61); stale();
  assert.equal(f.driver.progress, .61);
  assert.equal(f.driver.playing, false);
  assert.equal(f.queued.size, 0);
  f.driver.seek(-10); assert.equal(f.driver.progress, 0);
  f.driver.seek(2); assert.equal(f.driver.progress, 1);
  f.driver.seek(Number.NaN); assert.equal(f.driver.progress, 0);
});

test('offscreen, hidden or reduced-motion start gates preserve the selected manual state', () => {
  const f = fixture();
  f.driver.seek(.48); f.permitted = false;
  assert.equal(f.driver.play(), false);
  assert.equal(f.driver.progress, .48);
  assert.equal(f.running, false);
  assert.equal(f.queued.size, 0);
  f.permitted = true;
  assert.equal(f.queued.size, 0, 'restoring eligibility must not resume automatically');
  assert.equal(f.driver.play(), true);
});

test('a gate closing between frames cancels playback without advancing its scene', () => {
  const f = fixture();
  f.driver.play(); f.frame(apiCinemaDuration * .3);
  f.permitted = false; f.frame(apiCinemaDuration * .4);
  assert.equal(f.driver.progress, .3);
  assert.equal(f.driver.playing, false);
  assert.equal(f.running, false);
  assert.equal(f.queued.size, 0);
  assert.equal(f.states.at(-1).state, 'hidden');
});

test('repeated play does not duplicate a scheduler; disposal prevents later writes', () => {
  const f = fixture();
  f.driver.play(); f.driver.play(); f.driver.play();
  assert.equal(f.queued.size, 1);
  const stale = [...f.queued.values()][0];
  f.driver.destroy();
  const count = f.paints.length;
  stale(); f.driver.seek(.5); f.driver.play();
  assert.equal(f.paints.length, count);
  assert.equal(f.queued.size, 0);
  assert.equal(f.running, false);
});

test('the rendered contract has one complete scene surface and code in closed detail', () => {
  const tree = parseFragment(apiCinemaMarkup), nodes = visit(tree);
  const find = attr => nodes.filter(node => Object.hasOwn(attrs(node), attr));
  assert.equal(typeof mountApiCinema(null), 'function');
  assert.equal(find('data-api-surface').length, 1);
  assert.equal(find('data-api-scene').length, 3);
  assert.deepEqual(find('data-api-scene').map(node => attrs(node)['data-api-scene']), apiExamples.map(item => item.id));
  assert.equal(find('data-api-example').length, 3);
  assert.equal(find('data-api-progress').length, 0);
  assert.equal(find('data-api-phase').length, 0);
  assert.equal(find('data-api-reset').length, 0);
  assert.equal(nodes.filter(node => node.tagName === 'input' || node.tagName === 'progress').length, 0);
  const detail = nodes.find(node => node.tagName === 'details');
  assert.equal(attrs(detail).class, 'duik-api-reference');
  assert(!Object.hasOwn(attrs(detail), 'open'));
  const detailNodes = visit(detail);
  for (const hook of ['data-api-copy','data-api-code','data-api-prerequisite']) assert(detailNodes.some(node => Object.hasOwn(attrs(node), hook)));
  assert(apiCinemaMarkup.includes('功能关系示意，不执行 AE 操作。'));
  assert.deepEqual(Object.keys(apiScenes), apiExamples.map(item => item.id));
});

test('every animated node owns a finite transform/opacity track with resolved endpoints', () => {
  const tracks = apiCinemaTracks(), nodes = visit(parseFragment(apiCinemaMarkup));
  for (const node of nodes.filter(node => Object.hasOwn(attrs(node), 'data-api-motion'))) {
    const name = attrs(node)['data-api-motion'], track = tracks[name];
    assert(track, 'Missing track: ' + name);
    assert.equal(track[0].offset, 0); assert.equal(track.at(-1).offset, 1);
    assert(track.every((frame, index) => index === 0 || frame.offset >= track[index - 1].offset));
    for (const frame of track) assert(Object.keys(frame).every(key => ['offset','opacity','transform','easing'].includes(key)));
  }
  assert(apiCinemaDuration > 0 && apiCinemaDuration < 10000);
});

test('all calls, prerequisites and document destinations retain their real local sources', async () => {
  for (const example of apiExamples) {
    const source = await readFile(new URL('../content' + example.href + '.mdx', import.meta.url), 'utf8');
    assert(source.includes(example.call));
    assert(example.prerequisite);
  }
  for (const node of visit(parseFragment(apiCinemaMarkup))) {
    const values = attrs(node);
    if (values.href) await access(new URL('../content' + values.href + '.mdx', import.meta.url));
    if (node.tagName === 'img') {
      assert.equal(values.src, '/duik-experience/official/duik/tools/script-editor.png');
      assert.equal(values.width, '481'); assert.equal(values.height, '535');
    }
  }
});

// This adapter executes the real mount/selection controller against parsed
// markup. It does not prove browser layout, WAAPI rendering or trusted input.
class LocalTarget {
  listeners = [];
  addEventListener(type, callback) { this.listeners.push({type, callback}); }
  removeEventListener(type, callback) { this.listeners = this.listeners.filter(item => item.type !== type || item.callback !== callback); }
  fire(type, values = {}) {
    const event = {type, target:this, ...values};
    for (let target = this; target; target = ['click','pointerdown','keydown','focusin','focusout','input'].includes(type) ? target.parentElement : null) {
      for (const item of [...target.listeners]) if (item.type === type) item.callback(event);
    }
  }
}
const dataName = key => 'data-' + String(key).replace(/[A-Z]/g, char => '-' + char.toLowerCase());
class LocalElement extends LocalTarget {
  constructor(node, document) {
    super();
    this.tagName = node.tagName || '#text'; this.ownerDocument = document;
    this.attributes = new Map((node.attrs || []).map(item => [item.name, item.value]));
    this.parentElement = null; this._text = node.value || '';
    this.childNodes = (node.childNodes || []).map(child => { const element = new LocalElement(child, document); element.parentElement = this; return element; });
    this.dataset = new Proxy({}, {get:(_, key) => this.getAttribute(dataName(key)) ?? undefined, set:(_, key, value) => { this.setAttribute(dataName(key), value); return true; }});
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  hasAttribute(name) { return this.attributes.has(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  toggleAttribute(name, force = !this.hasAttribute(name)) { if (force) this.setAttribute(name, ''); else this.removeAttribute(name); return force; }
  matches(selector) {
    const tag = selector.match(/^[a-z][\w-]*/i)?.[0];
    if (tag && this.tagName !== tag) return false;
    const className = selector.match(/\.([\w-]+)/)?.[1];
    if (className && !(this.getAttribute('class') || '').split(/\s+/).includes(className)) return false;
    return [...selector.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)].every(([, name, value]) => this.hasAttribute(name) && (value === undefined || this.getAttribute(name) === value));
  }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
  contains(other) { for (let node = other; node; node = node.parentElement) if (node === this) return true; return false; }
  querySelectorAll(selector) { const result = []; const walk = node => { for (const child of node.childNodes) { if (child.tagName !== '#text' && child.matches(selector)) result.push(child); walk(child); } }; walk(this); return result; }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  get textContent() { return this._text + this.childNodes.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.childNodes = []; }
  focus() { this.ownerDocument.activeElement = this; }
  getBoundingClientRect() { return {width:1100, height:550}; }
  animate(frames, options) {
    const animation = {frames, options, currentTime:0, playState:'running', cancelled:false, pause() { this.playState = 'paused'; }, play() { this.playState = 'running'; }, cancel() { this.cancelled = true; this.playState = 'idle'; }};
    this.ownerDocument.animations.push(animation); return animation;
  }
}
for (const name of ['href','value']) Object.defineProperty(LocalElement.prototype, name, {get() { return this.getAttribute(name) || ''; }, set(value) { this.setAttribute(name, value); }});
for (const name of ['hidden','disabled','open']) Object.defineProperty(LocalElement.prototype, name, {get() { return this.hasAttribute(name); }, set(value) { this.toggleAttribute(name, !!value); }});
function mountedFixture(t, {reduced = false} = {}) {
  const document = new LocalTarget(), preference = new LocalTarget(), frames = new Map(), observers = [];
  document.hidden = false; document.animations = []; preference.matches = reduced;
  let nextFrame = 0;
  document.defaultView = {
    matchMedia:() => preference,
    requestAnimationFrame(callback) { const id = ++nextFrame; frames.set(id, callback); return id; },
    cancelAnimationFrame:id => frames.delete(id),
    IntersectionObserver:class {
      constructor(callback) { this.callback = callback; this.disconnected = false; observers.push(this); }
      observe(target) { this.target = target; }
      disconnect() { this.disconnected = true; }
      notify(visible) { if (!this.disconnected) this.callback([{target:this.target, isIntersecting:visible, intersectionRatio:visible ? 1 : 0}]); }
    },
  };
  const host = new LocalElement(parseFragment(apiCinemaMarkup), document), root = host.querySelector('[data-duik-api]');
  const cleanup = mountApiCinema(root); t.after(cleanup);
  return {root, document, preference, frames, observers, cleanup, control:selector => root.querySelector(selector)};
}

// Copyable code may repeat in closed reference details, but the first layer
// keeps exactly one call, in the object/call/result relationship itself.
function firstLayerText(node) {
  if (node.tagName === 'details') return '';
  return node.childNodes.length ? node.childNodes.map(firstLayerText).join('') : node.textContent;
}
function assertSingleFirstLayerCall(root, example) {
  assert.equal(firstLayerText(root).split(example.call).length - 1, 1);
  assert(!root.querySelector('[data-api-stage-status]').textContent.includes(example.call));
}

test('first-layer SSR connects the selected objects, real call and result outside closed details', () => {
  const host = new LocalElement(parseFragment(apiCinemaMarkup), {});
  const relation = host.querySelector('[data-api-relation]');
  assert(relation, 'the visible stage needs its own object/call/result relationship');
  assert.equal(relation.closest('figure'), host.querySelector('figure'));
  assert.equal(relation.closest('details'), null);
  assert.equal(relation.dataset.apiRelationPhase, 'result');
  assert.equal(relation.querySelector('[data-api-input]').textContent, apiScenes.arm.input);
  assert.equal(relation.querySelector('[data-api-call]').textContent, apiExamples[0].call);
  assert.equal(relation.querySelector('[data-api-result]').textContent, apiScenes.arm.result);
  assert.equal(host.querySelectorAll('[data-api-call]').length, 1);
  assertSingleFirstLayerCall(host, apiExamples[0]);
  for (const hook of ['data-api-copy','data-api-code','data-api-prerequisite']) assert(host.querySelector(`[${hook}]`).closest('details'));
});

test('mounted example selection updates the visible call, object, result and detail from one source', t => {
  const env = mountedFixture(t);
  for (const example of [...apiExamples.slice(1), apiExamples[0]]) {
    env.control(`[data-api-example="${example.id}"]`).fire('click');
    const relation = env.control('[data-api-relation]');
    assert(relation, 'mount must keep a first-layer relationship, not code only inside details');
    assert.equal(env.root.dataset.apiSelection, example.id);
    assert.equal(relation.querySelector('[data-api-call]').textContent, example.call);
    assert.equal(relation.querySelector('[data-api-input]').textContent, apiScenes[example.id].input);
    assert.equal(relation.querySelector('[data-api-result]').textContent, apiScenes[example.id].result);
    assert.equal(env.control('[data-api-code]').textContent, example.call);
    assert.equal(env.root.dataset.apiPosition, '1.000');
    assert.equal(relation.dataset.apiRelationPhase, 'result');
    assert.equal(env.frames.size, 0, 'changing examples must not start a loop');
    assertSingleFirstLayerCall(env.root, example);
  }
});

test('automatic stages emphasize the call only in its phase while keeping the whole relation readable', t => {
  const env = mountedFixture(t);
  env.observers[0].notify(true);
  for (const example of apiExamples) {
    env.control(`[data-api-example="${example.id}"]`).fire('click');
    for (const [value, phase] of [['0','input'],['0.48','call'],['1','result']]) {
      for (const animation of env.document.animations) if (!animation.cancelled) animation.currentTime = apiCinemaDuration * Number(value);
      const pending = [...env.frames.values()]; env.frames.clear(); pending.forEach(callback => callback());
      const relation = env.control('[data-api-relation]');
      assert(relation);
      assert.equal(relation.dataset.apiRelationPhase, phase);
      assert.equal(relation.querySelector('[data-api-call]').textContent, example.call);
      assert.equal(relation.querySelector('[data-api-call]').closest('[hidden]'), null);
      assertSingleFirstLayerCall(env.root, example);
      assert.equal(env.control('[data-api-stage-status]').textContent, {
        input: apiScenes[example.id].input,
        call: '查看调用片段及其作用对象。',
        result: `${apiScenes[example.id].result}。`,
      }[phase]);
      assert.equal(env.frames.size, 1);
    }
  }
});

test('reduced-motion and cleanup retain a complete static relationship without pending frames', t => {
  const env = mountedFixture(t, {reduced:true});
  env.observers[0].notify(true);
  env.control('[data-api-example="auto-parent"]').fire('click');
  const relation = env.control('[data-api-relation]');
  assert(relation);
  assert.equal(relation.dataset.apiRelationPhase, 'result');
  assert.equal(relation.querySelector('[data-api-call]').textContent, apiExamples[2].call);
  assertSingleFirstLayerCall(env.root, apiExamples[2]);
  assert.equal(env.control('[data-api-stage-status]').textContent, `${apiScenes['auto-parent'].result}。`);
  assert.equal(env.control('[data-api-play]'), null);
  assert.equal(env.frames.size, 0);
  env.cleanup();
  env.control('[data-api-example="wiggle"]').fire('click');
  assert.equal(relation.querySelector('[data-api-call]').textContent, apiExamples[2].call);
  assert(env.document.animations.every(animation => animation.cancelled));
  assert.equal(env.frames.size, 0);
});

test('a playing call phase survives offscreen pause and becomes a complete relation on motion reduction', t => {
  const env = mountedFixture(t), relation = env.control('[data-api-relation]');
  env.observers[0].notify(true);
  assert.equal(env.frames.size, 1);
  for (const animation of env.document.animations) if (!animation.cancelled) animation.currentTime = apiCinemaDuration * .48;
  const pending = [...env.frames.values()]; env.frames.clear(); pending.forEach(callback => callback());
  assert.equal(relation.dataset.apiRelationPhase, 'call');
  assert.equal(env.root.dataset.apiPosition, '0.480');
  env.observers[0].notify(false);
  assert.equal(env.frames.size, 0);
  assert.equal(relation.dataset.apiRelationPhase, 'call');
  assert.equal(env.root.dataset.apiPosition, '0.480');
  env.observers[0].notify(true);
  assert.equal(env.frames.size, 1, 'returning to the page resumes the same loop');
  env.preference.matches = true; env.preference.fire('change');
  assert.equal(relation.dataset.apiRelationPhase, 'result');
  assert.equal(relation.querySelector('[data-api-call]').textContent, apiExamples[0].call);
  assert.equal(env.root.dataset.apiPosition, '1.000');
  assert.equal(env.frames.size, 0);
});

test('mounted API keeps looping through passive hover, focus and example selection without player controls', t => {
  const env = mountedFixture(t), root = env.root;
  assert.equal(env.control('[data-api-play]'), null);
  env.observers[0].notify(true);assert.equal(env.frames.size, 1);
  root.fire('pointerenter');assert.equal(env.frames.size, 1);
  env.control('[data-api-example="wiggle"]').fire('focusin');
  assert.equal(env.frames.size, 1);
  env.control('[data-api-example="wiggle"]').fire('keydown', {key:'Enter'});
  env.control('[data-api-example="wiggle"]').fire('click');
  assert.equal(root.dataset.apiSelection, 'wiggle');
  assert.equal(root.dataset.apiPosition, '0.000');
  assert.equal(env.frames.size, 1);
  root.fire('pointerleave');assert.equal(env.frames.size, 1);
  const stale = env.observers[0].callback;env.cleanup();stale([{target:env.control('[data-api-surface]'),isIntersecting:true,intersectionRatio:1}]);
  assert.equal(env.frames.size, 0);
});

test('automatic narration stays silent and opening reference details holds the scene until closed', t => {
  const env = mountedFixture(t), status = env.control('[data-api-stage-status]');
  env.observers[0].notify(true);
  for (const position of [.2,.48,.8,1.4,1.8,2.4]) {
    for (const animation of env.document.animations) if (!animation.cancelled) animation.currentTime = apiCinemaDuration * position;
    const pending = [...env.frames.values()];env.frames.clear();pending.forEach(callback => callback());
    assert.equal(status.getAttribute('aria-live'), 'off');
  }
  const reference = env.control('.duik-api-reference');
  reference.open = true; reference.fire('toggle');
  assert.equal(env.frames.size, 0);
  const held = env.root.dataset.apiPosition;
  env.root.fire('pointerleave'); env.observers[0].notify(true);
  assert.equal(env.frames.size, 0);
  assert.equal(env.root.dataset.apiPosition, held);
  reference.open = false; reference.fire('toggle');
  assert.equal(env.frames.size, 1);
  assert.equal(status.getAttribute('aria-live'), 'off');
  env.cleanup(); reference.fire('toggle');
  assert.equal(env.frames.size, 0);
});
