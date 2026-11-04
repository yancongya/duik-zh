// Product-specific learning, FAQ and footer surfaces.
// Reading routes use the existing official icon set; screenshots stay in closed references.
// Pure deterministic markup is shared by the local SSR publisher and Vue host.
import {textSlots} from './content.mjs';

const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

export const guidePaths = [
  {id:'install', label:'第一次使用', description:'装好主面板，再认识 Duik 的工作方式。', note:'安装入口：File / Scripts / Install ScriptUI Panel…。安装后重启 AE，从 Window 菜单打开。脚本权限与语言设置见安装指南。', steps:[
    {title:'安装 Duik Angela.jsx', detail:'从官方下载包中选择 ScriptUI Panels 内的主面板；按指南安装后重启 AE。', href:'/docs/getting-started/install'},
    {title:'从 Window 菜单打开面板', detail:'认识顶部八类工具，再根据已选图层、属性或关键帧使用对应功能。', href:'/docs/getting-started/first-look'},
    {title:'了解工作方式', detail:'分清 Duik 处理的任务，以及项目需要自己准备的部分。', href:'/docs/getting-started/introduction'},
  ]},
  {id:'rig', label:'让角色动起来', description:'从骨骼结构开始，把美术图层交给控制器。', note:'建议阅读路线，不是唯一绑定顺序。', steps:[
    {title:'建立骨骼结构', detail:'了解骨骼如何驱动美术图层，以及从 OCO 预设骨架起步的方式。', href:'/docs/guide/bones'},
    {title:'链接图形（Link Art）', detail:'通过父子链接，将美术图层与 Duik 图钉关联到骨骼。', href:'/docs/guide/bones/tools/link-art'},
    {title:'进入自动绑定', detail:'按角色结构选择绑定工具，再检查控制器与运动关系。', href:'/docs/guide/bones/autorig'},
  ]},
  {id:'animation', label:'打磨动作节奏', description:'从关键帧入手，再让动作更自然、更易复用。', note:'按当前动画任务选择，不要求逐篇完成。', steps:[
    {title:'动画与关键帧', detail:'查阅插值、补间和动画面板的工具。', href:'/docs/guide/animation'},
    {title:'自动化与表达式', detail:'了解通过规则驱动属性的工具。', href:'/docs/guide/automation'},
    {title:'整理动画片段', detail:'认识动画库中的保存、分类和应用流程。', href:'/docs/guide/animation/anim-library'},
  ]},
  {id:'tools', label:'减少重复操作', description:'从裁掉预合成空白开始，也可直接选择其他工具。', note:'按需选择，不是操作顺序。', choices:true, steps:[
    {title:'裁剪预合成', detail:'了解裁剪范围与合成位置的处理。', href:'/docs/guide/tools/composition/crop'},
    {title:'图层工具', detail:'按需要创建、命名、标记和组织图层。', href:'/docs/guide/tools/layers'},
    {title:'批量重命名', detail:'整理图层与项目中的名称。', href:'/docs/guide/tools/text/rename'},
    {title:'使用脚本编辑器', detail:'在脚本工具中编辑和组织代码。', href:'/docs/guide/tools/scripting/script-editor'},
  ]},
  {id:'api', label:'扩展自己的流程', description:'先完成初始化，再把常用操作接进 AE 脚本。', note:'适合已有 AE 脚本基础的读者。', steps:[
    {title:'准备 API 环境', detail:'确认 Duik API 的包含、初始化与使用前提。', href:'/docs/advanced/api/getting-started'},
    {title:'按功能查找 API', detail:'从功能与命名空间找到适合任务的入口。', href:'/docs/advanced/api/duik-features'},
    {title:'了解无界面脚本', detail:'继续阅读不依赖完整面板的脚本用法与边界。', href:'/docs/advanced/api/headless-scripts'},
  ]},
];

export const guideAssetSources = [{src:'/duik-experience/official/duik/home.png', file:'components/home/landing/official-media/duik/home.png', source:'src-docs/docs/img/duik/home.png', document:'/docs/getting-started/first-look', width:292, height:529, credit:'Nicolas “Duduf” Dufresne 与贡献者 / RxLaboratory', license:'GFDL-1.3', role:'官方 Duik 主页面板截图，保持原比例，不是网页模拟面板'}];

