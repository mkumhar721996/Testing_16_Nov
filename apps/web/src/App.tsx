import { useState } from 'react'
import CustomerMenuPreview from './menu/CustomerMenuPreview'
import MenuPage from './menu/MenuPage'

const SECTIONS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'projects', label: 'Projects' },
  { id: 'activity', label: 'Activity' },
  { id: 'settings', label: 'Settings' },
]

// Development stand-in until sign-in provides the partner's restaurant.
const restaurantId: string = import.meta.env.VITE_RESTAURANT_ID ?? ''

export default function App() {
  const [screen, setScreen] = useState<'menu' | 'preview'>('menu')
  const [navOpen, setNavOpen] = useState(false)

  return (
    <div className="shell">
      <header className="shell-header">
        <div className="cluster">
          <button
            type="button"
            className="btn btn-ghost btn-icon shell-menu-button"
            aria-label="Menu"
            aria-controls="main-nav"
            aria-expanded={navOpen}
            onClick={() => setNavOpen((open) => !open)}
          >
            <span aria-hidden="true">☰</span>
          </button>
          <a className="shell-brand" href="#">
            Console
          </a>
        </div>
        <a className="btn btn-ghost btn-sm" href="#account">
          Account
        </a>
      </header>
      <nav className="shell-nav" id="main-nav" aria-label="Main" hidden={!navOpen}>
        <ul>
          {SECTIONS.map((section) => (
            <li key={section.id}>
              <a
                className="nav-link"
                href={`#${section.id}`}
                aria-current={section.id === 'dashboard' ? 'page' : undefined}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <main className="shell-main">
        <div className="shell-content">
          {screen === 'menu' ? (
            <MenuPage onPreview={() => setScreen('preview')} />
          ) : (
            <CustomerMenuPreview restaurantId={restaurantId} onBack={() => setScreen('menu')} />
          )}
        </div>
      </main>
    </div>
  )
}
