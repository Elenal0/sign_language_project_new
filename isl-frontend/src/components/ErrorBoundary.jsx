import { Component } from 'react';

// Renders outside the theme provider's reach in the worst case, so it relies
// only on the global CSS tokens (which are set on <html> before React mounts).
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)', color: 'var(--text-primary)', padding: '2rem',
      }}>
        <div style={{ maxWidth: 480 }}>
          <span className="eyebrow">Something broke</span>
          <h1 className="display" style={{ fontSize: 'clamp(2.6rem, 6vw, 4rem)', marginTop: 18 }}>
            We dropped the <em>thread.</em>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: 16, lineHeight: 1.7 }}>
            An unexpected error stopped this page from rendering. Reloading usually fixes it.
          </p>
          <pre className="mono" style={{
            marginTop: 20, padding: '12px 14px', borderRadius: 12, fontSize: '0.74rem', whiteSpace: 'pre-wrap',
            background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text-secondary)',
          }}>
            {this.state.error.message || 'Unknown error'}
          </pre>
          <button onClick={() => window.location.reload()} className="btn-primary btn-lg" style={{ marginTop: 24 }}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
