import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {parseFragment} from 'parse5';
import ts from 'typescript';

const source = await readFile(new URL('../components/home/landing/adapter.js', import.meta.url), 'utf8');
const diagnostic = process.env.DUIK_HERO_TEST_ORIGINAL === '1';
const approvedPoster = '/riglab-project/source.png';

// Captured before the lifecycle fix. Diagnostic mode runs the same behavioral
// assertions against the original mountSlot and must fail on recovery checks.
const originalMountSlot = `function mountSlot(host) {
  mountLanding();
  if (!host.closest('.kp-home-hero-main-input-wrap')) return mountJourney(host);
  const lifetime = new AbortController();
  host.innerHTML = \`<div class="duik-character-stage" aria-label="角色绑定交互演示">
    <div class="duik-stage-heading"><span><i></i> 角色结构预览</span><span>IK · 双臂 · 表情</span></div>
    <character-rig id="duik-hero-character" src="/riglab-project/rig.json" interaction="both" controls="visible"></character-rig>
    <div class="duik-rig-toolbar"><span>拖动红色端点，试试角色的动作。</span><button type="button" data-rig-reset>复位</button><button type="button" data-rig-controls aria-pressed="true">隐藏控制器</button></div>
  </div><p class="duik-demo-note">网页交互示意 · 实际角色绑定请在 After Effects 中使用 Duik</p>\`;
  const character = host.querySelector('character-rig');
  host.querySelector('[data-rig-reset]').addEventListener('click', () => character.rig?.reset(), {signal:lifetime.signal});
  host.querySelector('[data-rig-controls]').addEventListener('click', event => {
    const show = character.getAttribute('controls') !== 'visible';
    character.setAttribute('controls', show ? 'visible' : 'hidden');
    event.currentTarget.setAttribute('aria-pressed', String(show));
    event.currentTarget.textContent = show ? '隐藏控制器' : '显示控制器';
  }, {signal:lifetime.signal});
  character.ready.catch(() => {
    if (!character.isConnected) return;
    const fallback = document.createElement('img');
    fallback.src = '/riglab-project/source.png'; fallback.alt = '角色原图；交互加载失败，可继续阅读文档';
    character.replaceWith(fallback);
  });
  return () => { lifetime.abort(); host.replaceChildren(); };
}`;

// Execute the current adapter declarations, including any extracted mountHero
// helper. Imports are environment boundaries; no public mirror or browser runs.
function executable() {
  const ast = ts.createSourceFile('adapter.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  return ast.statements.map(node => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) return '';
    if (diagnostic && ts.isFunctionDeclaration(node) && node.name?.text === 'mountSlot') return originalMountSlot;
    return node.getText(ast).replace(/^export\s+/, '');
  }).join('\n') + '\n({mountSlot});';
}

class Events {
  listeners = new Map();
  addEventListener(type, callback, options = {}) {
    if (options.signal?.aborted) return;
    const group = this.listeners.get(type) || new Set();
    group.add(callback); this.listeners.set(type, group);
    options.signal?.addEventListener('abort', () => group.delete(callback), {once: true});
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  fire(type, values = {}) {
    const path = []; for (let node = this; node; node = node.parentElement) path.push(node);
    const event = {type, target: this, bubbles: true, detail: 1, composedPath: () => path,
      preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.stopped = true; },
      stopImmediatePropagation() { this.stopped = this.immediate = true; }, ...values};
    for (const node of path) {
      event.currentTarget = node;
      for (const callback of [...node.listeners.get(type) || []]) {
        callback(event); if (event.immediate) break;
      }
      if (event.stopped || !event.bubbles) break;
    }
    return event;
  }
  listenerCount() { return [...this.listeners.values()].reduce((total, group) => total + group.size, 0); }
}

