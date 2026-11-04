import { apiExamples } from './tool-catalog.mjs';

const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const firstExample = apiExamples[0];
export const apiCinemaDuration = 4200;
export const apiScenes = Object.freeze({
  arm: { input: '选中的手臂骨骼', result: '用控制器调整姿态', description: '骨骼连接成手臂结构，末端控制器带动关节。', verb: '让骨骼连成动作。' },
  wiggle: { input: '选中的属性', result: '加入可调节的抖动', description: '静止的属性开始产生变化，形成程序化运动。', verb: '让静止开始变化。' },
  'auto-parent': { input: '选中的图层', result: '一起跟随父级移动', description: '其他选中图层链接到最后选中的父级，并跟随它移动。', verb: '让图层一起移动。' },
});

// Structural sources: Linearity HomeHowItWorksKP's centered stage -> focus
// movement and stepProgress; VoiceStudio LandingPage's _early/_mid/_late
// layers. Reworked as an automatically alternating explanation with Duik-owned geometry.
const drawing = `<svg class="duik-api-cinema-art" viewBox="0 0 1200 600" role="img" aria-labelledby="duik-api-cinema-description" data-api-surface>
  <title id="duik-api-cinema-description" data-api-description>${apiScenes.arm.description}</title>
  <g data-api-motion="camera">
    <g data-api-scene="arm">
      <g class="duik-api-cinema-context" data-api-motion="early"><path d="M292 454 470 537 992 364 814 281Z"/><path d="m322 475 148 68 492-163"/></g>
      <g class="duik-api-cinema-ghost" data-api-motion="early"><path d="m355 175 43-28 234 173-43 29Z"/><path d="m584 342 48-23 245-85 17 48-251 87Z"/><circle cx="380" cy="164" r="16"/><circle cx="616" cy="338" r="16"/><circle cx="873" cy="257" r="16"/></g>
      <g data-api-motion="output">
        <g data-api-motion="arm-upper" class="duik-api-cinema-upper">
          <g data-api-motion="arm-assembly-upper">
            <path class="duik-api-cinema-extrusion" d="m350 160 55-31 241 185 5 55-43 17-258-193Z"/>
            <path class="duik-api-cinema-face" d="m350 160 55-31 241 185-38 39Z"/>
            <path class="duik-api-cinema-edge" d="m350 160 258 193v33L350 193Z"/>
            <circle class="duik-api-cinema-joint" cx="382" cy="159" r="16"/>
            <path class="duik-api-cinema-bone-line" d="m382 159 223 168"/>
          </g>
          <g data-api-motion="arm-lower" class="duik-api-cinema-lower">
            <g data-api-motion="arm-assembly-lower">
              <path class="duik-api-cinema-extrusion" d="m584 313 282-100 34 34-12 47-264 91-40-32Z"/>
              <path class="duik-api-cinema-face" d="m584 313 282-100 34 34-276 99Z"/>
              <path class="duik-api-cinema-edge" d="m624 346 276-99-12 47-264 91Z"/>
              <circle class="duik-api-cinema-joint" cx="616" cy="329" r="17"/>
              <circle class="duik-api-cinema-joint" cx="864" cy="242" r="14"/>
              <path class="duik-api-cinema-bone-line" d="m640 321 204-72"/>
            </g>
            <g data-api-motion="controller" class="duik-api-cinema-control"><rect x="810" y="188" width="108" height="108" rx="14"/><circle cx="864" cy="242" r="6"/><path d="M864 180v-17m0 158v-17m-62-62h-17m158 0h-17"/></g>
          </g>
        </g>
      </g>
      <g class="duik-api-cinema-anchor" data-api-motion="late"><circle cx="382" cy="159" r="29"/><circle cx="382" cy="159" r="5"/></g>
    </g>
    <g data-api-scene="wiggle" hidden>
      <g class="duik-api-cinema-context" data-api-motion="early"><path d="m240 404 241 137 510-207-241-137Z"/><path d="M245 313h707"/></g>
      <g class="duik-api-cinema-samples" data-api-motion="mid"><path d="m224 351 91-81 82 99 85-146 84 128 84-90 82 105 88-176 88 107 70-74"/><circle cx="315" cy="270" r="6"/><circle cx="397" cy="369" r="6"/><circle cx="482" cy="223" r="6"/><circle cx="566" cy="351" r="6"/><circle cx="650" cy="261" r="6"/><circle cx="732" cy="366" r="6"/><circle cx="820" cy="190" r="6"/><circle cx="908" cy="297" r="6"/></g>
      <g data-api-motion="output"><g data-api-motion="wiggle-point">
        <path class="duik-api-cinema-extrusion" d="m484 202 166-47 95 91v137l-166 49-95-93Z"/>
        <path class="duik-api-cinema-face" d="m484 202 166-47 95 91-167 49Z"/>
        <path class="duik-api-cinema-edge" d="m578 295 167-49v137l-166 49Z"/>
        <path class="duik-api-cinema-property" d="m534 220 100-29 57 55-100 29Z"/>
        <path class="duik-api-cinema-property-line" d="m558 223 25 25 61-18"/>
      </g></g>
      <g data-api-motion="late" class="duik-api-cinema-sample-brackets"><path d="M228 190v206h41m665-244h42v244h-42"/></g>
    </g>
    <g data-api-scene="auto-parent" hidden>
      <g class="duik-api-cinema-context" data-api-motion="early"><path d="m241 394 282 157 482-173-282-156Z"/></g>
      <g data-api-motion="output"><g data-api-motion="parent-group">
        <g class="duik-api-cinema-links" data-api-motion="mid"><path d="M600 196v99M367 295h466M367 295v80M600 295v114M833 295v80"/><circle cx="600" cy="295" r="6"/></g>
        <g data-api-motion="parent-left"><path class="duik-api-cinema-extrusion" d="m287 368 84-29 82 49v76l-87 28-79-48Z"/><path class="duik-api-cinema-face" d="m287 368 84-29 82 49-87 28Z"/><path class="duik-api-cinema-edge" d="m366 416 87-28v76l-87 28Z"/></g>
        <g data-api-motion="parent-center"><path class="duik-api-cinema-extrusion" d="m519 409 84-29 82 49v76l-87 28-79-48Z"/><path class="duik-api-cinema-face" d="m519 409 84-29 82 49-87 28Z"/><path class="duik-api-cinema-edge" d="m598 457 87-28v76l-87 28Z"/></g>
        <g data-api-motion="parent-right"><path class="duik-api-cinema-extrusion" d="m751 368 84-29 82 49v76l-87 28-79-48Z"/><path class="duik-api-cinema-face" d="m751 368 84-29 82 49-87 28Z"/><path class="duik-api-cinema-edge" d="m830 416 87-28v76l-87 28Z"/></g>
        <g data-api-motion="parent-root" class="duik-api-cinema-parent"><path d="m510 128 96-31 92 57v85l-97 31-91-55Z"/><path d="m510 128 91 58 97-32M601 186v84"/><circle cx="606" cy="151" r="10"/></g>
      </g></g>
      <g class="duik-api-cinema-control" data-api-motion="late"><path d="m488 114 119-39 114 71v102l-120 38-113-70Z"/></g>
    </g>
  </g>
</svg>`;

