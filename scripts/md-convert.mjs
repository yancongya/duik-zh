#!/usr/bin/env node
/**
 * md-convert.mjs
 * 把 upstream/docs 下的 md 适配为 Nextra 可用的 mdx 草稿（英文占位，供后续翻译）。
 * 规则见 PLAN.md §5.2。不覆盖 content/ 下已存在的文件（除非 --force）。
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  rmSync,
} from 'node:fs'
import { join, relative, sep, dirname } from 'node:path'

const FORCE = process.argv.includes('--force')
const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const SRC = join(ROOT, 'upstream', 'docs')
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

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.md')) out.push(p)
  }
  return out
}

function convert(raw, relPath) {
  let text = raw.replace(/\r\n/g, '\n')

  // META 行：整行删除（归属信息由 NOTICE + frontmatter 承担）
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
    text = `---\ntitle: ${JSON.stringify(title)}\n---\n\n${text}`
  }

  return text
}

const files = walk(SRC)
let created = 0
let skipped = 0
for (const abs of files) {
  const rel = relative(SRC, abs).split(sep).join('/')
  const destRel = rel.replace(/\.md$/, '.mdx')
  const dest = join(DEST, destRel)
  if (existsSync(dest) && !FORCE) {
    skipped++
    continue
  }
  if (existsSync(dest) && FORCE) rmSync(dest)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, convert(readFileSync(abs, 'utf8'), rel))
  created++
}
console.log(
  `[convert] 扫描 ${files.length} 篇，新建/覆盖 ${created} 篇，跳过已存在 ${skipped} 篇`,
)
