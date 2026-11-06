#!/usr/bin/env node
import {fileURLToPath} from 'node:url'
import {resolve, relative, sep} from 'node:path'
import {prepareBatch, checkBatch, applyBatch} from './lib/translation-batch.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
try {
  const [command, ...args] = process.argv.slice(2)
  if (!['prepare', 'check', 'apply'].includes(command)) throw Error('用法：translation-batch.mjs prepare|check|apply --batch=目录 [--limit=5] [--path=文档.md]')
  const allowed = command === 'prepare' ? ['--batch=', '--limit=', '--path='] : ['--batch=']
  if (args.some(a => !allowed.some(prefix => a.startsWith(prefix)))) throw Error('未知参数')
  const option = key => args.find(a => a.startsWith(key + '='))?.slice(key.length + 1)
  if (!option('--batch')) throw Error('需要显式--batch目录')
  const output = resolve(option('--batch'))
  if (output === root || root.startsWith(output + '/')) throw Error('不能将仓库或其父目录作为批次目录')
  const local = relative(root, output)
  if (!local.startsWith('..' + sep) && !local.startsWith('output' + sep + 'upstream-sync' + sep)) throw Error('仓库内批次必须位于output/upstream-sync/，不能写入正文或配置目录')
  const result = command === 'prepare' ? prepareBatch(root, output, {limit: Number(option('--limit') || 5), path: option('--path')}) : command === 'apply' ? applyBatch(root, output) : {validated: checkBatch(root, output).validated.length, applied: false}
  console.log(JSON.stringify(result, null, 2))
} catch (error) { console.error('[translation] ' + error.message); process.exitCode = 1 }
