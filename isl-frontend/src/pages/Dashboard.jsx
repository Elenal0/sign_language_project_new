import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts'
import { Activity, Cpu, AlertCircle, Sparkles, Zap, Users, TrendingUp } from 'lucide-react'
import { useApp } from '../context/AppContext'

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

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card" style={{ padding: '8px 12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginBottom: 4 }}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ fontSize: '0.85rem', fontWeight: 600, color: entry.color || 'var(--accent)' }}>
            {entry.name}: {entry.value}{entry.dataKey === 'conf' ? '%' : ''}
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

  return (
    <div style={{ padding: '1.5rem', minHeight: '100%' }}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Analytics Dashboard</h1>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Monitor translation performance and model statistics.</p>
        </div>

        {/* Status Banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
          background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 12
        }}>
          {apiStatus === 'checking' && <Activity size={16} style={{ color: 'var(--yellow)', animation: 'spin 1s linear infinite' }} />}
          {apiStatus === 'online' && <Activity size={16} style={{ color: 'var(--green)' }} />}
          {apiStatus === 'offline' && <AlertCircle size={16} style={{ color: 'var(--red)' }} />}
          
          <div>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {apiStatus === 'checking' && 'Checking status...'}
              {apiStatus === 'online' && 'Model Online'}
              {apiStatus === 'offline' && 'Model Offline'}
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-faint)' }}>
              {apiStatus === 'online' ? '99.7% avg confidence' : 'Start backend server'}
            </p>
          </div>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total Translations', value: totalTranslations, icon: Sparkles, color: 'var(--accent)',  bg: 'var(--accent-soft)' },
          { label: 'Avg Confidence',     value: averageConfidence, suffix: '%', icon: TrendingUp, color: 'var(--green)',   bg: 'var(--green-soft)' },
          { label: 'Saved Items',        value: history.filter(h => h.saved).length, icon: Zap,      color: 'var(--yellow)',  bg: 'var(--yellow-soft)' },
          { label: 'Active Sessions',    value: 12,                icon: Users,    color: 'var(--blue)',    bg: 'var(--blue-soft)' },
        ].map(({ label, value, suffix, icon: Icon, color, bg }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="card"
            style={{ display: 'flex', alignItems: 'center', gap: 16 }}
            whileHover={{ y: -2, boxShadow: 'var(--shadow-md)' }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Icon size={20} style={{ color }} />
            </div>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</p>
              <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: "'JetBrains Mono', monospace" }}>
                <AnimatedCounter value={value} suffix={suffix} />
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Charts Grid ──────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: 16 }}>
        
        {/* Confidence Trend */}
        <motion.div className="card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
          <p className="section-label">Real-time Confidence Trend</p>
          <div style={{ height: 220, width: '100%' }}>
            {!apiStatus ? <SkeletonChart /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={confTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="time" stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} domain={[60, 100]} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="monotone" dataKey="conf" stroke="var(--accent)" strokeWidth={3} dot={{ r: 3, fill: 'var(--bg-panel)', strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Category Distribution */}
        <motion.div className="card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
          <p className="section-label">Translations by Category</p>
          <div style={{ height: 220, width: '100%' }}>
            {!apiStatus ? <SkeletonChart /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-elevated)', opacity: 0.5 }} />
                  <Bar dataKey="val" fill="var(--blue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Usage Time */}
        <motion.div className="card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
          <p className="section-label">Session Duration (Minutes)</p>
          <div style={{ height: 220, width: '100%' }}>
             {!apiStatus ? <SkeletonChart /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="day" stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--chart-text)" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Line type="stepAfter" dataKey="min" stroke="var(--pink)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
             )}
          </div>
        </motion.div>

        {/* Top Signs & Language Split */}
        <motion.div className="card" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.5 }} style={{ display: 'flex', flexDirection: 'column' }}>
           <p className="section-label">Top Signs & Language</p>
           <div style={{ display: 'flex', flex: 1, gap: 16 }}>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>Most Detected</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {topSigns.map((s, i) => (
                    <div key={s.sign} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                       <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-faint)', fontWeight: 600 }}>#{i+1}</span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>{s.sign}</span>
                       </div>
                       <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 120, height: 120, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={langPie} cx="50%" cy="50%" innerRadius={35} outerRadius={50} dataKey="value" stroke="none">
                      {langPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? 'var(--accent)' : 'var(--blue)'} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                   <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>EN</span>
                   <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>75%</span>
                </div>
              </div>
           </div>
        </motion.div>

      </div>
    </div>
  )
}
