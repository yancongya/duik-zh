import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { createHash } from 'node:crypto'
import test from 'node:test'
import { convertToPageMap } from 'nextra/page-map'
import { compileMdx } from 'nextra/compile'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import * as jsxRuntime from 'react/jsx-runtime'
import { createDocsLinkResolver } from '../components/docs/docs-links.mjs'
import rootMeta from '../content/docs/_meta.js'
import guideMeta from '../content/docs/guide/_meta.js'
import bonesMeta from '../content/docs/guide/bones/_meta.js'
import autorigMeta from '../content/docs/guide/bones/autorig/_meta.js'
import automationMeta from '../content/docs/guide/automation/_meta.js'

const root = fileURLToPath(new URL('../', import.meta.url))
const contentFiles = readdirSync(new URL('../content/docs/', import.meta.url), { recursive: true })
  .filter(path => path.endsWith('.mdx'))
  .map(path => `content/docs/${path}`)
const { pageMap } = convertToPageMap({ filePaths: contentFiles, basePath: '' })

test('sidebar keeps official group order and reviewed Chinese labels', () => {
  assert.deepEqual(Object.keys(rootMeta), ['index', 'angela', 'tutorials', 'printed-user-guide', 'getting-started', 'guide', 'advanced', 'faq', 'misc', 'bassel'])
  assert.deepEqual(Object.keys(guideMeta), ['rigging', 'oco', 'bones', 'constraints', 'controllers', 'automation', 'animation', 'camera', 'tools', 'cmd', 'notes', 'sanity', 'settings'])
  assert.equal(bonesMeta.index, '骨骼简介')
  assert.equal(bonesMeta.tools, '骨骼工具')
  assert.equal(autorigMeta.index, '自动绑定简介')
  assert.equal(automationMeta.kleaner, 'Kleaner')
  assert.equal(automationMeta.effector, 'Effector')
})

test('actual root document links get the docs prefix and preserve fragments', () => {
  const source = 'content/docs/index.mdx'
  const markdown = readFileSync(new URL(`../${source}`, import.meta.url), 'utf8')
  const resolve = createDocsLinkResolver(source, pageMap)
  for (const [href, expected] of [
    ['getting-started/introduction#should-i-use-duik', '/docs/getting-started/introduction#should-i-use-duik'],
    ['misc/license', '/docs/misc/license'],
    ['advanced/api', '/docs/advanced/api'],
  ]) {
    assert.ok(markdown.includes(`](${href})`), `must exercise real source link: ${href}`)
    assert.equal(resolve(href), expected)
  }
})

test('directory index and normal pages resolve relative to the actual source file', () => {
  const index = createDocsLinkResolver('content/docs/guide/bones/index.mdx', pageMap)
  assert.equal(index('autorig'), '/docs/guide/bones/autorig')
  assert.equal(index('create-bones'), '/docs/guide/bones/create-bones')
  assert.equal(index('autorig/index.md?view=full#section'), '/docs/guide/bones/autorig?view=full#section')
  const page = createDocsLinkResolver('content/docs/guide/bones/autorig/leg.mdx', pageMap)
  assert.equal(page('../create-bones'), '/docs/guide/bones/create-bones')
  assert.equal(page('../../constraints/kinematics'), '/docs/guide/constraints/kinematics')
  assert.equal(page('/misc/license'), '/docs/misc/license')
})

test('external URLs, anchors, images, home and unknown routes remain unchanged', () => {
  const resolve = createDocsLinkResolver('content/docs/index.mdx', pageMap)
  for (const href of ['https://duik.rxlab.io', '//example.org/guide', 'mailto:hello@example.org', 'tel:+123', '#许可证', '?view=all', '/docs-img/logos/gnu.png', '/assets/demo.zip', 'image.png', '/unknown', '/guide', '/', '/docs/advanced/api']) {
    assert.equal(resolve(href), href)
  }
})

test('Nextra renders the real docs homepage through the source-aware anchor adapter', async () => {
  const source = 'content/docs/index.mdx'
  const compiled = await compileMdx(readFileSync(new URL(`../${source}`, import.meta.url), 'utf8'), {
    filePath: `${root}${source}`,
    codeHighlight: false,
    staticImage: false,
  })
  const page = new Function(compiled)({ ...jsxRuntime, useMDXComponents: () => ({}) })
  const resolve = createDocsLinkResolver(page.metadata.filePath, pageMap)
  const html = renderToStaticMarkup(createElement(page.default, {
    components: { a: props => createElement('a', { ...props, href: resolve(props.href) }) },
  }))
  for (const href of ['/docs/misc/license', '/docs/advanced/api', '/docs/getting-started/introduction#should-i-use-duik']) {
    assert.ok(html.includes(`href="${href}"`), `rendered article must contain ${href}`)
  }
  assert.ok(html.includes('src="/docs-img/logos/gnu.png"'))
  assert.ok(html.includes('href="http://membership.rxlab.info"'))
})

test('navigation generation is repeatable and never modifies MDX body files', () => {
  const digest = paths => Object.fromEntries(paths.map(path => [path, createHash('sha256').update(readFileSync(new URL(`../${path}`, import.meta.url))).digest('hex')]))
  const metadataFiles = readdirSync(new URL('../content/docs/', import.meta.url), { recursive: true })
    .filter(path => path.endsWith('_meta.js')).map(path => `content/docs/${path}`)
  const beforeContent = digest(contentFiles)
  const beforeMetadata = digest(metadataFiles)
  execFileSync(process.execPath, ['scripts/mkdocs-to-nextra.mjs'], { cwd: root, encoding: 'utf8' })
  assert.deepEqual(digest(contentFiles), beforeContent)
  assert.deepEqual(digest(metadataFiles), beforeMetadata)
})