function pathReference(path) {
  if (path.id !== 'install') return '<p class="duik-guide-path-note">' + escape(path.note) + '</p>';
  const asset = guideAssetSources[0];
  return '<details class="duik-guide-reference" data-guide-reference><summary>安装说明与官方面板</summary><div class="duik-guide-reference-body"><p>' + escape(path.note) + '</p><figure class="duik-guide-official-preview"><a href="' + asset.document + '"><img src="' + asset.src + '" width="' + asset.width + '" height="' + asset.height + '" alt="官方 Duik 主页面板，顶部排列八类工具入口" loading="lazy" decoding="async"></a><figcaption><span>官方面板截图 · <a href="' + asset.document + '">查看界面说明</a></span><span>' + escape(asset.credit) + ' · <a href="/docs/misc/doc-license">GFDL 1.3</a></span></figcaption></figure></div></details>';
}

// Task markers are not a claim that these five routes are Duik's main panels.
export const guideTaskIcons = Object.freeze({install:'tools', rig:'bone', animation:'animation', tools:'tools', api:'cmd'});
const taskIcon = path => '<img class="duik-guide-task-icon" src="/duik-experience/icons/' + guideTaskIcons[path.id] + '.svg" width="24" height="24" alt="" loading="lazy" decoding="async">';

function pathPanel(path, index) {
  const [next, ...following] = path.steps;
  const list = path.choices ? 'ul' : 'ol';
  const routeTitle = path.choices ? '或直接查看' : '接着阅读';
  return '<div class="duik-guide-path-panel" id="duik-guide-panel-' + path.id + '" role="tabpanel" aria-labelledby="duik-guide-tab-' + path.id + '" tabindex="0" data-guide-panel="' + path.id + '"' + (index ? ' hidden' : '') + '>' +
    '<div class="duik-guide-reading-spread">' +
      '<a class="duik-guide-next" data-guide-next="' + path.id + '" data-guide-reading href="' + next.href + '">' +
        '<div class="duik-guide-next-copy"><h3>' + escape(next.title) + '</h3><p>' + escape(path.description) + '</p><span class="duik-guide-next-action">开始阅读 ' + arrow + '</span></div>' +
      '</a>' +
      '<nav class="duik-guide-route" data-guide-route="' + path.id + '" aria-label="' + (path.choices ? '其他工具文档' : '后续阅读路线') + '"><h4>' + routeTitle + '</h4><' + list + (path.choices ? '' : ' start="2"') + ' class="duik-guide-reading-list' + (path.choices ? ' is-choices' : '') + '">' +
      following.map(step => '<li><a data-guide-reading href="' + step.href + '"><span class="duik-guide-route-copy"><strong>' + escape(step.title) + '</strong></span>' + arrow + '</a></li>').join('') +
      '</' + list + '></nav>' +
    '</div><div class="duik-guide-route-footnote">' + pathReference(path) + '</div>' +
  '</div>';
}

export const learningMarkup = '<section class="duik-guide duik-guide-learning" data-duik-guide="learning" aria-labelledby="duik-guide-learning-title">' +
  '<header class="duik-guide-heading"><h2 id="duik-guide-learning-title">从下一篇开始。</h2><p>选一个任务，从对应文档继续。</p></header>' +
  '<div class="duik-guide-learning-desk">' +
    '<div class="duik-guide-path-tabs" role="tablist" aria-label="选择学习任务" aria-orientation="horizontal">' +
      guidePaths.map((path,index) => '<button type="button" role="tab" id="duik-guide-tab-' + path.id + '" aria-controls="duik-guide-panel-' + path.id + '" aria-selected="' + !index + '" tabindex="' + (index ? '-1' : '0') + '" data-guide-path="' + path.id + '">' +
      taskIcon(path) + '<span class="duik-guide-task-label"><strong>' + escape(path.label) + '</strong></span></button>').join('') +
    '</div><div class="duik-guide-path-panels">' + guidePaths.map(pathPanel).join('') + '</div>' +
  '</div><div class="duik-guide-learning-bottom"><a href="/docs">查看完整中文文档 ' + arrow + '</a></div><p class="duik-guide-sr-only" aria-live="polite" data-guide-path-status></p>' +
'</section>';

