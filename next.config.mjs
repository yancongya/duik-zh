import withNextra from 'nextra'
import {readFileSync} from 'node:fs'

const nextra = withNextra({
  defaultShowCopyCode: true,
  // content/docs already supplies the /docs segment to the root catch-all.
  contentDirBasePath: '/',
  // Documentation media lives in public/docs-img; preserve its native format.
  staticImage: false,
})

// Pages builds run in a disposable staging tree; normal local preview is unchanged.
const pages = process.env.DUIK_PAGES === '1'
const basePath = pages ? (process.env.DUIK_PAGES_BASE_PATH || '/duik-zh') : ''

export default nextra({
  reactStrictMode: true,
  ...(pages ? { output: 'export', basePath, trailingSlash: true, outputFileTracingRoot: process.cwd() } : {}),
  ...(!pages ? {
  async redirects() {
    return [
      { source: '/docs/docs/:path*', destination: '/docs/:path*', permanent: true },
      { source: '/logo-lab.html', destination: '/brand.html', permanent: true },
      { source: '/landing-candidate.html', destination: '/', permanent: true },
    ]
  },
  async rewrites() {
    // Serve the copied template and its local assets from this project.
    return {
      beforeFiles: [{ source: '/', destination: '/landing.html' },
        ...JSON.parse(readFileSync(new URL('./components/brand/media-rewrites.json',import.meta.url),'utf8'))],
      // Missing media must return a real 404, never a success-shaped SVG placeholder.
      afterFiles: [],
    }
  },
  } : {}),
  images: {
    dangerouslyAllowSVG: true,
    ...(pages ? { unoptimized: true } : {}),
  },
})
