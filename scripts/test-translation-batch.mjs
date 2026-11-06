import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync, symlinkSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {execFileSync} from 'node:child_process'
import {prepareBatch, checkBatch, applyBatch, validateDraft} from './lib/translation-batch.mjs'
import {hashText, sha256, writeJSON} from './lib/upstream-sync.mjs'

const draft = '---\ntitle: 测试\nlicense: GFDL-1.3\nauthors: RxLaboratory\ncopyright: 2026\n---\n\n# 中文测试\n\n说明正文。\n'
function setup(t) {
  const root = mkdtempSync(join(tmpdir(), 'duik-translation-test-'))
  t.after(() => rmSync(root, {recursive: true, force: true}))
  for (const dir of ['upstream/docs', 'content/docs']) mkdirSync(join(root, dir), {recursive: true})
  writeFileSync(join(root, 'upstream/docs/a.md'), '# Test\n\nOriginal.\n')
  const output = join(root, 'batch')
  return {root, output}
}
function approve(root, output, path = 'a.md', text = draft) {
  mkdirSync(join(output, 'drafts'), {recursive: true})
  writeFileSync(join(output, 'drafts', path.replace(/\.md$/, '.mdx')), text)
  writeJSON(join(output, 'review.json'), {reviews: [{path, decision: 'approved', translator: 'draft-pass', reviewer: 'review-pass', notes: '已核对含义、术语、代码、链接、版权', draftSha256: sha256(text)}]})
}
function trackedFixture(root) {
  const git = args => execFileSync('git', args, {cwd: root, stdio: 'pipe'})
  git(['init']); git(['config', 'core.autocrlf', 'false'])
  writeFileSync(join(root, 'content/docs/a.mdx'), draft)
  git(['add', '--', 'upstream/docs/a.md', 'content/docs/a.mdx'])
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'baseline'])
  writeJSON(join(root, 'translation-manifest.json'), {'a.md': {status: 'translated', upstreamHashAtTranslation: hashText('# Test\n\nOriginal.\n')}})
  writeFileSync(join(root, 'upstream/docs/a.md'), '# Test\n\nChanged.\n')
  return git
}
test('prepare is isolated and refuses to overwrite an existing work batch', t => {
  const {root, output} = setup(t)
  const result = prepareBatch(root, output)
  assert.equal(result.ready, 1)
  assert.equal(existsSync(join(root, 'content/docs/a.mdx')), false)
  assert.equal(existsSync(join(root, 'translation-manifest.json')), false)
  assert.throws(() => prepareBatch(root, output), /已存在/)
})
test('reviewed draft can be checked without writes and applied with updated provenance', t => {
  const {root, output} = setup(t)
  prepareBatch(root, output); approve(root, output)
  assert.equal(checkBatch(root, output).validated.length, 1)
  assert.equal(existsSync(join(root, 'content/docs/a.mdx')), false)
  assert.equal(applyBatch(root, output).applied, 1)
  assert.equal(readFileSync(join(root, 'content/docs/a.mdx'), 'utf8'), draft)
  const entry = JSON.parse(readFileSync(join(root, 'translation-manifest.json')))['a.md']
  assert.equal(entry.status, 'translated')
  assert.equal(entry.upstreamHashAtTranslation, hashText('# Test\n\nOriginal.\n'))
  assert.equal(entry.reviewer, 'review-pass')
  assert.throws(() => applyBatch(root, output), /翻译登记已变化/)
})
test('unreviewed and post-review edited drafts cannot change live content', t => {
  const {root, output} = setup(t)
  prepareBatch(root, output)
  assert.throws(() => applyBatch(root, output), /审校/)
  approve(root, output)
  writeFileSync(join(output, 'drafts/a.mdx'), draft + '修改。')
  assert.throws(() => applyBatch(root, output), /审校后变化/)
  assert.equal(existsSync(join(root, 'content/docs/a.mdx')), false)
})
test('new source or concurrent human edits invalidate a batch', t => {
  const {root, output} = setup(t)
  prepareBatch(root, output); approve(root, output)
  writeFileSync(join(root, 'content/docs/a.mdx'), '人工新增中文')
  assert.throws(() => applyBatch(root, output), /当前译文已被修改/)
  assert.equal(readFileSync(join(root, 'content/docs/a.mdx'), 'utf8'), '人工新增中文')
  writeFileSync(join(root, 'upstream/docs/a.md'), '# Changed')
  assert.throws(() => applyBatch(root, output), /源文已变化/)
})
test('unresolvable historical baselines are reported, not translated or re-anchored', t => {
  const {root, output} = setup(t)
  writeJSON(join(root, 'translation-manifest.json'), {'a.md': {status: 'translated', upstreamHashAtTranslation: '000000000000'}})
  writeFileSync(join(root, 'content/docs/a.mdx'), draft)
  const result = prepareBatch(root, output)
  assert.equal(result.blocked, 1); assert.equal(result.ready, 0)
  assert.throws(() => applyBatch(root, output), /基线待核实/)
  assert.equal(readFileSync(join(root, 'content/docs/a.mdx'), 'utf8'), draft)
})
test('entire batch is validated before the first content write', t => {
  const {root, output} = setup(t)
  writeFileSync(join(root, 'upstream/docs/b.md'), '# Other')
  prepareBatch(root, output); approve(root, output)
  assert.throws(() => applyBatch(root, output), /审校/)
  assert.equal(existsSync(join(root, 'content/docs/a.mdx')), false)
})
test('MDX execution, scripts, altered attribution and invented code are rejected', () => {
  for (const addition of ['\nexport const bad = 1', '\n{process.exit()}', '\n<script>alert(1)</script>', '\n<img src="x" onClick={run} />', '\n<Video src={process.env.KEY} />', '\n```js\nhacked()\n```', '\n[x](javascript:alert)']) {
    assert.throws(() => validateDraft(draft + addition, null, '# Test'), addition)
  }
  assert.throws(() => validateDraft(draft.replace('RxLaboratory', 'Someone'), draft, '# Test'), /归属字段/)
  assert.doesNotThrow(() => validateDraft(draft + '\n<Video src="https://example.org/video.mp4" caption={"图注"} />', null, '# Test'))
})
test('symlink draft and forged destination cannot escape the batch or content tree', t => {
  const {root, output} = setup(t)
  prepareBatch(root, output)
  writeFileSync(join(root, 'secret.mdx'), draft)
  mkdirSync(join(output, 'drafts'))
  symlinkSync(join(root, 'secret.mdx'), join(output, 'drafts/a.mdx'))
  writeJSON(join(output, 'review.json'), {reviews: [{path: 'a.md', decision: 'approved', translator: 'one', reviewer: 'two', notes: 'checked', draftSha256: sha256(draft)}]})
  assert.throws(() => applyBatch(root, output), /符号链接/)
  const batch = JSON.parse(readFileSync(join(output, 'batch.json')))
  batch.tasks[0].target = '../escape.mdx'; writeJSON(join(output, 'batch.json'), batch)
  assert.throws(() => applyBatch(root, output), /目标路径不匹配/)
})
test('YAML-only frontmatter rejects executable engines before any evaluation', () => {
  for (const language of ['js', 'javascript', 'json', 'yaml']) {
    const attack = `---${language}\n({title:"中文",license:"GFDL-1.3",authors:"RxLaboratory",copyright:"2026",proof:(globalThis.__duikReviewExecuted="executed")})\n---\n# 中文`
    delete globalThis.__duikReviewExecuted
    assert.throws(() => validateDraft(attack, null, '# Test'), /YAML/)
    assert.equal(globalThis.__duikReviewExecuted, undefined)
    assert.throws(() => validateDraft(draft, attack, '# Test'), /YAML/)
    assert.equal(globalThis.__duikReviewExecuted, undefined)
  }
  assert.throws(() => validateDraft(draft.replace('title: 测试', 'title: !!js/function "function() {}"'), null, '# Test'), /YAML/)
  assert.doesNotThrow(() => validateDraft(draft.replace(/\n/g, '\r\n'), null, '# Test'))
})
test('review input copies must be present and exactly match their registered source', t => {
  for (const kind of ['source', 'baseline', 'current']) {
    const {root, output} = setup(t)
    trackedFixture(root)
    prepareBatch(root, output); approve(root, output)
    assert.equal(checkBatch(root, output).validated.length, 1)
    const input = join(output, kind, kind === 'current' ? 'a.mdx' : 'a.md')
    const original = readFileSync(input, 'utf8')
    writeFileSync(input, original + '\n改过的输入')
    assert.throws(() => applyBatch(root, output), /输入副本/)
    assert.equal(readFileSync(join(root, 'content/docs/a.mdx'), 'utf8'), draft)
    rmSync(input)
    assert.throws(() => checkBatch(root, output), /输入副本/)
  }
})
test('sparse-omitted translations block preparation and cannot be recreated by apply', t => {
  const {root, output} = setup(t)
  const git = trackedFixture(root)
  prepareBatch(root, output); approve(root, output)
  git(['update-index', '--skip-worktree', 'content/docs/a.mdx'])
  rmSync(join(root, 'content/docs/a.mdx'))
  assert.equal(prepareBatch(root, join(root, 'sparse-batch')).blocked, 1)
  assert.throws(() => applyBatch(root, output), /已登记译文缺失/)
  assert.equal(existsSync(join(root, 'content/docs/a.mdx')), false)
  assert.equal(git(['show', ':content/docs/a.mdx']).toString(), draft)
})
test('registered missing translations are blocked even without a Git checkout', t => {
  const {root, output} = setup(t)
  writeJSON(join(root, 'translation-manifest.json'), {'a.md': {status: 'translated', upstreamHashAtTranslation: '000000000000'}})
  const result = prepareBatch(root, output)
  assert.equal(result.blocked, 1)
  const batch = JSON.parse(readFileSync(join(output, 'batch.json')))
  assert.match(batch.blocked[0].blockedReason, /译文在工作区缺失/)
})
