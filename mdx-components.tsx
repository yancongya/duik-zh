import { useMDXComponents as baseUseMDXComponents } from 'nextra-theme-docs'
import type { MDXComponents } from 'nextra/mdx-components'
import { Callout } from 'nextra/components'
import { Video } from './components/docs/Video'

export function useMDXComponents(components: MDXComponents = {}) {
  return {
    ...baseUseMDXComponents(components),
    Callout,
    Video,
  }
}
