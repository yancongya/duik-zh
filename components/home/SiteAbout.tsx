export function SiteAbout() {
  return (
    <section style={{ padding: '4rem 2rem', maxWidth: 720, margin: '0 auto' }}>
      <h2>关于本站</h2>
      <p style={{ color: 'var(--muted)' }}>
        本站是 Duik Ángela 的非官方中文社区文档站，内容翻译并整理自{' '}
        <a href="https://github.com/RxLaboratory/Duik" target="_blank" rel="noreferrer">
          RxLaboratory/Duik
        </a>{' '}
        官方文档，与 Rainbox Laboratory 及官方 duik.org 无隶属关系。
      </p>
      <p style={{ color: 'var(--muted)' }}>
        文档译文以 GNU Free Documentation License 1.3 发布；Duik 软件本体以 GNU GPLv3
        发布，请仅通过官方渠道获取软件。
      </p>
    </section>
  )
}
