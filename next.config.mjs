import withNextra from 'nextra'
import {readFileSync} from 'node:fs'

const nextra = withNextra({
  defaultShowCopyCode: true,
  // content/docs already supplies the /docs segment to the root catch-all.
  contentDirBasePath: '/',
  // Documentation media lives in public/docs-img; preserve its native format.
  staticImage: false,
})

export default nextra({
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/docs/docs/:path*', destination: '/docs/:path*', permanent: true },
      { source: '/logo-lab.html', destination: '/brand.html', permanent: true },
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
  images: {
    dangerouslyAllowSVG: true,
  },
})
