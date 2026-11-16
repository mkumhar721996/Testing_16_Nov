import { useId, useState, type FormEvent } from 'react'
import Dialog from './Dialog'

interface CategoryModalProps {
  /** Current name when renaming; null when adding. */
  initialName: string | null
  onSave: (name: string) => Promise<void>
  onClose: () => void
}

export default function CategoryModal({ initialName, onSave, onClose }: CategoryModalProps) {
  const id = useId()
  const [name, setName] = useState(initialName ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const clean = name.trim()
    if (!clean) {
      setError('Category name is required. Enter a name such as Starters.')
      return
    }
    setError('')
    setSaving(true)
    try {
      await onSave(clean)
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Could not save the category. Try again.')
      setSaving(false)
    }
  }

  return (
    <Dialog kind="modal" labelledBy={`${id}-title`} onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <h2 id={`${id}-title`}>{initialName === null ? 'Add category' : 'Rename category'}</h2>
        <div className="field">
          <label htmlFor={`${id}-name`}>Category name</label>
          <input
            className={`input${error ? ' is-invalid' : ''}`}
            id={`${id}-name`}
            autoComplete="off"
            placeholder="e.g. Starters"
            value={name}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? `${id}-err` : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {error && (
            <span className="field-error" id={`${id}-err`} role="alert">
              {error}
            </span>
          )}
        </div>
        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save category'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
