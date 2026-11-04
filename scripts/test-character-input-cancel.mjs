import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import ts from 'typescript';

// Agreed seam: actual shared pointer bindings -> actual public rig API -> pose
// and pointer-capture ownership. DOM, RAF and drawing are boundary adapters.
// No character manifest, PNG, WebGL, public mirror or browser is read/executed.
const source = await readFile(new URL('../skills/character-rig-lab/assets/webui/character-rig-core.js', import.meta.url), 'utf8');
const ast = ts.createSourceFile('character-rig-core.js', source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const mount = ast.statements.find(node => ts.isFunctionDeclaration(node) && node.name?.text === 'mountCharacterRig');
assert(mount?.body, 'The real shared mount entry must exist');
const initialization = mount.body.statements.find(ts.isTryStatement);
assert(initialization, 'The real asynchronous initialization boundary must exist');
const apiDeclaration = initialization.tryBlock.statements.find(node => ts.isVariableStatement(node)
  && node.declarationList.declarations.some(item => item.name.getText(ast) === 'api'));
assert(apiDeclaration, 'The real public API must exist');
const apiObject = apiDeclaration.declarationList.declarations[0].initializer;
assert(ts.isObjectLiteralExpression(apiObject));

// Pre-fix binding kept verbatim as an executable negative control. Public API
// boundary snapshots below also precede the fix; the live test never uses them.
const originalBindInput = String.raw`function bindInput(){
 on($('controls'),'pointerdown',e=>{const h=e.target.closest('[data-control]');if(!h||state.mode!=='assembled'||!canDrag())return;stop();state.pose=structuredClone(renderedPose);clearHover();const p=localPointer(e);drag={name:h.dataset.control,start:p,pose:structuredClone(state.pose),id:e.pointerId};$('controls').setPointerCapture(e.pointerId);e.preventDefault();});
on($('controls'),'pointermove',e=>{if(!drag)return;const p=localPointer(e),dx=p[0]-drag.start[0],dy=p[1]-drag.start[1],base=drag.pose;if(['root','globalMove'].includes(drag.name)){state.pose.rootX=clamp(base.rootX+dx,-rig.motionLimits.rootX,rig.motionLimits.rootX);state.pose.rootY=clamp(base.rootY+dy,-rig.motionLimits.rootY,rig.motionLimits.rootY);}else if(['head','direction'].includes(drag.name))state.pose.head=clamp(base.head+dx/7,-rig.motionLimits.headDegrees,rig.motionLimits.headDegrees);else if(['body','bodyGlobal'].includes(drag.name))state.pose.body=clamp(base.body-dx/16,-rig.motionLimits.bodyDegrees,rig.motionLimits.bodyDegrees);else if(drag.name==='gaze'){state.pose.gaze=clamp(base.gaze+dx/45,-1,1);state.pose.blink=clamp(base.blink+dy/60,0,1);}else if(drag.name==='smile')state.pose.smile=clamp(base.smile+dx/45,0,1);else if(drag.name.startsWith('hair'))state.pose[drag.name]=clamp(base[drag.name]+dx/14,-rig.motionLimits.hairDegrees,rig.motionLimits.hairDegrees);else {const target=[base[drag.name][0]+dx,base[drag.name][1]+dy],len=Math.hypot(...target);state.pose[drag.name]=target.map(v=>v*(len>rig.motionLimits.handTargetRadius?rig.motionLimits.handTargetRadius/len:1));}requestRender();});
for(const type of ['pointerup','pointercancel','lostpointercapture'])on($('controls'),type,()=>{drag=null;});
on($('controls'),'keydown',e=>{const h=e.target.closest('[data-control]');if(!h||!canDrag()||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();stop();const dx=e.key==='ArrowLeft'?-5:e.key==='ArrowRight'?5:0,dy=e.key==='ArrowUp'?-5:e.key==='ArrowDown'?5:0,n=h.dataset.control;if(['root','globalMove'].includes(n)){state.pose.rootX+=dx;state.pose.rootY+=dy;}else if(['head','direction'].includes(n))state.pose.head+=dx/10;else if(['body','bodyGlobal'].includes(n))state.pose.body+=dx/10;else if(n==='gaze'){state.pose.gaze+=dx/40;state.pose.blink+=dy/50;}else if(n==='smile')state.pose.smile+=dx/50;else if(n.startsWith('hair'))state.pose[n]+=dx/15;else state.pose[n]=[state.pose[n][0]+dx,state.pose[n][1]+dy];state.pose=sanitizePose(state.pose);requestRender();});
 on($('stage'),'pointermove',e=>{if(!canHover()||drag||state.mode!=='assembled')return;const r=$('stage').getBoundingClientRect();hover.tx=clamp((e.clientX-r.left)/Math.max(1,r.width)*2-1,-1,1);hover.ty=clamp((e.clientY-r.top)/Math.max(1,r.height)*2-1,-1,1);requestRender();});
 on($('stage'),'pointerleave',()=>{hover.tx=hover.ty=0;requestRender();});
 on(reduced,'change',()=>{stop();clearHover();requestRender();});
 }`;
const originalMethods = {
  configure: `configure(options){assertAlive();if(options.interaction!==undefined){if(!['none','drag','hover','both'].includes(options.interaction))throw Error('Unknown interaction mode');interaction=options.interaction;clearHover();}for(const k of ['showControls','showLabels','showMesh','overlay'])if(k in options)state[k]=Boolean(options[k]);render();}`,
  setMode: `setMode(mode){assertAlive();if(!['assembled','exploded','source'].includes(mode))throw Error('Invalid mode');stop();clearHover();state.mode=mode;render();}`,
  reset: `reset(full=true){assertAlive();stop();clearHover();state.pose=initial();blinkStart=null;if(full){state.visible=new Set(rig.parts.map(p=>p.id));state.mode='assembled';state.overlay=false;}render();return diagnostics();}`,
};

class Surface {
  listeners = new Map();
  captured = new Set();
  released = [];
  addEventListener(type, callback, {signal} = {}) {
    if (signal?.aborted) return;
    const listeners = this.listeners.get(type) || new Set();
    listeners.add(callback);
    this.listeners.set(type, listeners);
    signal?.addEventListener('abort', () => listeners.delete(callback), {once: true});
  }
  removeEventListener(type, callback) { this.listeners.get(type)?.delete(callback); }
  emit(type, event) {
    if (type === 'lostpointercapture') this.captured.delete(event.pointerId);
    for (const callback of [...this.listeners.get(type) || []]) callback({type, ...event});
  }
  getBoundingClientRect() { return {left: 0, top: 0, width: 1000, height: 1000}; }
  setPointerCapture(id) { this.captured.add(id); }
  hasPointerCapture(id) { return this.captured.has(id); }
  releasePointerCapture(id) {
    assert(this.captured.delete(id), 'Only the owning pointer capture may be released');
    this.released.push(id);
    // Synchronous loss is deliberately stricter than a browser queued event:
    // state must be cleared before releasing capture to remain reentrant-safe.
    this.emit('lostpointercapture', {pointerId: id});
  }
  replaceChildren() {}
}

function fixture({original = false} = {}) {
  const controlsSurface = new Surface();
  const elements = Object.fromEntries(['stage', 'rigCanvas', 'sourceImage', 'stageLabels'].map(name => [name, new Surface()]));
  elements.controls = controlsSurface;
  const reduced = new Surface();
  reduced.matches = false;
  const frames = new Map();
  let sequence = 0;
  const globals = ast.statements.filter(node => !ts.isImportDeclaration(node) && node !== mount).map(node => node.getText(ast)).join('\n');
  const declarations = [...mount.body.statements].slice(0, mount.body.statements.indexOf(initialization)).map(node => {
    if (ts.isFunctionDeclaration(node) && node.name?.text === 'render') {
      return 'function render(p=state.pose){if(destroyed)return;renderedPose=structuredClone(p);frame++;dirty=false;onChange(diagnostics());}';
    }
    if (original && ts.isFunctionDeclaration(node) && node.name?.text === 'bindInput') return originalBindInput;
    return node.getText(ast);
  }).join('\n');
  const properties = apiObject.properties.map(node => original && originalMethods[node.name?.getText(ast)]
    || node.getText(ast)).join(',\n');
  const execute = new Function('environment', `
    const {elements,matchMedia,requestAnimationFrame,cancelAnimationFrame}=environment;
    const controls=true,initialInteraction='drag',signal=undefined,onChange=()=>{},CONTROLLER_STYLE={id:'input-lifecycle-fixture'};
    ${globals}
    ${declarations}
    // Synthetic domain fixture, unrelated to the approved character assets.
    rig={parts:[{id:'test-part'}],vertices:[],sourceSha256:'input-lifecycle-fixture',motionLimits:{
      rootX:100,rootY:100,headDegrees:8,bodyDegrees:4,hairDegrees:3,wristDegrees:18,handTargetRadius:100}};
    gl={getError:()=>0};positions=new Float32Array();camera=[0,0,1000,1000];
    bindInput();
    const api={${properties}};
    return api;
  `);
  const api = execute({
    elements,
    matchMedia: () => reduced,
    requestAnimationFrame: callback => { const id = ++sequence; frames.set(id, callback); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  function flush() {
    const scheduled = [...frames];
    frames.clear();
    for (const [, callback] of scheduled) callback(0);
  }
  function send(type, {id = 1, x = 0, y = 0, control = 'handL', ...extra} = {}) {
    const target = {dataset: {control}, closest: () => target};
    controlsSurface.emit(type, {pointerId: id, clientX: x, clientY: y, button: 0, target, preventDefault() {}, ...extra});
    flush();
  }
  return {api, controls: controlsSurface, send, flush};
}

function beginDrag(h) {
  h.send('pointerdown');
  h.send('pointermove', {x: 10});
  assert.deepEqual(h.api.getState().pose.handL, [10, 0]);
  assert(h.controls.hasPointerCapture(1));
}

test('configure disabling dragging releases capture and ignores a stale move', () => {
  const h = fixture();
  beginDrag(h);
  h.api.configure({interaction: 'none'});
  const disabledPose = h.api.getState().pose;
  h.send('pointermove', {x: 20});
  assert.deepEqual(h.api.getState().pose, disabledPose);
  assert(!h.controls.hasPointerCapture(1));
  assert.deepEqual(h.controls.released, [1]);
});

for (const mode of ['exploded', 'source']) {
  test(`setMode(${mode}) cancels the gesture without changing the saved pose`, () => {
    const h = fixture();
    beginDrag(h);
    const saved = h.api.getState().pose;
    h.api.setMode(mode);
    h.send('pointermove', {x: 30});
    assert.deepEqual(h.api.getState().pose, saved);
    assert.equal(h.api.getState().mode, mode);
    assert(!h.controls.hasPointerCapture(1));
  });
}

for (const full of [true, false]) {
  test(`reset(${full}) retains the complete neutral pose after a stale captured move`, () => {
    const h = fixture();
    const neutral = h.api.getState().pose;
    h.api.setPose({head: 6, rootX: 15, handR: [-6, 8]});
    beginDrag(h);
    h.api.reset(full);
    h.send('pointermove', {x: 30});
    assert.deepEqual(h.api.getState().pose, neutral);
    assert(!h.controls.hasPointerCapture(1));
  });
}

for (const options of [{interaction: 'hover'}, {showControls: false}]) {
  test(`configure ${JSON.stringify(options)} ends capture and permits a fresh later drag`, () => {
    const h = fixture();
    beginDrag(h);
    h.api.configure(options);
    h.send('pointermove', {x: 30});
    assert.deepEqual(h.api.getState().pose.handL, [10, 0]);
    assert(!h.controls.hasPointerCapture(1));
    h.api.configure({interaction: 'drag', showControls: true});
    h.send('pointerdown', {id: 2, x: 50});
    h.send('pointermove', {id: 2, x: 55});
    assert.deepEqual(h.api.getState().pose.handL, [15, 0]);
  });
}

test('labels, mesh, selection and still-draggable interaction changes retain the active gesture', () => {
  const h = fixture();
  beginDrag(h);
  h.api.configure({showLabels: true, showMesh: true, overlay: true, interaction: 'both'});
  h.api.selectPart('test-part');
  h.send('pointermove', {x: 30});
  assert.deepEqual(h.api.getState().pose.handL, [30, 0]);
  assert(h.controls.hasPointerCapture(1));
  assert.deepEqual(h.controls.released, []);
});

for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  test(`${type} cleans up the owning pointer and a fresh drag starts from the saved pose`, () => {
    const h = fixture();
    beginDrag(h);
    h.send(type);
    h.send('pointermove', {x: 30});
    assert.deepEqual(h.api.getState().pose.handL, [10, 0]);
    assert(!h.controls.hasPointerCapture(1));
    h.send('pointerdown', {id: 2, x: 50});
    h.send('pointermove', {id: 2, x: 55});
    assert.deepEqual(h.api.getState().pose.handL, [15, 0]);
  });
}

test('a stale pointer cannot move or cancel a newly acquired gesture', () => {
  const h = fixture();
  beginDrag(h);
  h.api.reset();
  h.send('pointerdown', {id: 2, x: 50});
  h.send('pointermove', {id: 1, x: 30});
  h.send('pointercancel', {id: 1});
  h.send('lostpointercapture', {id: 1});
  assert.deepEqual(h.api.getState().pose.handL, [0, 0]);
  assert(h.controls.hasPointerCapture(2));
  h.send('pointermove', {id: 2, x: 55});
  assert.deepEqual(h.api.getState().pose.handL, [5, 0]);
});

test('a second pointerdown cannot steal an active gesture', () => {
  const h = fixture();
  beginDrag(h);
  h.send('pointerdown', {id: 2, control: 'handR', x: 50});
  h.send('pointermove', {x: 20});
  assert.deepEqual(h.api.getState().pose.handL, [20, 0]);
  assert.deepEqual(h.api.getState().pose.handR, [0, 0]);
  assert(!h.controls.hasPointerCapture(2));
});

for (const [name, boundary] of [
  ['setPose', api => api.setPose({handL: [-4, 8], head: 5})],
  ['importPose', api => api.importPose({sourceSha256: 'input-lifecycle-fixture', pose: {handL: [-4, 8], head: 5}})],
]) {
  test(`${name} retains its explicit pose after stale pointer movement`, () => {
    const h = fixture();
    beginDrag(h);
    boundary(h.api);
    const pose = h.api.getState().pose;
    h.send('pointermove', {x: 30});
    assert.deepEqual(h.api.getState().pose, pose);
    assert(!h.controls.hasPointerCapture(1));
  });
}

test('deactivation releases capture and stale input stays cancelled after reactivation', () => {
  const h = fixture();
  beginDrag(h);
  h.api.setActive(false);
  h.send('pointermove', {x: 30});
  h.api.setActive(true);
  h.flush();
  assert.deepEqual(h.api.getState().pose.handL, [10, 0]);
  assert(!h.controls.hasPointerCapture(1));
});

for (const name of ['play', 'destroy']) {
  test(`${name} releases an active capture`, () => {
    const h = fixture();
    beginDrag(h);
    h.api[name]();
    assert(!h.controls.hasPointerCapture(1));
    assert.deepEqual(h.controls.released, [1]);
  });
}

test('capture already removed by the browser cannot prevent reset or retain the gesture', () => {
  const h = fixture();
  beginDrag(h);
  h.controls.releasePointerCapture = () => { throw new DOMException('Pointer no longer active', 'NotFoundError'); };
  assert.doesNotThrow(() => h.api.reset());
  h.send('pointermove', {x: 30});
  assert.deepEqual(h.api.getState().pose.handL, [0, 0]);
});

for (const [label, boundary] of [
  ['configure', api => api.configure({interaction: 'none'})],
  ['setMode', api => api.setMode('exploded')],
  ['reset', api => api.reset()],
]) {
  test(`negative control: original ${label} allows captured movement to overwrite boundary pose`, () => {
    const h = fixture({original: true});
    beginDrag(h);
    boundary(h.api);
    const boundaryPose = h.api.getState().pose;
    h.send('pointermove', {x: 20});
    assert.notDeepEqual(h.api.getState().pose, boundaryPose);
    assert.deepEqual(h.api.getState().pose.handL, [20, 0]);
  });
}
