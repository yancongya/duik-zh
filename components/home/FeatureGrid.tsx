const FEATURES = [
  { title: '骨骼与自动绑定', desc: '骨骼创建、包络、自动绑定手臂/腿/脊椎/尾巴/翅膀' },
  { title: '链接与约束', desc: 'IK/FK、父子约束、变换约束、Pin、连接器' },
  { title: '控制器', desc: '伪效果控制器、控制器提取与管理工具' },
  { title: '自动化与表达式', desc: 'Kleaner、Effector、Wiggle、行走循环等自动化工具' },
  { title: '动画工具', desc: '补间、插值、动画库、非线性动画、逐帧动画' },
  { title: '摄像机', desc: '摄像机绑定、2D 摄像机、构图参考线' },
]

export function FeatureGrid() {
  return (
    <section style={{ padding: '4rem 2rem', maxWidth: 1080, margin: '0 auto' }}>
      <h2>核心能力</h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1rem',
          marginTop: '1.5rem',
        }}
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            style={{
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '1.25rem',
              background: 'var(--bg-soft)',
            }}
          >
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem' }}>{f.title}</h3>
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.95rem' }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
