import { panels, tools, toolGroups, searchTools } from './tool-catalog.mjs';
import {catalogBannerMarkup,mountCatalogBanner} from './catalog-banner.mjs';

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const icon = panel => '<img src="/duik-experience/icons/' + panel.icon + '.svg" width="24" height="24" alt="" loading="lazy" decoding="async">';
const panelCount = panel => tools.filter(tool => tool.panel === panel.id).length;
const catalogArrow='<svg class="duik-catalog-link-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
// The banner explains the selected category; search results remain a still reading surface.
export const catalogPanelSummaries = Object.freeze({
  bones:'为分层角色搭建驱动结构。',
  constraints:'让图层与属性相互驱动。',
  controllers:'用控制器直接调整角色姿态。',
  automation:'用程序化动画减少重复关键帧。',
  animation:'整理关键帧，调整动作节奏。',
  camera:'为平面场景设计镜头运动。',
  tools:'处理合成、图层、文本和脚本。',
  command:'搜索功能，快速找到工具。',
});

function resultMarkup(results) {
  if (!results.length) return '<div class="duik-catalog-empty"><strong>没有找到匹配的工具</strong><p>试试“骨骼”“抖动”“裁剪”，或英文名称。</p><button type="button" data-catalog-reset>清空筛选，查看全部工具</button></div>';
  return panels.map(panel => {
    const matches = results.filter(tool => tool.panel === panel.id);
    if (!matches.length) return '';
    const groups = panel.id === 'tools' ? toolGroups : [{ id: undefined, title: panel.title }];
    return groups.map(group => {
      const entries = matches.filter(tool => tool.group === group.id);
      if (!entries.length) return '';
      return '<section class="duik-catalog-group"><h4>' + escapeHtml(panel.id === 'tools' ? panel.title + ' / ' + group.title : panel.title) + '</h4><ul>' + entries.map(tool => '<li><a data-catalog-result href="' + tool.href + '"><span class="duik-catalog-tool-title"><strong>' + escapeHtml(tool.title) + '</strong><span lang="en">' + escapeHtml(tool.english) + '</span></span><span class="duik-catalog-tool-description">' + escapeHtml(tool.summary) + '</span><span class="duik-catalog-open" aria-hidden="true">' + catalogArrow + '</span></a></li>').join('') + '</ul></section>';
    }).join('');
  }).join('');
}

const panelLabels={bones:'骨骼',constraints:'链接与约束',controllers:'控制器',automation:'自动化',animation:'动画',camera:'摄像机',tools:'通用工具',command:'命令行'};
export const catalogMarkup = '<section class="duik-tool-catalog" data-duik-catalog data-catalog-active="bones" data-catalog-input="keyboard" aria-label="Duik 工具目录">' +
  '<div class="duik-catalog-heading"><h2>找到眼前这件事的工具。</h2><p>选一个主面板，或直接搜索工具名称。</p></div>' +
  '<div class="duik-catalog-index" data-catalog-index><div class="duik-catalog-workbench">' +
    '<form class="duik-catalog-search" role="search" aria-label="搜索 Duik 工具文档"><label><span class="duik-catalog-search-label">搜索工具文档</span><input data-catalog-query type="search" placeholder="骨骼、抖动、裁剪，或英文名称" aria-controls="duik-catalog-results" autocomplete="off" spellcheck="false" enterkeyhint="go"></label><button type="button" data-catalog-clear disabled>清空</button></form>' +
    catalogBannerMarkup() +
    '<div class="duik-catalog-categories" role="group" aria-label="选择主面板">' + panels.map(panel => '<button type="button" data-catalog-panel="' + panel.id + '" aria-label="' + panel.title + '" aria-controls="duik-catalog-results" aria-pressed="' + (panel.id === 'bones') + '" tabindex="' + (panel.id === 'bones' ? '0' : '-1') + '"><span class="duik-catalog-panel-label">' + icon(panel) + '<span>' + panelLabels[panel.id] + '</span></span></button>').join('') + '</div>' +
    '<div class="duik-catalog-main"><div class="duik-catalog-result-heading"><div><h3 data-catalog-title>骨骼</h3><p data-catalog-summary>' + catalogPanelSummaries.bones + '</p></div><a data-catalog-guide href="' + panels[0].href + '">面板指南 ' + catalogArrow + '</a></div>' +
      '<div class="duik-catalog-index-filter"><p data-catalog-count role="status" aria-live="polite">' + panelCount(panels[0]) + ' 个精选入口</p><button type="button" data-catalog-panel="all" aria-controls="duik-catalog-results" aria-pressed="false"><span class="duik-catalog-all-icon" aria-hidden="true"></span>查看全部 ' + tools.length + ' 个</button></div>' +
      '<div class="duik-catalog-results" id="duik-catalog-results" data-catalog-results>' + resultMarkup(searchTools('', 'bones')) + '</div>' +
      '<div class="duik-catalog-bottom"><p class="duik-catalog-search-help"><span>方向键浏览</span><span><kbd>Enter</kbd> 阅读</span><span><kbd>Esc</kbd> 清空</span></p></div>' +
    '</div></div></div>' +
  '<div class="duik-catalog-boundary"><p>这里打开本地文档；实际工具请在 After Effects 中使用。</p></div>' +
