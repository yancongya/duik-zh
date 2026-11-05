// Real captured parent + production publishing transforms. These assertions
// prove source/SSR composition and repeatability, not browser motion quality.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import {parse} from 'parse5';
import ts from 'typescript';
import {capabilityClasses, patchCapabilityLayoutRuntime, patchCapabilityLayoutSSR} from './lib/landing-capability-layout.mjs';
import {patchCapabilityLinksRuntime, patchCapabilityLinksSSR} from './lib/landing-capability-links.mjs';
import {patchCapabilityResizeRuntime, patchCapabilityResizeSSR} from './lib/landing-capability-resize.mjs';
import {patchCapabilitySelectionRuntime} from './lib/landing-capability-selection.mjs';
import {patchCapabilityKeyboardRuntime} from './lib/landing-capability-keyboard.mjs';
import {isCinematicComposition, patchCinematicCompositionRuntime, patchCinematicCompositionSSR} from './lib/landing-cinematic-composition.mjs';
import {renderExperience} from '../components/home/landing/experience-layout.mjs';

const hash = 'd2ea4a745e1ba64aecc76bbf680458929795d2d8';
const parentName = 'HomeCapabilitiesKP.' + hash + '.js';
const baselineRuntimeURL = new URL('../components/home/landing/baseline/_nuxt/' + parentName, import.meta.url);
const baselineHTMLURL = new URL('../components/home/landing/baseline/landing.html', import.meta.url);
const baselineRuntime = await readFile(baselineRuntimeURL, 'utf8');
const baselineHTML = await readFile(baselineHTMLURL, 'utf8');
const runtimePatches = [
  patchCapabilityLayoutRuntime, patchCapabilityLinksRuntime,
  patchCapabilityResizeRuntime, patchCapabilitySelectionRuntime,
  patchCapabilityKeyboardRuntime, patchCinematicCompositionRuntime,
];
const runtimeChain = source => runtimePatches.reduce((code, patch) => patch(code), source);
const beforeCinema = runtimePatches.slice(0, -1).reduce((code, patch) => patch(code), baselineRuntime);
const cinematicRuntime = patchCinematicCompositionRuntime(beforeCinema);
const marker = '// duik-cinematic-composition-v2\n';
const cardAttribute = 'data-duik-cinematic-card';
const oldList = '(de.blok?.listItems||[]).map(s=>';
const retiredList = '(de.blok?.listItems||[]).slice(0,1).map(s=>';

