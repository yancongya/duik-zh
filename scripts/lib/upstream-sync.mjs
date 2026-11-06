import {readFileSync, readdirSync, lstatSync, existsSync, mkdirSync, writeFileSync} from 'node:fs'
import {join, dirname} from 'node:path'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'

export const UPSTREAM_REPOSITORY = 'RxLaboratory/Duik'
export const hashText = text => createHash('sha256').update(text.replace(/\r\n/g, '\n')).digest('hex').slice(0, 12)
export const sha256 = bytes => createHash('sha256').update(bytes).digest('hex')
export function legacyCRLFEquivalent(text, oldHash) {
  const lf = text.replace(/\r\n/g, '\n')
  return !!oldHash && oldHash !== hashText(lf) && sha256(lf.replace(/\n/g, '\r\n')).slice(0, 12) === oldHash
}
export function safePath(path) {
  if (typeof path !== 'string' || !path || path.startsWith('/') || path.includes('\\') || /[\x00-\x1f:]/.test(path) || path.split('/').some(p => !p || p === '.' || p === '..')) throw Error('非法文档相对路径')
  return path
}
export function readJSON(file, fallback) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : fallback
}
export function writeJSON(file, value) {
  const text = JSON.stringify(value, null, 2) + '\n'
  if (existsSync(file) && readFileSync(file, 'utf8') === text) return false
  mkdirSync(dirname(file), {recursive: true})
  writeFileSync(file, text)
  return true
}
const git = (root, args) => execFileSync('git', args, {cwd: root, maxBuffer: 40 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe']})

export function translationState(root, path) {
  safePath(path)
  if (!path.startsWith('content/docs/')) throw Error('译文目标必须位于content/docs/')
  let file = root
  for (const part of path.split('/')) {
    file = join(file, part)
    try { if (lstatSync(file).isSymbolicLink()) throw Error('译文路径不接受符号链接') }
    catch (error) { if (error.code !== 'ENOENT') throw error }
  }
  let tracked = false
  try { git(root, ['cat-file', '-e', ':' + path]); tracked = true } catch {}
  const text = existsSync(file) ? readFileSync(file, 'utf8') : null
  return {text, tracked, missingTracked: tracked && text === null}
}

// Union keeps a partially sparse checkout readable; complete CI snapshots exclude deleted files.
export function loadSnapshot(root) {
  const paths = new Set()
  if (process.env.DUIK_SYNC_COMPLETE_SNAPSHOT !== '1') {
    try {
      const tree = git(root, ['ls-tree', '-r', '-z', 'HEAD', '--', 'upstream/']).toString()
      for (const record of tree.split('\0').filter(Boolean)) {
        const [meta, path] = record.split('\t')
        if (!meta.startsWith('100')) throw Error('快照含非普通文件')
        paths.add(path.slice('upstream/'.length))
      }
    } catch (error) {
      if (error.message === '快照含非普通文件') throw error
      if (!existsSync(join(root, 'upstream/docs'))) throw Error('upstream/docs不存在，且无可读Git快照；请通过CI同步，不要重建空快照')
    }
  }
  function walk(dir, prefix = '') {
    if (!existsSync(dir)) return
    for (const name of readdirSync(dir)) {
      const p = join(dir, name), rel = prefix + name, stat = lstatSync(p)
      if (stat.isSymbolicLink()) throw Error('快照不接受符号链接')
      if (stat.isDirectory()) walk(p, rel + '/')
      else if (stat.isFile()) paths.add(safePath(rel))
    }
  }
  walk(join(root, 'upstream'))
  function read(path) {
    safePath(path)
    const file = join(root, 'upstream', path)
    if (existsSync(file)) return readFileSync(file)
    return git(root, ['show', 'HEAD:upstream/' + path])
  }
  const docs = new Map([...paths].filter(p => p.startsWith('docs/') && p.endsWith('.md')).sort().map(p => [p.slice(5), read(p).toString('utf8')]))
  if (!docs.size) throw Error('拒绝空文档快照，防止全量误标删除')
  const navHash = paths.has('mkdocs.yml') ? sha256(read('mkdocs.yml')) : null
  const meta = readJSON(join(root, 'upstream-revision.json'), null)
  if (meta && (meta.repository !== UPSTREAM_REPOSITORY || !/^[a-f0-9]{40}$/.test(meta.commit))) throw Error('上游版本记录无效')
  return {docs, navHash, sourceCommit: meta?.commit || null}
}

export function analyzeSnapshot({docs, navHash = null, sourceCommit = null, manifest = {}, previousReport = {}, root, now = new Date().toISOString()}) {
  if (!docs.size) throw Error('拒绝空文档快照')
  if (sourceCommit !== null && !/^[a-f0-9]{40}$/.test(sourceCommit)) throw Error('上游commit必须为完整SHA')
  const nextManifest = structuredClone(manifest), files = [], tasks = []
  const changes = {added: [], modified: [], removed: [], restored: [], renamedCandidates: [], navigationChanged: previousReport.navHash !== undefined && previousReport.navHash !== navHash}
  for (const [path, text] of [...docs].sort(([a], [b]) => a.localeCompare(b, 'en'))) {
    safePath(path)
    const hash = hashText(text), prev = manifest[path]
    const entry = nextManifest[path] ||= {status: 'untranslated'}
    if (!prev) changes.added.push(path)
    else if (prev.upstreamHashAtSnapshot !== hash) changes.modified.push(path)
    if (entry.removedUpstream) changes.restored.push(path)
    delete entry.removedUpstream
    if (!prev || prev.upstreamHashAtSnapshot !== hash || prev.removedUpstream) entry.lastChecked = now.slice(0, 10)
    entry.upstreamHashAtSnapshot = hash
    // Early translations recorded the raw CRLF hash. Migrate only when byte-equivalence
    // is proven against that exact variant; do not relabel genuinely changed content.
    if (entry.status !== 'untranslated' && legacyCRLFEquivalent(text, entry.upstreamHashAtTranslation)) {
      entry.translationHashMigration = {from: entry.upstreamHashAtTranslation, to: hash, reason: 'legacy-crlf-to-lf'}
      entry.upstreamHashAtTranslation = hash
    }
    const translated = entry.status !== 'untranslated'
    const baselineMissing = translated && !entry.upstreamHashAtTranslation
    const stale = translated && (baselineMissing || entry.upstreamHashAtTranslation !== hash)
    if (stale) entry.stale = true
    else delete entry.stale
    files.push({path, hash})
    if (!translated || stale) {
      const dest = path.replace(/\.md$/, '.mdx')
      const current = root ? translationState(root, 'content/docs/' + dest) : {text: null, missingTracked: false}
      const currentTranslationSha256 = current.text === null ? null : sha256(current.text)
      tasks.push({path, target: 'content/docs/' + dest, kind: baselineMissing ? 'baseline-missing' : translated ? 'update' : 'new', sourceHash: hash, translationBaseHash: entry.upstreamHashAtTranslation || null, currentTranslationSha256, currentTranslationMissing: !!root && (current.missingTracked || translated && current.text === null)})
    }
  }
  for (const path of Object.keys(nextManifest).sort()) {
    safePath(path)
    if (!docs.has(path)) {
      if (!nextManifest[path].removedUpstream) changes.removed.push(path)
      nextManifest[path].removedUpstream = true
    }
  }
  for (const from of changes.removed) for (const to of changes.added) {
    if (manifest[from].upstreamHashAtSnapshot === nextManifest[to].upstreamHashAtSnapshot) changes.renamedCandidates.push({from, to})
  }
  const stableReport = {schemaVersion: 2, repository: UPSTREAM_REPOSITORY, sourceCommit, mdCount: files.length, navHash, files}
  const {generatedAt: oldTime, ...oldStable} = previousReport
  const report = {...stableReport, generatedAt: JSON.stringify(oldStable) === JSON.stringify(stableReport) ? oldTime : now}
  const queue = {schemaVersion: 1, repository: UPSTREAM_REPOSITORY, sourceCommit, tasks}
  return {manifest: nextManifest, report, queue, run: {checkedAt: now, sourceCommit, changes, pending: tasks.length, blocked: tasks.filter(t => t.kind === 'baseline-missing' || t.currentTranslationMissing).length}}
}

export function findTranslationBaseline(root, path, hash) {
  safePath(path)
  if (!hash) return null
  const file = 'upstream/docs/' + path
  let revisions
  try { revisions = git(root, ['log', '--format=%H', 'HEAD', '--', file]).toString().trim().split('\n').filter(Boolean) } catch { return null }
  for (const rev of revisions) {
    let text
    try { text = git(root, ['show', `${rev}:${file}`]).toString('utf8') } catch { continue }
    if (hashText(text) === hash) return {revision: rev, text}
  }
  return null
}
