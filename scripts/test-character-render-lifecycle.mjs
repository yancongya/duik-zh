import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';
import {solveTwoBone} from '../skills/character-rig-lab/assets/webui/rig-vendor/rev2d-ik.js';

// Agreed seam: actual layout/render/tick/setActive/capture, with a synthetic
// triangle and a command-recording Canvas/WebGL boundary. No character images,
// manifest, browser, GPU or public mirror is used. Canvas dimension writes
// invalidate the model's frame, even for the same value; that boundary contract
// is explicit and is NOT evidence of actual browser pixels or compositing.
const source = await readFile(new URL('../skills/character-rig-lab/assets/webui/character-rig-core.js', import.meta.url), 'utf8');
const ast = ts.createSourceFile('character-rig-core.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const mount = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'mountCharacterRig');
assert(mount?.body, 'The shared mount entry must exist');
const initialization = mount.body.statements.find(ts.isTryStatement);
assert(initialization, 'The async initialization boundary must exist');
const apiDeclaration = initialization.tryBlock.statements.find(node => ts.isVariableStatement(node)
  && node.declarationList.declarations.some(item => item.name.getText(ast) === 'api'));
assert(apiDeclaration, 'The actual public API must exist');

// Original function kept unchanged: future fixes must not turn the negative
// control into a test of the replacement. It is never written to the runtime.
const originalLayout = String.raw`function layout(){const stage=$('stage'),w=Math.max(1,stage.clientWidth),h=Math.max(1,stage.clientHeight),dpr=Math.min(devicePixelRatio,2),c=$('rigCanvas');c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);gl.viewport(0,0,c.width,c.height);const base=rig.camera,aspect=w/h;let cw=base[2],ch=base[3];if(aspect>cw/ch)cw=ch*aspect;else ch=cw/aspect;camera=[base[0]+(base[2]-cw)/2,base[1]+(base[3]-ch)/2,cw,ch];$('controls').setAttribute('viewBox',camera.join(' '));const img=$('sourceImage');img.style.left=(-camera[0]/cw*w)+'px';img.style.top=(-camera[1]/ch*h)+'px';img.style.width=(rig.canvas[0]/cw*w)+'px';img.style.height=(rig.canvas[1]/ch*h)+'px';requestRender();}`;

class Surface {
  style = {};
  clientWidth = 640;
  clientHeight = 480;
  attributes = new Map();
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  getRootNode() { return {activeElement: null}; }
  replaceChildren() {}
}

class CanvasModel extends Surface {
  dimensions = {width: 300, height: 150};
  sizeWrites = [];
  draws = [];
  get width() { return this.dimensions.width; }
  set width(value) { this.resize('width', value); }
  get height() { return this.dimensions.height; }
  set height(value) { this.resize('height', value); }
  resize(axis, value) {
    this.sizeWrites.push({axis, previous: this.dimensions[axis], value});
    this.dimensions[axis] = value;
    this.draws = [];
  }
  toDataURL(format) {
    assert.equal(format, 'image/png');
    // A trace, deliberately not a PNG or screenshot substitute.
    return JSON.stringify({model: 'draw-command-record', ...this.dimensions, draws: this.draws});
  }
}

function recordingGL(canvas) {
  const buffers = new Map(), attributes = new Map(), uniforms = new Map();
  let arrayBuffer, texture;
  return {
    ARRAY_BUFFER: 'array', ELEMENT_ARRAY_BUFFER: 'index', TEXTURE_2D: 'texture',
    DYNAMIC_DRAW: 'dynamic', FLOAT: 'float', TRIANGLES: 'triangles', UNSIGNED_SHORT: 'short', COLOR_BUFFER_BIT: 'color',
    viewport() {}, clearColor() {},
    clear() { canvas.draws = []; },
    bindBuffer(target, buffer) { if (target === 'array') arrayBuffer = buffer; },
    bufferData(target, data) { assert.equal(target, 'array'); buffers.set(arrayBuffer, Array.from(data)); },
    vertexAttribPointer(location) { attributes.set(location, arrayBuffer); },
    bindTexture(target, value) { assert.equal(target, 'texture'); texture = value; },
    uniform4f(location, ...values) { uniforms.set(location, values); },
    uniform4fv(location, values) { uniforms.set(location, Array.from(values)); },
    drawElements() {
      canvas.draws.push({texture, positions: [...buffers.get(attributes.get(0))], camera: [...uniforms.get('camera')]});
    },
    getError() { return 0; },
  };
}

function fixture({original = false} = {}) {
  const canvas = new CanvasModel();
  const elements = Object.fromEntries(['stage', 'controls', 'sourceImage', 'stageLabels'].map(name => [name, new Surface()]));
  elements.rigCanvas = canvas;
  const frames = new Map();
  let sequence = 0;
  const globals = ast.statements.filter(node => !ts.isImportDeclaration(node) && node !== mount).map(node => node.getText(ast)).join('\n');
  const declarations = [...mount.body.statements].slice(0, mount.body.statements.indexOf(initialization)).map(node => {
    if (original && ts.isFunctionDeclaration(node) && node.name?.text === 'layout') return originalLayout;
    return node.getText(ast);
  }).join('\n');
  const execute = new Function('environment', `
    const {elements,solveTwoBone,recordingGL,requestAnimationFrame,cancelAnimationFrame}=environment;
    const controls=false,initialInteraction='drag',signal=undefined,onChange=()=>{},devicePixelRatio=1.25;
    const CONTROLLER_STYLE={id:'synthetic-frame-fixture'},matchMedia=()=>({matches:false});
    ${globals}
    ${declarations}
    // Hand-authored, single root-weighted triangle: no production character data.
    const part={id:'triangle',bbox:[0,0,50,50],indices:[0,1,2],texture:'opaque-fixture',index:'indices'};
    rig={parts:[part],vertices:[[0,0,1],[50,0,1],[0,50,1]],hairFields:[],
      camera:[0,0,200,200],canvas:[200,200],sourceSha256:'render-lifecycle-fixture',
      joints:{body:[0,0],neck:[0,0],head:[0,0],l:{shoulder:[0,0],elbow:[10,0],wrist:[20,0]},r:{shoulder:[0,0],elbow:[10,0],wrist:[20,0]}},
      motionLimits:{rootX:100,rootY:100,headDegrees:8,bodyDegrees:4,hairDegrees:3,wristDegrees:18,handTargetRadius:100}};
    resources=[part];state.visible=new Set(['triangle']);
    gl=recordingGL($('rigCanvas'));positionBuffer='positions';loc={a_position:0,u_camera:'camera',u_bbox:'bbox'};
    ${apiDeclaration.getText(ast)}
    layout();render();
    return {api,layout};
  `);
  const runtime = execute({
    elements, solveTwoBone, recordingGL,
    requestAnimationFrame: callback => { const id = ++sequence; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  function flush() {
    const scheduled = [...frames]; frames.clear();
    for (const [, callback] of scheduled) callback(1000);
  }
  flush();
  runtime.api.setPose({rootX: 12, rootY: -8});
  return {
    ...runtime, canvas, flush,
    capture: () => JSON.parse(runtime.api.capture()),
    pending: () => frames.size,
    resize(width = elements.stage.clientWidth, height = elements.stage.clientHeight) {
      elements.stage.clientWidth = width; elements.stage.clientHeight = height;
      runtime.layout();
    },
  };
}

const translatedTriangle = [12, -8, 62, -8, 12, 42];

test('same-size layout must not discard the already presented frame', () => {
  const h = fixture(), before = h.capture(), writes = h.canvas.sizeWrites.length;
  assert.deepEqual(before.draws[0].positions, translatedTriangle);
  h.resize();
  assert.deepEqual(h.capture(), before, 'Unchanged dimensions should not produce an empty capture before RAF');
  assert.equal(h.canvas.sizeWrites.length, writes, 'Avoid both redundant dimension assignments');
});

test('inactive resize must retain a frame of the last visible pose without a background RAF loop', () => {
  const h = fixture(), pose = h.api.getState().pose;
  h.api.setActive(false);
  h.resize(800, 500);
  assert.deepEqual(h.api.getState().pose, pose, 'Stored diagnostics must retain the pose');
  assert.equal(h.pending(), 0, 'Inactivity must not start background RAF');
  assert.deepEqual(h.capture().draws[0]?.positions, translatedTriangle,
    'Pose metadata alone does not mean a presented frame was preserved');
});

test('deactivation between layout notification and RAF must not strand an empty capture', () => {
  const h = fixture(), before = h.capture();
  h.resize(800, 500);
  assert.equal(h.pending(), 1);
  h.api.setActive(false); h.flush();
  assert.equal(h.pending(), 0);
  assert.deepEqual(h.capture(), before, 'Cancelling the queued frame must leave the previous frame intact');
});

test('an explicit inactive setPose still renders once with the pending dimensions', () => {
  const h = fixture();
  h.api.setActive(false); h.resize(800, 500);
  h.api.setPose({rootX: 25});
  assert.equal(h.api.getState().active, false);
  assert.deepEqual(h.capture().draws[0]?.positions, [25, -8, 75, -8, 25, 42]);
  assert.equal(h.capture().width, 1000);
  assert.equal(h.capture().height, 625);
  assert.equal(h.pending(), 0, 'Explicit drawing must not enable continuous rendering');
});

test('reactivation reliably redraws resized geometry from the retained user pose', () => {
  const h = fixture(), pose = h.api.getState().pose;
  h.api.setActive(false); h.resize(800, 500);
  h.api.setActive(true); h.api.setActive(true);
  assert.equal(h.pending(), 1, 'Resume calls share one queued frame');
  h.flush();
  assert.deepEqual(h.api.getState().pose, pose);
  assert.deepEqual(h.capture().draws[0]?.positions, translatedTriangle);
  assert.equal(h.capture().width, 1000);
  assert.equal(h.capture().height, 625);
  assert.deepEqual(h.capture().draws[0].camera, [-60, 0, 320, 200]);
  assert.equal(h.pending(), 0, 'A stationary resumed pose does not loop');
});

test('active layout bursts coalesce and redraw the final measured dimensions', () => {
  const h = fixture();
  h.resize(700, 500); h.resize(900, 500); h.resize(800, 500);
  assert.equal(h.pending(), 1);
  h.flush();
  assert.deepEqual(h.capture().draws[0]?.positions, translatedTriangle);
  assert.equal(h.capture().width, 1000);
  assert.equal(h.capture().height, 625);
  assert.equal(h.pending(), 0);
});

test('negative control: original same-size layout writes both dimensions and invalidates the frame', () => {
  const h = fixture({original: true}), writes = h.canvas.sizeWrites.length;
  h.resize();
  assert.deepEqual(h.canvas.sizeWrites.slice(writes), [
    {axis: 'width', previous: 800, value: 800},
    {axis: 'height', previous: 600, value: 600},
  ]);
  assert.deepEqual(h.capture().draws, []);
  assert.equal(h.pending(), 1);
  h.flush();
  assert.deepEqual(h.capture().draws[0].positions, translatedTriangle);
});

test('negative control: original inactive resize keeps pose metadata but capture remains empty until resume', () => {
  const h = fixture({original: true}), pose = h.api.getState().pose;
  h.api.setActive(false); h.resize(800, 500); h.flush();
  assert.deepEqual(h.api.getState().pose, pose);
  assert.deepEqual(h.capture().draws, []);
  assert.equal(h.pending(), 0);
  h.api.setActive(true); h.flush();
  assert.deepEqual(h.capture().draws[0].positions, translatedTriangle);
});
