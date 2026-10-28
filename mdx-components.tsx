import { useMDXComponents as baseUseMDXComponents } from 'nextra/mdx-components'
import type { MDXComponents } from 'nextra/mdx-components'
import { Callout } from 'nextra/components'
import { Video } from './components/docs/Video'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...baseUseMDXComponents(components),
    Callout,
    Video,
  }
}
