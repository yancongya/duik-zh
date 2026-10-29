import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { NextRequest, NextResponse } from 'next/server'
import assets from './asset-map.json'

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams
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
