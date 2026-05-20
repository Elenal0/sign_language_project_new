import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Home from './pages/Home'
import Translator from './pages/Translator'
import Dictionary from './pages/Dictionary'
import History from './pages/History'
import Learn from './pages/Learn'
import Dashboard from './pages/Dashboard'
import NotFound from './pages/NotFound'
import AnimatedToast from './components/AnimatedToast'
import CommandPalette from './components/CommandPalette'

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="translate" element={<Translator />} />
          <Route path="dictionary" element={<Dictionary />} />
          <Route path="history" element={<History />} />
          <Route path="learn" element={<Learn />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
      <AnimatedToast />
      <CommandPalette />
    </>
  )
}