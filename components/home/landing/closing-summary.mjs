// The closing surface is a reading index, not another demonstration chapter.
// Existing catalog, learning and API implementations retain their source data
// and controls; only their repeated chapter introductions are removed here.
import {catalogMarkup, mountCatalog} from './experience-catalog.mjs';
import {learningMarkup, mountGuide, guideFaqGroups, guideFaqItems} from './guide-experience.mjs';
import {apiMarkup, mountApi} from './api-cinema.mjs';
import {textSlots} from './content.mjs';

const escape = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[character]));
function replaceOnce(source, expected, replacement, label) {
  const first = source.indexOf(expected);
  if (first < 0 || source.indexOf(expected, first + expected.length) >= 0) throw new Error('Closing source contract changed: ' + label);
  return source.slice(0, first) + replacement + source.slice(first + expected.length);
}

const compactCatalog = replaceOnce(catalogMarkup,
  '<div class="duik-catalog-heading"><h2>找到眼前这件事的工具。</h2><p>选一个主面板，或直接搜索工具名称。</p></div>', '', 'catalog introduction');
const compactLearning = replaceOnce(replaceOnce(learningMarkup,
  '<header class="duik-guide-heading"><h2 id="duik-guide-learning-title">从下一篇开始。</h2><p>选一个任务，从对应文档继续。</p></header>', '', 'learning introduction'),
  'aria-labelledby="duik-guide-learning-title"', 'aria-labelledby="duik-closing-learning-title"', 'learning label');
const compactApi = replaceOnce(apiMarkup,
  '<div class="duik-api-cinema-intro"><h2>面板之外，也能写进脚本。</h2><p>把绑定、动画和图层操作，接进自己的工具。</p></div>', '', 'API introduction');

// ID ownership: toolkit and api live here; learning is a new secondary anchor.
// inside-ae remains owned by the introductory/rigging section, never aliased.
export const closingIndexMarkup = `<section id="toolkit" class="duik-closing duik-closing-index" data-closing-index aria-labelledby="duik-closing-index-title">
  <header class="duik-closing-heading"><h2 id="duik-closing-index-title">找到需要的工具</h2><p>按名称搜索，或从八个主面板进入文档。</p></header>
  ${compactCatalog}
  <div class="duik-closing-secondary">
    <details id="learning" class="duik-closing-disclosure" data-closing-learning>
      <summary id="duik-closing-learning-title"><strong>按任务开始阅读</strong><span>安装、绑定、动画、工具与脚本</span></summary>
      <div class="duik-closing-disclosure-body">${compactLearning}</div>
    </details>
    <details id="api" class="duik-closing-disclosure" data-closing-api>
      <summary id="duik-closing-api-title"><strong>把常用操作写进脚本</strong><span>API 示例与运行前提</span></summary>
      <div class="duik-closing-disclosure-body">${compactApi}</div>
    </details>
  </div>
</section>`;

const faqItem = item => `<details id="faq-${item.id}" class="duik-closing-question" data-closing-question="${item.id}"><summary>${escape(textSlots[item.question])}</summary><div class="duik-closing-answer"><p>${escape(textSlots[item.answer])}</p><a href="${item.href}">${escape(item.link)}</a></div></details>`;
const startingQuestions = guideFaqItems.filter(item => item.group === 'start');
const otherGroups = guideFaqGroups.filter(group => group.id !== 'start');
export const closingStartMarkup = `<section id="faq" class="duik-closing duik-closing-start" data-closing-start aria-labelledby="duik-closing-start-title">
  <header class="duik-closing-heading"><h2 id="duik-closing-start-title">开始使用</h2><p>安装 Duik，把这里看到的方法带回 After Effects。</p></header>
  <div class="duik-closing-start-actions"><a class="duik-closing-primary" href="/docs/getting-started/install">安装指南</a><a href="https://rxlaboratory.org/tools/duik-angela/" target="_blank" rel="noopener noreferrer">到官方获取 Duik</a></div>
  <div class="duik-closing-questions" aria-label="开始使用前的常见问题">${startingQuestions.map(faqItem).join('')}</div>
  <details class="duik-closing-disclosure duik-closing-more" data-closing-more-faq><summary><strong>更多问题</strong><span>角色、项目与本站说明</span></summary><div class="duik-closing-faq-groups">${otherGroups.map(group => `<section aria-labelledby="duik-closing-faq-${group.id}"><h3 id="duik-closing-faq-${group.id}">${escape(group.label)}</h3>${guideFaqItems.filter(item => item.group === group.id).map(faqItem).join('')}</section>`).join('')}<a class="duik-closing-faq-document" href="/docs/faq">查看完整常见问题</a></div></details>
</section>`;

