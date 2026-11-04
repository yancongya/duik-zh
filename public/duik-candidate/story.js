import '/character-rig.js';
import { clamp, sceneAt, beatPositions, layerTransform } from './scene-model.mjs';

const sequence = document.querySelector('.sequence');
const viewport = document.querySelector('.story-viewport');
const character = document.querySelector('#character');
const stack = document.querySelector('#layer-stack');
const status = document.querySelector('#scene-status');
const play = document.querySelector('#play');
const reset = document.querySelector('#reset');
const beatButtons = [...document.querySelectorAll('[data-beat]')];
const copies = [...document.querySelectorAll('[data-copy]')];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const life = new AbortController();
let rig, manifest, images = [], currentBeat = -1, currentInteractive, progress = 0, raf = 0, hasError = false, lastPlaying;
const labels = ['插画 → 角色', '每一层都保留原坐标', '图层 → 骨骼 → 控制器', '试试手腕、头部和眼神'];
const on = (element, name, callback, options = {}) => element.addEventListener(name, callback, { ...options, signal: life.signal });

function update() {
  raf = 0;
  if (!rig || !manifest || document.hidden) return;
  if (!reduced.matches) {
    const bounds = sequence.getBoundingClientRect();
    const headerHeight = document.querySelector('.site-header').offsetHeight;
    progress = clamp((headerHeight - bounds.top) / Math.max(1, sequence.offsetHeight - viewport.offsetHeight));
  }
  const scene = sceneAt(progress);
  if (currentBeat !== scene.beat) {
    copies.forEach((copy, index) => {
      copy.hidden = index !== scene.beat;
      if (!copy.hidden && !reduced.matches) {
        copy.getAnimations().forEach(animation => animation.cancel());
        copy.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 240, easing: 'cubic-bezier(.23,1,.32,1)' });
      }
    });
    beatButtons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === scene.beat)));
    document.querySelector('#scene-label').textContent = labels[scene.beat];
    currentBeat = scene.beat;
  }
  if (currentInteractive !== scene.interactive) {
    if (!scene.interactive) rig.reset();
    character.toggleAttribute('data-inactive', !scene.interactive);
    character.inert = !scene.interactive;
    rig.configure({ interaction: scene.interactive ? 'drag' : 'none', showControls: scene.interactive });
    stack.classList.toggle('is-visible', !scene.interactive);
    play.disabled = !scene.interactive || reduced.matches;
    reset.disabled = !scene.interactive;
    status.textContent = scene.interactive ? (reduced.matches ? '已减少动态效果 · 可点击章节，也可拖动控制器' : '拖动彩色控制器 · 也支持 Tab 与方向键') : '来自同一张已确认原图的 26 个透明图层';
    currentInteractive = scene.interactive;
  }
  images.forEach((image, index) => { image.style.transform = layerTransform(manifest.parts[index], index, manifest.camera, scene.spread); });
  sequence.dataset.beat = String(scene.beat);
  sequence.dataset.spread = scene.spread.toFixed(4);
}
function schedule() { if (!raf && !life.signal.aborted) raf = requestAnimationFrame(update); }
function selectBeat(index) {
  progress = beatPositions[index];
  if (reduced.matches) { update(); return; }
  const top = sequence.getBoundingClientRect().top + scrollY;
  const headerHeight = document.querySelector('.site-header').offsetHeight;
  window.scrollTo({ top: top - headerHeight + progress * (sequence.offsetHeight - viewport.offsetHeight), behavior: 'smooth' });
}

beatButtons.forEach((button, index) => on(button, 'click', () => selectBeat(index)));
on(play, 'click', () => {
  if (!rig || !currentInteractive || reduced.matches) return;
  if (play.getAttribute('aria-pressed') === 'true') rig.pause(); else rig.play('wave');
});
on(reset, 'click', () => rig?.reset());
on(character, 'rig-change', event => {
  const playing = Boolean(event.detail.playing);
  if (lastPlaying === playing) return;
  lastPlaying = playing;
  play.setAttribute('aria-pressed', String(playing));
  play.innerHTML = playing ? '暂停动作 <span aria-hidden="true">Ⅱ</span>' : '播放动作 <span aria-hidden="true">▷</span>';
});
function showError(error) {
  hasError = true;
  status.dataset.error = '';
  status.textContent = '角色演示未能载入，请刷新重试；中文文档仍可阅读。';
  sequence.dataset.state = 'error';
  play.disabled = reset.disabled = true;
  console.error('Candidate character:', error);
}
on(character, 'rig-error', event => showError(new Error(event.detail.message)));
on(window, 'scroll', schedule, { passive: true });
on(window, 'resize', schedule, { passive: true });
on(document, 'visibilitychange', schedule);
on(reduced, 'change', () => { rig?.pause(); currentInteractive = undefined; schedule(); });
on(window, 'pagehide', event => { if (!event.persisted) { cancelAnimationFrame(raf); life.abort(); } });
on(window, 'pageshow', schedule);

try {
  const url = new URL(character.getAttribute('src'), location.href);
  const response = await fetch(url, { signal: life.signal });
  if (!response.ok) throw new Error('Rig manifest HTTP ' + response.status);
  manifest = await response.json();
  if (manifest.parts.length !== 26 || manifest.sourceSha256 !== 'fdd21eb55d65074815cf1c7620cc7fbc65f90e226052f5219a16bd57d4d2249a') throw new Error('The approved 26-layer identity changed.');
  images = manifest.parts.map(part => {
    const image = new Image();
    image.src = new URL(part.src, url).href;
    image.alt = '';
    image.className = 'character-layer';
    image.dataset.part = part.id;
    const [x, y, right, bottom] = part.bbox;
    image.style.left = ((x - manifest.camera[0]) / manifest.camera[2] * 100) + '%';
    image.style.top = ((y - manifest.camera[1]) / manifest.camera[3] * 100) + '%';
    image.style.width = ((right - x) / manifest.camera[2] * 100) + '%';
    image.style.height = ((bottom - y) / manifest.camera[3] * 100) + '%';
    stack.append(image);
    return image;
  });
  await Promise.all(images.map(image => image.decode()));
  rig = await character.ready;
  if (!rig || hasError) throw new Error('Rig not ready.');
  sequence.dataset.state = 'ready';
  update();
} catch (error) {
  if (error.name !== 'AbortError') showError(error);
}