const innerMarkup = `<div class="duik-api-cinema-intro"><h2>面板之外，也能写进脚本。</h2><p>把绑定、动画和图层操作，接进自己的工具。</p></div>
  <div class="duik-api-cinema-switch" role="group" aria-label="选择 API 调用示例">${apiExamples.map((example, index) => `<button type="button" data-api-example="${example.id}" aria-pressed="${index === 0}">${example.title}</button>`).join('')}</div>
  <figure class="duik-api-stage duik-api-cinema-stage">
    <div class="duik-api-cinema-caption"><p data-api-verb>${apiScenes.arm.verb}</p></div>
    ${drawing}
    <div class="duik-api-cinema-relation" data-api-relation data-api-relation-phase="result" role="group" aria-label="API 调用关系"><span data-api-input>${apiScenes.arm.input}</span><code data-api-call>${escapeHtml(firstExample.call)}</code><span data-api-result>${apiScenes.arm.result}</span></div>
    <figcaption class="duik-api-cinema-boundary"><span>功能关系示意，不执行 AE 操作。</span><span data-api-position-label>能力示意</span></figcaption>
  </figure>
  <p class="duik-api-cinema-status" data-api-stage-status role="status" aria-live="polite">${apiScenes.arm.result}。</p>
  <div class="duik-api-cinema-links-row"><a class="duik-api-cinema-start" href="/docs/advanced/api/getting-started">开始使用 API</a><a data-api-source href="${firstExample.href}">查看示例文档</a></div>
  <details class="duik-api-reference"><summary>调用代码与运行前提</summary><div class="duik-api-cinema-reference-body"><div><div class="duik-api-cinema-code"><span>After Effects / ExtendScript</span><pre tabindex="0" aria-label="可复制的 API 调用代码"><code data-api-code>${escapeHtml(firstExample.call)}</code></pre><button data-api-copy type="button">复制调用片段</button></div><p data-api-feedback class="duik-api-cinema-feedback" role="status" aria-live="polite"></p><div class="duik-api-requirements"><p data-api-prerequisite>${firstExample.prerequisite}</p><ol><li>在 After Effects 的 ExtendScript 环境运行。</li><li>先引入适配版本的 API，调用 <code>DuAEF.init()</code> 初始化框架。</li><li>若未调用 <code>DuScriptUI.showUI()</code>，在功能调用前执行 <code>DuAEF.enterRunTime()</code>。</li></ol><p>这是调用片段，不是完整独立脚本；不会在浏览器中执行 AE 操作。API 包文件名以所用版本和初始化文档为准。</p></div></div><figure class="duik-api-official"><img src="/duik-experience/official/duik/tools/script-editor.png" width="481" height="535" alt="官方文档中的 Duik 内置脚本编辑器" loading="lazy" decoding="async"><figcaption>官方脚本编辑器原图。<a href="/docs/guide/tools/scripting/script-editor">查看操作文档</a></figcaption></figure></div></details>`;