export const guideFaqGroups = [
  {id:'start', label:'开始使用', description:'安装、基础与使用方式'},
  {id:'character', label:'角色与项目', description:'素材、调整与项目移交'},
  {id:'about', label:'工具与本站', description:'能力边界与内容来源'},
];
export const guideFaqItems = [
  {id:'scope', group:'about', question:658, answer:657, href:'/docs/getting-started/first-look', link:'认识工具面板'},
  {id:'basics', group:'start', question:663, answer:662, href:'/docs/getting-started/introduction', link:'阅读入门介绍'},
  {id:'adjust', group:'character', question:667, answer:666, href:'/docs/guide/bones/autorig', link:'了解自动绑定'},
  {id:'web', group:'about', question:671, answer:670, href:'/docs/getting-started/introduction', link:'了解 Duik 的工作方式'},
  {id:'artwork', group:'character', question:675, answer:674, href:'/docs/guide/bones', link:'查看骨骼与素材准备'},
  {id:'individual', group:'start', question:679, answer:678, href:'/docs/getting-started/install', link:'查看安装选项'},
  {id:'handoff', group:'character', question:683, answer:682, href:'/docs/getting-started/introduction', link:'了解绑定项目的使用'},
  {id:'scripts', group:'about', question:687, answer:686, href:'/docs/advanced/api/getting-started', link:'开始了解脚本 API'},
  {id:'download', group:'start', question:691, answer:690, href:'/docs/getting-started/install', link:'查看官方获取与安装说明'},
  {id:'unofficial', group:'about', question:695, answer:694, href:'/docs/misc/doc-license', link:'阅读文档协议'},
  {id:'compatibility', group:'start', question:699, answer:698, href:'/docs/getting-started/install', link:'核对安装与兼容要求'},
];

export const faqMarkup = `<section class="duik-guide duik-guide-faq" data-duik-guide="faq" data-faq-active="start" aria-labelledby="duik-guide-faq-title"><aside class="duik-guide-faq-intro"><h2 id="duik-guide-faq-title">开始之前，先确认这些。</h2><a href="/docs/faq">查看完整常见问题 ${arrow}</a><div class="duik-guide-faq-index" role="group" aria-label="筛选问题分类"><button type="button" data-guide-faq-filter="all" aria-pressed="false">全部问题 <span>11</span></button>${guideFaqGroups.map(group=>`<button type="button" data-guide-faq-filter="${group.id}" aria-pressed="${group.id==='start'}">${group.label}<span>${guideFaqItems.filter(item=>item.group===group.id).length}</span></button>`).join('')}</div></aside><div class="duik-guide-faq-content"><div class="duik-guide-faq-toolbar"><p data-guide-faq-status aria-live="polite">开始使用 ${guideFaqItems.filter(item=>item.group==='start').length} 个问题</p><button type="button" data-guide-faq-collapse>收起全部</button></div>${guideFaqGroups.map((group,index)=>`<section class="duik-guide-faq-group" data-guide-faq-group="${group.id}"${group.id==='start'?'':' hidden'} aria-labelledby="duik-guide-faq-group-${group.id}"><h3 id="duik-guide-faq-group-${group.id}">${group.label}</h3>${guideFaqItems.filter(item=>item.group===group.id).map((item,itemIndex)=>`<details class="duik-guide-faq-item" data-guide-faq-item="${item.id}"><summary><span>${escape(textSlots[item.question])}</span><span class="duik-guide-faq-toggle" aria-hidden="true"></span></summary><div class="duik-guide-faq-answer"><p>${escape(textSlots[item.answer])}</p><a href="${item.href}">${item.link} ${arrow}</a></div></details>`).join('')}</section>`).join('')}</div></section>`;


