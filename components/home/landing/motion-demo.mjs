import {MOTION_KINDS, ANIMATION_DURATION, AUTOMATION_DURATION, CAMERA_DURATION, AUTOMATION_PRESETS, animationStagePoint, animationTimeAtX, clamp, sampleAnimation, sampleAutomation, cameraTransforms, sampleCameraTour, easePath, automationPath} from './motion-model.mjs';

// Dynamic scene/graph SVG is original illustration geometry, not an icon library.
// Pure markup exports keep SSR and client output identical; no DOM at import time.
const copy = {
  animation: ['动画', '同一条路径，不同的节奏。', '/docs/guide/animation/interpolation', '了解插值工具'],
  automation: ['自动化', '让变化，自己发生。', '/docs/guide/automation/wiggle', '了解 Wiggle'],
  camera: ['摄像机', '让平面，也有纵深。', '/docs/guide/camera/camera-2d', '了解 2D 摄像机'],
};
const officialMotion={
  animation:{image:'animation/temporal-interpolation.png',alt:'Duik 官方文档中的时间插值界面，包含关键帧类型、缓动影响力与速度控件',caption:'动画面板 / 时间插值',title:'从所选关键帧开始',steps:['选择要调整的关键帧，设置插值类型。','调整缓入、缓出的影响力与速度。','按需要保存预设，或复制缓动数值。'],note:'“体验原理”中的曲线解释时间与位移关系，不是 Duik 的 Bézier 编辑器。'},
  automation:{image:'automation/wiggle-effect.png',alt:'Duik 官方 Wiggle 效果控件截图',caption:'Wiggle / 效果控件',title:'先选属性，再添加自动化',steps:['在 AE 中选择要处理的属性，点击 Wiggle。','在第一个选中图层的效果中调整参数。','设置频率、幅度与循环时长，继续打磨运动。'],note:'网页使用确定性示意信号；不执行 Duik 表达式，也不复现其随机算法。'},
  camera:{image:'cameras/camera-panel.png',detail:'cameras/2d-camera-effect.png',alt:'Duik 官方摄像机工具面板截图',caption:'摄像机面板 / Camera',title:'让不同景层形成视差',steps:['选择背景平面，点击“2D 摄像机”。','将画面图层关联到对应的深度层。','调整各层的摄像机影响，再操作摄像机控制器。'],note:'网页视差系数仅用于辅助理解，不是 Duik 的默认参数。'},
};
const officialMotionDimensions={animation:[418,206],automation:[392,255],camera:[318,193]};
function officialMotionMarkup(kind){
  const item=officialMotion[kind],base='/duik-experience/official/duik/',[width,height]=officialMotionDimensions[kind];
  return `<div class="duik-motion-reference" data-motion-reference><figure class="duik-motion-official-figure"><div class="duik-motion-official-images"><a class="duik-motion-image-link" href="${base+item.image}" target="_blank" rel="noopener" aria-label="查看${item.caption}原尺寸截图"><img src="${base+item.image}" width="${width}" height="${height}" alt="${item.alt}" loading="lazy" decoding="async"></a>${item.detail?`<a class="duik-motion-detail-link" href="${base+item.detail}" target="_blank" rel="noopener">查看 2D 摄像机效果原图</a>`:''}</div><figcaption>官方文档原图 · ${item.caption} · 可点击查看</figcaption></figure><div class="duik-motion-official-guide"><strong>${item.title}</strong><ol>${item.steps.map(step=>`<li>${step}</li>`).join('')}</ol><p>${item.note}</p></div></div>`;
}
const svg = (viewBox, content, label, extra = '') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${label}" ${extra}>${content}</svg>`;
const range = (name, label, min, max, value, suffix = '', step = 1) => `<label class="duik-motion-range"><span>${label}<output data-output="${name}">${value}${suffix}</output></span><input type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-input="${name}" aria-label="${label}"></label>`;
const motionPath = Array.from({length: 61}, (_, i) => {const p = animationStagePoint(sampleAnimation(i / 60, 'linear'));return `${i ? 'L' : 'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`;}).join(' ');

