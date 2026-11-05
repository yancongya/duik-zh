import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {fileURLToPath} from 'node:url'
import {extractDocsMedia, collectDocsMedia, imageMime} from './lib/docs-media.mjs'
import {captionParts, videoInfo, requestVideoPlay, officialCourse} from '../components/docs/video-policy.mjs'
import ts from 'typescript'
import {renderToStaticMarkup} from 'react-dom/server'
import {createElement} from 'react'
import {docsImageMigrations, resolveDocsImage} from '../components/docs/image-policy.mjs'
import {compileMdx} from 'nextra/compile'
import * as jsxRuntime from 'react/jsx-runtime'

test('the real Bassel document renders migrated images without rewriting its captions', async () => {
  const source = await readFile(new URL('../content/docs/bassel.mdx', import.meta.url), 'utf8')
  const compiled = await compileMdx(source, {filePath: fileURLToPath(new URL('../content/docs/bassel.mdx', import.meta.url)), codeHighlight: false, staticImage: false})
  const page = new Function(compiled)({...jsxRuntime, useMDXComponents: () => ({})})
  const html = renderToStaticMarkup(createElement(page.default, {components: {
    img: props => createElement('img', {...props, src: resolveDocsImage(props.src)}),
  }}))
  for (const [oldUrl, newUrl] of Object.entries(docsImageMigrations)) {
    assert(source.includes(oldUrl), 'translated source must retain its original provenance')
    assert(html.includes(`src="${newUrl}"`))
    assert(!html.includes(`src="${oldUrl}"`))
  }
  assert(html.includes('Bassel 的签名'))
})

test('exact external image migrations preserve unrelated sources and document attribution', async () => {
  const inventory = await collectDocsMedia(fileURLToPath(new URL('../', import.meta.url)))
  assert.equal(Object.keys(docsImageMigrations).length, 2)
  for (const [original, current] of Object.entries(docsImageMigrations)) {
    assert(inventory.external.some(i => i.url === original), 'mapping must match a real document reference')
    assert.equal(resolveDocsImage(original), current)
    assert.equal(new URL(current).hostname, 'upload.wikimedia.org')
  }
  for (const src of [undefined, '/docs-img/ae/file_network_access.png', 'https://example.com/other.png']) {
    assert.equal(resolveDocsImage(src), src)
  }
})

test('media inventory retains balanced filenames, reference images, JSX and source links', () => {
  const r = extractDocsMedia('![a](/docs-img/test_(2).jpg)\n\n![b][ref]\n\n[ref]: /docs-img/b.png\n\n<img src="/docs-img/c.gif" />\n\n<Video src="https://example.com/x.mp4" />', 'test.mdx')
  assert.deepEqual(r.images.map(i => i.url), ['/docs-img/test_(2).jpg', '/docs-img/b.png', '/docs-img/c.gif'])
  assert.equal(r.videos[0].url, 'https://example.com/x.mp4')
  assert.equal(imageMime(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), 'image/svg+xml')
})
test('all current document-local images exist as real image files', async () => {
  const r = await collectDocsMedia(fileURLToPath(new URL('../', import.meta.url)))
  assert(r.local.length > 500)
  assert.deepEqual(r.local.filter(i => !i.exists || !i.mime).map(i => i.url), [])
  const mytho = await readFile(new URL('../public/docs-img/examples/mytho01.jpg', import.meta.url))
  assert.equal(imageMime(mytho), 'image/jpeg', 'an SVG placeholder is not a successful JPEG')
})

test('missing images cannot be disguised as a successful placeholder response', async () => {
  const {default: config} = await import('../next.config.mjs')
  const rewrites = await config.rewrites()
  assert(!Object.values(rewrites).flat().some(rule => rule.source.startsWith('/docs-img')))
})

test('video policy keeps original links, renders safe caption links and distinguishes network errors', async () => {
  const src = 'https://rxlaboratory.org/wp-content/uploads/rx-videos/Duik17_B01_Install__EN_720.mp4'
  assert.deepEqual(videoInfo(src, [{url: src, status: 404}]), {url: src, unavailable: true, officialPage: officialCourse})
  assert.equal(videoInfo(src, [{url: src, error: 'timeout'}]).unavailable, false)
  assert.equal(videoInfo('javascript:alert(1)').url, null)
  assert.equal(captionParts('本视频是 [__官方课程__](https://example.com/course) 的一部分')[1].href, 'https://example.com/course')
  let failed = 0
  for (const name of ['AbortError', 'NotAllowedError']) await requestVideoPlay({play: async () => {throw {name}}}, () => failed++)
  assert.equal(failed, 0)
  await requestVideoPlay({play: async () => {throw {name: 'NotSupportedError'}}}, () => failed++)
  assert.equal(failed, 1)
})

test('actual React video SSR shows official fallback for checked dead sources, native controls for others', async () => {
  const checks = JSON.parse(await readFile(new URL('../components/docs/video-status.json', import.meta.url), 'utf8'))
  let source = await readFile(new URL('../components/docs/Video.tsx', import.meta.url), 'utf8')
  source = source.replace("import videoChecks from './video-status.json'", `const videoChecks = ${JSON.stringify(checks)}`)
  let js = ts.transpileModule(source, {compilerOptions: {jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ES2022}}).outputText
  js = js.replaceAll('"react/jsx-runtime"', JSON.stringify(import.meta.resolve('react/jsx-runtime')))
    .replaceAll("'react'", JSON.stringify(import.meta.resolve('react')))
    .replaceAll("'./video-policy.mjs'", JSON.stringify(new URL('../components/docs/video-policy.mjs', import.meta.url).href))
  const {Video} = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'))
  const dead = checks.videos.find(v => v.status === 404)
  assert(dead, 'the real checked source is required')
  const unavailable = renderToStaticMarkup(createElement(Video, {src: dead.url, caption: '本视频是 [__官方课程__](https://example.com/course) 的一部分'}))
  assert(!unavailable.includes('<video'))
  assert(!unavailable.includes('aria-label="播放视频"'))
  assert(unavailable.includes(officialCourse))
  assert(!unavailable.includes(`href="${dead.url}"`), 'a known-dead source is provenance, not a recommended navigation link')
  assert(unavailable.includes('href="https://example.com/course"'))
  assert(unavailable.includes('重试原地址'))
  const available = renderToStaticMarkup(createElement(Video, {src: '/test.mp4'}))
  assert(available.includes('<video'))
  assert(available.includes('controls=""'))
  assert(!available.includes('autoplay'))
})
