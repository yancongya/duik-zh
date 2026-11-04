import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { convertToPageMap } from 'nextra/page-map'

const projectRoot = new URL('../', import.meta.url)
const configSource = await readFile(new URL('next.config.mjs', projectRoot), 'utf8')
const contentDirBasePath = configSource.match(/contentDirBasePath:\s*(['"])(.*?)\1/)?.[2] ?? '/'

function flattenPages(items) {
  return items.flatMap(item => item.children ? flattenPages(item.children) : [item])
}

test('Nextra navigation routes match the root catch-all content keys', () => {
  const { pageMap, mdxPages } = convertToPageMap({
    filePaths: [
      'app/page.tsx',
      'content/docs/index.mdx',
      'content/docs/advanced/contributing-guide.mdx',
      'content/docs/getting-started/first-look.mdx',
    ],
    basePath: contentDirBasePath.slice(1),
  })

  for (const item of flattenPages(pageMap)) {
    if (!item.__pagePath?.startsWith('content/')) continue
    const contentPath = item.__pagePath.slice('content/'.length)
    const importedKey = Object.entries(mdxPages).find(([, file]) => file === contentPath)?.[0]
    assert.equal(item.route, `/${importedKey}`, `${contentPath}: navigation must use the actual importPage key`)
    assert.ok(!item.route.startsWith('/docs/docs'), `duplicate docs prefix: ${item.route}`)
  }
})

test('legacy duplicate-prefix links redirect permanently without affecting the landing rewrite', async () => {
  const { default: config } = await import('../next.config.mjs')
  assert.equal(typeof config.redirects, 'function')
  const redirects = await config.redirects()
  assert.deepEqual(redirects.find(rule => rule.source === '/docs/docs/:path*'), {
    source: '/docs/docs/:path*',
    destination: '/docs/:path*',
    permanent: true,
  })
  const rewrites = await config.rewrites()
  assert.ok(rewrites.beforeFiles.some(rule => rule.source === '/' && rule.destination === '/landing.html'))
})

const docsOrigin = process.env.DOCS_TEST_ORIGIN
test('live docs have real content, Chinese controls and canonical navigation', { skip: !docsOrigin }, async () => {
  for (const [path, heading] of [
    ['/docs', /Duik/],
    ['/docs/advanced/contributing-guide', /贡献者指南/],
  ]) {
    const response = await fetch(new URL(path, docsOrigin))
    assert.equal(response.status, 200, path)
    const html = await response.text()
    assert.doesNotMatch(html, /id="__next_error__"|NEXT_HTTP_ERROR_FALLBACK;404/)
    assert.match(html, /<article[\s>]/, `${path}: real document article is required`)
    assert.match(html, heading)
    assert.doesNotMatch(html, /href="\/docs\/docs(?:\/|")/)
    assert.match(html, /搜索文档/)
    assert.match(html, /本页内容/)
    assert.match(html, /duik-docs-theme/)
    assert.doesNotMatch(html, />\s*(?:Index|Docs)\s*</)
  }
  const legacy = await fetch(new URL('/docs/docs/advanced/contributing-guide', docsOrigin), { redirect: 'manual' })
  assert.equal(legacy.status, 308)
  assert.equal(new URL(legacy.headers.get('location'), docsOrigin).pathname, '/docs/advanced/contributing-guide')
})
