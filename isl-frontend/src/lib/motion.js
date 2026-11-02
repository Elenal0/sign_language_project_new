// Motion glue. All visual animation lives in styles/motion.css; this file only
// tells CSS *when* something happens and *where* the pointer is.

import { useEffect } from 'react'
import { flushSync } from 'react-dom'

const reduceMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export const supportsViewTransitions = () =>
  typeof document !== 'undefined' && typeof document.startViewTransition === 'function' && !reduceMotion()

/**
 * Run a React state update inside a View Transition.
 * `type` becomes an `html.vt-<type>` class for the transition's lifetime so CSS
 * can choreograph each kind differently (route / theme / modal).
 * Falls back to a plain update where unsupported.
 */
export function withViewTransition(update, type = 'route') {
  if (!supportsViewTransitions()) { update(); return null }
  const html = document.documentElement
  html.classList.add(`vt-${type}`)
  const t = document.startViewTransition(() => flushSync(update))
  t.finished.finally(() => html.classList.remove(`vt-${type}`))
  return t
}

/**
 * Wrap same-origin <a> navigations in a View Transition.
 * Runs in the capture phase, before React Router's Link handler; once we call
 * preventDefault, Link skips its own navigation (it checks defaultPrevented)
 * but still runs any onClick prop (e.g. closing the mobile menu).
 */
export function useViewTransitionLinks(navigate) {
  useEffect(() => {
    if (!supportsViewTransitions()) return
    const onClick = (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = e.target.closest?.('a[href]')
      if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname === location.pathname && url.search === location.search) return
      e.preventDefault()
      withViewTransition(() => navigate(url.pathname + url.search + url.hash), 'route')
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [navigate])
}

/**
 * Cursor-tracking light for `.spotlight` surfaces: one delegated, rAF-throttled
 * listener writes --mx / --my onto whichever spotlight is under the pointer.
 */
export function useSpotlight() {
  useEffect(() => {
    if (!window.matchMedia?.('(hover: hover)').matches) return
    let frame = 0
    let last = null
    const onMove = (e) => {
      last = e
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        const el = last.target.closest?.('.spotlight')
        if (!el) return
        const r = el.getBoundingClientRect()
        el.style.setProperty('--mx', `${last.clientX - r.left}px`)
        el.style.setProperty('--my', `${last.clientY - r.top}px`)
      })
    }
    document.addEventListener('pointermove', onMove, { passive: true })
    return () => { document.removeEventListener('pointermove', onMove); cancelAnimationFrame(frame) }
  }, [])
}

/**
 * Theme switch with a circular reveal expanding from the click point.
 * Sets the new data-theme inside the transition so the "new" snapshot is
 * already in the target theme (AppContext's effect then agrees with it).
 */
export function toggleThemeWithReveal(event, currentTheme, toggleTheme) {
  const next = currentTheme === 'dark' ? 'light' : 'dark'
  if (!supportsViewTransitions()) { toggleTheme(); return }
  const html = document.documentElement
  const x = event?.clientX ?? innerWidth - 40
  const y = event?.clientY ?? 28
  const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))
  html.style.setProperty('--vt-x', `${x}px`)
  html.style.setProperty('--vt-y', `${y}px`)
  html.style.setProperty('--vt-r', `${r}px`)
  withViewTransition(() => {
    toggleTheme()
    html.setAttribute('data-theme', next)
    html.classList.toggle('dark', next === 'dark')
    html.classList.toggle('light', next === 'light')
  }, 'theme')
}
