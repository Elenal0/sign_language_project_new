// Editorial page header: mono eyebrow, serif title (use <em> for the accent word),
// optional Devanagari gloss, supporting line and right-aligned actions.
// Entrance choreography is CSS (styles/motion.css): eyebrow → title line → sub → actions.
export default function PageHeader({ eyebrow, title, deva, sub, actions }) {
  return (
    <header className="page-header">
      <div style={{ minWidth: 0 }}>
        <span className="eyebrow enter-fade" style={{ '--d': 40 }}>{eyebrow}</span>
        <h1 className="page-title">
          <span className="line-mask">
            <span style={{ '--d': 90 }}>
              {title}
              {deva && (
                <span className="deva" style={{ fontSize: '0.38em', color: 'var(--text-faint)', marginLeft: '0.6em', letterSpacing: 0, verticalAlign: 'middle' }}>
                  {deva}
                </span>
              )}
            </span>
          </span>
        </h1>
        {sub && <p className="page-sub enter" style={{ '--d': 260 }}>{sub}</p>}
      </div>
      {actions && (
        <div className="enter" style={{ '--d': 320, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </header>
  )
}