const dataAttribute = key => 'data-' + String(key).replace(/[A-Z]/g, character => '-' + character.toLowerCase());
class Element extends Events {
  constructor(tag, document) {
    super(); this.tagName = tag; this.ownerDocument = document; this.attrs = new Map();
    this.childNodes = []; this.parentElement = null; this.style = {}; this._text = '';
    this.dataset = new Proxy({}, {
      get: (_, key) => this.getAttribute(dataAttribute(key)) ?? undefined,
      set: (_, key, value) => { this.setAttribute(dataAttribute(key), value); return true; },
      deleteProperty: (_, key) => { this.removeAttribute(dataAttribute(key)); return true; },
    });
    document.elements.push(this);
  }
  getAttribute(name) { return this.attrs.get(name) ?? null; }
  setAttribute(name, value) { this.attrs.set(name, String(value)); }
  removeAttribute(name) { this.attrs.delete(name); }
  hasAttribute(name) { return this.attrs.has(name); }
  get isConnected() { return this === this.ownerDocument.documentElement || Boolean(this.parentElement?.isConnected); }
  get children() { return this.childNodes.filter(node => node.tagName !== '#text'); }
  matches(selector) {
    if (selector.startsWith('.')) return (this.getAttribute('class') || '').split(/\s+/).includes(selector.slice(1));
    const match = selector.match(/^([\w-]+)?(?:\[([^=\]]+)(?:=["']?([^"'\]]+)["']?)?\])?$/);
    return Boolean(match && (!match[1] || this.tagName === match[1]) && (!match[2]
      || (this.hasAttribute(match[2]) && (match[3] === undefined || this.getAttribute(match[2]) === match[3]))));
  }
  closest(selector) { for (let node = this; node; node = node.parentElement) if (node.matches(selector)) return node; return null; }
  contains(other) { for (let node = other; node; node = node.parentElement) if (node === this) return true; return false; }
  querySelectorAll(selector) {
    const matches = []; const visit = node => { for (const child of node.childNodes) { if (child.matches(selector)) matches.push(child); visit(child); } };
    visit(this); return matches;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  append(...nodes) { for (const node of nodes) { node.parentElement = this; this.childNodes.push(node); } }
  appendChild(node) { this.append(node); return node; }
  disconnected() { if (this.tagName === 'character-rig') this.disconnections++; for (const node of this.childNodes) node.disconnected(); }
  remove() {
    if (!this.parentElement) return;
    if (this.isConnected) this.disconnected();
    this.parentElement.childNodes = this.parentElement.childNodes.filter(node => node !== this); this.parentElement = null;
  }
  replaceChildren(...nodes) { for (const node of [...this.childNodes]) node.remove(); this._text = ''; this.append(...nodes); }
  replaceWith(node) {
    const parent = this.parentElement; if (!parent) return;
    const index = parent.childNodes.indexOf(this); this.remove(); node.parentElement = parent; parent.childNodes.splice(index, 0, node);
  }
  set innerHTML(html) { this.replaceChildren(...parseFragment(html).childNodes.map(node => fromParsed(node, this.ownerDocument))); }
  get textContent() { return this._text + this.childNodes.map(node => node.textContent).join(''); }
  set textContent(value) { this.replaceChildren(); this._text = String(value); }
  click() { if (!this.disabled) this.fire('click'); }
  focus() { this.ownerDocument.activeElement = this; this.fire('focusin'); }
}
for (const name of ['src', 'alt', 'width', 'height', 'type', 'className']) {
  const attribute = name === 'className' ? 'class' : name;
  Object.defineProperty(Element.prototype, name, {get() { return this.getAttribute(attribute) || ''; }, set(value) { this.setAttribute(attribute, value); }});
}
for (const name of ['hidden', 'disabled']) Object.defineProperty(Element.prototype, name, {
  get() { return this.hasAttribute(name); }, set(value) { if (value) this.setAttribute(name, ''); else this.removeAttribute(name); },
});
function fromParsed(parsed, document) {
  const element = document.createElement(parsed.tagName || '#text');
  for (const {name, value} of parsed.attrs || []) element.setAttribute(name, value);
  if (parsed.nodeName === '#text') element._text = parsed.value;
  element.append(...(parsed.childNodes || []).map(node => fromParsed(node, document))); return element;
}
const flush = () => new Promise(resolve => setImmediate(resolve));

