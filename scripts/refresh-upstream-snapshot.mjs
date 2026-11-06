#!/usr/bin/env node
import {readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync, lstatSync, renameSync, rmSync} from 'node:fs'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {safePath, writeJSON, UPSTREAM_REPOSITORY} from './lib/upstream-sync.mjs'

// Only the dedicated CI checkout may replace the snapshot. Local upstream stays read-only.
const root = fileURLToPath(new URL('../', import.meta.url))
if (process.env.GITHUB_ACTIONS !== 'true') throw Error('快照刷新仅用于GitHub Actions；本地请运行sync --check')
const source = join(root, 'upstream-tmp')
if (!existsSync(source) || lstatSync(source).isSymbolicLink()) throw Error('缺少独立官方检出')
const git = args => execFileSync('git', args, {cwd: source, encoding: 'utf8', maxBuffer: 20e6})
const remote = git(['remote', 'get-url', 'origin']).trim()
if (!/^https:\/\/github\.com\/RxLaboratory\/Duik(?:\.git)?$/i.test(remote)) throw Error('上游来源不匹配')
const commit = git(['rev-parse', 'HEAD']).trim()
if (!/^[a-f0-9]{40}$/.test(commit)) throw Error('无效上游commit')
const entries = git(['ls-tree', '-r', '-z', commit, '--', 'src-docs/']).split('\0').filter(Boolean).map(record => {
  const [meta, path] = record.split('\t'), [mode, type, hash] = meta.split(' ')
  if (!['100644', '100755'].includes(mode) || type !== 'blob') throw Error('拒绝上游符号链接或子模块')
  return {path: safePath(path.slice('src-docs/'.length)), hash}
})
if (!entries.some(e => e.path === 'mkdocs.yml') || !entries.some(e => /^docs\/.+\.md$/.test(e.path))) throw Error('拒绝不完整快照')
const stage = mkdtempSync(join(root, '.upstream-stage-')), backup = join(stage, 'previous')
const payload = join(stage, 'payload'), target = join(root, 'upstream')
mkdirSync(payload)
let movedOld = false, installed = false
try {
  for (const entry of entries) {
    const path = join(source, 'src-docs', entry.path)
    if (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink()) throw Error('非普通来源文件')
    const bytes = readFileSync(path)
    const actual = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex')
    if (actual !== entry.hash) throw Error('官方检出字节不匹配：' + entry.path)
    mkdirSync(join(payload, entry.path, '..'), {recursive: true})
    writeFileSync(join(payload, entry.path), bytes)
  }
  if (existsSync(target)) { renameSync(target, backup); movedOld = true }
  renameSync(payload, target); installed = true
  writeJSON(join(root, 'upstream-revision.json'), {repository: UPSTREAM_REPOSITORY, commit, files: entries.length})
  console.log(JSON.stringify({repository: UPSTREAM_REPOSITORY, commit, files: entries.length, byteVerified: true}))
} catch (error) {
  if (installed) rmSync(target, {recursive: true})
  if (movedOld) renameSync(backup, target)
  throw error
} finally { rmSync(stage, {recursive: true, force: true}) }
