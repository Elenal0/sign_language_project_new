// Brand mark: a point of sight (the saffron dot) radiating voice (the arcs) —
// "दृश्य वाणी", visible voice.
export function BrandMark({ size = 32, animated = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect width="32" height="32" rx="9" fill="var(--text-primary)" />
      <circle cx="10.5" cy="16" r="3.2" fill="var(--accent)" />
      <path d="M16 10.2a7 7 0 0 1 0 11.6" stroke="var(--bg-base)" strokeWidth="2.2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-opacity" values="1;0.35;1" dur="2.4s" repeatCount="indefinite" />}
      </path>
      <path d="M20.4 6.6a11.6 11.6 0 0 1 0 18.8" stroke="var(--bg-base)" strokeOpacity=".5" strokeWidth="2.2" strokeLinecap="round">
        {animated && <animate attributeName="stroke-opacity" values="0.5;0.15;0.5" dur="2.4s" begin="0.3s" repeatCount="indefinite" />}
      </path>
    </svg>
  )
}

export function Wordmark({ compact = false }) {
  return (
    <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, whiteSpace: 'nowrap' }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontSize: compact ? '1.15rem' : '1.3rem', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
        Drishya <em style={{ color: 'var(--accent)' }}>Vaani</em>
      </span>
      {!compact && (
        <span className="deva" style={{ fontSize: '0.7rem', color: 'var(--text-faint)', marginTop: 4 }}>
          दृश्य वाणी
        </span>
      )}
    </span>
  )
}
