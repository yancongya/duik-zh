import type { ReactNode } from 'react'
import Link from 'next/link'
import { Footer, LastUpdated, Layout, Navbar } from 'nextra-theme-docs'
import { Search } from 'nextra/components'
import { GitHubIcon } from 'nextra/icons'
import { getPageMap } from 'nextra/page-map'

export default async function DocsLayout({ children }: { children: ReactNode }) {
  // Keep the landing page and the outer docs folder out of the reader navigation.
  // Labels and order come from the existing mkdocs → _meta.js generation flow.
  const pageMap = await getPageMap('/docs')

  return (
    <Layout
      navbar={
        <Navbar
          logoLink={false}
          logo={<Link href="/docs" aria-label="Duik 中文文档首页" style={{display:'inline-flex',alignItems:'center',gap:8}}><img src="/brand/v1/logo.svg" width="32" height="32" alt="" /><b>Duik 中文站</b></Link>}
          projectLink="https://github.com/yancongya/duik-zh"
          projectIcon={<GitHubIcon height="24" aria-label="项目仓库" />}
        >
          <Link href="/">返回首页</Link>
        </Navbar>
      }
      footer={<Footer>非官方中文站 · Duik Ángela · GFDL 1.3</Footer>}
      pageMap={pageMap}
      docsRepositoryBase="https://github.com/yancongya/duik-zh"
      nextThemes={{ defaultTheme: 'light', storageKey: 'duik-docs-theme' }}
      themeSwitch={{ light: '浅色', dark: '深色', system: '跟随系统' }}
      toc={{ title: '本页内容', backToTop: '返回顶部' }}
      editLink="编辑此页"
      feedback={{ content: '反馈问题' }}
      lastUpdated={<LastUpdated locale="zh-CN">最后更新于</LastUpdated>}
      search={
        <Search
          placeholder="搜索文档…"
          aria-label="搜索文档"
          emptyResult="没有找到相关内容。"
          errorText="搜索索引暂时不可用。"
          loading="正在搜索…"
        />
      }
    >
      {children}
    </Layout>
  )
}
