import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Translator from './pages/Translator'
import Dictionary from './pages/Dictionary'
import Learn from './pages/Learn'
import History from './pages/History'
import Dashboard from './pages/Dashboard'

function Page({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

export default function App() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route element={<Layout />}>
          <Route path="/"           element={<Page><Home /></Page>} />
          <Route path="/translate"  element={<Page><Translator /></Page>} />
          <Route path="/dictionary" element={<Page><Dictionary /></Page>} />
          <Route path="/learn"      element={<Page><Learn /></Page>} />
          <Route path="/history"    element={<Page><History /></Page>} />
          <Route path="/dashboard"  element={<Page><Dashboard /></Page>} />
        </Route>
      </Routes>
    </AnimatePresence>
  )
}