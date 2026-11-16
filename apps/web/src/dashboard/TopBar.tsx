import { useEffect, useRef, useState } from 'react'

export const PRODUCT_NAME = 'Market Dashboard'

interface Props {
  productName: string
  user: { name: string; email: string }
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')

export function TopBar({ productName, user }: Props) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    const onDown = (e: MouseEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [open])

  const onMenuKey = (e: React.KeyboardEvent) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const items = [...root.current!.querySelectorAll<HTMLElement>('[role="menuitem"]')]
    const at = items.indexOf(document.activeElement as HTMLElement)
    const step = e.key === 'ArrowDown' ? 1 : -1
    items[(at + step + items.length) % items.length]?.focus()
  }

  return (
    <header className="tools">
      <strong className="product">{productName}</strong>
      <div className="dropdown" ref={root} onKeyDown={onMenuKey}>
        <button
          ref={trigger}
          type="button"
          className="avatar user-btn"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`User menu for ${user.name}`}
          onClick={() => setOpen((o) => !o)}
        >
          {initials(user.name)}
        </button>
        {open && (
          <div className="dropdown-menu is-open" role="menu">
            <div className="menu-note">Signed in as {user.email}</div>
            <button type="button" className="dropdown-item" role="menuitem">
              Account settings
            </button>
            <button type="button" className="dropdown-item" role="menuitem">
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
