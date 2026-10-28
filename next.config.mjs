import withNextra from 'nextra'

const nextra = withNextra({
  defaultShowCopyCode: true,
})

export default nextra({
  reactStrictMode: true,
  images: {
    dangerouslyAllowSVG: true,
  },
})
