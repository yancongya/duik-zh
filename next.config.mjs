import withNextra from 'nextra'

const nextra = withNextra({
  defaultShowCopyCode: true,
  // content/docs already supplies the /docs segment to the root catch-all.
  contentDirBasePath: '/',
  // Sparse checkouts may omit upstream images; serve them at runtime.
  staticImage: false,
})

export default nextra({
  reactStrictMode: true,
  async redirects() {
    return [
      { source: '/docs/docs/:path*', destination: '/docs/:path*', permanent: true },
    ]
  },
  async rewrites() {
    // Serve the copied template and its local assets from this project.
    return {
      beforeFiles: [{ source: '/', destination: '/landing.html' }],
      // Existing public images win; omitted sparse-checkout images get a label.
      afterFiles: [{ source: '/docs-img/:path*', destination: '/docs-image-unavailable.svg' }],
    }
  },
  images: {
    dangerouslyAllowSVG: true,
  },
})