// character-rig readiness, DOM events and disconnect are boundary adapters.
// These tests make no PNG, WebGL, image-decoding or physical-input claim.
function fixture(t) {
  const document = new Events(); document.elements = []; document.instances = [];
  document.createElement = tag => {
    const element = new Element(tag, document);
    if (tag === 'character-rig') {
      element.disconnections = 0; element.rig = null;
      element.api = {resets: 0, reset() { this.resets++; }};
      let resolve, reject; element.ready = new Promise((yes, no) => { resolve = yes; reject = no; });
      element.ready.catch(() => {});
      element.resolve = () => { element.rig = element.api; resolve(element.api); };
      element.reject = () => reject(new Error('fixture: rig loading failed'));
      element.fail = () => element.fire('rig-error', {detail: {message: 'fixture: WebGL context lost'}, composed: true});
      document.instances.push(element);
    }
    return element;
  };
  document.documentElement = document.createElement('html'); document.body = document.createElement('body');
  document.documentElement.append(document.body); document.querySelector = selector => document.documentElement.querySelector(selector);
  const wrap = document.createElement('div'); wrap.className = 'kp-home-hero-main-input-wrap';
  const host = document.createElement('div'); wrap.append(host); document.body.append(wrap);
  const frames = new Map(); let nextFrame = 0;
  const adapter = runInNewContext(executable(), {document, AbortController, navMarkup: '',
    requestAnimationFrame: callback => { const id = ++nextFrame; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id), console, URL, location: {href: 'http://127.0.0.1/'}});
  const dispose = adapter.mountSlot(host); t.after(() => dispose());
  const control = selector => host.querySelector(selector);
  const posters = () => host.querySelectorAll('img').filter(image => image.src === approvedPoster && !image.hidden);
  const retry = () => control('[data-rig-retry]');
  return {document, host, dispose, control, posters, retry, instances: document.instances,
    async ready(element = document.instances.at(-1)) { element.resolve(); await flush(); return element; },
    async error(element = document.instances.at(-1)) { element.fail(); await flush(); },
  };
}

function assertRecoverable(f) {
  assert.equal(f.posters().length, 1, 'Hero must expose exactly one approved poster after a character failure');
  assert(f.posters()[0].alt.length > 0, 'The fallback image must retain meaningful alternative text');
  assert.equal(f.host.querySelectorAll('character-rig').length, 0, 'The failed character must disconnect');
  assert(f.retry() && !f.retry().hidden && !f.retry().disabled, 'Failure must provide an enabled retry button');
  const status = f.control('[data-rig-status]');
  assert(status && status.textContent.trim(), 'Failure must explain the recovery state in text');
  for (const selector of ['[data-rig-reset]', '[data-rig-controls]']) {
    const button = f.control(selector); assert(!button || button.disabled || button.hidden, 'Failed character controls must not remain actionable');
  }
  assert.equal(f.control('.duik-character-stage').dataset.rigState, 'error');
}

test('healthy Hero retains its approved source, reset and controller toggle', async t => {
  const f = fixture(t), character = await f.ready();
  assert.equal(character.getAttribute('src'), '/riglab-project/rig.json');
  assert.equal(character.getAttribute('interaction'), 'both');
  f.control('[data-rig-reset]').click(); assert.equal(character.api.resets, 1);
  f.control('[data-rig-controls]').click(); assert.equal(character.getAttribute('controls'), 'hidden');
  f.control('[data-rig-controls]').click(); assert.equal(character.getAttribute('controls'), 'visible');
  assert.equal(f.posters().length, 0);
});

