import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const publicDir = path.join(root, 'public')
const payloadPath = path.join(publicDir, '_payload.json')
const htmlPath = path.join(publicDir, 'landing.html')
const headlinePath = path.join(publicDir, '_nuxt/HeroOrgHeadline.d2ea4a745e1ba64aecc76bbf680458929795d2d8.js')
const payload = JSON.parse(await fs.readFile(payloadPath, 'utf8'))

// Keep the original devalue graph intact: edit strings in their existing slots
// and never append references to the serialized Nuxt payload.
payload[9] = '从骨骼开始，让角色动起来。'
payload[36] = '查看安装与入门指南'
payload[37] = '让角色动起来。\n让每个动作可控。'
payload[38] = '向下滚动，了解 Duik 的工作流程'
payload[39] = '用 Duik Ángela 在 After Effects 中搭建骨骼、约束与控制器，再把时间留给表演。这里整理了中文使用文档，帮助你找到每一步需要的工具。'
for (const [index, value] of [[284, '拆分图层'], [287, '建立骨骼'], [290, '开始动画'], [294, '准备分层角色素材'], [297, '连接骨骼与控制器'], [300, '调整姿势和关键帧']]) payload[index] = value

const heroImages = [40, 129]
for (let i = 0; i < 22; i++) {
  const assetPath = `/duik-preview-assets/hero-${String(i + 1).padStart(2, '0')}.svg`
  for (const listRef of heroImages) {
    const imageRef = payload[listRef]?.[i]
    const image = payload[imageRef]
    if (image && typeof image === 'object') {
      for (const key of ['filename', 'source']) {
        const stringRef = image[key]
        if (typeof stringRef === 'number' && typeof payload[stringRef] === 'string') payload[stringRef] = assetPath
      }
    }
  }
}

await fs.writeFile(payloadPath, JSON.stringify(payload))

let html = await fs.readFile(htmlPath, 'utf8')
const heroStart = html.indexOf('<section')
const heroEnd = html.indexOf('</section>', heroStart)
if (heroStart !== -1 && heroEnd !== -1) {
  let section = html.slice(heroStart, heroEnd + 10)
  const replacements = [
    ['On brand. Every time.', '从骨骼开始，让角色动起来。'],
    ['Describe your campaign. Linearity&#39;s AI design generator builds the whole set: posts, ads, emails, slides. On-brand, fully editable. Then resize it, translate it, ship it.', '用 Duik Ángela 在 After Effects 中搭建骨骼、约束与控制器，再把时间留给表演。这里整理了中文使用文档，帮助你找到每一步需要的工具。'],
    ['Prompted', '拆分图层'], ['Designed', '建立骨骼'], ['Created', '开始动画'],
    ['in seconds', '角色绑定与动画'], ['On-brand &amp; Editable.', '从骨骼开始，完成可控动作。'],
    ['Scroll down to explore', '向下滚动，了解 Duik 的工作流程'],
  ]
  for (const [from, to] of replacements) section = section.replaceAll(from, to)
  html = html.slice(0, heroStart) + section + html.slice(heroEnd + 10)
}
html = html.replace('<title>Linearity | AI Design Generator: Editable, On-Brand Campaigns</title>', '<title>Duik Ángela 中文指南｜角色绑定与动画</title>')
html = html.replace('</head>', '<link rel="stylesheet" href="/duik-preview.css"></head>')
html = html.replace('</body>', '<script defer src="/duik-preview.js"></script></body>')
const payloadTag = html.indexOf('id="__NUXT_DATA__"')
if (payloadTag !== -1) {
  const jsonStart = html.indexOf('>', payloadTag) + 1
  const jsonEnd = html.indexOf('</script>', jsonStart)
  if (jsonEnd !== -1) html = html.slice(0, jsonStart) + JSON.stringify(payload) + html.slice(jsonEnd)
}
await fs.writeFile(htmlPath, html)

let headline = await fs.readFile(headlinePath, 'utf8')
headline = headline.replace(/const L=\[.*?\],M=/s, 'const L=[{name:"角色",avatar:"/duik-preview-assets/avatar.svg"},{name:"绑定师",avatar:"/duik-preview-assets/avatar.svg"},{name:"动画师",avatar:"/duik-preview-assets/avatar.svg"}],M=')
headline = headline.replace(/,d=\[.*?\],tt=/s, ',d=[{name:"骨骼",icon:"ic-settings",tint:"255 107 43",assets:[{label:"角色骨架",icon:"ic-people",prompt:"为角色建立清晰的骨骼结构"},{label:"自动绑定",icon:"ic-settings",prompt:"为四肢角色设置自动绑定"},{label:"动作控制",icon:"ic-present",prompt:"调整角色控制器和动作姿势"}]},{name:"约束",icon:"ic-link",tint:"255 176 116",assets:[{label:"IK 肢体",icon:"ic-settings",prompt:"连接肢体并调整 IK 约束"},{label:"控制器",icon:"ic-people",prompt:"为角色创建动画控制器"},{label:"关键帧",icon:"ic-present",prompt:"整理姿势与动画关键帧"}]},{name:"动画",icon:"ic-play",tint:"255 213 157",assets:[{label:"行走循环",icon:"ic-present",prompt:"制作角色行走循环"},{label:"插值工具",icon:"ic-settings",prompt:"调整关键帧插值与节奏"},{label:"摄像机",icon:"ic-photo",prompt:"为场景设置摄像机运动"}]}],tt=')
headline = headline.replace('"Let"', '"让"').replace('"from"', '"用"').replace('"create"', '"完成"')
headline = headline.replace('Let anyone in your company create anything.', '让角色从骨骼开始，逐步完成可控动画。')
await fs.writeFile(headlinePath, headline)
console.log('Updated Hero strings and local artwork without changing the Nuxt payload graph.')
