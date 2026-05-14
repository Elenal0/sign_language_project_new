import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const AppContext = createContext(null)

// Grammar suggestion rules based on your 9 trained classes:
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
  // Also generate a contextual sentence from the current words
  const joined = words.join(' ')
  const contextual = joined.length > 2 ? [`${joined}?`, `${joined}.`] : []
  return [...new Set([...base, ...contextual])].slice(0, 5)
}

export function AppProvider({ children }) {
  const [history, setHistory]               = useState([])
  const [totalTranslations, setTotalTranslations] = useState(0)
  const [sidebarOpen, setSidebarOpen]       = useState(false)
  const [toast, setToast]                   = useState(null)
  const [theme, setTheme]                   = useState(() => {
    // default: dark
    return 'dark'
  })

  // Apply theme class to <html> element
  useEffect(() => {
    const html = document.documentElement
    html.setAttribute('data-theme', theme)
    if (theme === 'dark') {
      html.classList.add('dark')
      html.classList.remove('light')
    } else {
      html.classList.add('light')
      html.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark')
  }, [])

  const addToHistory = useCallback((entry) => {
    setHistory(h => [
      { ...entry, id: Date.now(), timestamp: new Date().toISOString(), saved: false },
      ...h
    ].slice(0, 50))
    setTotalTranslations(t => t + 1)
  }, [])

  const toggleSaved = useCallback((id) =>
    setHistory(h => h.map(i => i.id === id ? { ...i, saved: !i.saved } : i)), [])

  const deleteItem = useCallback((id) =>
    setHistory(h => h.filter(i => i.id !== id)), [])

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now()
    setToast({ message, type, id })
    setTimeout(() => setToast(null), 3000)
  }, [])

  return (
    <AppContext.Provider value={{
      history, addToHistory, toggleSaved, deleteItem,
      totalTranslations, sidebarOpen, setSidebarOpen,
      toast, showToast,
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