'</section>';

const catalogMounts = new WeakMap();

export function mountCatalog(host) {
  if (!host?.querySelector) return () => {};
  let root = host.matches?.('[data-duik-catalog]') ? host : host.querySelector('[data-duik-catalog]');
  if (!root) { host.innerHTML = catalogMarkup; root = host.querySelector('[data-duik-catalog]'); }
  if (!root) return () => {};
  if (catalogMounts.has(root)) return catalogMounts.get(root);
  const input = root.querySelector('[data-catalog-query]');
  const results = root.querySelector('[data-catalog-results]');
  const clear = root.querySelector('[data-catalog-clear]');
  const banner = mountCatalogBanner(root);
  let selected = root.querySelector('[data-catalog-panel][aria-pressed="true"]')?.dataset.catalogPanel || 'bones';
  const listeners = [];
  const listen = (target, type, handler) => {
    if (!target?.addEventListener) return;
    target.addEventListener(type, handler);
    listeners.push(() => target.removeEventListener(type, handler));
  };
  function render() {
    const matches = searchTools(input.value, selected);
    const panel = panels.find(item => item.id === selected);
    root.dataset.catalogActive = selected;
    banner.select(selected);
    root.querySelectorAll('[data-catalog-panel]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.catalogPanel === selected)));
    root.querySelectorAll('.duik-catalog-categories [data-catalog-panel]').forEach(button => button.setAttribute('tabindex', button.dataset.catalogPanel === (selected === 'all' ? 'bones' : selected) ? '0' : '-1'));
    root.querySelector('[data-catalog-title]').textContent = panel?.title || '全部工具';
    root.querySelector('[data-catalog-summary]').textContent = catalogPanelSummaries[selected] || '按面板浏览精选工具，或输入名称缩小范围。';
    const guide = root.querySelector('[data-catalog-guide]');
    guide.href = panel?.href || '/docs/getting-started/first-look';
    guide.innerHTML = (panel ? '面板指南 ' : '认识完整界面 ') + catalogArrow;
    root.querySelector('[data-catalog-count]').textContent = matches.length + ' 个精选入口' + (input.value.trim() ? '，匹配“' + input.value.trim() + '”' : '');
    results.innerHTML = resultMarkup(matches);
    clear.disabled = !input.value;
  }
  function onInput(event) {
    if (event.target !== input) return;
    selected = 'all';
    render();
  }
  function onClick(event) {
    const button = event.target.closest?.('button');
    if (!button || !root.contains(button)) return;
    if (button.hasAttribute('data-catalog-panel')) {
      root.dataset.catalogInput = event.detail > 0 ? 'pointer' : 'keyboard';
      selected = button.dataset.catalogPanel;
      if (selected === 'all') input.value = '';
      render();
    }
    if (button.hasAttribute('data-catalog-clear')) { input.value = ''; render(); input.focus(); }
    if (button.hasAttribute('data-catalog-reset')) { input.value = ''; selected = 'all'; render(); input.focus(); }
  }
  function onSubmit(event) {
    if (!event.target.matches('.duik-catalog-search')) return;
    event.preventDefault();
    if (!input.value.trim()) return;
    results.querySelector('[data-catalog-result]')?.click();
  }
  function onKeydown(event) {
    root.dataset.catalogInput = 'keyboard';
    if (event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return;
    if (event.key === 'Escape' && (event.target === input || results.contains(event.target))) {
      event.preventDefault(); input.value = ''; render(); input.focus(); return;
    }
    const category = event.target.closest?.('[data-catalog-panel]');
    if (category) {
      const buttons = [...root.querySelectorAll('.duik-catalog-categories [data-catalog-panel]')];
      const current = buttons.indexOf(category);
      if (current < 0) return;
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (current + 1) % buttons.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (current - 1 + buttons.length) % buttons.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = buttons.length - 1;
      if (next !== undefined) {
        event.preventDefault(); selected = buttons[next].dataset.catalogPanel; render(); buttons[next].focus();
      }
      return;
    }
    if (!['ArrowDown', 'ArrowUp'].includes(event.key)) return;
    const links = [...results.querySelectorAll('[data-catalog-result]')];
    const current = links.indexOf(event.target.closest?.('[data-catalog-result]'));
    if (!links.length || (event.target !== input && current < 0)) return;
    event.preventDefault();
    const next = event.target === input ? (event.key === 'ArrowDown' ? 0 : links.length - 1) : (current + (event.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length;
    links[next].focus();
  }
  listen(root, 'input', onInput);
  listen(root, 'click', onClick);
  listen(root, 'keydown', onKeydown);
  listen(root, 'submit', onSubmit);
  render();
  let disposed = false;
  const cleanup = () => {
    if (disposed) return;
    disposed = true;
    banner.destroy();
    for (const remove of listeners.splice(0)) remove();
    catalogMounts.delete(root);
  };
  catalogMounts.set(root, cleanup);
  return cleanup;
}

// Compatibility exports for existing consumers; one API stage owns the implementation.
export {apiMarkup, apiScenes, mountApi} from './api-cinema.mjs';
