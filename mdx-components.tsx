import { useMDXComponents as baseUseMDXComponents } from 'nextra-theme-docs'
import type { MDXComponents } from 'nextra/mdx-components'
import type { ComponentProps } from 'react'
import type { PageMapItem } from 'nextra'
import { Callout } from 'nextra/components'
import { Video } from './components/docs/Video'
import { createDocsLinkResolver } from './components/docs/docs-links.mjs'
import { resolveDocsImage } from './components/docs/image-policy.mjs'

export function useMDXComponents(components: MDXComponents = {}) {
  const base = baseUseMDXComponents(components)
  const BaseImage = base.img
  return {
    ...base,
    img: (props: ComponentProps<typeof BaseImage>) => <BaseImage {...props} src={resolveDocsImage(props.src)} />,
    Callout,
    Video,
  }
}

export function getPageMDXComponents(sourceFile: string, pageMap: PageMapItem[]) {
  const components = useMDXComponents()
  const BaseAnchor = components.a
  const resolveHref = createDocsLinkResolver(sourceFile, pageMap)
  return {
    ...components,
    a: (props: ComponentProps<'a'>) => <BaseAnchor {...props} href={resolveHref(props.href)} />,
  }
}