export const footerMarkup = `<footer class="duik-guide duik-guide-footer" data-duik-guide="footer" aria-labelledby="duik-guide-footer-title"><div class="duik-guide-endplate"><div><h2 id="duik-guide-footer-title">把方法，带回你的下一帧。</h2><p>从安装开始，把这里看到的方法用在工程里。</p><div class="duik-guide-footer-actions"><a class="duik-guide-primary-link" href="/docs/getting-started/install">安装并开始使用 ${arrow}</a><a href="https://rxlaboratory.org/tools/duik-angela/" target="_blank" rel="noopener noreferrer">到官方获取 Duik ${arrow}</a></div></div></div><div class="duik-guide-footer-directory"><a class="duik-guide-footer-brand" href="/" aria-label="Duik Ángela 非官方中文指南首页"><strong>Duik <span>Ángela</span></strong><span>非官方中文指南</span></a><nav aria-label="页脚文档导航"><h3>从这里继续</h3><a href="/docs/getting-started/install">安装指南</a><a href="/docs/guide/bones">角色绑定</a><a href="/docs/guide/animation">动画工具</a><a href="/docs/guide/tools">效率工具</a><a href="/docs/advanced/api/getting-started">脚本 API</a></nav><nav aria-label="官方与文档来源"><h3>来源与说明</h3><a href="https://rxlaboratory.org/tools/duik-angela/" target="_blank" rel="noopener noreferrer">RxLaboratory 官方</a><a href="https://github.com/RxLaboratory/Duik" target="_blank" rel="noopener noreferrer">上游源代码与文档</a><a href="/docs/misc/credits">上游致谢</a><a href="/docs/misc/license">软件许可证</a><a href="/docs/misc/doc-license">文档协议</a></nav></div><div class="duik-guide-legal"><div><p>本站是 Duik Ángela 的非官方中文文档站，不代表 RxLaboratory，也不提供安装包镜像。</p><p>软件由 RxLaboratory 开发，以 GPLv3 分发。上游文档及图标归属 Nicolas “Duduf” Dufresne 与贡献者；本站译文保留上游署名，依据 <a href="/docs/misc/doc-license">GFDL 1.3</a> 发布。</p></div><a href="#" data-guide-top>回到顶部 ${arrow}</a></div></footer>`;

const markups = {learning:learningMarkup, faq:faqMarkup, footer:footerMarkup};
const mounted = new WeakMap();

export function renderGuide(kind) {
  if (!Object.hasOwn(markups, kind)) throw new Error(`Unknown Duik guide: ${kind}`);
  return markups[kind];
}