const indexMounts = new WeakMap(), startMounts = new WeakMap();
function surface(host, selector, markup) {
  if (!host?.querySelector) return null;
  if (host.matches?.(selector)) return host;
  let root = host.querySelector(selector);
  if (!root) { host.innerHTML = markup; root = host.querySelector(selector); }
  return root;
}

// Hash links remain real links. Open their containing disclosures before the
// browser aligns the target, then focus after layout without another scroll.
// The document click listener also handles clicking an already-current hash.
function mountHashNavigation(root, sync) {
  const doc = root.ownerDocument, view = doc?.defaultView;
  if (!view) return () => {};
  let disposed = false, frame = 0, generation = 0;
  const listeners = [];
  const listen = (target, type, callback) => {
    if (!target?.addEventListener) return;
    target.addEventListener(type, callback);
    listeners.push(() => target.removeEventListener(type, callback));
  };
  const find = hash => {
    let id;
    try { id = decodeURIComponent(hash.replace(/^#/, '')); } catch { return null; }
    if (!id) return null;
    return root.id === id ? root : [...root.querySelectorAll('[id]')].find(element => element.id === id) || null;
  };
  const reveal = hash => {
    if (disposed) return;
    const target = find(hash);
    if (!target) return;
    for (let ancestor = target; ancestor && root.contains(ancestor); ancestor = ancestor.parentElement) {
      if (ancestor.matches('details')) ancestor.open = true;
    }
    sync();
    const token = ++generation;
    if (frame) view.cancelAnimationFrame?.(frame);
    const focus = () => {
      frame = 0;
      if (disposed || token !== generation) return;
      for (let ancestor = target; ancestor && root.contains(ancestor); ancestor = ancestor.parentElement) {
        if (ancestor.matches('details') && !ancestor.open) return;
      }
      const focusTarget = target.matches('details') ? target.querySelector('summary') : target;
      if (!focusTarget) return;
      if (!focusTarget.matches('a,button,input,summary,[tabindex]')) focusTarget.setAttribute('tabindex', '-1');
      target.scrollIntoView?.({block:'start', behavior:'auto'});
      focusTarget.focus?.({preventScroll:true});
    };
    if (view.requestAnimationFrame) frame = view.requestAnimationFrame(focus); else focus();
  };
  listen(view, 'hashchange', () => reveal(view.location?.hash || ''));
  listen(doc, 'click', event => {
    if (event.defaultPrevented || event.button > 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.hasAttribute('download') || (link.getAttribute('target') && link.getAttribute('target') !== '_self')) return;
    try {
      const current = new URL(view.location.href), destination = new URL(link.getAttribute('href'), current);
      if (destination.origin === current.origin && destination.pathname === current.pathname && destination.search === current.search) reveal(destination.hash);
    } catch { /* Non-URL links retain their native behavior. */ }
  });
  reveal(view.location?.hash || '');
  return () => {
    if (disposed) return;
    disposed = true; generation += 1;
    if (frame) view.cancelAnimationFrame?.(frame);
    frame = 0;
    for (const remove of listeners) remove();
  };
}

export function mountClosingIndex(host) {
  const root = surface(host, '[data-closing-index]', closingIndexMarkup);
  if (!root) return () => {};
  if (indexMounts.has(root)) return indexMounts.get(root);
  let disposed = false;
  const catalogCleanup = mountCatalog(root);
  const disclosures = [
    {element:root.querySelector('[data-closing-learning]'), start:element => mountGuide(element, 'learning'), cleanup:null},
    {element:root.querySelector('[data-closing-api]'), start:element => mountApi(element), cleanup:null},
  ];
  const sync = () => {
    if (disposed) return;
    for (const entry of disclosures) {
      if (entry.element.open && !entry.cleanup) entry.cleanup = entry.start(entry.element);
      else if (!entry.element.open && entry.cleanup) { const cleanup = entry.cleanup; entry.cleanup = null; cleanup(); }
      entry.element.dataset.closingMounted = String(!!entry.cleanup);
    }
  };
  for (const entry of disclosures) entry.element.addEventListener('toggle', sync);
  sync();
  const hashCleanup = mountHashNavigation(root, sync);
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    hashCleanup(); catalogCleanup();
    for (const entry of disclosures) {
      entry.element.removeEventListener('toggle', sync);
      entry.cleanup?.(); entry.cleanup = null;
      entry.element.dataset.closingMounted = 'false';
    }
    if (indexMounts.get(root) === cleanup) indexMounts.delete(root);
  };
  indexMounts.set(root, cleanup);
  return cleanup;
}

export function mountClosingStart(host) {
  const root = surface(host, '[data-closing-start]', closingStartMarkup);
  if (!root) return () => {};
  if (startMounts.has(root)) return startMounts.get(root);
  const hashCleanup = mountHashNavigation(root, () => {});
  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true; hashCleanup();
    if (startMounts.get(root) === cleanup) startMounts.delete(root);
  };
  startMounts.set(root, cleanup);
  return cleanup;
}
