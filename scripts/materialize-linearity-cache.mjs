import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'

const source = '/Users/tanyancong/工作/开发/web-clone/.web-clone/jobs/linearity-recapture-20261029b/runtime-cache'
const destination = path.resolve('public')
const manifest = JSON.parse(await fs.readFile(path.join(source, 'manifest.json'), 'utf8'))
const root = manifest.entries['GET /']
if (!root || root.status !== 200) throw new Error('Missing recorded homepage')
let homepage = await fs.readFile(path.join(source, root.file), 'utf8')
homepage = homepage.replace(/<script[^>]*googletagmanager[^>]*><\/script>/g, '')
homepage = homepage.replace(/<script[^>]*lemlist[^>]*><\/script>/g, '')
homepage = homepage.replace(/<noscript><iframe[^>]*googletagmanager[^>]*><\/iframe><\/noscript>/g, '')
await fs.writeFile(path.join(destination, 'landing.html'), homepage)
const queried = {}
let copied = 0
let skipped = 0
for (const [key, entry] of Object.entries(manifest.entries)) {
  if (!key.startsWith('GET ') || entry.status !== 200) continue
  const url = new URL(key.slice(4), 'https://www.linearity.io')
  if (url.pathname === '/') { skipped++; continue }
  if (url.search && url.pathname.startsWith('/.netlify/images')) {
    const file = `${createHash('sha256').update(key).digest('hex')}.webp`
    await fs.mkdir(path.join(destination, 'linearity-media'), { recursive: true })
    const cachedBody = await fs.readFile(path.join(source, entry.file))
    const originalPath = url.searchParams.get('url')
    const isSvgPlaceholder = cachedBody.subarray(0, 4).toString() === '<svg' && originalPath?.endsWith('.svg')
    let body = cachedBody
    let type = entry.headers['content-type'] || 'image/webp'
    if (isSvgPlaceholder) {
      const localOriginal = path.resolve(destination, `.${originalPath}`)
      if (!localOriginal.startsWith(`${destination}${path.sep}`)) throw new Error(`Unsafe image path: ${originalPath}`)
      try { body = await fs.readFile(localOriginal) }
      catch {
        const response = await fetch(new URL(originalPath, 'https://www.linearity.io'))
        if (!response.ok) throw new Error(`Unable to fetch ${originalPath}: ${response.status}`)
        body = Buffer.from(await response.arrayBuffer())
        await fs.mkdir(path.dirname(localOriginal), { recursive: true })
        await fs.writeFile(localOriginal, body)
      }
      type = 'image/svg+xml'
    }
    await fs.writeFile(path.join(destination, 'linearity-media', file), body)
    queried[url.search] = { file, type }
    copied++
    continue
  }
  if (!/^\/(?:_nuxt|fonts|images|textures)\//.test(url.pathname) && !['/_payload.json', '/how_it_works.json', '/favicon-16x16.png', '/favicon-32x32.png'].includes(url.pathname)) { skipped++; continue }
  const target = path.resolve(destination, `.${url.pathname}`)
  if (!target.startsWith(`${destination}${path.sep}`)) throw new Error(`Unsafe path: ${url.pathname}`)
  await fs.mkdir(path.dirname(target), { recursive: true })
  await fs.copyFile(path.join(source, entry.file), target)
  copied++
}
await fs.mkdir(path.resolve('app/.netlify/images'), { recursive: true })
await fs.writeFile(path.resolve('app/.netlify/images/asset-map.json'), `${JSON.stringify(queried, null, 2)}\n`)
console.log({ copied, skipped, total: Object.keys(manifest.entries).length })
