import { useId, useState } from 'react'
import Dialog from './Dialog'

interface ConfirmModalProps {
  title: string
  text: string
  confirmLabel: string
  onConfirm: () => Promise<void>
  onClose: () => void
}

export default function ConfirmModal({ title, text, confirmLabel, onConfirm, onClose }: ConfirmModalProps) {
  const id = useId()
  const [working, setWorking] = useState(false)

  async function confirm() {
    setWorking(true)
    try {
      await onConfirm()
    } catch {
      setWorking(false)
    }
  }

  return (
    <Dialog kind="modal" role="alertdialog" labelledBy={`${id}-title`} onClose={onClose}>
      <h2 id={`${id}-title`}>{title}</h2>
      <p>{text}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="btn btn-danger" disabled={working} onClick={confirm}>
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  )
}
