#!/usr/bin/env node
/**
 * sync-upstream.mjs
 * 从 upstream/ 快照生成 sync-report，并把上游 md 结构信息写入 manifest 草稿。
 * 上游快照本身由 GitHub Actions sparse checkout 刷新；本脚本只做本地分析。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { createHash } from 'node:crypto'

const ROOT = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const UPSTREAM_DOCS = join(ROOT, 'upstream', 'docs')
const MANIFEST_PATH = join(ROOT, 'translation-manifest.json')

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, out)
    else out.push(p)
  }
  return out
}

function hashFile(p) {
  return createHash('sha256').update(readFileSync(p)).digest('hex').slice(0, 12)
}

if (!existsSync(UPSTREAM_DOCS)) {
  console.error('[sync] upstream/docs 不存在，请先运行 git sparse-checkout 或 CI 同步。')
  process.exit(1)
}

const files = walk(UPSTREAM_DOCS).filter((p) => p.endsWith('.md'))
const report = { generatedAt: new Date().toISOString(), mdCount: files.length, files: [] }

let manifest = {}
if (existsSync(MANIFEST_PATH)) {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'))
}

const seen = new Set()
for (const abs of files) {
  const rel = relative(UPSTREAM_DOCS, abs).split(sep).join('/')
  const hash = hashFile(abs)
  seen.add(rel)
  report.files.push({ path: rel, hash })
  if (!manifest[rel]) {
    manifest[rel] = {
      upstreamHashAtSnapshot: hash,
      status: 'untranslated',
      lastChecked: report.generatedAt.slice(0, 10),
    }
  } else if (manifest[rel].upstreamHashAtSnapshot !== hash) {
    manifest[rel].stale = true
    manifest[rel].upstreamHashAtSnapshot = hash
  }
}

// 移除上游已删除的条目（保留在 manifest 但标记 removed）
for (const key of Object.keys(manifest)) {
  if (!seen.has(key)) manifest[key].removedUpstream = true
}

writeFileSync(join(ROOT, 'sync-report.json'), JSON.stringify(report, null, 2))
writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2) + '\n')
console.log(`[sync] ${files.length} 个 md 已盘点；报告 -> sync-report.json；manifest -> translation-manifest.json`)
