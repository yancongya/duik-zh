import type { ReactNode } from 'react'
import './globals.css'
import { Head } from 'nextra/components'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'Duik 中文站',
    template: '%s | Duik 中文站',
  },
  description:
    'Duik Ángela（After Effects 角色绑定与动画工具集）非官方中文文档与产品介绍站',
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" dir="ltr" suppressHydrationWarning>
      <Head />
      <body>
        {children}
      </body>
    </html>
  )
}