function animationMarkup() {
  const initial = animationStagePoint(sampleAnimation(0.32));
  const reference = animationStagePoint(sampleAnimation(.32, 'linear'));
  const ghosts = Array.from({length: 9}, (_, i) => {const time=i/8,p=animationStagePoint(sampleAnimation(time));return `<circle data-sample-time="${time}" cx="${p.x}" cy="${p.y}" r="3" fill="#a5b298"/>`;}).join('');
  return `<div class="duik-motion-scene" data-motion-stage data-motion-drag="animation" tabindex="0" role="slider" aria-label="沿路径拖动时间，也可用方向键调整" aria-valuemin="0" aria-valuemax="100" aria-valuenow="32">${svg('0 0 600 360', `
    <path d="M0 280Q120 242 254 282T600 275V360H0Z" fill="#e1e5d7"/>
    <path d="M0 297Q139 275 272 309T600 294" fill="none" stroke="#ced7c2"/>
    <circle cx="490" cy="78" r="25" fill="#ead7b4"/><path d="M83 93H133M108 88H157M413 142H463" stroke="#d0d6c5" stroke-width="2"/>
    <path d="${motionPath}" fill="none" stroke="#b8c4ad" stroke-width="1.5"/>${ghosts}
    <path d="M68 232l8 8-8 8-8-8Z M532 232l8 8-8 8-8-8Z" fill="#70896c"/>
    <g data-art="reference-traveler" transform="translate(${reference.x} ${reference.y}) rotate(${reference.angle})" opacity=".8"><path d="M-31-21L36 0-31 21-14 0Z M-14 0H36" fill="#eeeee4" stroke="#608889" stroke-width="1.7" stroke-dasharray="4 3"/></g>
    <g data-art="traveler" transform="translate(${initial.x} ${initial.y}) rotate(${initial.angle})"><path d="M-40-27L47 0-40 27-19 0Z" fill="#c4512e"/><path d="M-19 0H47L-40-27Z" fill="#e7a77e"/><path d="M-19 0L-40 27" stroke="#923d26" stroke-width="1.5"/><path d="M-37-25L42-1" stroke="#f6c6a7" fill="none"/></g>
    <circle cx="32" cy="29" r="4" fill="#c4512e"/><text x="44" y="33" class="duik-motion-svg-label" data-output="timing-label">缓入缓出</text>
    <circle cx="448" cy="29" r="4" fill="none" stroke="#608889"/><text x="460" y="33">匀速参照</text>
    `, '暖色纸飞机与冷色匀速参照共用同一路径；在同一时刻，对照它们的位置')}</div>
    <div class="duik-motion-controls"><div class="duik-motion-segment" role="group" aria-label="插值示意类型"><button type="button" data-ease="linear" aria-pressed="false">线性</button><button type="button" data-ease="smooth" aria-pressed="true">缓入缓出</button></div></div>
    <details class="duik-motion-adjust" data-motion-adjust><summary>查看时间曲线</summary><div class="duik-motion-adjust-body"><div class="duik-motion-graph">${svg('0 0 600 80', `<path d="M36 16V64H564" stroke="#cdd5c8" fill="none"/><path d="M36 64L564 16" stroke="#dae0d5" stroke-dasharray="4 5"/><path data-art="ease-curve" d="${easePath()}" fill="none" stroke="#557b67" stroke-width="2.5"/><line data-art="time-line" x1="204.96" x2="204.96" y1="10" y2="69" stroke="#c4512e"/><circle data-art="curve-dot" cx="204.96" cy="52.398592" r="4" fill="#c4512e"/><text x="36" y="10">位移</text><text x="564" y="77" text-anchor="end">时间</text>`, '时间与位移关系曲线')}</div><p class="duik-motion-result">位移 <output data-output="progress">24.2%</output></p></div></details>`;
}