export const apiCinemaMarkup = `<section class="duik-api-cinema" data-duik-api data-api-cinema aria-label="Duik API 介绍">${innerMarkup}</section>`;
export const apiMarkup = apiCinemaMarkup;

const moveEase = 'cubic-bezier(0.77, 0, 0.175, 1)';
const arriveEase = 'cubic-bezier(0.23, 1, 0.32, 1)';
const transformFrames = frames => frames.map(([offset, transform]) => ({ offset, transform, easing: moveEase }));
const reveal = (from, to) => [{offset:0,opacity:0,transform:'scale(.96)'},{offset:from,opacity:0,transform:'scale(.96)',easing:arriveEase},{offset:to,opacity:1,transform:'scale(1)'},{offset:1,opacity:1,transform:'scale(1)'}];

export function apiCinemaTracks() {
  return {
    camera: transformFrames([[0,'translate(48px, 22px) scale(.88)'],[.26,'translate(0px, 0px) scale(1)'],[.66,'translate(-25px, 8px) scale(1.04)'],[1,'translate(0px, 0px) scale(1)']]),
    early: [{offset:0,opacity:.75},{offset:.34,opacity:.75},{offset:.62,opacity:.24},{offset:1,opacity:.24}],
    mid: reveal(.3,.54),
    late: reveal(.54,.72),
    output: [{offset:0,opacity:.7},{offset:.32,opacity:1},{offset:1,opacity:1}],
    'arm-assembly-upper': transformFrames([[0,'translate(-132px, 56px) rotate(-14deg)'],[.12,'translate(-132px, 56px) rotate(-14deg)'],[.44,'translate(0px, 0px) rotate(0deg)'],[1,'translate(0px, 0px) rotate(0deg)']]),
    'arm-assembly-lower': transformFrames([[0,'translate(122px, 48px) rotate(18deg)'],[.16,'translate(122px, 48px) rotate(18deg)'],[.48,'translate(0px, 0px) rotate(0deg)'],[1,'translate(0px, 0px) rotate(0deg)']]),
    'arm-upper': transformFrames([[0,'rotate(0deg)'],[.64,'rotate(0deg)'],[.84,'rotate(-8deg)'],[1,'rotate(-5deg)']]),
    'arm-lower': transformFrames([[0,'rotate(0deg)'],[.64,'rotate(0deg)'],[.84,'rotate(-28deg)'],[1,'rotate(-16deg)']]),
    controller: reveal(.48,.64),
    'wiggle-point': transformFrames([[0,'translate(0px, 0px)'],[.54,'translate(0px, 0px)'],[.63,'translate(-46px, 22px)'],[.71,'translate(40px, -38px)'],[.79,'translate(-28px, -18px)'],[.89,'translate(32px, 28px)'],[1,'translate(18px, -20px)']]),
    'parent-group': transformFrames([[0,'translate(0px, 0px)'],[.64,'translate(0px, 0px)'],[.83,'translate(44px, -22px)'],[1,'translate(16px, -8px)']]),
    'parent-root': transformFrames([[0,'translate(0px, -32px)'],[.14,'translate(0px, -32px)'],[.4,'translate(0px, 0px)'],[1,'translate(0px, 0px)']]),
    'parent-left': transformFrames([[0,'translate(-104px, -65px) rotate(-12deg)'],[.18,'translate(-104px, -65px) rotate(-12deg)'],[.5,'translate(0px, 0px) rotate(0deg)'],[1,'translate(0px, 0px) rotate(0deg)']]),
    'parent-center': transformFrames([[0,'translate(20px, -20px) rotate(8deg)'],[.21,'translate(20px, -20px) rotate(8deg)'],[.53,'translate(0px, 0px) rotate(0deg)'],[1,'translate(0px, 0px) rotate(0deg)']]),
    'parent-right': transformFrames([[0,'translate(92px, -65px) rotate(12deg)'],[.24,'translate(92px, -65px) rotate(12deg)'],[.56,'translate(0px, 0px) rotate(0deg)'],[1,'translate(0px, 0px) rotate(0deg)']]),
  };
}

