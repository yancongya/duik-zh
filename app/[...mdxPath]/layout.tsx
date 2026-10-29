import type { ReactNode } from 'react'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { getPageMap } from 'nextra/page-map'

export default async function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <Layout
      navbar={<Navbar logo={<b>Duik 中文站</b>} projectLink="https://github.com/yancongya/duik-zh" />}
      footer={<Footer>非官方中文站 · Duik Ángela · GFDL 1.3</Footer>}
      pageMap={await getPageMap()}
      docsRepositoryBase="https://github.com/yancongya/duik-zh"
    >
      {children}
    </Layout>
  )
}
