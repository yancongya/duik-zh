import { useMDXComponents as baseUseMDXComponents } from 'nextra/mdx-components'
import type { MDXComponents } from 'nextra/mdx-components'
import { Callout } from 'nextra/components'

export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    ...baseUseMDXComponents(components),
    Callout,
  }
}
