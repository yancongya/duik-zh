(() => {
  const doc = document;
  doc.title = 'Duik Ángela 中文站｜After Effects 角色绑定与动画文档';
  doc.querySelector('meta[name="description"]')?.setAttribute(
    'content',
    'Duik Ángela 非官方中文文档：从安装、角色绑定到动画自动化的 After Effects 学习路径。',
  );

  const replaceExactText = (from, to) => {
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (parent && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName) && node.nodeValue?.trim() === from) nodes.push(node);
    }
    nodes.forEach((node) => { node.nodeValue = node.nodeValue?.replace(from, to) ?? ''; });
  };

  [
    ['Use cases', '学习路径'], ['Products', '核心能力'], ['Business', '关于 Duik'],
    ['Enterprise', '文档'], ['Blog', '教程'], ['Guides', '指南'], ['Learn', '开始学习'],
    ['Pricing', '官方渠道'], ['Company', '关于本站'], ['Log in', '官方站'],
    ['Get started', '阅读文档'], ['Contact sales', '官方 GitHub'],
    ['Scroll down to explore', '向下浏览'], ['Watch the 60-second demo', '了解 Duik 工作流'],
    ['REAL OUTPUTS', '角色绑定'], ['EDITABLE GRAPHICS', '可控动画'], ['BRAND ASSETS', '工具集'],
    ['Privacy Policy', 'GFDL 1.3'], ['Terms of Service', '上游 GitHub'],
    ['Cookie Policy', '官方站'], ['Imprint', '本站说明'],
    ['Trusted by leading companies worldwide.', '非官方中文翻译站，内容基于 RxLaboratory 官方文档。'],
  ].forEach(([from, to]) => replaceExactText(from, to));

  const replaceTextFragment = (from, to) => {
    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const parent = node.parentElement;
      if (parent && !['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName) && node.nodeValue?.includes(from)) nodes.push(node);
    }
    nodes.forEach((node) => { node.nodeValue = node.nodeValue?.replaceAll(from, to) ?? ''; });
  };
  replaceTextFragment('Linearity', 'Duik Ángela');
  replaceTextFragment('AI design generator', '角色绑定与动画工具集');
  replaceTextFragment('AI-generated', 'Duik 工作流');

  const home = doc.querySelector('a[aria-label="Home"]');
  if (home) {
    home.href = '/';
    home.setAttribute('aria-label', 'Duik Ángela 中文站首页');
    home.innerHTML = '<span class="duik-wordmark">Duik <b>Ángela</b><small>中文文档</small></span>';
  }

  const hero = doc.querySelector('h1');
  if (hero) hero.textContent = '从第一个骨骼，到完整角色绑定。';
  const heroDescription = [...doc.querySelectorAll('p')].find((p) => p.textContent?.includes("Linearity's AI design generator"));
  if (heroDescription) heroDescription.textContent = 'Duik Ángela 的非官方中文文档。系统学习 After Effects 角色绑定、约束、控制器与动画自动化。';
  const prompt = doc.querySelector('[aria-label="AI Prompt Input"]');
  if (prompt) {
    prompt.setAttribute('aria-label', '搜索文档主题');
    prompt.setAttribute('placeholder', '例如：怎样给角色自动绑定手臂？');
  }
  const promptCta = doc.querySelector('a[aria-label="Start designing in Linearity"]');
  if (promptCta) {
    promptCta.href = '/docs';
    promptCta.target = '';
    promptCta.setAttribute('aria-label', '从文档开始学习 Duik');
    promptCta.textContent = '搜索文档';
  }

  doc.querySelectorAll('a').forEach((link) => {
    const url = link.getAttribute('href') || '';
    if (url.includes('linearity') || url.includes('stripe.com') || url.includes('typeform.com')) {
      link.href = '/docs';
      link.removeAttribute('target');
      link.removeAttribute('rel');
    }
  });
  doc.querySelectorAll('a[href*="enterprise"], a[href*="blog"], a[href*="pricing"], a[href*="policies"]').forEach((link) => {
    link.href = '/docs';
  });
  doc.querySelectorAll('a').forEach((link) => {
    const label = link.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (label.includes('官方 GitHub') || label.includes('上游 GitHub')) link.href = 'https://github.com/RxLaboratory/Duik';
    if (label.includes('官方站')) link.href = 'https://duik.org/';
  });

  doc.querySelectorAll('img:not(.duik-rig-stage)').forEach((image) => {
    image.src = '/assets/duik-rig-stage.svg';
    image.srcset = '';
    image.alt = 'Duik 角色绑定与动画工作流示意图';
  });

  const footerCopyright = [...doc.querySelectorAll('span')].find((span) => span.textContent?.includes('Copyright © 2026 Linearity'));
  if (footerCopyright) footerCopyright.textContent = 'Duik Ángela 中文站 · 非官方中文翻译';

  const stage = doc.createElement('img');
  stage.className = 'duik-rig-stage';
  stage.src = '/assets/duik-rig-stage.svg';
  stage.alt = 'Duik 角色绑定与控制器示意图';
  hero?.parentElement?.append(stage);

  const style = doc.createElement('style');
  style.textContent = `
    .duik-wordmark{display:grid;font:700 1.38rem/1 "Arial Narrow",system-ui,sans-serif;letter-spacing:-.05em;color:#fff}.duik-wordmark b{color:#ff6b24;font-weight:800}.duik-wordmark small{margin-top:.32rem;font:500 .54rem/1 system-ui,sans-serif;letter-spacing:.16em;color:#ffb88d;text-transform:uppercase}.duik-rig-stage{position:absolute;z-index:2;width:min(31vw,430px);right:7vw;bottom:7vh;opacity:.95;pointer-events:none;filter:drop-shadow(0 32px 48px rgba(0,0,0,.28))}@media(max-width:900px){.duik-rig-stage{position:relative;right:auto;bottom:auto;width:min(72vw,430px);margin:2rem auto -2rem}}`;
  doc.head.append(style);
})();
