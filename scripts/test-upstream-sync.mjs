import test from 'node:test'
import assert from 'node:assert/strict'
import {analyzeSnapshot, hashText, sha256, safePath} from './lib/upstream-sync.mjs'

const doc = '# Source\n', hash = hashText(doc)
const translated = {status: 'translated', upstreamHashAtSnapshot: hash, upstreamHashAtTranslation: hash, lastChecked: '2026-10-28', translator: 'human'}
test('translation baseline detects an update already present in the previous snapshot', () => {
  const changed = '# Changed\n'
  const result = analyzeSnapshot({docs: new Map([['a.md', changed]]), manifest: {'a.md': {...translated, upstreamHashAtSnapshot: hashText(changed)}}})
  assert.deepEqual(result.run.changes.modified, [])
  assert.equal(result.manifest['a.md'].stale, true)
  assert.equal(result.queue.tasks[0].kind, 'update')
  assert.equal(result.manifest['a.md'].upstreamHashAtTranslation, hash)
})
test('no-op preserves report timestamps and manifest; run checks are independently fresh', () => {
  const first = analyzeSnapshot({docs: new Map([['a.md', doc]]), manifest: {'a.md': translated}, now: '2026-11-06T00:00:00Z'})
  const second = analyzeSnapshot({docs: new Map([['a.md', doc]]), manifest: first.manifest, previousReport: first.report, now: '2026-11-07T00:00:00Z'})
  assert.deepEqual(second.manifest, first.manifest)
  assert.deepEqual(second.report, first.report)
  assert.notEqual(second.run.checkedAt, first.run.checkedAt)
  assert.equal(second.queue.tasks.length, 0)
})
test('restored source clears removed flag; return to translated baseline clears stale', () => {
  const result = analyzeSnapshot({docs: new Map([['a.md', doc]]), manifest: {'a.md': {...translated, stale: true, removedUpstream: true}}})
  assert.equal(result.manifest['a.md'].stale, undefined)
  assert.equal(result.manifest['a.md'].removedUpstream, undefined)
  assert.deepEqual(result.run.changes.restored, ['a.md'])
})
test('removal preserves translated entries and identical rename is only a candidate', () => {
  const result = analyzeSnapshot({docs: new Map([['b.md', doc]]), manifest: {'a.md': translated}})
  assert.equal(result.manifest['a.md'].status, 'translated')
  assert.equal(result.manifest['a.md'].removedUpstream, true)
  assert.deepEqual(result.run.changes.renamedCandidates, [{from: 'a.md', to: 'b.md'}])
  assert.equal(result.queue.tasks[0].path, 'b.md')
})
test('missing translation hash blocks instead of assuming current source was reviewed', () => {
  const result = analyzeSnapshot({docs: new Map([['a.md', doc]]), manifest: {'a.md': {status: 'translated'}}})
  assert.equal(result.run.blocked, 1)
  assert.equal(result.queue.tasks[0].kind, 'baseline-missing')
})
test('untranslated source gets a task, not a pretend stale translation; CRLF is normalized', () => {
  assert.equal(hashText('# Source\r\n'), hash)
  const result = analyzeSnapshot({docs: new Map([['a.md', doc]]), manifest: {'a.md': {status: 'untranslated', stale: true}}})
  assert.equal(result.manifest['a.md'].stale, undefined)
  assert.equal(result.queue.tasks[0].kind, 'new')
})
test('empty source, traversal and non-full source revisions fail closed', () => {
  assert.throws(() => analyzeSnapshot({docs: new Map()}))
  for (const p of ['../x.md', '/x.md', 'a/../../x.md', 'a\\b.md', 'a\nx.md']) assert.throws(() => safePath(p))
  assert.throws(() => analyzeSnapshot({docs: new Map([['a.md', doc]]), sourceCommit: 'master'}))
})
test('legacy CRLF translation hashes migrate only on exact newline-equivalent content', () => {
  const legacy = sha256(doc.replace(/\n/g, '\r\n')).slice(0, 12)
  const manifest = {'a.md': {...translated, upstreamHashAtTranslation: legacy}}
  const same = analyzeSnapshot({docs: new Map([['a.md', doc]]), manifest})
  assert.equal(same.queue.tasks.length, 0)
  assert.equal(same.manifest['a.md'].upstreamHashAtTranslation, hash)
  assert.equal(same.manifest['a.md'].translationHashMigration.from, legacy)
  assert.equal(same.manifest['a.md'].translator, 'human')
  const changed = analyzeSnapshot({docs: new Map([['a.md', '# Actually changed\n']]), manifest})
  assert.equal(changed.queue.tasks[0].kind, 'update')
  assert.equal(changed.manifest['a.md'].upstreamHashAtTranslation, legacy)
})
