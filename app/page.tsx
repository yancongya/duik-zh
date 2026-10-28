import Link from 'next/link'
import { Hero } from '@/components/home/Hero'
import { FeatureGrid } from '@/components/home/FeatureGrid'
import { QuickStart } from '@/components/home/QuickStart'
import { VersionBar } from '@/components/home/VersionBar'
import { SiteAbout } from '@/components/home/SiteAbout'
import { SiteFooter } from '@/components/home/SiteFooter'

export default function HomePage() {
  return (
    <main>
      <Hero />
      <FeatureGrid />
      <QuickStart />
      <VersionBar />
      <SiteAbout />
      <SiteFooter />
      <p style={{ padding: '1rem 2rem 3rem' }}>
        <Link href="/docs">进入文档 →</Link>
      </p>
    </main>
  )
}