test('runtime rig-error after ready falls back to the approved poster and offers retry', async t => {
  const f = fixture(t), character = await f.ready(); await f.error(character);
  assertRecoverable(f); assert.equal(character.disconnections, 1);
  await f.error(character); assertRecoverable(f);
  assert.equal(character.disconnections, 1, 'Repeated stale errors cannot dispose twice');
});

test('retry mounts one fresh character and success restores interactive controls', async t => {
  const f = fixture(t), first = await f.ready(); await f.error(first); assertRecoverable(f);
  const retry = f.retry(); retry.click(); retry.click();
  assert.equal(f.instances.length, 2, 'Repeated retry activation cannot mount concurrent characters');
  assert.equal(f.control('.duik-character-stage').dataset.rigState, 'loading');
  assert(f.control('[data-rig-reset]').disabled); assert(f.control('[data-rig-controls]').disabled);
  const second = f.instances[1]; assert(second.isConnected); assert.notEqual(second, first);
  assert.equal(second.getAttribute('src'), '/riglab-project/rig.json');
  await f.ready(second);
  assert.equal(f.control('.duik-character-stage').dataset.rigState, 'ready');
  assert.equal(f.host.querySelectorAll('character-rig').length, 1); assert.equal(f.posters().length, 0);
  assert(!f.retry() || f.retry().hidden, 'Successful recovery clears the retry state');
  assert(!f.control('[data-rig-reset]').disabled); assert(!f.control('[data-rig-controls]').disabled);
  f.control('[data-rig-reset]').click(); assert.equal(second.api.resets, 1); assert.equal(first.api.resets, 0);
  await f.error(first); assert.equal(f.host.querySelector('character-rig'), second); assert.equal(f.posters().length, 0);
});

test('initial ready rejection has the same retryable recovery as a runtime failure', async t => {
  const f = fixture(t); f.instances[0].reject(); await flush(); assertRecoverable(f);
  f.retry().click(); await f.ready(); assert.equal(f.posters().length, 0);
});

test('unmount in the retry state clears the recovery action and stale error listener', async t => {
  const f = fixture(t), character = await f.ready(); await f.error(character); assertRecoverable(f);
  const retry = f.retry(); f.dispose(); retry.click(); character.fail(); await flush();
  assert.equal(f.host.childNodes.length, 0); assert.equal(f.instances.length, 1);
  assert.equal(f.document.elements.reduce((sum, element) => sum + element.listenerCount(), 0), 0);
});

for (const settlement of ['resolve', 'reject']) {
  test(`stale ${settlement} after an early rig-error cannot replace the recovered character`, async t => {
    const f = fixture(t), first = f.instances[0]; await f.error(first); assertRecoverable(f);
    f.retry().click(); const second = f.instances[1]; await f.ready(second);
    first[settlement](); await flush();
    assert.equal(f.host.querySelector('character-rig'), second); assert.equal(f.posters().length, 0);
    assert(!f.retry() || f.retry().hidden);
  });
}

for (const readyFirst of [false, true]) {
  test(`unmount ${readyFirst ? 'after' : 'before'} ready clears owned listeners and rejects stale work`, async t => {
    const f = fixture(t), character = f.instances[0]; if (readyFirst) await f.ready(character);
    const reset = f.control('[data-rig-reset]'); f.dispose();
    assert.equal(f.host.childNodes.length, 0); assert.equal(character.disconnections, 1);
    assert.equal(f.document.elements.reduce((sum, element) => sum + element.listenerCount(), 0), 0,
      'The slot must release its element listeners on unmount');
    character.resolve(); character.fail(); reset.click(); await flush();
    assert.equal(f.host.childNodes.length, 0); assert.equal(f.instances.length, 1);
    assert.equal(character.api.resets, 0, 'Detached toolbar callbacks must not operate the old rig');
  });
}
