(() => {
  const topLabels = ['认识 Duik', '工具', '工作流程', '安装指南', '常见问题', '使用指南', '学习资源', '官方获取', '关于本站']
  const routes = [
    '/docs/getting-started/introduction', '/docs/guide/bones',
    '/docs/guide/constraints', '/docs/getting-started/install',
    '/docs/faq', '/docs/guide/controllers', '/docs/guide/animation',
    'https://rxlaboratory.org/tools/duik-angela/', '/docs/misc/credits',
  ]
  const menuLabels = ['安装与简介', '骨骼与自动绑定', '链接与约束', '控制器', '动画工具', '自动化', '摄像机', '常见问题']
  const replaceLeafText = (element, value) => {
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      if (node.nodeValue.trim()) {
        node.nodeValue = node.nodeValue.replace(node.nodeValue.trim(), value)
        return
      }
    }
  }
  const apply = () => {
    const header = document.querySelector('header')
    if (header) {
      const logo = header.querySelector('a[aria-label="Home"]')
      if (logo) logo.setAttribute('aria-label', 'Duik Ángela 首页')
      const navItems = [...header.querySelectorAll('nav ul > li')]
      navItems.forEach((item, index) => {
        if (index >= topLabels.length) return
        const trigger = item.querySelector(':scope > button, :scope > a, button, a')
        if (!trigger) return
        const old = ['Use cases', 'Products', 'Business', 'Enterprise', 'Blog', 'Guides', 'Learn', 'Pricing', 'Company']
        if (old.some(label => trigger.textContent.trim() === label) || trigger.textContent.trim() !== topLabels[index]) {
          replaceLeafText(trigger, topLabels[index])
        }
        if (trigger.tagName === 'A') trigger.setAttribute('href', routes[index])
        const submenuLinks = [...item.querySelectorAll('a')].filter(anchor => anchor !== trigger)
        submenuLinks.forEach((anchor, childIndex) => {
          anchor.setAttribute('href', routes[(index + childIndex) % routes.length])
          const leaf = anchor.querySelector('p,span') || anchor
          if (childIndex < menuLabels.length && leaf.textContent.trim() !== menuLabels[childIndex]) {
            replaceLeafText(leaf, menuLabels[childIndex])
          }
        })
      })
      for (const anchor of header.querySelectorAll('a')) {
        if (/cloud\.linearity\.io|form\.typeform\.com|buy\.stripe\.com/.test(anchor.href)) anchor.setAttribute('href', '/docs')
      }
      for (const button of header.querySelectorAll('a')) {
        if (/Get started|Log in/.test(button.textContent || '')) {
          button.setAttribute('href', '/docs')
          replaceLeafText(button, '阅读文档')
        }
      }
    }

    const hero = document.querySelector('main > section:first-of-type')
    if (!hero) return
    hero.querySelectorAll('a').forEach(anchor => {
      const text = anchor.textContent.trim()
      if (/Get started/.test(text)) {
        anchor.setAttribute('href', '/docs/getting-started/install')
        replaceLeafText(anchor, '查看安装方法')
      } else if (/Contact sales/.test(text)) {
        anchor.setAttribute('href', '/docs')
        replaceLeafText(anchor, '阅读中文文档')
      }
    })
    hero.querySelectorAll('button').forEach(button => {
      if (/Watch the 60-second demo/.test(button.textContent || '')) {
        button.setAttribute('aria-label', '打开 Duik 中文入门指南')
        button.onclick = () => { location.href = '/docs/getting-started/introduction' }
      }
    })
    const logoImage = hero.querySelector('img[src^="/images/logos/"]')
    const strip = logoImage?.parentElement?.parentElement
    if (strip && !strip.dataset.duikLabel) {
      strip.dataset.duikLabel = 'true'
      const note = document.createElement('span')
      note.textContent = '非官方中文指南 · 角色绑定 · 动画工具'
      note.style.cssText = 'color:#f6c29c;font-size:12px;letter-spacing:.08em;white-space:nowrap;padding:0 24px'
      strip.prepend(note)
    }
  }
  const start = () => {
    apply()
    const observer = new MutationObserver(() => apply())
    observer.observe(document.documentElement, { childList: true, subtree: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(start, 1600), { once: true })
  else setTimeout(start, 1600)
})()
