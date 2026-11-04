const DOCS_ORIGIN = 'https://duik-docs.invalid'

function documentRoutes(pageMap, routes = new Set()) {
  for (const item of pageMap) {
    if (item.route && (!item.children || item.frontMatter?.filePath)) routes.add(item.route)
    if (item.children) documentRoutes(item.children, routes)
  }
  return routes
}

function canonicalPath(path) {
  return path.replace(/\.(?:mdx?|html)$/, '').replace(/\/index\/?$/, '').replace(/\/$/, '') || '/'
}

/** Resolve Markdown links relative to the actual source file, not its pretty URL.
 * Only routes in Nextra's real content page map are rewritten. Assets, anchors,
 * downloads, external protocols and unknown application paths retain their href.
 */
export function createDocsLinkResolver(sourceFile, pageMap) {
  const routes = documentRoutes(pageMap)
  const sourcePath = typeof sourceFile === 'string' && sourceFile.startsWith('content/docs/')
    ? sourceFile.slice('content'.length)
    : null

  return function resolveDocsHref(href) {
    if (!sourcePath || typeof href !== 'string' || !href || /^(?:[?#]|[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) return href
    const [, pathname, suffix = ''] = href.match(/^([^?#]*)([?#][\s\S]*)?$/) || []
    if (!pathname || pathname === '/') return href
    const resolved = new URL(pathname, `${DOCS_ORIGIN}${sourcePath}`).pathname
    const candidates = [canonicalPath(resolved)]
    if (pathname.startsWith('/') && !pathname.startsWith('/docs/')) candidates.push(canonicalPath(`/docs${resolved}`))
    const destination = candidates.find(route => routes.has(route))
    return destination ? `${destination}${suffix}` : href
  }
}
