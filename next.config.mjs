import withNextra from 'nextra'

const nextra = withNextra({
  defaultShowCopyCode: true,
  contentDirBasePath: '/docs',
})

export default nextra({
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
  },
})
