import { generateStaticParamsFor, importPage } from 'nextra/pages'

export const generateStaticParams = generateStaticParamsFor('slug')

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>
}) {
  const params = await props.params
  const { default: MDXContent } = await importPage(params.slug)
  return <MDXContent {...props} params={params} />
}
