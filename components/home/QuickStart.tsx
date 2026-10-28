const STEPS = [
  { n: '01', title: '安装 Duik', desc: '从官方渠道下载并安装 Duik Ángela', href: '/docs/getting-started/install' },
  { n: '02', title: '入门指南', desc: '了解界面与基本工作流', href: '/docs/getting-started/introduction' },
  { n: '03', title: '动手绑定', desc: '跟随教程完成第一个角色绑定', href: '/docs/tutorials' },
]

export function QuickStart() {
  return (
    <section style={{ padding: '4rem 2rem', background: 'var(--bg-soft)' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto' }}>
        <h2>快速上手</h2>
        <div style={{ display: 'grid', gap: '1rem', marginTop: '1.5rem' }}>
          {STEPS.map((s) => (
            <a
              key={s.n}
              href={s.href}
              style={{
                display: 'flex',
                gap: '1rem',
                alignItems: 'center',
                padding: '1rem 1.25rem',
                background: '#fff',
                border: '1px solid var(--border)',
                borderRadius: 12,
                color: 'var(--fg)',
              }}
            >
              <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--accent)', fontWeight: 700 }}>
                {s.n}
              </span>
              <span>
                <strong>{s.title}</strong>
                <span style={{ color: 'var(--muted)', marginLeft: '0.75rem' }}>{s.desc}</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
