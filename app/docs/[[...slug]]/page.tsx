import { generateStaticParamsFor, importPage } from 'nextra/pages'

/**
 * 路由：/docs/* ↔ content/docs/*
 * - /docs                    → content/docs/index.mdx
 * - /docs/getting-started/…  → content/docs/getting-started/…
 *
 * generateStaticParamsFor 返回的是相对 content/ 根的路径（含 docs 前缀），
 * 而本路由段已固定 /docs，因此需要去掉前一层。
 */
export async function generateStaticParams() {
  const items = await generateStaticParamsFor('slug')()
  return items.map(({ slug }) => {
    const arr = Array.isArray(slug) ? slug : slug ? [slug] : []
    const stripped = arr[0] === 'docs' ? arr.slice(1) : arr
    return { slug: stripped }
  })
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const segments = ['docs', ...(params.slug ?? [])]
  const { default: MDXContent } = await importPage(segments)
  return <MDXContent {...props} params={params} />
}