// Ownership is limited to this surface. All listeners clean up; no timers or AE calls.
export function mountGuide(host, kind) {
  if (!Object.hasOwn(markups, kind)) throw new Error(`Unknown Duik guide: ${kind}`);
  const selector = `[data-duik-guide="${kind}"]`;
  const root = host?.matches?.(selector) ? host : host?.querySelector?.(selector);
  if (!root) return () => {};
  if (mounted.has(root)) return mounted.get(root);
  const listeners = [];
  const listen = (target, event, handler) => {
    target.addEventListener(event, handler);
    listeners.push(() => target.removeEventListener(event, handler));
  };
  if (kind === 'learning') {
    const tabs = [...root.querySelectorAll('[data-guide-path]')];
    const panels = [...root.querySelectorAll('[data-guide-panel]')];
    const status = root.querySelector('[data-guide-path-status]');
    const doc = root.ownerDocument;
    const view = doc?.defaultView;
    const reducedMotion = view?.matchMedia?.('(prefers-reduced-motion: reduce)');
    let visible = !view?.IntersectionObserver;
    let feedback = null;
    let selectedIndex = Math.max(0, tabs.findIndex(tab => tab.getAttribute('aria-selected') === 'true'));
    root.dataset.guideActive = tabs[selectedIndex]?.dataset.guidePath || '';
    root.dataset.guideInput = 'keyboard';
    root.dataset.guideVisible = String(visible);
    root.dataset.guideMotion = reducedMotion?.matches ? 'reduced' : 'idle';
    const stopFeedback = (reason = 'idle') => {
      const current = feedback;
      feedback = null;
      current?.cancel();
      root.dataset.guideMotion = reason;
    };
    const showFeedback = (panel, direction) => {
      if (reducedMotion?.matches || doc?.hidden || !visible || !panel?.animate) return;
      const ease = view?.getComputedStyle?.(root)?.getPropertyValue('--ease-out')?.trim() || 'cubic-bezier(.23,1,.32,1)';
      const animation = panel.animate([{opacity:.65, transform:'translateX(' + (direction * 8) + 'px)'}, {opacity:1, transform:'translateX(0)'}], {duration:180, easing:ease});
      feedback = animation;
      root.dataset.guideMotion = 'active';
      animation.onfinish = () => {
        if (feedback !== animation) return;
        feedback = null;
        root.dataset.guideMotion = 'idle';
      };
    };
    const select = (tab, {focus = false, pointer = false} = {}) => {
      const nextIndex = tabs.indexOf(tab);
      const changed = nextIndex !== selectedIndex;
      const direction = nextIndex > selectedIndex ? 1 : -1;
      const id = tab.dataset.guidePath;
      stopFeedback(reducedMotion?.matches ? 'reduced' : 'idle');
      root.dataset.guideInput = pointer ? 'pointer' : 'keyboard';
      root.dataset.guideActive = id;
      for (const candidate of tabs) {
        candidate.setAttribute('aria-selected', String(candidate === tab));
        candidate.tabIndex = candidate === tab ? 0 : -1;
      }
      for (const panel of panels) panel.hidden = panel.dataset.guidePanel !== id;
      selectedIndex = nextIndex;
      if (status) status.textContent = '已选择：' + (guidePaths.find(path => path.id === id)?.label || id);
      if (focus) tab.focus({preventScroll:true});
      if (changed && pointer) showFeedback(panels.find(panel => panel.dataset.guidePanel === id), direction);
    };
    listen(root, 'pointerdown', () => {
      root.dataset.guideInput = 'pointer';
      stopFeedback();
    });
    listen(root, 'keydown', () => {
      root.dataset.guideInput = 'keyboard';
      stopFeedback(reducedMotion?.matches ? 'reduced' : 'idle');
    });
    listen(root, 'focusin', () => stopFeedback(reducedMotion?.matches ? 'reduced' : 'idle'));
    if (doc?.addEventListener) listen(doc, 'visibilitychange', () => {
      if (doc.hidden) stopFeedback('hidden');
    });
    if (reducedMotion?.addEventListener) listen(reducedMotion, 'change', () => stopFeedback(reducedMotion.matches ? 'reduced' : 'idle'));
    if (view?.IntersectionObserver) {
      const observer = new view.IntersectionObserver(entries => {
        const entry = entries.find(item => item.target === root);
        if (!entry) return;
        visible = entry.isIntersecting;
        root.dataset.guideVisible = String(visible);
        if (!visible) stopFeedback('offscreen');
      });
      observer.observe(root);
      listeners.push(() => observer.disconnect());
    }
    listeners.push(() => stopFeedback());
    tabs.forEach((tab, index) => {
      listen(tab, 'click', event => select(tab, {pointer:event.detail !== 0}));
      listen(tab, 'keydown', event => {
        let next = index;
        if (['ArrowDown','ArrowRight'].includes(event.key)) next = (index + 1) % tabs.length;
        else if (['ArrowUp','ArrowLeft'].includes(event.key)) next = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = tabs.length - 1;
        else return;
        event.preventDefault();
        select(tabs[next], {focus:true});
      });
    });
  } else if (kind === 'faq') {
    const filters = [...root.querySelectorAll('[data-guide-faq-filter]')];
    const groups = [...root.querySelectorAll('[data-guide-faq-group]')];
    const items = [...root.querySelectorAll('[data-guide-faq-item]')];
    const status = root.querySelector('[data-guide-faq-status]');
    filters.forEach(button => listen(button, 'click', () => {
      const id = button.dataset.guideFaqFilter;
      root.dataset.faqActive = id;
      for (const candidate of filters) candidate.setAttribute('aria-pressed', String(candidate === button));
      for (const group of groups) group.hidden = id !== 'all' && group.dataset.guideFaqGroup !== id;
      const count = id === 'all' ? guideFaqItems.length : guideFaqItems.filter(item => item.group === id).length;
      const label = guideFaqGroups.find(group => group.id === id)?.label || '全部';
      if (status) status.textContent = `${label} ${count} 个问题`;
    }));
    const collapse = root.querySelector('[data-guide-faq-collapse]');
    if (collapse) listen(collapse, 'click', () => {
      for (const item of items) item.open = false;
      if (status) status.textContent = '已收起全部回答；选择问题可重新展开。';
    });
  } else {
    const top = root.querySelector('[data-guide-top]');
    const view = root.ownerDocument?.defaultView;
    if (top && view) listen(top, 'click', event => {
      event.preventDefault();
      const reduced = view.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (view.lenis?.scrollTo) view.lenis.scrollTo(0, {immediate:!!reduced, force:true});
      else view.scrollTo({top:0, behavior:reduced ? 'auto' : 'smooth'});
    });
  }
  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    for (const remove of listeners.splice(0)) remove();
    mounted.delete(root);
  };
  mounted.set(root, cleanup);
  return cleanup;
}
