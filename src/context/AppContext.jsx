import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'

const AppContext = createContext(null)

// Grammar suggestion rules for the 9 trained ISL classes:
// Going, Hello, How, I, Meet, Nice, School, Thank you, You
const GRAMMAR_RULES = {
  'Hello':     ['Hello, How are you?', 'Hello, Nice to meet you!', 'Hello! I am going to school.'],
  'How':       ['How are you?', 'How nice to meet you!', 'How are you going to school?'],
  'I':         ['I am going to school.', 'I am nice.', 'I want to meet you.'],
  'Nice':      ['Nice to meet you!', 'Nice, how are you?', 'How nice!'],
  'Meet':      ['Nice to meet you!', 'I want to meet you.', 'How do you meet?'],
  'Going':     ['I am going to school.', 'Going to meet you.', 'Going, how are you?'],
  'School':    ['Going to school.', 'I am at school.', 'School is nice.'],
  'Thank you': ['Thank you! How are you?', 'Thank you, nice to meet you!', 'Thank you, I am going now.'],
  'You':       ['How are you?', 'Nice to meet you!', 'You are going to school.'],
}

function getSuggestions(words) {
  if (!words.length) return []
  const last = words[words.length - 1]
  const base = GRAMMAR_RULES[last] || []
  const joined = words.join(' ')
  const contextual = joined.length > 2 ? [`${joined}?`, `${joined}.`] : []
  return [...new Set([...base, ...contextual])].slice(0, 5)
}

// ── Persistence helpers ───────────────────────────────────────────────────────
function getInitialTheme() {
  try {
    const stored = localStorage.getItem('sanketsetu-theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch { /* ignore */ }
  // Respect OS preference as fallback
  if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  return 'dark'
}

function getInitialHistory() {
  try {
    const stored = localStorage.getItem('sanketsetu-history')
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return []
}

function getInitialTotalTranslations() {
  try {
    const stored = localStorage.getItem('sanketsetu-total')
    if (stored) return parseInt(stored, 10) || 0
  } catch { /* ignore */ }
  return 0
}

export function AppProvider({ children }) {
  const [history,           setHistory]           = useState(getInitialHistory)
  const [totalTranslations, setTotalTranslations] = useState(getInitialTotalTranslations)
  const [sidebarOpen,       setSidebarOpen]       = useState(false)
  const [toast,             setToast]             = useState(null)
  const [theme,             setTheme]             = useState(getInitialTheme)

  const toastTimerRef = useRef(null)

  // ── Sync theme class + persist ──────────────────────────────────────────────
  useEffect(() => {
    const html = document.documentElement
    // Add transition class for smooth theme change
    html.classList.add('theme-transitioning')
    html.setAttribute('data-theme', theme)
    html.classList.toggle('dark', theme === 'dark')
    html.classList.toggle('light', theme === 'light')
    // Persist
    try { localStorage.setItem('sanketsetu-theme', theme) } catch { /* ignore */ }
    // Remove transition class after animation
    const timeout = setTimeout(() => html.classList.remove('theme-transitioning'), 500)
    return () => clearTimeout(timeout)
  }, [theme])

  // ── Persist history ─────────────────────────────────────────────────────────
  useEffect(() => {
    try { localStorage.setItem('sanketsetu-history', JSON.stringify(history)) } catch { /* ignore */ }
  }, [history])

  useEffect(() => {
    try { localStorage.setItem('sanketsetu-total', String(totalTranslations)) } catch { /* ignore */ }
  }, [totalTranslations])

  const toggleTheme = useCallback(() => {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'))
  }, [])

  const addToHistory = useCallback((entry) => {
    setHistory(h =>
      [
        { ...entry, id: Date.now(), timestamp: new Date().toISOString(), saved: false },
        ...h,
      ].slice(0, 50)
    )
    setTotalTranslations(t => t + 1)
  }, [])

  const toggleSaved = useCallback((id) =>
    setHistory(h => h.map(i => i.id === id ? { ...i, saved: !i.saved } : i)),
  [])

  const deleteItem = useCallback((id) =>
    setHistory(h => h.filter(i => i.id !== id)),
  [])

  const clearHistory = useCallback(() => {
    setHistory([])
  }, [])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    // Clear any previous timer
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message, type, id })
    toastTimerRef.current = setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev))
    }, 3500)
  }, [])

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(null)
  }, [])

  return (
    <AppContext.Provider value={{
      history, addToHistory, toggleSaved, deleteItem, clearHistory,
      totalTranslations, sidebarOpen, setSidebarOpen,
      toast, showToast, dismissToast,
      theme, toggleTheme,
      getSuggestions,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}