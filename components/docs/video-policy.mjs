export const officialCourse = 'https://rxlaboratorio.org/rx-tutorial/duik-17/'
const legacyCourse = /^https:\/\/rxlaboratory\.org\/wp-content\/uploads\/rx-videos\/Duik17_[\w-]+\.mp4$/

export function safeMediaUrl(value) {
  if (typeof value !== 'string') return null
  if (value.startsWith('/') && !value.startsWith('//')) return value
  try { const u = new URL(value); return ['http:', 'https:'].includes(u.protocol) ? u.href : null } catch { return null }
}

export function videoInfo(src, checks = []) {
  const url = safeMediaUrl(src)
  const checked = checks.find(item => item.url === url)
  return {url, officialPage: legacyCourse.test(src) ? officialCourse : null,
    unavailable: !url || [403, 404, 410].includes(checked?.status)}
}

// Existing translated captions contain a small Markdown subset. Render links
// as safe React nodes, never raw HTML; retain their text and attribution.
export function captionParts(caption = '') {
  const parts = [], pattern = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g
  const plain = text => text.replace(/\*\*|__/g, '')
  let start = 0
  for (const match of caption.matchAll(pattern)) {
    if (match.index > start) parts.push({text: plain(caption.slice(start, match.index))})
    parts.push({text: plain(match[1]), href: safeMediaUrl(match[2])})
    start = match.index + match[0].length
  }
  if (start < caption.length) parts.push({text: plain(caption.slice(start))})
  return parts
}

export async function requestVideoPlay(element, onFailure) {
  if (!element) return
  try { await element.play() } catch (error) {
    // Browser gesture restrictions aren't a missing media file. Native controls
    // stay available, and expected aborted loads must not become unhandled errors.
    if (!['AbortError', 'NotAllowedError'].includes(error?.name)) onFailure(error)
  }
}
