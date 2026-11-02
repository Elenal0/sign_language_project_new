import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, AreaChart, Area
} from 'recharts'
import { AlertCircle, Sparkles, Zap, Users, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'
import PageHeader from '../components/ui/PageHeader'

// Mock Data
const confTrend = [
  { time: '10:00', conf: 85 }, { time: '10:05', conf: 92 },
  { time: '10:10', conf: 88 }, { time: '10:15', conf: 96 },
  { time: '10:20', conf: 91 }, { time: '10:25', conf: 98 }
]
const categoryData = [
  { name: 'Greetings', val: 45 }, { name: 'Questions', val: 25 },
  { name: 'Common',    val: 80 }, { name: 'Numbers',   val: 15 }
]
const topSigns = [
  { sign: 'Hello', count: 42 }, { sign: 'Thank you', count: 28 },
  { sign: 'How', count: 19 }, { sign: 'Nice', count: 14 }
]
const sessionData = [
  { day: 'Mon', min: 12 }, { day: 'Tue', min: 45 }, { day: 'Wed', min: 30 },
  { day: 'Thu', min: 60 }, { day: 'Fri', min: 25 }, { day: 'Sat', min: 90 }
]
const langPie = [
  { name: 'English', value: 75 }, { name: 'Hindi', value: 25 }
]

// Animated Counter Hook
function AnimatedCounter({ value, suffix = '', duration = 1.5 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    const step = end / (duration * 60)
    const timer = setInterval(() => {
      start += step
      if (start >= end) { setDisplay(end); clearInterval(timer) }
      else setDisplay(start)
    }, 1000 / 60)
    return () => clearInterval(timer)
  }, [value, duration])

  const formatted = Number.isInteger(value)
    ? Math.round(display).toLocaleString()
    : display.toFixed(1)

  return (
    <span>{formatted}{suffix}</span>
  )
}

const UNITS = { conf: '%', min: ' min', val: '' }
const NAMES = { conf: 'Confidence', min: 'Session', val: 'Translations' }

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ padding: '10px 12px', borderRadius: 10, background: 'var(--bg-elevated)', border: '1px solid var(--border-hover)', boxShadow: 'var(--shadow-md)', minWidth: 120 }}>
        <p className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-faint)', marginBottom: 6 }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: entry.color || 'var(--chart-1)' }} />
            {NAMES[entry.dataKey] || entry.name}
            <span className="mono" style={{ marginLeft: 'auto', color: 'var(--text-primary)', fontWeight: 500 }}>
              {entry.value}{UNITS[entry.dataKey] ?? ''}
            </span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

const SkeletonChart = () => (
  <div className="skeleton" style={{ width: '100%', height: '100%' }} />
)

function ChartCard({ title, value, sample, children, delay = 0, style }) {
  return (
    <section
      className="card spotlight enter"
      style={{ '--d': Math.round(delay * 1000), padding: 22, borderRadius: 'var(--r-xl)', display: 'flex', flexDirection: 'column', ...style }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 18 }}>
        <div>
          <h2 style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>{title}</h2>
          {value && <p className="display" style={{ fontSize: '2rem', marginTop: 8 }}>{value}</p>}
        </div>
        {sample && <span className="badge mono" title="Illustrative data — not yet wired to real usage" style={{ fontSize: '0.6rem', letterSpacing: '0.08em' }}>SAMPLE</span>}
      </div>
      {children}
    </section>
  )
}

const axis = { stroke: 'var(--chart-text)', fontSize: 11, tickLine: false, axisLine: false, fontFamily: 'Geist Mono, monospace' }

