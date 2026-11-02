import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'
import ScrollToTop from '../ScrollToTop'
import { useSpotlight, useViewTransitionLinks } from '../../lib/motion'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()

  // Route changes cross-dissolve via View Transitions; spotlight surfaces track the cursor
  useViewTransitionLinks(navigate)
  useSpotlight()

  return (
    <div className="app">
      <div className="ambient" aria-hidden="true"><i /><i /></div>

      <div className="app-rail">
        <Sidebar />
      </div>
      <div className="app-main">
        <Navbar progressKey={location.pathname} />
        <main id="main-scroll" className="app-scroll">
          <ScrollToTop />
          {/* Remounts per route so its CSS entrance replays on every navigation */}
          <div key={location.pathname} className="route-view">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
