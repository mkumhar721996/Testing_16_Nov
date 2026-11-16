import { useId, useRef, useState, type FormEvent } from 'react'
import Dialog from './Dialog'
import { parsePriceToMinor } from './money'
import type { ItemInput, MenuItem } from './types'

interface VariantRow {
  key: number
  name: string
  price: string
  nameError: string
  priceError: string
}

interface ItemDrawerProps {
  /** The item being edited; null when adding. */
  item: MenuItem | null
  onSave: (input: ItemInput) => Promise<void>
  onClose: () => void
}

const toPounds = (minor: number) => (minor / 100).toFixed(2)

export default function ItemDrawer({ item, onSave, onClose }: ItemDrawerProps) {
  const id = useId()
  const nextKey = useRef(0)
  const newRow = (name = '', price = ''): VariantRow => ({
    key: nextKey.current++,
    name,
    price,
    nameError: '',
    priceError: '',
  })
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [price, setPrice] = useState(item ? toPounds(item.priceMinor) : '')
  const [rows, setRows] = useState<VariantRow[]>(() =>
    (item?.variants ?? []).map((v) => newRow(v.name, toPounds(v.priceMinor))),
  )
  const [nameError, setNameError] = useState('')
  const [priceError, setPriceError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)

  const updateRow = (key: number, change: Partial<VariantRow>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...change } : row)))

  async function submit(event: FormEvent) {
    event.preventDefault()
    const cleanName = name.trim()
    const priceMinor = parsePriceToMinor(price)

    const nextNameError = cleanName ? '' : 'Item name is required. Enter a name customers will recognise.'
    let nextPriceError = ''
    if (price.trim() === '') {
      nextPriceError = rows.length
        ? 'Price is required when the item has sizes. Enter the item price, then give each size its own price.'
        : 'Price is required. Enter a price such as 4.50.'
    } else if (priceMinor === null || priceMinor <= 0) {
      nextPriceError = 'Price must be more than 0. Enter a price such as 4.50.'
    }
    const checkedRows = rows.map((row) => {
      const variantPrice = parsePriceToMinor(row.price)
      return {
        ...row,
        nameError: row.name.trim() ? '' : 'Size name is required.',
        priceError: variantPrice !== null && variantPrice > 0 ? '' : 'Size price must be more than 0.',
      }
    })

    setNameError(nextNameError)
    setPriceError(nextPriceError)
    setRows(checkedRows)
    if (nextNameError || nextPriceError || checkedRows.some((r) => r.nameError || r.priceError)) return

    setSaveError('')
    setSaving(true)
    try {
      await onSave({
        name: cleanName,
        description: description.trim(),
        priceMinor: priceMinor as number,
        variants: checkedRows.map((r) => ({ name: r.name.trim(), priceMinor: parsePriceToMinor(r.price) as number })),
      })
    } catch (failure) {
      setSaveError(failure instanceof Error ? failure.message : 'Could not save the item. Try again.')
      setSaving(false)
    }
  }

  return (
    <Dialog kind="drawer" labelledBy={`${id}-title`} onClose={onClose}>
      <form className="stack" noValidate onSubmit={submit}>
        <h2 id={`${id}-title`}>{item ? 'Edit item' : 'Add item'}</h2>
        {saveError && (
          <div className="alert alert-danger" role="alert">
            {saveError}
          </div>
        )}
        <div className="field">
          <label htmlFor={`${id}-name`}>Item name</label>
          <input
            className={`input${nameError ? ' is-invalid' : ''}`}
            id={`${id}-name`}
            autoComplete="off"
            placeholder="e.g. Onion bhaji"
            value={name}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? `${id}-name-err` : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {nameError && (
            <span className="field-error" id={`${id}-name-err`} role="alert">
              {nameError}
            </span>
          )}
        </div>
        <div className="field">
          <label htmlFor={`${id}-desc`}>Description (optional)</label>
          <textarea
            className="textarea"
            id={`${id}-desc`}
            placeholder="What is in the dish"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={`${id}-price`}>Price (£)</label>
          <input
            className={`input${priceError ? ' is-invalid' : ''}`}
            id={`${id}-price`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="4.50"
            value={price}
            aria-invalid={priceError ? true : undefined}
            aria-describedby={`${id}-price-hint${priceError ? ` ${id}-price-err` : ''}`}
            onChange={(event) => setPrice(event.target.value)}
          />
          <span className="field-hint" id={`${id}-price-hint`}>
            Required, even if the item has sizes. Must be more than 0.
          </span>
          {priceError && (
            <span className="field-error" id={`${id}-price-err`} role="alert">
              {priceError}
            </span>
          )}
        </div>
        <fieldset className="stack-sm plain-fieldset">
          <legend className="sr-only">Size variants</legend>
          <h3>Size variants (optional)</h3>
          <div className="stack-sm">
            {rows.map((row) => (
              <div className="variant-row" key={row.key}>
                <div className="field">
                  <label htmlFor={`${id}-vn-${row.key}`}>Size name</label>
                  <input
                    className={`input${row.nameError ? ' is-invalid' : ''}`}
                    id={`${id}-vn-${row.key}`}
                    autoComplete="off"
                    placeholder="e.g. Large"
                    value={row.name}
                    aria-invalid={row.nameError ? true : undefined}
                    onChange={(event) => updateRow(row.key, { name: event.target.value })}
                  />
                  {row.nameError && (
                    <span className="field-error" role="alert">
                      {row.nameError}
                    </span>
                  )}
                </div>
                <div className="field">
                  <label htmlFor={`${id}-vp-${row.key}`}>Price (£)</label>
                  <input
                    className={`input${row.priceError ? ' is-invalid' : ''}`}
                    id={`${id}-vp-${row.key}`}
                    inputMode="decimal"
                    autoComplete="off"
                    placeholder="14.00"
                    value={row.price}
                    aria-invalid={row.priceError ? true : undefined}
                    onChange={(event) => updateRow(row.key, { price: event.target.value })}
                  />
                  {row.priceError && (
                    <span className="field-error" role="alert">
                      {row.priceError}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost icon-btn rm"
                  aria-label="Remove size variant"
                  onClick={() => setRows((current) => current.filter((r) => r.key !== row.key))}
                >
                  <span aria-hidden="true">✕</span>
                </button>
              </div>
            ))}
          </div>
          <div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRows((current) => [...current, newRow()])}>
              Add size variant
            </button>
          </div>
        </fieldset>
        <p className="field-hint">Saving updates your menu for customers straight away.</p>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save item'}
          </button>
        </div>
      </form>
    </Dialog>
  )
}
