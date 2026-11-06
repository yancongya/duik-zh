#!/usr/bin/env node
/**
 * md-convert.mjs
 * 把 upstream/docs 下的 md 适配为 Nextra 可用的 mdx 草稿（英文占位，供后续翻译）。
 * 规则见 PLAN.md §5.2。已有文件一律保留；不提供强制覆盖。
 */
import {
  writeFileSync,
  mkdirSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import {fileURLToPath} from 'node:url'
import {loadSnapshot, readJSON, translationState} from './lib/upstream-sync.mjs'

if (process.argv.slice(2).length) {
  console.error('[convert] 不支持参数或--force；已有译文/占位一律保留，请按增量翻译任务审查修改。')
  process.exit(1)
}
const ROOT = fileURLToPath(new URL('..', import.meta.url))
const DEST = join(ROOT, 'content', 'docs')

/** 顶层缩进代码块 → 围栏代码（MDX 不支持 indented code）。 */
function fenceIndentedCode(text) {
  const lines = text.split('\n')
  const out = []
  let inFence = false
  let i = 0
  const isIndent = (l) => /^(?: {4}|\t)/.test(l)
  while (i < lines.length) {
    const line = lines[i]
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence
      out.push(line)
      i++
      continue
    }
    if (inFence || !isIndent(line)) {
      out.push(line)
      i++
      continue
    }
    // 收集连续缩进行作为一个块
    const start = i
    while (
      i < lines.length &&
      isIndent(lines[i]) &&
      !/^\s*(```|~~~)/.test(lines[i])
    ) {
      i++
    }
    const run = lines.slice(start, i)
    // 上一非空行决定是否「顶层」
    let k = out.length - 1
    while (k >= 0 && out[k].trim() === '') k--
    const prev = k >= 0 ? out[k] : ''
    const eligible =
      prev.trim() !== '' &&
      !/^\s*</.test(prev) && // JSX（Callout 等）子内容
      !/^\s*([-*+]|\d+\.)\s+/.test(prev) && // 列表延续
      !isIndent(prev) // 已在被跳过的上下文里
    if (eligible) {
      const indents = run
        .filter((l) => l.trim() !== '')
        .map((l) => l.match(/^(?: {4}|\t)/)[0].length)
      const strip = Math.min(...indents)
      out.push('```text')
      for (const l of run) {
        out.push(l.trim() === '' ? '' : l.slice(strip))
      }
      out.push('```')
    } else {
      out.push(...run)
    }
  }
  return out.join('\n')
}

function convert(raw, relPath) {
  let text = raw.replace(/\r\n/g, '\n')

  const attribution = {}
  for (const match of text.matchAll(/^!\[META\]\(([^)]*)\)\s*$/gm)) {
    for (const field of match[1].split(';')) {
      const at = field.indexOf(':')
      if (at > 0) attribution[field.slice(0, at).trim()] = field.slice(at + 1).trim()
    }
  }
  // Preserve source metadata in frontmatter, not just a site-wide notice.
  text = text.replace(/^!\[META\]\([^)]*\)\s*$/gm, '')

  // RXLAB_VIDEO → 自有 Video 组件（下一行斜体图注保留为 caption）
  text = text.replace(
    /^!\[RXLAB_VIDEO\]\((https?:\/\/[^)\s]+)\)[ \t]*\r?\n\*([^*]+)\*[ \t]*$/gm,
    (_m, url, caption) => `<Video src="${url}" caption={${JSON.stringify(caption.trim())}} />`,
  )
  text = text.replace(/^!\[RXLAB_VIDEO\]\((https?:\/\/[^)\s]+)\)[ \t]*$/gm, '<Video src="$1" />')

  // mkdocs admonition 开关行 -> Callout
  const kindMap = {
    note: 'info',
    warning: 'warning',
    danger: 'error',
    tip: 'success',
    bug: 'info',
    success: 'success',
    failure: 'error',
  }
  text = text.replace(
    /^!!!\s+(note|warning|danger|tip|bug|success|failure)\s*$/gm,
    (_m, kind) => `<Callout type="${kindMap[kind]}">`,
  )
  // 在 Callout 开启后的下一个空行前闭合（闭合标签独占一行）
  text = text.replace(/(<Callout type="[^"]+">[\s\S]*?)(\n\n)/g, '$1\n</Callout>$2')
  // 若文件末尾仍有未闭合 Callout，补一个
  const openCount = (text.match(/<Callout /g) || []).length
  const closeCount = (text.match(/<\/Callout>/g) || []).length
  if (openCount > closeCount) {
    text += '\n</Callout>\n'.repeat(openCount - closeCount)
  }

  // 行内 attr_list：链接/图片后的 {target="_blank" ...} 等
  text = text.replace(/\)\s*\{[^}]*\}/g, ')')
  // 强调等其他元素后的 attr_list：*text*{style="..."} → *text*
  text = text.replace(
    /\{(?=(?:style|class|id|width|height|align|title|href|src|alt|dir|lang|colspan|rowspan)=)[^}]*\}/g,
    '',
  )
  // 独立成行的 attr_list
  text = text.replace(/^\s*\{:[^}]*\}\s*$/gm, '')

  // 绝对图片路径 /img/... -> /docs-img/...
  text = text.replace(/!\[([^\]]*)\]\(\/img\//g, '![$1](/docs-img/')
  // 相对/异常图片路径（img/、../img/、../../img/、..//img/...）-> /docs-img/...
  text = text.replace(/\]\((?:[^)]*?\/)?img\//g, '](/docs-img/')
  text = text.replace(/src="(?:[^"]*?\/)?img\//g, 'src="/docs-img/')

  // 站内 .md 链接 -> 路由形式（相对路径，去 index 后缀）
  text = text.replace(
    /\]\((\.{1,2}\/[^)#\s]+)\.md(#[^)]*)?\)/g,
    (_m, path, hash = '') => `](${path.replace(/\/index$/, '')}${hash})`,
  )
  // 根绝对路径 .md 链接：](/guide/foo.md) -> ](/docs/guide/foo)
  text = text.replace(
    /\]\(\/([^)#\s]+)\.md(#[^)]*)?\)/g,
    (_m, path, hash = '') => `](/docs/${path.replace(/\/index$/, '')}${hash})`,
  )

  // 裸 HTML 注释（MDX 不允许）
  text = text.replace(/<!--[\s\S]*?-->/g, '')

  // MDX：HTML 空元素需自闭合（img/br/hr/input/...）
  text = text.replace(/<(img|br|hr|input|col|source|wbr)(\s[^<>]*?)?>/gi, (_m, tag, attrs = '') =>
    attrs.trim().endsWith('/') ? `<${tag}${attrs}>` : `<${tag}${attrs}/>`,
  )

  // JSX：style="a:b;" 字符串 → style={{a:'b'}} 对象
  text = text.replace(/style="([^"]*)"/g, (_m, css) => {
    const decls = css
      .split(';')
      .map((d) => d.trim())
      .filter(Boolean)
      .map((d) => {
        const i = d.indexOf(':')
        if (i < 0) return null
        const key = d
          .slice(0, i)
          .trim()
          .replace(/-([a-z])/g, (_, c) => c.toUpperCase())
        return `${key}: ${JSON.stringify(d.slice(i + 1).trim())}`
      })
      .filter(Boolean)
    return `style={{${decls.join(', ')}}}`
  })

  // MDX：尖括号自动链接 <https://...> -> [url](url)
  text = text.replace(/<(https?:\/\/[^\s<>]+)>/g, '[$1]($1)')

  // MDX：占位符 <some text ...>（含空白、无 = 的尖括号文本）转义；代码块内不动
  text = text
    .split(/(```[\s\S]*?```|~~~[\s\S]*?~~~)/g)
    .map((seg, i) =>
      i % 2 === 1
        ? seg
        : seg.replace(/<([^<>\n]*\s[^<>\n]*)>/g, (m, inner) =>
            inner.includes('=') || inner.startsWith('/') ? m : `&lt;${inner}&gt;`,
          ),
    )
    .join('')

  // MDX：不支持缩进代码块——把「顶层」缩进块转为围栏代码；Callout/列表内的缩进保留
  text = fenceIndentedCode(text)

  // HTML 实体中的裸 & 在 MDX 里偶尔出问题，但一般安全；跳过

  // 确保有 frontmatter title（取第一个 H1）
  if (!/^---\n/.test(text)) {
    const h1 = text.match(/^#\s+(.+)$/m)
    const fallback = relPath.replace(/\.md$/, '').split('/').pop()
    const title = h1 ? h1[1].trim() : fallback
    const fields = ['authors', 'copyright', 'updated'].filter(key => attribution[key]).map(key => `${key}: ${JSON.stringify(attribution[key])}`).join('\n')
    text = `---\ntitle: ${JSON.stringify(title)}\nlicense: GFDL-1.3\n${fields ? fields + '\n' : ''}---\n\n${text}`
  }

  return text
}

const files = [...loadSnapshot(ROOT).docs]
const manifest = readJSON(join(ROOT, 'translation-manifest.json'), {})
let created = 0
let skipped = 0
for (const [rel, raw] of files) {
  const destRel = rel.replace(/\.md$/, '.mdx')
  const dest = join(DEST, destRel)
  const current = translationState(ROOT, 'content/docs/' + destRel)
  if (current.text !== null || current.tracked || manifest[rel] && manifest[rel].status !== 'untranslated') {
    skipped++
    continue
  }
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, convert(raw, rel), {flag: 'wx'})
  created++
}
console.log(
  `[convert] 扫描 ${files.length} 篇，新建 ${created} 篇，跳过已存在 ${skipped} 篇`,
)
