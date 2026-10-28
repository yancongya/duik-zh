export function SiteFooter() {
  return (
    <footer
      style={{
        padding: '2rem',
        borderTop: '1px solid var(--border)',
        color: 'var(--muted)',
        fontSize: '0.85rem',
        textAlign: 'center',
      }}
    >
      <p>
        上游:{' '}
        <a href="https://github.com/RxLaboratory/Duik" target="_blank" rel="noreferrer">
          RxLaboratory/Duik
        </a>{' '}
        · 官网:{' '}
        <a href="https://duik.org/" target="_blank" rel="noreferrer">
          duik.org
        </a>
      </p>
      <p>文档协议 GNU FDL 1.3 · 软件协议 GNU GPLv3 · 本站为非官方中文翻译</p>
    </footer>
  )
}
