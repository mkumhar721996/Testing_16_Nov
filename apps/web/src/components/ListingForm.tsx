import { useId, useState, type FormEvent } from 'react'
import type { ListingInput } from '../api/listingsApi'

export const CUISINES = ['Indian', 'Italian', 'Thai', 'Chinese', 'Lebanese', 'Mexican']

type FieldId = keyof ListingInput

const FIELD_ERRORS: Record<FieldId, string> = {
  name: "Name is required. Enter your restaurant's name.",
  cuisine: 'Cuisine is required. Pick the closest match.',
  addressCity: 'Address / city is required. Add the street and city.',
  description: 'Description is required. Add a sentence or two.',
}

const FIELD_IDS: FieldId[] = ['name', 'cuisine', 'addressCity', 'description']

interface Props {
  initial?: ListingInput
  title?: string
  submitLabel: string
  hint?: string
  submitting?: boolean
  /** Shown above the form when the server refused the submit. */
  serverError?: string | null
  onSubmit: (input: ListingInput) => void
  onCancel?: () => void
}

const EMPTY: ListingInput = { name: '', cuisine: '', addressCity: '', description: '' }

export default function ListingForm({
  initial = EMPTY,
  title,
  submitLabel,
  hint,
  submitting = false,
  serverError = null,
  onSubmit,
  onCancel,
}: Props) {
  const uid = useId()
  const [values, setValues] = useState<ListingInput>(initial)
  const [missing, setMissing] = useState<FieldId[]>([])
  const [attempted, setAttempted] = useState(false)

  const set = (field: FieldId, value: string) => {
    setValues((v) => ({ ...v, [field]: value }))
    if (attempted) setMissing((m) => m.filter((f) => f !== field || value.trim() === ''))
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const empty = FIELD_IDS.filter((f) => values[f].trim() === '')
    setMissing(empty)
    setAttempted(true)
    if (empty.length === 0) onSubmit(values)
  }

  const fieldProps = (field: FieldId) => {
    const invalid = missing.includes(field)
    return {
      id: `${uid}-${field}`,
      value: values[field],
      'aria-invalid': invalid || undefined,
      'aria-describedby': invalid ? `${uid}-${field}-err` : undefined,
      className: `${field === 'cuisine' ? 'select' : field === 'description' ? 'textarea' : 'input'}${invalid ? ' is-invalid' : ''}`,
    }
  }

  const error = (field: FieldId) =>
    missing.includes(field) ? (
      <span className="field-error" id={`${uid}-${field}-err`}>
        {FIELD_ERRORS[field]}
      </span>
    ) : null

  return (
    <>
      {missing.length > 0 && (
        <div className="alert alert-danger panel" role="alert">
          Fill in every field: name, cuisine, address / city and description. Nothing was submitted.
        </div>
      )}
      {serverError && (
        <div className="alert alert-danger panel" role="alert">
          {serverError}
        </div>
      )}
      <form className="card stack panel" noValidate onSubmit={submit}>
        {title && <h2>{title}</h2>}
        <div className="field">
          <label htmlFor={`${uid}-name`}>Restaurant name</label>
          <input
            {...fieldProps('name')}
            placeholder="e.g. Saffron & Spice"
            autoComplete="off"
            onChange={(e) => set('name', e.target.value)}
          />
          {error('name')}
        </div>
        <div className="field">
          <label htmlFor={`${uid}-cuisine`}>Cuisine</label>
          <select {...fieldProps('cuisine')} onChange={(e) => set('cuisine', e.target.value)}>
            <option value="">Select a cuisine</option>
            {/* keep an existing value that is not in the sample list */}
            {values.cuisine !== '' && !CUISINES.includes(values.cuisine) && <option>{values.cuisine}</option>}
            {CUISINES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          {error('cuisine')}
        </div>
        <div className="field">
          <label htmlFor={`${uid}-addressCity`}>Address / city</label>
          <input
            {...fieldProps('addressCity')}
            placeholder="12 High Street, Leeds"
            autoComplete="off"
            onChange={(e) => set('addressCity', e.target.value)}
          />
          {error('addressCity')}
        </div>
        <div className="field">
          <label htmlFor={`${uid}-description`}>Description</label>
          <textarea
            {...fieldProps('description')}
            placeholder="Tell customers about your restaurant"
            onChange={(e) => set('description', e.target.value)}
          />
          {error('description')}
        </div>
        {hint && <p className="field-hint">{hint}</p>}
        <div className="actions">
          {onCancel && (
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitLabel}
          </button>
        </div>
      </form>
    </>
  )
}
