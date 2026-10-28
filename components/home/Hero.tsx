export function Hero() {
  return (
    <section
      style={{
        padding: '6rem 2rem',
        textAlign: 'center',
        background:
          'linear-gradient(180deg, #fff5f0 0%, #ffffff 100%)',
      }}
    >
      <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', margin: 0 }}>
        Duik Ángela 中文站
      </h1>
      <p style={{ color: 'var(--muted)', maxWidth: 480, margin: '1rem auto 0' }}>
        After Effects 专业角色绑定与动画工具集 · 非官方中文文档
      </p>
      <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <a
          href="/docs"
          style={{
            background: 'var(--accent)',
            color: '#fff',
            padding: '0.75rem 1.5rem',
            borderRadius: 8,
          }}
        >
          阅读文档
        </a>
        <a
          href="https://duik.org/"
          target="_blank"
          rel="noreferrer"
          style={{
            border: '1px solid var(--border)',
            padding: '0.75rem 1.5rem',
            borderRadius: 8,
            color: 'var(--fg)',
          }}
        >
          官方网站
        </a>
      </div>
    </section>
  )
}