function automationMarkup() {
  const initial=sampleAutomation({time:.5});
  return `<div class="duik-motion-scene" data-motion-stage data-motion-drag="automation" tabindex="0" role="slider" aria-label="左右拖动装置改变幅度，也可用方向键调整" aria-valuemin="0" aria-valuemax="64" aria-valuenow="32">${svg('0 0 600 360', `
    <path d="M0 277H600V360H0Z" fill="#e1e5d7"/><path d="M0 277H600" stroke="#d0d7c5"/>
    <ellipse data-art="mobile-shadow" cx="300" cy="268" rx="116" ry="8" fill="#7b8c70" opacity=".12"/>
    <path d="M155 45H445M155 39V51M445 39V51" stroke="#a9b59a" stroke-width="1.5"/><circle cx="300" cy="45" r="5" fill="#26382e"/>
    <path data-art="suspension" d="M300 50L${(300+initial.x).toFixed(2)} 118" stroke="#65765b" stroke-width="1.5"/>
    <g data-art="position" transform="translate(${(300+initial.x).toFixed(2)} 128)"><g transform="scale(.86)">
      <path d="M-13-12H13V12H-13Z" fill="#26382e"/><circle r="4" fill="#eeeee4"/>
      <g data-art="rotation" transform="rotate(${initial.rotation.toFixed(2)})">
        <path d="M-120 0Q0-52 120 0" fill="none" stroke="#26382e" stroke-width="3"/>
        <path d="M-120 0V55M0-25V74M120 0V53" fill="none" stroke="#65765b" stroke-width="1.4"/>
        <g transform="translate(-120 58)"><path d="M-45 0A45 45 0 0 0 45 0Z" fill="#c4512e"/><path d="M-45 0H45" stroke="#e8aa7c" stroke-width="2"/></g>
        <path d="M0 44L30 96H-30Z" fill="#dba861"/>
        <g transform="translate(120 68)"><g data-art="scale" transform="scale(${initial.scale.toFixed(2)})"><circle r="30" fill="#709799"/><path d="M0-30A30 30 0 0 0 0 30Z" fill="#436d72"/><circle r="5" fill="#eeeee4"/></g></g>
      </g>
    </g></g>
    <path d="M34 24H52M43 15V33" stroke="#c4512e" stroke-width="1.5"/><text x="62" y="28" class="duik-motion-svg-label">一组参数，连续变化</text>
    <text x="568" y="28" text-anchor="end">拖动装置，改变幅度</text>
    <path d="M200 295V338M400 295V338" stroke="#c6cfba"/>
    <text x="42" y="303">位置</text><text x="42" y="331" class="duik-motion-svg-value" data-output="position-value">${initial.x>=0?'+':''}${Math.round(initial.x)} px</text>
    <text x="232" y="303">旋转</text><text x="232" y="331" class="duik-motion-svg-value" data-output="rotation-value">${initial.rotation>=0?'+':''}${Math.round(initial.rotation)}°</text>
    <text x="432" y="303">缩放</text><text x="432" y="331" class="duik-motion-svg-value" data-output="scale-value">${Math.round(initial.scale*100)}%</text>`, '同一个悬挂装置连续改变位置、旋转与缩放；三项读数直接跟随画面')}</div>
    <div class="duik-motion-controls"><div class="duik-motion-segment" role="group" aria-label="网页示例强度">${AUTOMATION_PRESETS.map(preset=>`<button type="button" data-motion-preset="${preset.id}" aria-pressed="${preset.id==='natural'}">${preset.label}</button>`).join('')}</div></div>
    <details class="duik-motion-adjust" data-motion-adjust><summary>调整幅度与频率</summary><div class="duik-motion-adjust-body"><div class="duik-motion-parameters">${range('amplitude', '变化幅度', 0, 64, 32)}${range('frequency', '频率', 1, 6, 2, ' 次/段')}</div><div class="duik-motion-graph">${svg('0 0 600 66', `<path d="M36 34H564" stroke="#d3dbce"/><path data-art="wave-curve" d="${automationPath()}" fill="none" stroke="#557b67" stroke-width="2"/><line data-art="wave-time" x1="102" x2="102" y1="8" y2="59" stroke="#c4512e"/><text x="36" y="62">0 秒</text><text x="564" y="62" text-anchor="end">4 秒示意片段</text>`, '确定性的属性运动曲线')}</div></div></details>`;
}

