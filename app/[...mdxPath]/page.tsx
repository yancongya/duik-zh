import { generateStaticParamsFor, importPage } from 'nextra/pages'
import { getPageMap } from 'nextra/page-map'
import { getPageMDXComponents, useMDXComponents as getMDXComponents } from '../../mdx-components'

/**
 * 标准 Nextra 文档路由（必填 catch-all）。
 *
 * 配合 next.config 中的 `contentDirBasePath: '/'`，
 * 内容树的 docs 目录直接把 `/docs/**` 映射到 `content/docs/**`，
 * 不再额外给导航加一次 /docs 前缀。
 * `params.mdxPath` 为完整内容路径（含 `docs` 前缀，与
 * `RouteToFilepath` 的 key 语义一致），`generateStaticParamsFor`
 * 与 `importPage` 直接使用同一份 pathSegments。
 *
 * 说明：不用 optional catch-all（[[...mdxPath]]）是因为它会与
 * 首页 `app/page.tsx`（'/'）同 specificity 冲突；必填 catch-all
 * 不匹配 '/'，与首页共存安全。
 */
export const generateStaticParams = generateStaticParamsFor('mdxPath')

export async function generateMetadata(props: {
  params: Promise<{ mdxPath?: string[] }>
}) {
  const params = await props.params
  const { metadata } = await importPage(params.mdxPath)
  return metadata
}

const Wrapper = getMDXComponents().wrapper

export default async function Page(props: {
  params: Promise<{ mdxPath?: string[] }>
}) {
  const params = await props.params
  const { default: MDXContent, toc, metadata, sourceCode } = await importPage(
    params.mdxPath,
  )
  const components = getPageMDXComponents(metadata.filePath, await getPageMap('/docs'))
  return (
    <Wrapper toc={toc} metadata={metadata} sourceCode={sourceCode}>
      <MDXContent {...props} params={params} components={components} />
    </Wrapper>
  )
}
