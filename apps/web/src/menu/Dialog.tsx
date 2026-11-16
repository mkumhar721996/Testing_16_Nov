import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react'

const FOCUSABLE = 'button:not([disabled]), input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])'

interface DialogProps {
  kind: 'modal' | 'drawer'
  role?: 'dialog' | 'alertdialog'
  labelledBy: string
  onClose: () => void
  children: ReactNode
}

/** Modal or drawer with backdrop: traps Tab, closes on Escape, returns focus to the opener. */
export default function Dialog({ kind, role = 'dialog', labelledBy, onClose, children }: DialogProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus()
    return () => opener?.focus()
  }, [])

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.stopPropagation()
      onClose()
      return
    }
    if (event.key !== 'Tab' || !ref.current) return
    const items = [...ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (items.length === 0) return
    const first = items[0]
    const last = items[items.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  return (
    <>
      <div className="backdrop is-open" onClick={onClose} />
      <div
        ref={ref}
        className={`${kind} is-open`}
        role={role}
        aria-modal="true"
        aria-labelledby={labelledBy}
        onKeyDown={onKeyDown}
      >
        {children}
      </div>
    </>
  )
}
