import test from 'node:test';
import assert from 'node:assert/strict';
import {parseFragment} from 'parse5';
import {mountRigDiagnostics} from '../components/home/landing/rig-diagnostics.mjs';

// The real source module owns sampling and cancellation. DOM events, image
// decoding and canvas pixels are controlled boundaries, not browser/WebGL proof.
class Events {
  listeners = new Map();
  addEventListener(type, callback, {signal} = {}) {
    if (signal?.aborted) return;
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(callback); this.listeners.set(type, listeners);
    signal?.addEventListener('abort', () => listeners.delete(callback), {once: true});
  }
  emit(type) {
    let pending;
    for (const callback of [...this.listeners.get(type) || []]) pending = callback({type, target: this});
    return pending;
  }
  listenerCount() { return [...this.listeners.values()].reduce((total, listeners) => total + listeners.size, 0); }
}

class Element extends Events {
  constructor(tag, document) {
    super(); this.tagName = tag; this.ownerDocument = document; this.attributes = new Map();
    this.children = []; this.parentElement = null; this._text = ''; document.elements.push(this);
  }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  append(...children) { for (const child of children) { child.parentElement = this; this.children.push(child); } }
  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter(child => child !== this);
    this.parentElement = null;
  }
  querySelector(selector) {
    const attribute = selector.match(/^\[([^\]]+)\]$/)?.[1];
    assert(attribute, 'Fixture only needs the module’s data-attribute selectors');
    for (const child of this.children) {
      if (child.attributes.has(attribute)) return child;
      const descendant = child.querySelector(selector); if (descendant) return descendant;
    }
    return null;
  }
  set innerHTML(html) {
    this.children = []; this._text = '';
    this.append(...parseFragment(html).childNodes.map(node => fromParsed(node, this.ownerDocument)));
  }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this.children = []; this._text = String(value); }
}
for (const name of ['src', 'alt']) Object.defineProperty(Element.prototype, name, {
  get() { return this.getAttribute(name) || ''; }, set(value) { this.setAttribute(name, value); },
});
for (const name of ['hidden', 'disabled']) Object.defineProperty(Element.prototype, name, {
  get() { return this.attributes.has(name); },
  set(value) { if (value) this.setAttribute(name, ''); else this.removeAttribute(name); },
});
function fromParsed(parsed, document) {
  const element = document.createElement(parsed.tagName || '#text');
  for (const {name, value} of parsed.attrs || []) element.setAttribute(name, value);
  if (parsed.nodeName === '#text') element._text = parsed.value;
  element.append(...(parsed.childNodes || []).map(node => fromParsed(node, document))); return element;
}

function fixture(t) {
  const document = {elements: [], probes: []}, images = [], previousGlobals = new Map();
  document.createElement = tag => {
    const element = new Element(tag, document);
    if (tag === 'canvas') {
      element.getContext = type => {
        assert.equal(type, '2d', 'Pixel inspection must not create another WebGL canvas');
        return {
          drawImage(image, x, y) { element.drawn = {image, x, y}; },
          getImageData(x, y, width, height) {
            assert.deepEqual([x, y, width, height], [0, 0, 2, 1]);
            return {data: new Uint8ClampedArray([24, 36, 48, 128, 0, 0, 0, 0])};
          },
        };
      };
      document.probes.push(element);
    }
    return element;
  };
  class DecodedImage {
    naturalWidth = 2; naturalHeight = 1;
    constructor() { images.push(this); }
    decode() { return new Promise(resolve => { this.finishDecode = resolve; }); }
  }
  for (const [name, value] of Object.entries({document, Image: DecodedImage,
    location: {href: 'http://127.0.0.1/?rig-diagnostics=1'}})) {
    previousGlobals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {value, configurable: true, writable: true});
  }
  const host = document.createElement('div'); host.isConnected = true;
  const lifetime = new AbortController();
  function character(name) {
    const state = {sourceSha256: 'synthetic-approved-source', frames: 12, active: true,
      rafScheduled: false, mode: 'assembled', visibleParts: ['synthetic-part'],
      pose: {head: 2}, webglError: 0};
    const gl = {lost: false, lossRequests: 0, isContextLost() { return this.lost; },
      getExtension(extension) {
        assert.equal(extension, 'WEBGL_lose_context');
        return {loseContext() { gl.lossRequests++; gl.lost = true; }};
      }};
    const canvas = {contextReads: 0, getContext(type) {
      assert.equal(type, 'webgl'); this.contextReads++; return gl;
    }};
    const rig = {captures: 0, capture() { this.captures++; return 'data:image/png;base64,' + name; },
      getState: () => structuredClone(state)};
    return {rig, state, gl, canvas, shadowRoot: {querySelector(selector) { assert.equal(selector, 'canvas'); return canvas; }}};
  }
  const first = character('first'); let current = first;
  mountRigDiagnostics(host, () => current, lifetime.signal);
  t.after(() => {
    lifetime.abort();
    for (const [name, descriptor] of previousGlobals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor); else delete globalThis[name];
    }
  });
  const control = selector => host.querySelector(selector);
  const read = control('[data-rig-capture]'), preview = control('[data-rig-frame-preview]');
  const output = control('[data-rig-frame-result]'), loss = control('[data-rig-context-loss]');
  return {host, document, images, first, read, preview, output, loss, lifetime, character,
    capture: () => read.emit('click'), decode: index => images[index].finishDecode(),
    replace(value) { current = value; },
  };
}