function astOf(source, name = parentName) {
  const ast = ts.createSourceFile(name, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  assert.deepEqual(ast.parseDiagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')), [], name + ' must parse');
  return ast;
}
function astNodes(ast, predicate) {
  const found = [];
  const visit = node => { if (predicate(node)) found.push(node); ts.forEachChild(node, visit); };
  visit(ast);
  return found;
}
function computedItems(source, blok) {
  const ast = astOf(source);
  const declarations = astNodes(ast, node => ts.isVariableDeclaration(node)
    && node.name.getText(ast) === 'U' && node.initializer?.getText(ast).includes('de.blok?.listItems'));
  assert.equal(declarations.length, 1, 'execute the actual captured computed list');
  return JSON.parse(JSON.stringify(runInNewContext(declarations[0].initializer.getText(ast), {
    at: read => read(), de: {blok},
  })));
}
const attributes = node => Object.fromEntries((node.attrs || []).map(({name, value}) => [name, value]));
const hasClass = (node, name) => (attributes(node).class || '').split(/\s+/).includes(name);
function all(node, predicate) {
  return [...(predicate(node) ? [node] : []), ...(node.childNodes || []).flatMap(child => all(child, predicate))];
}
const dom = html => parse(html, {sourceCodeLocationInfo: true});
const cardsIn = html => all(dom(html), node => hasClass(node, 'duik-capability-card'));
const elements = node => (node.childNodes || []).filter(child => child.tagName);
const sourceOf = (html, node) => html.slice(node.sourceCodeLocation.startOffset, node.sourceCodeLocation.endOffset);
function editSource(source, edits) {
  for (const {start, end, value} of edits.sort((left, right) => right.start - left.start)) source = source.slice(0, start) + value + source.slice(end);
  return source;
}
function stripCards(html) {
  return editSource(html, cardsIn(html).map(({sourceCodeLocation: loc}) => ({start: loc.startOffset, end: loc.endOffset, value: ''})));
}
function replaceNode(html, node, value) {
  const loc = node.sourceCodeLocation;
  return editSource(html, [{start: loc.startOffset, end: loc.endOffset, value}]);
}
function appendInside(html, node, value) {
  const end = node.sourceCodeLocation.endTag.startOffset;
  return editSource(html, [{start: end, end, value}]);
}
const motionSlots = node => all(node, item => Object.hasOwn(attributes(item), 'data-duik-motion'));
const ssrBeforeCinema = source => patchCapabilityResizeSSR(patchCapabilityLinksSSR(patchCapabilityLayoutSSR(source)));

// Only substitute the original diagram's contents. All card, scroll-parent,
// orbit and unrelated page geometry comes directly from the captured baseline.
function realSSRFixture() {
  let html = ssrBeforeCinema(baselineHTML);
  const cards = cardsIn(html);
  assert.equal(cards.length, 3);
  const edits = cards.map((card, index) => {
    const art = elements(card)[1];
    const slots = all(art, node => attributes(node).class === 'w-auto');
    assert.equal(slots.length, 1, 'expected the original diagram slot');
    const loc = slots[0].sourceCodeLocation;
    return {start: loc.startTag.endOffset, end: loc.endTag.startOffset, value: renderExperience(['animation', 'automation', 'camera'][index])};
  });
  return editSource(html, edits);
}
const originalSSR = realSSRFixture();
const cinematicSSR = patchCinematicCompositionSSR(originalSSR);

test('every real runtime transform parses in production order, including three full-stage scenes', () => {
  let code = baselineRuntime;
  astOf(code);
  for (const patch of runtimePatches) { code = patch(code); astOf(code, patch.name); }
  assert.equal(code, cinematicRuntime);
});

test('the entire runtime chain is byte-idempotent, preserving resize and keyboard owner headers', () => {
  assert(cinematicRuntime.startsWith('// duik-capability-resize-v3\n'));
  for (let cycle = 0, code = cinematicRuntime; cycle < 3; cycle++) {
    code = runtimeChain(code);
    assert.equal(code, cinematicRuntime, 'repeat publication ' + cycle);
  }
  assert.equal(cinematicRuntime.split(marker).length - 1, 1);
});

test('the real computed list retains all three artworks without mutating the original payload', () => {
  const listItems = Object.freeze(['animation', 'automation', 'camera'].map((title, index) => Object.freeze({
    label: 'label-' + index, title, subTitle: 'detail-' + index,
    ctaOutlineText: 'legacy', ctaOutlineLink: '/legacy', ctaPrimaryText: 'legacy-2', ctaPrimaryLink: '/legacy-2',
  })));
  const input = {listItems};
  assert.equal(computedItems(baselineRuntime, input).length, 3);
  assert.equal(computedItems(beforeCinema, input).length, 3);
  const current = computedItems(cinematicRuntime, input);
  assert.deepEqual(current, ['animation','automation','camera'].map((title,index)=>({tagline:'label-'+index,title,subTitle:'detail-'+index,ctaOutlineText:'',ctaOutlineLink:null,ctaPrimaryText:'',ctaPrimaryLink:null})));
  assert.equal(listItems.length, 3);
  for (const blok of [undefined, {}, {listItems: []}]) assert.deepEqual(computedItems(cinematicRuntime, blok), []);
});

test('the retired v1 runtime upgrades once to all three slots without changing its parent owner',()=>{
  const retired=cinematicRuntime.replace(marker,'// duik-cinematic-composition-v1\n').replace(oldList,retiredList);
  assert.equal(patchCinematicCompositionRuntime(retired),cinematicRuntime);
  assert.equal(patchCinematicCompositionRuntime(patchCinematicCompositionRuntime(retired)),cinematicRuntime);
});

test('only the curve projection changes; measured scroll timeline and both orbit render branches stay intact', () => {
  const capture = code => {
    const ast = astOf(code);
    const measurements = astNodes(ast, node => ts.isVariableDeclaration(node) && node.name.getText(ast) === 'u'
      && node.initializer?.getText(ast).includes('M.context')).map(node => node.initializer.getText(ast).replace('const duikCurveWidth=J+se;','').replaceAll('duikCurveWidth','J'));
    const orbits = astNodes(ast, node => ts.isCallExpression(node) && node.expression.getText(ast) === 'A'
      && node.arguments[0]?.getText(ast) === 're').map(node => node.getText(ast));
    assert.equal(measurements.length, 1); assert.equal(orbits.length, 2);
    return {measurements, orbits};
  };
  assert.deepEqual(capture(cinematicRuntime), capture(beforeCinema));
  assert(!cinematicRuntime.includes('r("div",ct,['), 'desktop legacy copy removed');
  assert(!cinematicRuntime.includes('capabilities-cards-pagination flex'), 'scroll owns the scene sequence without a playback bar');
});

test('curve projection includes the original measured approach gap at every size',()=>{
  const ast=astOf(cinematicRuntime);
  const declarations=astNodes(ast,node=>ts.isVariableDeclaration(node)&&node.name.getText(ast)==='we');
  assert.equal(declarations.length,1);
  const expression=declarations[0].initializer.getText(ast);
  for(const [J,se,ne] of [[2211,1055,1314],[1670,840,1050],[3100,1600,1500]]){
    const svg={style:{},attrs:{},setAttribute(k,v){this.attrs[k]=v;}},path={attrs:{},setAttribute(k,v){this.attrs[k]=v;}};
    runInNewContext('('+expression+')()',{J,se,ne,he:810,G:80,k:{value:svg},g:{value:path},ke:(width,height)=>`${width}:${height}`});
    assert.equal(svg.style.width,`${J+se}px`);assert.equal(svg.attrs.viewBox,`0 0 ${J+se} ${ne}`);assert.equal(path.attrs.d,`${J+se}:${ne}`);
  }
});

test('runtime unknown, partial, duplicate and mixed composition mappings fail closed', async t => {
  const corruptions = [
    ['unknown source', 'unknown capture'],
    ['missing earlier layout adaptation', baselineRuntime],
    ['marker without transformations', beforeCinema + '\n' + marker],
    ['double marker', cinematicRuntime + marker],
    ['retired single-item list', cinematicRuntime.replace(oldList, retiredList)],
    ['two artwork items', cinematicRuntime.replace(oldList, '(de.blok?.listItems||[]).slice(0,2).map(s=>')],
    ['card owner missing', cinematicRuntime.replace(',"data-duik-cinematic-card":"true"', '')],
    ['legacy copy restored', cinematicRuntime + '\nr("div",ct,[])'],
    ['transformed content without marker', cinematicRuntime.replace(marker, '')],
  ];
  for (const [name, source] of corruptions) await t.test(name, () => assert.throws(() => patchCinematicCompositionRuntime(source)));
});

test('SSR retains three real cards with one unchanged artwork column each and no legacy copy', () => {
  assert.equal(isCinematicComposition(originalSSR), false);
  assert.equal(isCinematicComposition(cinematicSSR), true);
  const originalCards = cardsIn(originalSSR), currentCards = cardsIn(cinematicSSR);
  assert.equal(currentCards.length, 3);
  for(const [index,card]of currentCards.entries()){
    assert.equal(attributes(card)[cardAttribute], 'true');
    assert.equal(elements(card).length, 1);
    assert.equal(sourceOf(cinematicSSR, elements(card)[0]), sourceOf(originalSSR, elements(originalCards[index])[1]));
    assert.deepEqual(motionSlots(card).map(node => attributes(node)['data-duik-motion']), [['animation'],['automation'],['camera']][index]);
    assert(!cinematicSSR.includes(sourceOf(originalSSR, elements(originalCards[index])[0])));
  }
});

test('SSR leaves the complete orbit subtree and every byte outside the motion cards unchanged', () => {
  const orbit = html => {
    const roots = all(dom(html), node => hasClass(node, 'home-testimonial-capabilities-kp'));
    assert.equal(roots.length, 1);
    return sourceOf(html, roots[0]);
  };
  assert.equal(orbit(cinematicSSR), orbit(originalSSR));
  assert.equal(stripCards(cinematicSSR), stripCards(originalSSR));
});

test('SSR composition and preceding layout/link/resize transforms are byte-idempotent together', () => {
  for (let cycle = 0, html = cinematicSSR; cycle < 3; cycle++) {
    html = patchCinematicCompositionSSR(ssrBeforeCinema(html));
    assert.equal(html, cinematicSSR, 'repeat SSR publication ' + cycle);
  }
  assert.equal(patchCapabilityLayoutSSR(cinematicSSR, ['unused one', 'unused two', 'unused three']), cinematicSSR);
});

test('SSR rejects partially consolidated or unknown card ownership instead of silently losing content', async t => {
  const currentCard = cardsIn(cinematicSSR)[0];
  const currentArt = elements(currentCard)[0];
  const copy = sourceOf(originalSSR, elements(cardsIn(originalSSR)[0])[0]);
  const firstMotion = motionSlots(currentCard)[0];
  const corruptions = [
    ['empty input', '<main></main>'],
    ['marked original three cards', originalSSR.replace('duik-capability-card"', 'duik-capability-card" ' + cardAttribute + '="true"')],
    ['already consolidated but no owner', cinematicSSR.replace(' ' + cardAttribute + '="true"', '')],
    ['owner on wrong element', cinematicSSR.replace(cardAttribute + '="true"', cardAttribute + '="false"').replace('<body', '<body ' + cardAttribute + '="true"')],
    ['legacy copy column returned', appendInside(cinematicSSR, currentCard, copy)],
    ['unified artwork absent', replaceNode(cinematicSSR, firstMotion, '<div></div>')],
    ['extra consolidated card', appendInside(cinematicSSR, currentCard.parentNode, sourceOf(cinematicSSR, currentCard))],
    ['different initial scene order', originalSSR.replace('data-duik-motion="animation"', 'data-duik-motion="camera"')],
    ['motion in removed text column', appendInside(originalSSR, elements(cardsIn(originalSSR)[0])[0], renderExperience('animation'))],
    ['mixed legacy motion before first consolidation', appendInside(originalSSR, elements(cardsIn(originalSSR)[0])[1], renderExperience('automation'))],
    ['mixed legacy motion inside unified artwork', appendInside(cinematicSSR, currentArt, renderExperience('automation'))],
  ];
  for (const [name, html] of corruptions) await t.test(name, () => assert.throws(() => patchCinematicCompositionSSR(html)));
});

test('the published parent uses all three items and accepts the complete publishing chain', async () => {
  const published = await readFile(new URL('../public/_nuxt/' + parentName, import.meta.url), 'utf8');
  astOf(published, 'published parent');
  assert.equal(runtimeChain(published), published);
  assert.deepEqual(computedItems(published, {listItems: [{title: 'first'}, {title: 'second'}, {title: 'third'}]}).map(item => item.title), ['first','second','third']);
});

test('published SSR has three horizontal artworks plus exactly two closing regions and one retired host', async () => {
  const published = await readFile(new URL('../public/landing.html', import.meta.url), 'utf8');
  const document = dom(published), cards = cardsIn(published);
  assert.equal(cards.length, 3);
  for(const [index,card]of cards.entries()){
    assert.equal(elements(card).length, 1);
    assert.deepEqual(motionSlots(card).map(node => attributes(node)['data-duik-motion']), [['animation'],['automation'],['camera']][index]);
  }
  assert.equal(patchCinematicCompositionSSR(ssrBeforeCinema(published)), published);
  const hosts = all(document, node => Object.hasOwn(attributes(node), 'data-duik-closing-host'));
  assert.deepEqual(hosts.map(node => attributes(node)['data-duik-closing-host']), ['catalog', 'faq', 'closing-empty']);
  for (const host of hosts) assert.equal(sourceOf(published, host), renderExperience(attributes(host)['data-duik-closing-host']));
  assert(Object.hasOwn(attributes(hosts[2]), 'hidden'));
  assert.equal(elements(hosts[2]).length, 0);
  for (const id of ['toolkit', 'api', 'learning', 'faq', 'inside-ae']) assert.equal(all(document, node => attributes(node).id === id).length, 1, id + ' must have one owner');
  const api = all(hosts[0], node => attributes(node).id === 'api')[0];
  assert(api, 'advanced API belongs inside the compact catalog closing region');
  for (const name of ['data-closing-api', 'data-closing-learning']) {
    const details = all(hosts[0], node => Object.hasOwn(attributes(node), name));
    assert.equal(details.length, 1); assert.equal(details[0].tagName, 'details');
    assert(!Object.hasOwn(attributes(details[0]), 'open'), name + ' starts closed');
  }
});

test('the archived original stays immutable with its original three-item runtime and three SSR cards', async () => {
  assert.equal(await readFile(baselineRuntimeURL, 'utf8'), baselineRuntime);
  assert.equal(await readFile(baselineHTMLURL, 'utf8'), baselineHTML);
  assert(!baselineRuntime.includes(marker)); assert(!isCinematicComposition(baselineHTML));
  const originalClass = capabilityClasses.find(([, name]) => name === 'duik-capability-card')[0];
  assert.equal(all(dom(baselineHTML), node => attributes(node).class === originalClass).length, 3);
  assert.equal(computedItems(baselineRuntime, {listItems: [{}, {}, {}]}).length, 3);
});
