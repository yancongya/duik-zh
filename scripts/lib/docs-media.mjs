import {readFile, readdir, stat} from 'node:fs/promises'
import {join, resolve, relative} from 'node:path'
import {unified} from 'unified'
import remarkParse from 'remark-parse'
import remarkMdx from 'remark-mdx'
import matter from 'gray-matter'

// Parse Markdown destinations rather than cutting at the first ')': several
// official filenames contain balanced parentheses and URL-encoded characters.
export function extractDocsMedia(source, file) {
  const ast = unified().use(remarkParse).use(remarkMdx).parse(matter(source).content)
  const images = [], videos = [], definitions = new Map()
  const visit = (node, fn) => { fn(node); for (const child of node.children || []) visit(child, fn) }
  visit(ast, node => { if (node.type === 'definition') definitions.set(node.identifier, node.url) })
  const add = (list, url) => { if (url) list.push({url, file}) }
  visit(ast, node => {
    if (node.type === 'image') add(images, node.url)
    if (node.type === 'imageReference') add(images, definitions.get(node.identifier))
    if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
      const src = node.attributes?.find(a => a.name === 'src')?.value
      if (typeof src !== 'string') return
      if (node.name === 'img') add(images, src)
      if (['Video', 'video', 'source'].includes(node.name)) add(videos, src)
    }
  })
  return {images, videos}
}

export function imageMime(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex'))) return 'image/png'
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (/^GIF8[79]a/.test(buffer.subarray(0, 6).toString())) return 'image/gif'
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  if (/<svg[\s>]/i.test(buffer.subarray(0, 1000).toString())) return 'image/svg+xml'
  return null
}

export async function collectDocsMedia(root) {
  const walk = async dir => (await Promise.all((await readdir(dir, {withFileTypes: true})).map(e =>
    e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))).flat()
  const images = new Map(), videos = new Map()
  const files = (await walk(join(root, 'content/docs'))).filter(p => p.endsWith('.mdx')).sort()
  for (const file of files) {
    const media = extractDocsMedia(await readFile(file, 'utf8'), relative(root, file))
    for (const [key, map] of [['images', images], ['videos', videos]]) for (const ref of media[key]) {
      if (!map.has(ref.url)) map.set(ref.url, {url: ref.url, files: []})
      if (!map.get(ref.url).files.includes(ref.file)) map.get(ref.url).files.push(ref.file)
    }
  }
  const local = [], external = []
  for (const image of images.values()) {
    if (!image.url.startsWith('/docs-img/')) { external.push(image); continue }
    const pathname = decodeURIComponent(new URL(image.url, 'http://local').pathname)
    const file = resolve(root, 'public' + pathname)
    if (!file.startsWith(resolve(root, 'public/docs-img') + '/')) throw Error('Invalid image path: ' + image.url)
    try {
      const buffer = await readFile(file)
      local.push({...image, bytes: (await stat(file)).size, mime: imageMime(buffer), exists: true})
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      local.push({...image, exists: false, mime: null})
    }
  }
  return {documents: files.length, local, external, videos: [...videos.values()]}
}

export async function mapLimit(items, count, fn) {
  const results = new Array(items.length)
  let index = 0
  await Promise.all(Array.from({length: Math.min(count, items.length)}, async () => {
    for (;;) { const i = index++; if (i >= items.length) return; results[i] = await fn(items[i]) }
  }))
  return results
}