test('late decode cannot publish a snapshot from a replaced character', async t => {
  const f = fixture(t), pending = f.capture(); assert(f.read.disabled);
  const replacement = f.character('replacement'); f.replace(replacement);
  f.decode(0); await pending;
  assert(f.preview.hidden); assert.equal(f.preview.src, ''); assert(!f.read.disabled);
  assert.match(f.output.textContent, /实例已切换/);
  assert.equal(f.document.probes.length, 0, 'A stale decode must stop before reading pixels');
  assert.equal(f.first.rig.captures, 1); assert.equal(replacement.rig.captures, 0);
});

test('rig-error and a new rig-ready clear the old preview and invalidate delayed decoding', async t => {
  const f = fixture(t), firstCapture = f.capture(); f.decode(0); await firstCapture;
  assert(!f.preview.hidden); assert(f.preview.src); assert.equal(f.document.probes.length, 1);
  const lateCapture = f.capture(); f.replace(null); f.host.emit('rig-error');
  assert(f.preview.hidden); assert.equal(f.preview.src, '');
  f.replace(f.character('recovered')); f.host.emit('rig-ready');
  const readyMessage = f.output.textContent;
  assert.match(readyMessage, /已就绪/);
  f.decode(1); await lateCapture;
  assert.equal(f.output.textContent, readyMessage); assert(f.preview.hidden); assert(!f.read.disabled);
  assert.equal(f.document.probes.length, 1, 'The old pending sample must not create another pixel probe');
});

test('contextLost and frame state describe capture time rather than decode completion', async t => {
  const f = fixture(t), pending = f.capture();
  f.first.gl.lost = true; f.first.state.frames = 99; f.first.state.pose.head = 7;
  f.decode(0); await pending;
  const result = JSON.parse(f.output.textContent);
  assert.equal(result.contextLost, false); assert.equal(result.frames, 12); assert.equal(result.pose.head, 2);
  assert.equal(result.width, 2); assert.equal(result.height, 1); assert.equal(result.alphaPixels, 1);
  assert.equal(f.first.canvas.contextReads, 1); assert.equal(f.first.rig.captures, 1);
  assert.equal(f.preview.src, 'data:image/png;base64,first'); assert(!f.preview.hidden);
});

test('abort removes the panel and listeners and prevents a late decode from writing', async t => {
  const f = fixture(t), pending = f.capture(), previousOutput = f.output.textContent;
  f.lifetime.abort();
  assert.equal(f.host.children.length, 0);
  assert.equal(f.document.elements.reduce((count, element) => count + element.listenerCount(), 0), 0);
  f.decode(0); await pending;
  assert.equal(f.output.textContent, previousOutput); assert(f.preview.hidden);
  assert.equal(f.document.probes.length, 0);
  f.host.emit('rig-ready'); f.loss.emit('click');
  assert.equal(f.first.gl.lossRequests, 0); assert.equal(f.output.textContent, previousOutput);
});

test('context-loss simulation cannot create WebGL while the character is loading', t => {
  const f = fixture(t); f.first.rig = null; f.loss.emit('click');
  assert.equal(f.first.canvas.contextReads, 0); assert.equal(f.first.gl.lossRequests, 0);
  assert.match(f.output.textContent, /加载完成/); assert.equal(f.document.probes.length, 0);
});
