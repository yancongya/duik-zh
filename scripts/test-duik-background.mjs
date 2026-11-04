import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {patchLightBackground} from './lib/landing-background.mjs';

const filename='WebGLBackgroundCore.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js';
const original=await readFile(new URL('../components/home/landing/baseline/_nuxt/'+filename,import.meta.url),'utf8');
test('light shader retains the original camera, distortion and scroll uniforms',()=>{
  const code=patchLightBackground(original);
  for(const anchor of ['u_waveSpeed','u_colorWeights','u_activeProgress','u_pulse','warpUV','p+=x/1e3+e.value*.0015','waveSpeed:4.57']) assert(code.includes(anchor),anchor);
  assert(code.includes('float rVal = 0.97255;'));
  assert(!code.includes('float rVal = 0.0;'));
  assert(!code.includes('#3bffbd'));
  assert.equal(patchLightBackground(code),code);
});
test('background clock and renderer stop for reduced motion and hidden tabs',()=>{
  const code=patchLightBackground(original);
  assert(code.includes('if(!duikRunning.value)return;'));
  assert(code.includes('!document.hidden&&!duikMotion?.matches'));
  assert(code.includes('"render-mode":duikRunning.value?"always":"on-demand"'));
  assert(code.includes('["dpr","render-mode"]'));
  for(const type of ['addEventListener','removeEventListener']) assert(code.includes(`document.${type}("visibilitychange",duikSyncBackground)`));
});
test('light surface preserves visible backdrop and the template fade-in',async()=>{
  const css=await readFile(new URL('../components/home/landing/theme.css',import.meta.url),'utf8');
  assert(!css.includes('opacity:.055'));
  assert(css.includes('.tres-canvas-container.opacity-100'));
  assert(css.includes('.tres-canvas-placeholder'));
  assert(css.includes('radial-gradient'));
});
