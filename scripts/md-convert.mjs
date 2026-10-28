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
const DEST = join(ROOT, 'content')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else if (p.endsWith('.md')) out.push(p)
  }
  return out
}

function convert(raw, relPath) {
  let text = raw

  // META 行：整行删除（归属信息由 NOTICE + frontmatter 承担）
  text = text.replace(/^!\[META\]\([^)]*\)\s*$/gm, '')

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
  // 在 Callout 开启后的下一个空行前闭合（粗粒度，Phase 2 精修为逐块解析）
  text = text.replace(/(<Callout type="[^"]+">[\s\S]*?)(\n\n)/g, '$1</Callout>$2')
  // 若文件末尾仍有未闭合 Callout，补一个
  const openCount = (text.match(/<Callout /g) || []).length
  const closeCount = (text.match(/<\/Callout>/g) || []).length
  if (openCount > closeCount) {
    text += '\n</Callout>\n'.repeat(openCount - closeCount)
  }

  // 行内 attr_list：链接/图片后的 {target="_blank" ...} 等
  text = text.replace(/\)\s*\{[^}]*\}/g, ')')
  // 独立成行的 attr_list
  text = text.replace(/^\s*\{:[^}]*\}\s*$/gm, '')

  // 绝对图片路径 /img/... -> /docs-img/...
  text = text.replace(/!\[([^\]]*)\]\(\/img\//g, '![$1](/docs-img/')

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
  writeFileSync(dest, convert(readFileSync(abs, 'utf8')))
  created++
}
console.log(
  `[convert] 扫描 ${files.length} 篇，新建/覆盖 ${created} 篇，跳过已存在 ${skipped} 篇`,
)
