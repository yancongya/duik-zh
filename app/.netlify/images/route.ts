import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import assets from './asset-map.json'

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams
  const localImage = requested.get('url')
  const localPrefix = ['/duik-preview-assets/', '/duik-landing-assets/', '/duik-experience/previews/', '/duik-experience/official/', '/duik-experience/wall/', '/duik-experience/icons/'].find(prefix => localImage?.startsWith(prefix))
  if (localImage && localPrefix) {
    const filename = path.resolve(process.cwd(), 'public', `.${localImage}`)
    const assetRoot = path.resolve(process.cwd(), 'public', `.${localPrefix}`)
    const types: Record<string, string> = { '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' }
    const type = types[path.extname(filename).toLowerCase()]
    if (!filename.startsWith(`${assetRoot}${path.sep}`) || !type) return new NextResponse('Invalid local image path', { status: 400 })
    try {
      const body = await readFile(filename)
      return new NextResponse(body, { headers: { 'Content-Type': type, 'Cache-Control': 'public, max-age=3600', 'X-Content-Type-Options': 'nosniff' } })
    } catch {
      return new NextResponse('Local image not found', { status: 404 })
    }
  }
  const entries = Object.entries(assets as Record<string, { file: string; type: string }>)
  const asset = entries.find(([query]) => {
    const recorded = new URLSearchParams(query)
    return [...requested].every(([key, value]) => recorded.get(key) === value) && [...recorded].length === [...requested].length
  })?.[1] ?? entries
    .filter(([query]) => {
      const recorded = new URLSearchParams(query)
      return recorded.get('url') === requested.get('url') && recorded.get('fm') === requested.get('fm')
    })
    .sort(([left], [right]) => {
      const targetWidth = Number(requested.get('w')) || 0
      return Math.abs((Number(new URLSearchParams(left).get('w')) || 0) - targetWidth)
        - Math.abs((Number(new URLSearchParams(right).get('w')) || 0) - targetWidth)
    })[0]?.[1]
  if (!asset) return new NextResponse('Image was not recorded locally', { status: 404 })
  const body = await readFile(path.join(process.cwd(), 'public/linearity-media', asset.file))
  return new NextResponse(body, { headers: { 'Content-Type': asset.type, 'Cache-Control': 'public, max-age=31536000, immutable' } })
}