// WAAPI owns animation time. The small driver makes cancellation, stale frames,
// interrupted playback and blocked starts independently testable without a DOM.
export function createApiCinemaPlayback({ requestFrame, cancelFrame, readTime, seekTime, run, halt, allowed, onProgress, onState }) {
  let progress = 1, playing = false, frame = 0, generation = 0, disposed = false;
  const paint = value => { progress = Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0)); onProgress(progress); };
  const pause = (reason = 'paused') => {
    generation += 1;
    if (frame) cancelFrame(frame);
    frame = 0;
    halt();
    playing = false;
    onState(reason, progress);
  };
  const seek = value => {
    if (disposed) return;
    pause('manual');
    paint(value);
    seekTime(progress * apiCinemaDuration);
    onState('manual', progress);
  };
  const play = () => {
    if (disposed || playing || !allowed()) return false;
    const token = ++generation;
    playing = true;
    run();
    onState('playing', progress);
    const tick = () => {
      if (disposed || !playing || token !== generation) return;
      frame = 0;
      if (!allowed()) { pause('hidden'); return; }
      // WAAPI alternates the original shot sequence. Read its current leg,
      // instead of cutting the scene back to zero or stopping at the end.
      const cycle = Math.max(0, readTime() / apiCinemaDuration) % 2;
      paint(cycle <= 1 ? cycle : 2 - cycle);
      frame = requestFrame(tick);
    };
    frame = requestFrame(tick);
    return true;
  };
  return { play, pause, seek, get progress() { return progress; }, get playing() { return playing; }, destroy() { if (disposed) return; disposed = true; pause('disposed'); } };
}