function cameraMarkup() {
  const planes=[
    '<rect x="-120" y="-80" width="784" height="460" fill="#e8ddc6"/><circle cx="386" cy="72" r="36" fill="#c77346"/><path d="M-100 230L65 84 174 181 267 125 421 224 565 116 650 230V390H-100Z" fill="#a8b39b"/><path d="M65 84L174 181 125 166Z M267 125L421 224 333 201Z" fill="#bbc3ad"/><path d="M24 56H94M48 48H115M448 122H520" stroke="#cfc5ad" stroke-width="2"/>',
    '<path d="M-110 300Q15 176 138 216T369 214Q480 167 656 219V390H-110Z" fill="#829579"/><path d="M-80 280Q115 204 252 267T620 267V390H-80Z" fill="#6f8769"/><path d="M230 289Q346 249 301 222Q275 207 328 187" fill="none" stroke="#d5c29e" stroke-width="16"/><path d="M387 183V110M371 135L387 108 406 143Z M369 157L387 128 410 160Z" fill="#46664e" stroke="#46664e" stroke-width="4"/><path d="M159 220V184H207V220Z" fill="#eeddb9"/><path d="M151 184L183 160 215 184Z" fill="#b96342"/><path d="M180 220V199H190V220" fill="#876d4d"/>',
    '<path d="M-120 333Q52 239 182 284T439 291Q547 238 674 296V390H-120Z" fill="#354f3e"/><path d="M65 319V84M46 139L65 76 90 143Z M30 187L65 118 104 192Z M19 238L65 164 111 238Z" fill="#365740" stroke="#365740" stroke-width="8"/><path d="M500 352V158M472 207L500 145 532 211Z M459 256L500 188 543 259Z M449 306L500 229 553 311Z" fill="#294a39" stroke="#294a39" stroke-width="7"/><path d="M260 333L272 291 284 337M330 345L343 308 349 348" fill="none" stroke="#718668" stroke-width="3"/>',
  ];
  const layers=planes.map((art,i)=>`<div class="duik-camera-plane" data-plane="${i}">${svg('0 0 544 300',`<g data-depth="${i}">${art}</g>`,['背景层：天空与远山','中景层：山坡、道路与小屋','前景层：近处树木'][i],'preserveAspectRatio="xMidYMid slice"')}<span class="duik-plane-label">${['远山 · 背景','小屋 · 中景','树木 · 前景'][i]}</span></div>`).join('');
  const finder=svg('0 0 600 360',`<path d="M32 74V32H74M526 32H568V74M568 286V328H526M74 328H32V286" fill="none" stroke="#fffdf8" stroke-width="2"/>
    <g data-art="composition-grid" stroke="#fffdf8" stroke-opacity=".4" fill="none"><path d="M210 32V328M390 32V328M32 130H568M32 230H568"/></g>
    <g data-art="view-target" transform="translate(300 180)" stroke="#fffdf8" stroke-width="1.5" fill="none"><circle r="9"/><path d="M-15 0H-6M6 0H15M0-15V-6M0 6V15"/></g>`,'摄像机取景框','class="duik-camera-overlay"');
  return `<div class="duik-camera-stage" data-motion-stage data-motion-drag="camera" data-camera-drag data-depth-view="flat" tabindex="0" role="group" aria-label="拖动风景控制视点，或用方向键移动，Home 键归中">
    <div class="duik-camera-space">${layers}</div>${finder}
    <div class="duik-camera-readout"><span>2D 视差</span><output data-output="camera-position">X 0 / Y 0</output></div><p class="duik-camera-hint">拖动画面，让远近错开</p>
    </div><div class="duik-motion-controls"><div class="duik-motion-row"><button type="button" data-action="depth" aria-pressed="false">拆开景层</button></div>
    <details class="duik-motion-adjust" data-motion-adjust><summary>用滑杆精确调整</summary><div class="duik-motion-adjust-body"><div class="duik-motion-parameters">${range('viewX','水平视点',-100,100,0)}${range('viewY','垂直视点',-70,70,0)}</div><label class="duik-motion-check"><input type="checkbox" data-input="grid" checked>构图辅助线</label></div></details></div>`;
}

export function renderMotion(kind = 'animation') {
  if (!MOTION_KINDS.includes(kind)) throw new TypeError(`Unknown motion demo: ${kind}`);
  const [category, title, href, link] = copy[kind];
  const content = kind === 'animation' ? animationMarkup() : kind === 'automation' ? automationMarkup() : cameraMarkup();
  return `<section class="duik-motion-demo" data-motion-demo="${kind}" data-playing="false" data-view="demo" aria-label="${category}：${title}"><div class="duik-motion-viewport">${officialMotionMarkup(kind).replace('data-motion-reference>','data-motion-reference hidden>')}<div data-motion-interactive>${content}</div></div><div class="duik-motion-foot"><div class="duik-motion-view-switch" role="group" aria-label="切换交互演示与真实面板"><button type="button" data-motion-view="reference" aria-pressed="false">查看真实面板</button><button type="button" data-motion-view="demo" aria-pressed="true" hidden>返回演示</button></div><a href="${href}">${link}</a></div><p class="duik-motion-boundary" data-motion-boundary>网页原理示意 · 非 AE / Duik 面板</p><div class="duik-motion-attribution" data-motion-attribution hidden>界面原图：Nicolas “Duduf” Dufresne / RxLaboratory · <a href="/docs/misc/doc-license">GFDL 1.3</a></div></section>`;
}