export default function Dashboard() {
  const { history, totalTranslations, theme } = useApp()
  const [apiStatus, setApiStatus] = useState('checking') // 'checking' | 'online' | 'offline'

  useEffect(() => {
    fetch('/health')
      .then(res => setApiStatus(res.ok ? 'online' : 'offline'))
      .catch(() => setApiStatus('offline'))
  }, [])

  const averageConfidence = history.length
    ? Math.round(history.reduce((acc, h) => acc + h.confidence, 0) / history.length * 100)
    : 0

  const savedCount = history.filter(h => h.saved).length
  const topMax = Math.max(...topSigns.map(s => s.count))
  const langTotal = langPie.reduce((a, l) => a + l.value, 0)

  return (
    <div className="page">

      <PageHeader
        eyebrow="Insights"
        title={<>How it’s <em>going</em></>}
        deva="विश्लेषण"
        sub="Your translation activity and model health. Charts marked sample show illustrative data."
        actions={
          <span className="badge" style={{ height: 32, padding: '0 12px', color: apiStatus === 'online' ? 'var(--green)' : apiStatus === 'offline' ? 'var(--red)' : 'var(--yellow)' }}>
            {apiStatus === 'offline' ? <AlertCircle size={13} /> : <span className="status-dot" data-live={apiStatus === 'online'} />}
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.76rem' }}>
              {apiStatus === 'checking' && 'Checking model…'}
              {apiStatus === 'online' && 'Model online'}
              {apiStatus === 'offline' && 'Model offline — start the backend'}
            </span>
          </span>
        }
      />

      {/* ── KPIs ── */}
      <div className="dash-kpis stagger" style={{ '--stagger-base': '200ms', '--stagger': '70ms' }}>
        {[
          { label: 'Translations', value: totalTranslations, icon: Sparkles, note: 'all time' },
          { label: 'Avg confidence', value: averageConfidence, suffix: '%', icon: TrendingUp, note: history.length ? `across ${history.length} saved` : 'no data yet' },
          { label: 'Saved phrases', value: savedCount, icon: Zap, note: 'bookmarked' },
          { label: 'Active sessions', value: 12, icon: Users, note: 'sample' },
        ].map(({ label, value, suffix, icon: Icon, note }, i) => (
          <div key={label} className="dash-kpi spotlight">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{label}</span>
              <Icon size={15} strokeWidth={1.75} style={{ color: 'var(--text-faint)' }} />
            </div>
            <p className="display tnum" style={{ fontSize: 'clamp(2.6rem, 4vw, 3.4rem)', marginTop: 18 }}>
              <AnimatedCounter value={value} suffix={suffix} />
            </p>
            <p className="mono" style={{ fontSize: '0.64rem', color: 'var(--text-faint)', marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{note}</p>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div className="dash-grid">

        <ChartCard title="Recognition confidence" value={`${confTrend[confTrend.length - 1].conf}%`} sample delay={0.35}>
          <div style={{ height: 220 }}>
            {!apiStatus ? <SkeletonChart /> : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={confTrend} margin={{ top: 6, right: 16, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id="confFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="time" {...axis} />
                  <YAxis {...axis} domain={[60, 100]} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="conf" stroke="var(--chart-1)" strokeWidth={2} fill="url(#confFill)"
                    dot={false} activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'var(--bg-panel)', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Translations by category" value={categoryData.reduce((a, c) => a + c.val, 0)} sample delay={0.43}>
          <div style={{ height: 220 }}>
            {!apiStatus ? <SkeletonChart /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 6, right: 16, left: -22, bottom: 0 }} barCategoryGap="28%">
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="name" {...axis} />
                  <YAxis {...axis} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--accent-softer)' }} />
                  <Bar dataKey="val" fill="var(--chart-1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Time signing per day" value={`${sessionData.reduce((a, d) => a + d.min, 0)} min`} sample delay={0.51}>
          <div style={{ height: 220 }}>
            {!apiStatus ? <SkeletonChart /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionData} margin={{ top: 6, right: 16, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="day" {...axis} />
                  <YAxis {...axis} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-strong)', strokeWidth: 1 }} />
                  <Line type="linear" dataKey="min" stroke="var(--chart-1)" strokeWidth={2} dot={{ r: 3.5, fill: "var(--chart-1)", stroke: "var(--bg-panel)", strokeWidth: 2 }}
                    activeDot={{ r: 5, fill: 'var(--chart-1)', stroke: 'var(--bg-panel)', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </ChartCard>

        <ChartCard title="Most detected signs" sample delay={0.59}>
          <div style={{ display: 'grid', gap: 14 }}>
            {topSigns.map((s, i) => (
              <div key={s.sign} className="dash-rank" title={`${s.sign}: ${s.count}`}>
                <span className="mono" style={{ fontSize: '0.66rem', color: 'var(--text-faint)', width: 20 }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ fontSize: '0.86rem', color: 'var(--text-primary)', width: 84 }}>{s.sign}</span>
                <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--bg-inset)', overflow: 'hidden' }}>
                  <div className="bar-grow" style={{ '--d': 700 + i * 80, width: `${(s.count / topMax) * 100}%`, height: '100%', borderRadius: 4, background: 'var(--chart-1)' }} />
                </div>
                <span className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', width: 28, textAlign: 'right' }}>{s.count}</span>
              </div>
            ))}
          </div>

          <hr className="hairline" style={{ margin: '22px 0 18px' }} />

          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12 }}>Output language</p>
          <div className="bar-grow" style={{ '--d': 900, display: 'flex', gap: 2, height: 10, borderRadius: 5, overflow: 'hidden' }}>
            {langPie.map((l, i) => (
              <div key={l.name} title={`${l.name}: ${l.value}%`}
                style={{ flexGrow: l.value, flexBasis: 0, background: i === 0 ? 'var(--chart-1)' : 'var(--chart-2)' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
            {langPie.map((l, i) => (
              <span key={l.name} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: i === 0 ? 'var(--chart-1)' : 'var(--chart-2)' }} />
                {l.name}
                <span className="mono" style={{ color: 'var(--text-primary)' }}>{Math.round((l.value / langTotal) * 100)}%</span>
              </span>
            ))}
          </div>
        </ChartCard>
      </div>

      <style>{`
        .dash-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0; margin-bottom: 20px; border: 1px solid var(--border); border-radius: var(--r-xl); background: var(--bg-panel); overflow: hidden; }
        .dash-kpi { padding: 22px 24px; border-left: 1px solid var(--border); border-radius: 0; }
        .dash-kpi:first-child { border-left: 0; }
        .dash-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
        .dash-rank { display: flex; align-items: center; gap: 12px; }
        .bar-grow { transform-origin: 0 50%; animation: draw-x 1000ms var(--ease-out) backwards; animation-delay: calc(var(--d, 0) * 1ms); }
        @media (max-width: 900px) {
          .dash-kpis { grid-template-columns: repeat(2, 1fr); }
          .dash-kpi:nth-child(3) { border-left: 0; }
          .dash-kpi:nth-child(n+3) { border-top: 1px solid var(--border); }
          .dash-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