const apiMounts = new WeakMap();
export function mountApiCinema(host) {
  if (!host?.querySelector) return () => {};
  let root = host.matches?.('[data-duik-api]') ? host : host.querySelector('[data-duik-api]');
  if (!root) { host.innerHTML = apiCinemaMarkup; root = host.querySelector('[data-duik-api]'); }
  apiMounts.get(root)?.();
  if (!root.hasAttribute('data-api-cinema')) { root.innerHTML = innerMarkup; root.className = 'duik-api-cinema'; root.setAttribute('data-api-cinema', ''); }
  const document = root.ownerDocument, view = document.defaultView;
  const reduced = view?.matchMedia('(prefers-reduced-motion: reduce)');
  const reference = root.querySelector('.duik-api-reference');
  const status = root.querySelector('[data-api-stage-status]'), surface = root.querySelector('[data-api-surface]');
  const feedback = root.querySelector('[data-api-feedback]'), copyButton = root.querySelector('[data-api-copy]'), code = root.querySelector('[data-api-code]');
  const relation = root.querySelector('[data-api-relation]'), stageCall = root.querySelector('[data-api-call]');
  let example = firstExample, animations = [], visible = !view?.IntersectionObserver, startAtBeginning = true, disposed = false, copyAttempt = 0;
  const currentPhase = progress => progress < .34 ? 0 : progress < .66 ? 1 : 2;
  function describe(progress) {
    const scene = apiScenes[example.id];
    return progress < .34 ? scene.input : progress < .66 ? '查看调用片段及其作用对象。' : `${scene.result}。`;
  }
  const playback = createApiCinemaPlayback({
    requestFrame: callback => view.requestAnimationFrame(callback), cancelFrame: id => view.cancelAnimationFrame(id),
    readTime: () => Number(animations[0]?.currentTime || 0), seekTime: time => animations.forEach(animation => { animation.currentTime = time; }),
    run: () => animations.forEach(animation => animation.play()), halt: () => animations.forEach(animation => animation.pause()),
    allowed: () => !disposed && visible && !document.hidden && !reduced?.matches && !reference?.open && animations.length > 0,
    onProgress(progress) {
      root.dataset.apiPosition = progress.toFixed(3);
      relation.dataset.apiRelationPhase = ['input','call','result'][currentPhase(progress)];
      root.querySelector('[data-api-position-label]').textContent = ['选择对象','调用片段','能力示意'][currentPhase(progress)];
      const nextDescription = describe(progress); if (status.textContent !== nextDescription) status.textContent = nextDescription;
    },
    onState(state, progress) {
      const playing = state === 'playing';
      root.dataset.apiPlaying = String(playing);
      // Automatic phases are visual narration, not repeating screen-reader announcements.
      status.setAttribute('aria-live', state === 'manual' ? 'polite' : 'off');
      status.textContent = describe(progress);
    },
  });
  function select(id) {
    playback.pause();
    animations.forEach(animation => animation.cancel());
    animations = [];
    example = apiExamples.find(item => item.id === id) || firstExample;
    const scene = apiScenes[example.id];
    root.dataset.apiSelection = example.id;
    code.textContent = example.call;
    stageCall.textContent = example.call;
    root.querySelector('[data-api-prerequisite]').textContent = example.prerequisite;
    root.querySelector('[data-api-source]').href = example.href;
    root.querySelector('[data-api-input]').textContent = scene.input;
    root.querySelector('[data-api-result]').textContent = scene.result;
    root.querySelector('[data-api-description]').textContent = scene.description;
    root.querySelector('[data-api-verb]').textContent = scene.verb;
    root.querySelectorAll('[data-api-example]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.apiExample === example.id)));
    root.querySelectorAll('[data-api-scene]').forEach(element => element.toggleAttribute('hidden', element.dataset.apiScene !== example.id));
    const tracks = apiCinemaTracks();
    try {
      root.querySelectorAll('[data-api-motion]').forEach(element => {
        if (element.closest('[data-api-scene]')?.hasAttribute('hidden') || !element.animate) return;
        const animation = element.animate(tracks[element.dataset.apiMotion], {duration:apiCinemaDuration,fill:'both',easing:'linear',direction:'alternate',iterations:Infinity});
        animation.pause();
        animations.push(animation);
      });
    } catch {
      animations.forEach(animation => animation.cancel());
      animations = [];
    }
    copyAttempt += 1;
    copyButton.disabled = false;
    copyButton.textContent = '复制调用片段';
    feedback.textContent = '';
    feedback.removeAttribute('data-error');
    playback.seek(1);
    startAtBeginning = true;
  }
  async function copy() {
    const attempt = ++copyAttempt, call = example.call;
    copyButton.disabled = true;
    feedback.textContent = '正在复制…';
    feedback.removeAttribute('data-error');
    try {
      const clipboard = view?.navigator.clipboard;
      if (!clipboard?.writeText) throw new Error('Clipboard unavailable');
      await clipboard.writeText(call);
      if (disposed || attempt !== copyAttempt) return;
      feedback.textContent = '已复制调用片段；请在已初始化 API 的 AE 脚本中使用。';
      copyButton.textContent = '再次复制';
    } catch {
      if (disposed || attempt !== copyAttempt) return;
      feedback.textContent = '复制失败，请选中上方代码后手动复制。';
      feedback.setAttribute('data-error', 'true');
      code.parentElement.focus();
    } finally { if (!disposed && attempt === copyAttempt) copyButton.disabled = false; }
  }
  function onClick(event) {
    const button = event.target.closest?.('button');
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute('data-api-example')) { select(button.dataset.apiExample); syncLoop(); }
    if (button.hasAttribute('data-api-copy')) void copy();
  }
  function syncLoop() {
    if (disposed) return;
    if (!visible || document.hidden || reduced?.matches || reference?.open) { playback.pause('hidden'); return; }
    if (startAtBeginning) { playback.seek(0); startAtBeginning = false; }
    playback.play();
  }
  const onVisibility = () => syncLoop();
  const onReduced = () => { if (reduced.matches) { playback.seek(1); startAtBeginning = true; } syncLoop(); };
  const observer = view?.IntersectionObserver ? new view.IntersectionObserver(entries => {
    if (disposed) return;
    const relevant = entries.filter(entry => entry.target === surface), entry = relevant.at(-1); if (!entry) return;
    if (relevant.some(item => !item.isIntersecting || item.intersectionRatio < .65)) playback.pause('hidden');
    visible = entry.isIntersecting && entry.intersectionRatio >= .65;
    syncLoop();
  }, {threshold:[0,.65]}) : null;
  root.addEventListener('click', onClick);
  reference?.addEventListener('toggle', syncLoop);
  document.addEventListener('visibilitychange', onVisibility);
  reduced?.addEventListener('change', onReduced);
  select(root.querySelector('[data-api-example][aria-pressed="true"]')?.dataset.apiExample);
  observer?.observe(surface);
  if (!observer) syncLoop();
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    playback.destroy();
    observer?.disconnect();
    animations.forEach(animation => animation.cancel());
    animations = [];
    copyAttempt += 1;
    copyButton.disabled = false;
    root.removeEventListener('click', onClick);
    reference?.removeEventListener('toggle', syncLoop);
    document.removeEventListener('visibilitychange', onVisibility);
    reduced?.removeEventListener('change', onReduced);
    if (apiMounts.get(root) === cleanup) apiMounts.delete(root);
  };
  apiMounts.set(root, cleanup);
  return cleanup;
}

export const mountApi = mountApiCinema;
