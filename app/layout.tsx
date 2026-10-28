import type { ReactNode } from 'react'
import './globals.css'

export const metadata = {
  title: {
    default: 'Duik 中文站',
    template: '%s | Duik 中文站',
  },
  description:
    'Duik Ángela（After Effects 角色绑定与动画工具集）非官方中文文档与产品介绍站',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  )
}