const mounts = new WeakMap();
export function mountMotion(host, kind = 'animation') {
  if (!MOTION_KINDS.includes(kind)) throw new TypeError(`Unknown motion demo: ${kind}`);
  if (!host?.ownerDocument) throw new TypeError('Motion demo requires a DOM host');
  mounts.get(host)?.();
  let root = host.matches?.(`[data-motion-demo="${kind}"]`) ? host : host.querySelector(`[data-motion-demo="${kind}"]`);
  if (!root) {host.innerHTML = renderMotion(kind);root = host.querySelector('[data-motion-demo]');}
  const doc = host.ownerDocument, win = doc.defaultView, lifetime = new win.AbortController();
  const state = {time: kind === 'animation' ? .32 : kind === 'automation' ? .5 : 0, mode: 'smooth', amplitude: 32, frequency: 2, loop: true, viewX: 0, viewY: 0, grid: true, depthOpen: false, playing: false};
  let disposed = false, raf = 0, last = null, pointer = null, curveKey = '', view = 'demo', direction = 1, generation = 0;
  let controlPointer = null;
  const heldKeys = new Set();
  let cameraStart = {viewX: 0, viewY: 0}, cameraNeedsStart = true;
  const media = win.matchMedia?.('(prefers-reduced-motion: reduce)');
  const q = selector => root.querySelector(selector);
  const all = selector => [...root.querySelectorAll(selector)];
  const stage = q('[data-motion-stage]') || root;
  const stageVisibleRatio = () => {
    const box=stage.getBoundingClientRect();
    if(box.width<=0||box.height<=0)return 0;
    const width=Math.max(0,Math.min(box.right,win.innerWidth)-Math.max(box.left,0));
    const height=Math.max(0,Math.min(box.bottom,win.innerHeight)-Math.max(box.top,0));
    return width*height/(box.width*box.height);
  };
  let visible=!win.IntersectionObserver&&stageVisibleRatio()>=.9;
  const number = n => Number(n).toFixed(2);
  const output = (name, value) => {const el=q(`[data-output="${name}"]`);if(el)el.textContent=value;};
  const setAttr = (selector, name, value) => q(selector)?.setAttribute(name, value);
  function syncInputs() {
    for (const el of all('[data-input]')) {
      const field=el.dataset.input;
      if(el.type==='checkbox')el.checked=state[field];
      else el.value=state[field];
    }
  }
  function paint(notify = false) {
    if (disposed) return;
    let sample;
    if (kind === 'animation') {
      sample=sampleAnimation(state.time,state.mode);
      const projected=animationStagePoint(sample);
      const reference=animationStagePoint(sampleAnimation(state.time,'linear'));
      setAttr('[data-art=traveler]','transform',`translate(${number(projected.x)} ${number(projected.y)}) rotate(${number(projected.angle)})`);
      setAttr('[data-art=reference-traveler]','transform',`translate(${number(reference.x)} ${number(reference.y)}) rotate(${number(reference.angle)})`);
      setAttr('[data-art=reference-traveler]','opacity',state.mode==='linear'?'0':'.8');
      stage.setAttribute('aria-valuenow',String(Math.round(sample.time*100)));
      if(curveKey!==state.mode){
        setAttr('[data-art=ease-curve]','d',easePath(state.mode));
        all('[data-sample-time]').forEach(dot=>{const p=animationStagePoint(sampleAnimation(Number(dot.dataset.sampleTime),state.mode));dot.setAttribute('cx',number(p.x));dot.setAttribute('cy',number(p.y));});
        curveKey=state.mode;
      }
      setAttr('[data-art=time-line]','x1',number(36+sample.time*528));setAttr('[data-art=time-line]','x2',number(36+sample.time*528));
      setAttr('[data-art=curve-dot]','cx',number(36+sample.time*528));setAttr('[data-art=curve-dot]','cy',number(64-sample.progress*48));
      output('progress',`${(sample.progress*100).toFixed(1)}%`);
      output('timing-label',state.mode==='linear'?'线性':'缓入缓出');
      all('[data-ease]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ease===state.mode)));
      root.dataset.progress=number(sample.progress);
    } else if (kind === 'automation') {
      sample=sampleAutomation(state);
      setAttr('[data-art=position]','transform',`translate(${number(300+sample.x)} 128)`);
      setAttr('[data-art=rotation]','transform',`rotate(${number(sample.rotation)})`);
      setAttr('[data-art=scale]','transform',`scale(${number(sample.scale)})`);
      setAttr('[data-art=suspension]','d',`M300 50L${number(300+sample.x)} 118`);
      setAttr('[data-art=mobile-shadow]','cx',number(300+sample.x*.6));
      stage.setAttribute('aria-valuenow',String(state.amplitude));
      const nextCurveKey=[state.amplitude,state.frequency,state.loop].join(':');
      if(curveKey!==nextCurveKey){setAttr('[data-art=wave-curve]','d',automationPath(state));curveKey=nextCurveKey;}
      setAttr('[data-art=wave-time]','x1',number(36+state.time/AUTOMATION_DURATION*528));setAttr('[data-art=wave-time]','x2',number(36+state.time/AUTOMATION_DURATION*528));
      output('amplitude',String(state.amplitude));output('frequency',`${state.frequency} 次/段`);
      output('position-value',`${sample.x>=0?'+':''}${Math.round(sample.x)} px`);output('rotation-value',`${sample.rotation>=0?'+':''}${Math.round(sample.rotation)}°`);output('scale-value',`${Math.round(sample.scale*100)}%`);
      root.dataset.offset=number(sample.x);
      all('[data-motion-preset]').forEach(button=>{const preset=AUTOMATION_PRESETS.find(item=>item.id===button.dataset.motionPreset);button.setAttribute('aria-pressed',String(preset?.amplitude===state.amplitude&&preset?.frequency===state.frequency));});
    } else {
      sample=cameraTransforms(state.viewX,state.viewY);
      sample.forEach((t,i)=>setAttr(`[data-depth="${i}"]`,'transform',`translate(${number(t.x)} ${number(t.y)})`));
      setAttr('[data-art=view-target]','transform',`translate(${number(300+state.viewX*.28)} ${number(180+state.viewY*.22)})`);
      setAttr('[data-art=composition-grid]','visibility',state.grid?'visible':'hidden');
      q('[data-camera-drag]').dataset.depthView=state.depthOpen?'exploded':'flat';
      const depthButton=q('[data-action=depth]');depthButton.textContent=state.depthOpen?'合回画面':'拆开景层';depthButton.setAttribute('aria-pressed',String(state.depthOpen));
      output('viewX',String(Math.round(state.viewX)));output('viewY',String(Math.round(state.viewY)));
      output('camera-position',`X ${Math.round(state.viewX)} / Y ${Math.round(state.viewY)}`);
      root.dataset.viewX=number(state.viewX);root.dataset.viewY=number(state.viewY);
    }
    root.dataset.playing=String(state.playing);root.dataset.time=number(state.time);root.dataset.mode=state.mode;
    syncInputs();
    if(notify)root.dispatchEvent(new win.CustomEvent('duik-motion-change',{bubbles:true,composed:true,detail:{kind,state:{...state},sample}}));
  }
  function canStart() {return !disposed&&view==='demo'&&visible&&stageVisibleRatio()>=.9&&!doc.hidden&&!media?.matches&&controlPointer===null&&heldKeys.size===0&&pointer===null;}
  function mayRun() {return state.playing&&canStart();}
  function stop(){generation++;state.playing=false;if(raf)win.cancelAnimationFrame(raf);raf=0;last=null;}
  function selectView(next, notify = false){
    view=next;root.dataset.view=view;
    q('[data-motion-reference]').hidden=view!=='reference';q('[data-motion-interactive]').hidden=view!=='demo';
    q('[data-motion-attribution]').hidden=view!=='reference';
    q('[data-motion-boundary]').textContent=view==='demo'?'网页原理示意 · 非 AE / Duik 面板':'在 After Effects 中使用 Duik';
    all('[data-motion-view]').forEach(item=>{item.setAttribute('aria-pressed',String(item.dataset.motionView===view));item.hidden=item.dataset.motionView===view;});
    if(view!=='demo')stop();
    paint(notify);syncFrame();
  }
  function syncFrame() {
    if(!mayRun()){if(state.playing){stop();paint();}else{if(raf)win.cancelAnimationFrame(raf);raf=0;last=null;}return;}
    if(!raf){const token=generation;raf=win.requestAnimationFrame(now=>{if(disposed||token!==generation)return;frame(now);});}
  }
  function frame(now) {
    raf=0;if(!mayRun()){stop();paint();return;}
    const delta=last===null?0:Math.min(100,Math.max(0,now-last))/1000;last=now;
    const duration=kind==='animation'?1:kind==='camera'?CAMERA_DURATION:AUTOMATION_DURATION;
    const amount=kind==='animation'?delta/ANIMATION_DURATION:delta;
    // Alternate the existing authored timeline so the next pass has no reset cut.
    state.time=clamp(state.time+amount*direction,0,duration);
    if(state.time>=duration)direction=-1;else if(state.time<=0)direction=1;
    if(kind==='camera')Object.assign(state,sampleCameraTour(state.time,cameraStart));
    paint();syncFrame();
  }
  const listen = (target,type,fn,options={}) => target.addEventListener(type,fn,{...options,signal:lifetime.signal});
  function autoLoop(){
    if(disposed)return;
    if(!canStart()){stop();paint();return;}
    if(!state.playing){
      if(kind==='camera'&&cameraNeedsStart){cameraStart={viewX:state.viewX,viewY:state.viewY};cameraNeedsStart=false;state.time=0;direction=1;}
      state.playing=true;last=null;paint();
    }
    syncFrame();
  }
  const adjustmentKeys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End','PageUp','PageDown'];
  function holdKey(event){heldKeys.add(event.key);stop();paint();}
  function clearControlHold(){controlPointer=null;heldKeys.clear();}
  // Merely hovering, tabbing to a control or reading its curve never pauses the
  // presentation. Only a held gesture/key owns the clock; releasing resumes it.
  listen(root,'pointerdown',event=>{
    if(!event.target.closest?.('[data-input]')||event.isPrimary===false||event.button!==0||controlPointer!==null)return;
    controlPointer=event.pointerId;stop();paint();
  });
  listen(root,'keydown',event=>{if(event.target.dataset?.input&&adjustmentKeys.includes(event.key))holdKey(event);});
  for(const type of ['pointerup','pointercancel'])listen(doc,type,event=>{if(event.pointerId===controlPointer){controlPointer=null;autoLoop();}});
  listen(doc,'keyup',event=>{if(heldKeys.delete(event.key))autoLoop();});
  listen(root,'focusout',()=>{if(heldKeys.size){heldKeys.clear();autoLoop();}});
  listen(root,'click',event=>{
    const button=event.target.closest?.('button');if(!button||!root.contains(button))return;
    if(button.dataset.motionView){
      selectView(button.dataset.motionView,true);
      q(`[data-motion-view="${view==='demo'?'reference':'demo'}"]`)?.focus({preventScroll:true});autoLoop();return;
    }
    if(button.dataset.ease){stop();state.mode=button.dataset.ease;paint(true);autoLoop();return;}
    if(button.dataset.motionPreset){const preset=AUTOMATION_PRESETS.find(item=>item.id===button.dataset.motionPreset);if(preset){stop();state.amplitude=preset.amplitude;state.frequency=preset.frequency;paint(true);autoLoop();}return;}
    if(button.dataset.action==='depth'){stop();state.depthOpen=!state.depthOpen;q('[data-camera-drag]').dataset.instant=String(event.detail===0);paint(true);autoLoop();}
  });
  listen(root,'input',event=>{
    const el=event.target,field=el.dataset?.input;if(!field)return;
    stop();
    if(field==='amplitude')state.amplitude=clamp(el.value,0,64);
    if(field==='frequency')state.frequency=Math.round(clamp(el.value,1,6));
    if(field==='viewX')state.viewX=clamp(el.value,-100,100);
    if(field==='viewY')state.viewY=clamp(el.value,-70,70);
    if(field==='viewX'||field==='viewY')cameraNeedsStart=true;
    if(field==='grid')state.grid=el.checked;
    paint(true);autoLoop();
  });
  const drag=q('[data-motion-drag]');
  let dragOrigin=null;
  const finishDrag=()=>{
    const previous=pointer;pointer=null;dragOrigin=null;if(drag)drag.dataset.dragging='false';
    if(previous!==null&&drag?.hasPointerCapture?.(previous))drag.releasePointerCapture(previous);
  };
  if(drag){
    const move=event=>{
      if(pointer!==event.pointerId||!dragOrigin)return;
      const box=drag.getBoundingClientRect();
      if(box.width<=0||box.height<=0)return;
      if(kind==='animation'){
        const scale=Math.min(box.width/600,box.height/360),left=box.left+(box.width-600*scale)/2;
        state.time=animationTimeAtX((event.clientX-left)/scale,state.mode);
      }else if(kind==='automation'){
        state.amplitude=Math.round(clamp(dragOrigin.amplitude+(event.clientX-dragOrigin.x)/box.width*128,0,64));
      }else{
        state.viewX=clamp(dragOrigin.viewX+(event.clientX-dragOrigin.x)/box.width*240,-100,100);
        state.viewY=clamp(dragOrigin.viewY+(event.clientY-dragOrigin.y)/box.height*175,-70,70);
        cameraNeedsStart=true;
      }
      paint(true);
    };
    listen(drag,'pointerdown',event=>{
      if(event.button!==0||event.isPrimary===false||pointer!==null)return;
      stop();pointer=event.pointerId;
      dragOrigin={x:event.clientX,y:event.clientY,amplitude:state.amplitude,viewX:state.viewX,viewY:state.viewY};
      drag.dataset.dragging='true';drag.dataset.instant=String(!!media?.matches);drag.setPointerCapture?.(pointer);drag.focus({preventScroll:true});move(event);
    });
    listen(drag,'pointermove',move);
    const finish=event=>{if(event.pointerId===pointer){finishDrag();autoLoop();}};
    listen(drag,'pointerup',finish);listen(drag,'pointercancel',finish);listen(drag,'lostpointercapture',event=>{if(pointer!==event.pointerId)return;pointer=null;dragOrigin=null;drag.dataset.dragging='false';autoLoop();});
    listen(drag,'keydown',event=>{
      if(event.target!==drag||!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))return;
      event.preventDefault();holdKey(event);drag.dataset.instant='true';
      const direction=['ArrowLeft','ArrowDown'].includes(event.key)?-1:1;
      if(kind==='animation')state.time=event.key==='Home'?0:event.key==='End'?1:clamp(state.time+direction*.02,0,1);
      else if(kind==='automation')state.amplitude=event.key==='Home'?0:event.key==='End'?64:clamp(state.amplitude+direction*2,0,64);
      else{
        if(event.key==='Home'){state.viewX=0;state.viewY=0;}
        else if(event.key==='ArrowLeft'||event.key==='ArrowRight')state.viewX=clamp(state.viewX+direction*5,-100,100);
        else if(event.key==='ArrowUp'||event.key==='ArrowDown')state.viewY=clamp(state.viewY+(event.key==='ArrowUp'?-5:5),-70,70);
        cameraNeedsStart=true;
      }
      paint(true);
    });
  }
  const observer=win.IntersectionObserver?new win.IntersectionObserver(entries=>{
    if(disposed)return;
    const relevant=entries.filter(entry=>entry.target===stage),entry=relevant.at(-1);if(!entry)return;
    if(relevant.some(item=>!item.isIntersecting||item.intersectionRatio<.9)){clearControlHold();finishDrag();stop();}
    visible=entry.isIntersecting&&entry.intersectionRatio>=.9;
    if(!visible){finishDrag();stop();paint();}
    autoLoop();
  },{threshold:[0,.05,.9]}):null;
  observer?.observe(stage);listen(doc,'visibilitychange',()=>{if(doc.hidden){clearControlHold();finishDrag();stop();paint();}autoLoop();});
  if(media?.addEventListener)listen(media,'change',event=>{if(event.matches){clearControlHold();finishDrag();stop();}paint(true);autoLoop();});
  if(win.addEventListener)listen(win,'blur',event=>{if(event.target===win){clearControlHold();finishDrag();stop();paint();}});
  if(win.addEventListener)listen(win,'focus',event=>{if(event.target===win)autoLoop();});
  // Timeline numbers change every frame; ranges/buttons remain the accessible controls.
  all('output').forEach(el=>el.setAttribute('aria-live','off'));
  root.dataset.motionMounted='true';selectView('demo');autoLoop();
  const cleanup=()=>{
    if(disposed)return;clearControlHold();finishDrag();stop();disposed=true;
    observer?.disconnect();lifetime.abort();delete root.dataset.motionMounted;root.dataset.playing='false';
    if(mounts.get(host)===cleanup)mounts.delete(host);
  };
  mounts.set(host,cleanup);return cleanup;
}
