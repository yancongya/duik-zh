import type { ReactNode } from 'react'
import './globals.css'
import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'Duik 中文站',
    template: '%s | Duik 中文站',
  },
  description:
    'Duik Ángela（After Effects 角色绑定与动画工具集）非官方中文文档与产品介绍站',
}

const navbar = (
  <Navbar
    logo={<b>Duik 中文站</b>}
    projectLink="https://github.com/yancongya/duik-zh"
  />
)

const footer = <Footer>非官方中文站 · Duik Ángela · GFDL 1.3</Footer>

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        <Layout
          navbar={navbar}
          footer={footer}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/yancongya/duik-zh"
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
