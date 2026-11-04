import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { sceneAt, layerTransform, beatPositions } from '../components/home/landing/candidate/scene-model.mjs';

const read = name => readFile(new URL('../' + name, import.meta.url));
const manifest = JSON.parse(await read('public/riglab-project/rig.json'));
test('candidate uses the approved identity and all 26 actual layers', async () => {
  assert.equal(manifest.parts.length, 26);
  const original = await read('public/duik-character/source/character-selected-v1.png');
  assert.equal(createHash('sha256').update(original).digest('hex'), manifest.sourceSha256);
  for (const part of manifest.parts) assert((await read('public/riglab-project/' + part.src)).length > 0);
});
test('story has four reachable beats and interactive endpoints', () => {
  beatPositions.forEach((p, i) => assert.equal(sceneAt(p).beat, i));
  assert.equal(sceneAt(0).interactive, true);
  assert.equal(sceneAt(1).interactive, true);
  assert.equal(sceneAt(.45).spread, 1);
  assert.equal(sceneAt(.45).interactive, false);
});
test('layer assembly is identity at rest and finite throughout the scroll', () => {
  for (const [index, part] of manifest.parts.entries()) {
    assert.equal(layerTransform(part, index, manifest.camera, 0), 'translate(0%, 0%) scale(1)');
    for (let sample = 0; sample <= 100; sample++) {
      const transform = layerTransform(part, index, manifest.camera, sceneAt(sample / 100).spread);
      assert(!/NaN|Infinity/.test(transform));
    }
  }
});
test('candidate publishing does not change root HTML or Nuxt payload', async () => {
  const before = await Promise.all(['public/landing.html', 'public/_payload.json'].map(read));
  execFileSync(process.execPath, ['scripts/publish-duik-candidate.mjs'], { cwd: new URL('../', import.meta.url) });
  const after = await Promise.all(['public/landing.html', 'public/_payload.json'].map(read));
  before.forEach((data, index) => assert(data.equals(after[index])));
});
test('candidate source and published output match without old template gallery', async () => {
  assert((await read('components/home/landing/candidate/index.html')).equals(await read('public/landing-candidate.html')));
  for (const filename of ['style.css', 'story.js', 'scene-model.mjs']) {
    assert((await read('components/home/landing/candidate/' + filename)).equals(await read('public/duik-candidate/' + filename)));
  }
  const source = String(await read('public/landing-candidate.html'));
  assert(!/assets\.linearity\.io|<iframe|hero(?:[1-9]|1[0-5])\.jpg/i.test(source));
  assert(source.includes('不在浏览器执行 AE'));
});
