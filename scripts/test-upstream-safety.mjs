import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, copyFileSync, existsSync, rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {execFileSync, spawnSync} from 'node:child_process'

const root = fileURLToPath(new URL('../', import.meta.url))
function fixture(t, label = 'fixture') {
  const base = mkdtempSync(join(tmpdir(), 'duik-sync-test-'))
  t.after(() => rmSync(base, {recursive: true, force: true}))
  const dir = join(base, label)
  for (const sub of ['scripts/lib', 'upstream/docs', 'content/docs']) mkdirSync(join(dir, sub), {recursive: true})
  for (const file of ['md-convert.mjs', 'sync-upstream.mjs', 'refresh-upstream-snapshot.mjs', 'lib/upstream-sync.mjs']) {
    if (existsSync(join(root, 'scripts', file))) copyFileSync(join(root, 'scripts', file), join(dir, 'scripts', file))
  }
  writeFileSync(join(dir, 'upstream/docs/a.md'), '# Original\n\nEnglish source.\n')
  return dir
}
const run = (dir, script, args = []) => spawnSync(process.execPath, [join(dir, 'scripts', script), ...args], {cwd: dir, encoding: 'utf8'})

test('upstream binary bytes are never changed by Git clean filters', () => {
  const binary = Buffer.from('89504e470d0a1a0a000d0aff', 'hex')
  const raw = execFileSync('git', ['hash-object', '--stdin'], {cwd: root, input: binary, encoding: 'utf8'})
  for (const ext of ['png', 'PNG', 'gif', 'jpg', 'mp4', 'aep', 'ttf']) {
    const clean = execFileSync('git', ['hash-object', `--path=upstream/docs/img/example.${ext}`, '--stdin'], {cwd: root, input: binary, encoding: 'utf8'})
    assert.equal(clean, raw, ext + ' must retain every byte')
  }
})

test('sync and convert resolve a Chinese checkout without percent-encoded paths', t => {
  const dir = fixture(t, '中文 工作目录')
  const sync = run(dir, 'sync-upstream.mjs')
  assert.equal(sync.status, 0, sync.stderr)
  const convert = run(dir, 'md-convert.mjs')
  assert.equal(convert.status, 0, convert.stderr)
  assert.match(readFileSync(join(dir, 'content/docs/a.mdx'), 'utf8'), /English source/)
})

test('report output cannot overwrite translations or synchronization records', t => {
  for (const path of ['content/docs/a.mdx', 'translation-manifest.json', 'sync-report.json']) {
    const dir = fixture(t)
    const file = join(dir, path), original = path.endsWith('.mdx') ? '# 已有中文\n' : '{}\n'
    writeFileSync(file, original)
    const result = run(dir, 'sync-upstream.mjs', ['--check', '--output=' + path])
    assert.notEqual(result.status, 0)
    assert.equal(readFileSync(file, 'utf8'), original)
  }
  const dir = fixture(t)
  assert.equal(run(dir, 'sync-upstream.mjs', ['--check', '--output=output/upstream-sync/check.json']).status, 0)
  assert.equal(existsSync(join(dir, 'translation-manifest.json')), false)
  assert.equal(JSON.parse(readFileSync(join(dir, 'output/upstream-sync/check.json'))).pending, 1)
})

test('force cannot overwrite translated, unregistered or partially edited existing files', t => {
  for (const status of ['translated', 'reviewed', undefined, 'untranslated']) {
    const dir = fixture(t, String(status))
    writeFileSync(join(dir, 'content/docs/a.mdx'), '# 已有中文\n\n保留人工改动。\n')
    writeFileSync(join(dir, 'translation-manifest.json'), JSON.stringify(status ? {'a.md': {status}} : {}))
    const result = run(dir, 'md-convert.mjs', ['--force'])
    assert.notEqual(result.status, 0, '--force must be explicitly rejected')
    assert.equal(readFileSync(join(dir, 'content/docs/a.mdx'), 'utf8'), '# 已有中文\n\n保留人工改动。\n')
  }
})

