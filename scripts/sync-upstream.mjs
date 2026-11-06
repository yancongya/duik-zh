#!/usr/bin/env node
/**
 * sync-upstream.mjs
 * 从 upstream/ 快照生成 sync-report，并把上游 md 结构信息写入 manifest 草稿。
 * 上游快照本身由 GitHub Actions sparse checkout 刷新；本脚本只做本地分析。
 */
import {fileURLToPath} from 'node:url'
import {join, resolve, relative, sep} from 'node:path'
import {lstatSync} from 'node:fs'
import {loadSnapshot, analyzeSnapshot, readJSON, writeJSON, safePath} from './lib/upstream-sync.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
try {
  const args = process.argv.slice(2)
  for (const arg of args) if (arg !== '--check' && !arg.startsWith('--output=')) throw Error('未知参数：' + arg)
  const outputs = args.filter(a => a.startsWith('--output='))
  if (outputs.length > 1 || outputs.length && !outputs[0].slice(9)) throw Error('仅接受一个非空--output路径')
  const output = outputs.length ? resolve(outputs[0].slice(9)) : null
  if (output) {
    const path = safePath(relative(root, output).split(sep).join('/'))
    if (!path.startsWith('output/upstream-sync/') || !path.endsWith('.json')) throw Error('运行报告只能写到output/upstream-sync/内的JSON，不得覆盖正文或登记')
    let cursor = root
    for (const part of path.split('/')) {
      cursor = join(cursor, part)
      try { if (lstatSync(cursor).isSymbolicLink()) throw Error('报告路径不接受符号链接') }
      catch (error) { if (error.code !== 'ENOENT') throw error }
    }
  }
  const result = analyzeSnapshot({root, ...loadSnapshot(root), manifest: readJSON(join(root, 'translation-manifest.json'), {}), previousReport: readJSON(join(root, 'sync-report.json'), {})})
  if (!args.includes('--check')) {
    writeJSON(join(root, 'translation-manifest.json'), result.manifest)
    writeJSON(join(root, 'sync-report.json'), result.report)
    writeJSON(join(root, 'translation-queue.json'), result.queue)
  }
  if (output) writeJSON(output, {...result.run, queue: result.queue})
  console.log(JSON.stringify({mode: args.includes('--check') ? 'read-only' : 'write-reports', documents: result.report.mdCount, ...result.run}, null, 2))
} catch (error) { console.error('[sync] ' + error.message); process.exitCode = 1 }
