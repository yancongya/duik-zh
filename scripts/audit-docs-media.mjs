#!/usr/bin/env node
import {mkdir, writeFile} from 'node:fs/promises'
import {dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {collectDocsMedia, mapLimit} from './lib/docs-media.mjs'
import {resolveDocsImage} from '../components/docs/image-policy.mjs'

const args = process.argv.slice(2)
const option = name => args.find(arg => arg.startsWith(name + '='))?.slice(name.length + 1)
const root = fileURLToPath(new URL('../', import.meta.url))
const origin = option('--origin')
if (origin && !['127.0.0.1', 'localhost', '[::1]'].includes(new URL(origin).hostname)) throw Error('--origin must be loopback')
const report = {checkedAt: new Date().toISOString(), ...await collectDocsMedia(root)}
if (args.includes('--check-external-images')) report.externalHttp = await mapLimit(report.external, 4, async image => {
  const resolvedUrl = resolveDocsImage(image.url)
  try {
    const r = await fetch(resolvedUrl, {method: 'HEAD', signal: AbortSignal.timeout(10000)})
    return {url: image.url, resolvedUrl, status: r.status, type: r.headers.get('content-type'), ok: r.ok && /^image\//.test(r.headers.get('content-type') || '')}
  } catch (e) { return {url: image.url, resolvedUrl, ok: false, error: e.message} }
})
if (args.includes('--check-videos')) report.videoHttp = await mapLimit(report.videos, 6, async video => {
  // Only the exact sources already present in the documents. No guessed URLs,
  // course downloads, credentials or protected-content workarounds.
  try {
    const r = await fetch(video.url, {method: 'HEAD', signal: AbortSignal.timeout(10000)})
    return {url: video.url, status: r.status, finalUrl: r.url, type: r.headers.get('content-type'), ok: r.ok && /^video\//.test(r.headers.get('content-type') || '')}
  } catch (e) { return {url: video.url, ok: false, error: e.message} }
})
if (origin) report.http = await mapLimit(report.local, 8, async image => {
  try {
    const r = await fetch(new URL(image.url, origin), {method: 'HEAD', signal: AbortSignal.timeout(10000)})
    return {url: image.url, status: r.status, type: r.headers.get('content-type'), ok: r.ok && r.headers.get('content-type')?.split(';')[0] === image.mime}
  } catch (e) { return {url: image.url, ok: false, error: e.message} }
})
const missing = report.local.filter(i => !i.exists || !i.mime)
const failedHttp = report.http?.filter(i => !i.ok) || []
const failedExternal = report.externalHttp?.filter(i => !i.ok) || []
report.summary = {documents: report.documents,localImages: report.local.length,externalImages: report.external.length,videos: report.videos.length,missingImages: missing.length,failedHttp: failedHttp.length,failedExternalImages: report.externalHttp ? failedExternal.length : undefined,failedVideos: report.videoHttp?.filter(v => !v.ok).length}
const output = option('--output')
if (output) { await mkdir(dirname(output), {recursive: true}); await writeFile(output, JSON.stringify(report, null, 2) + '\n') }
if (args.includes('--record-video-status')) {
  if (!report.videoHttp) throw Error('--record-video-status requires --check-videos')
  await writeFile(new URL('../components/docs/video-status.json', import.meta.url), JSON.stringify({
    checkedAt: report.checkedAt,
    source: 'Exact video sources from content/docs; HEAD checks, no media downloads',
    officialCourse: 'https://rxlaboratorio.org/rx-tutorial/duik-17/',
    videos: report.videoHttp,
  }, null, 2) + '\n')
}
console.log(JSON.stringify({...report.summary, missing, httpFailures: failedHttp, externalFailures: failedExternal}, null, 2))
if (missing.length || failedHttp.length || failedExternal.length) process.exitCode = 1