test('converter preserves Git-tracked sparse translations and registered missing files', t => {
  const dir = fixture(t), target = join(dir, 'content/docs/a.mdx')
  const git = args => execFileSync('git', args, {cwd: dir, stdio: 'pipe'})
  git(['init'])
  writeFileSync(target, '# 已批准中文\n')
  git(['add', '--', 'content/docs/a.mdx'])
  git(['update-index', '--skip-worktree', 'content/docs/a.mdx'])
  rmSync(target)
  assert.equal(run(dir, 'md-convert.mjs').status, 0)
  assert.equal(existsSync(target), false)
  assert.equal(git(['show', ':content/docs/a.mdx']).toString(), '# 已批准中文\n')
  const registered = fixture(t, 'registered')
  writeFileSync(join(registered, 'translation-manifest.json'), JSON.stringify({'a.md': {status: 'translated'}}))
  assert.equal(run(registered, 'md-convert.mjs').status, 0)
  assert.equal(existsSync(join(registered, 'content/docs/a.mdx')), false)
})

test('new placeholders retain official attribution metadata', t => {
  const dir = fixture(t)
  writeFileSync(join(dir, 'upstream/docs/a.md'), '# Test\n\n![META](authors:An author;license:GNU-FDL;copyright:2026;updated:2026-01-01)\n')
  const result = run(dir, 'md-convert.mjs')
  assert.equal(result.status, 0, result.stderr)
  const out = readFileSync(join(dir, 'content/docs/a.mdx'), 'utf8')
  assert.match(out, /license: GFDL-1.3/)
  assert.match(out, /authors: "An author"/)
  assert.match(out, /copyright: "2026"/)
})

test('CI refresh pins official bytes; invalid source cannot replace the prior snapshot', t => {
  const dir = fixture(t), source = join(dir, 'upstream-tmp')
  mkdirSync(join(source, 'src-docs/docs/img'), {recursive: true})
  const png = Buffer.from('89504e470d0a1a0a000d0aff', 'hex')
  writeFileSync(join(source, 'src-docs/mkdocs.yml'), 'site_name: fixture\n')
  writeFileSync(join(source, 'src-docs/docs/a.md'), '# Original\r\n')
  writeFileSync(join(source, 'src-docs/docs/img/a.png'), png)
  const git = args => execFileSync('git', args, {cwd: source, stdio: 'pipe'})
  git(['init']); git(['config', 'core.autocrlf', 'false'])
  git(['add', '--', 'src-docs'])
  git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-m', 'fixture'])
  git(['remote', 'add', 'origin', 'https://github.com/RxLaboratory/Duik'])
  const invoke = () => spawnSync(process.execPath, [join(dir, 'scripts/refresh-upstream-snapshot.mjs')], {cwd: dir, env: {...process.env, GITHUB_ACTIONS: 'true'}, encoding: 'utf8'})
  writeFileSync(join(source, 'src-docs/docs/img/a.png'), Buffer.from('corrupt'))
  assert.notEqual(invoke().status, 0)
  assert.match(readFileSync(join(dir, 'upstream/docs/a.md'), 'utf8'), /English source/)
  writeFileSync(join(source, 'src-docs/docs/img/a.png'), png)
  const refreshed = invoke()
  assert.equal(refreshed.status, 0, refreshed.stderr)
  assert.deepEqual(readFileSync(join(dir, 'upstream/docs/img/a.png')), png)
  assert.equal(JSON.parse(readFileSync(join(dir, 'upstream-revision.json'))).commit, git(['rev-parse', 'HEAD']).toString().trim())
  const local = spawnSync(process.execPath, [join(dir, 'scripts/refresh-upstream-snapshot.mjs')], {cwd: dir, env: {...process.env, GITHUB_ACTIONS: 'false'}, encoding: 'utf8'})
  assert.notEqual(local.status, 0)
})
