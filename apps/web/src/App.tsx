import { useState } from 'react'
import { devActor } from './api/listingsApi'
import ListingApprovalsPage from './pages/ListingApprovalsPage'
import RestaurantListingPage from './pages/RestaurantListingPage'

const NAV = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
]

export default function App() {
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="cluster">
          <button
            className="btn btn-ghost btn-icon shell-menu-button"
            type="button"
            aria-label="Menu"
            aria-controls="main-nav"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            &#9776;
          </button>
          <a className="shell-brand" href="#">
            Console
          </a>
        </div>
        <a className="btn btn-ghost btn-sm" href="#">
          Account
        </a>
      </header>
      <nav className="shell-nav" id="main-nav" aria-label="Main" hidden={!navOpen}>
        <ul>
          {NAV.map((item) => (
            <li key={item.id}>
              <a className="nav-link" href="#" aria-current={item.id === 'dashboard' ? 'page' : undefined}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="shell-main">
        <div className="shell-content">
          {devActor.role === 'admin' ? <ListingApprovalsPage /> : <RestaurantListingPage />}
        </div>
      </main>
      <footer className="shell-footer">Console</footer>
    </div>
  )
}
