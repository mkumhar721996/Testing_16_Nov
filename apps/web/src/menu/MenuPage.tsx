import { useCallback, useEffect, useState } from 'react'
import CategoryModal from './CategoryModal'
import ConfirmModal from './ConfirmModal'
import ItemDrawer from './ItemDrawer'
import { deleteCategory, deleteItem, getPartnerMenu, createCategory, renameCategory, reorderCategories, saveItem } from './menuApi'
import { formatMinor } from './money'
import type { ItemInput, Menu, MenuCategory, MenuItem } from './types'

type Dialogs =
  | { type: 'category'; category: MenuCategory | null }
  | { type: 'delete-category'; category: MenuCategory }
  | { type: 'item'; category: MenuCategory; item: MenuItem | null }
  | { type: 'delete-item'; category: MenuCategory; item: MenuItem }

type Status = 'loading' | 'error' | 'ready'

const plural = (count: number) => `${count} ${count === 1 ? 'item' : 'items'}`

function refusal(category: MenuCategory, count = category.items.length) {
  return `Couldn't delete ${category.name}. It still has ${plural(count)}. Remove them first, then delete the category.`
}

export default function MenuPage({ onPreview }: { onPreview: () => void }) {
  const [status, setStatus] = useState<Status>('loading')
  const [menu, setMenu] = useState<Menu>({ categories: [] })
  const [dialog, setDialog] = useState<Dialogs | null>(null)
  const [problem, setProblem] = useState('')
  const [toast, setToast] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      setMenu(await getPartnerMenu())
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(timer)
  }, [toast])

  const closeDialog = () => setDialog(null)
  const mapCategories = (change: (categories: MenuCategory[]) => MenuCategory[]) =>
    setMenu((current) => ({ categories: change(current.categories) }))

  async function saveCategory(category: MenuCategory | null, name: string) {
    if (category) {
      await renameCategory(category.id, name)
      mapCategories((all) => all.map((c) => (c.id === category.id ? { ...c, name } : c)))
      setToast(`Category renamed to ${name}`)
    } else {
      const created = await createCategory(name)
      mapCategories((all) => [...all, { id: created.id, name: created.name, items: [] }])
      setToast(`Category ${name} added. Customers see it once it has items.`)
    }
    setProblem('')
    closeDialog()
  }

  async function removeCategory(category: MenuCategory) {
    try {
      await deleteCategory(category.id)
    } catch (failure) {
      setProblem(
        failure instanceof Error && 'status' in failure && failure.status === 409
          ? refusal(category, category.items.length || 1)
          : `Couldn't delete ${category.name}. Try again.`,
      )
      closeDialog()
      throw failure
    }
    mapCategories((all) => all.filter((c) => c.id !== category.id))
    setToast('Category deleted')
    closeDialog()
  }

  function askDeleteCategory(category: MenuCategory) {
    if (category.items.length > 0) {
      setProblem(refusal(category))
      return
    }
    setProblem('')
    setDialog({ type: 'delete-category', category })
  }

  async function move(index: number, direction: -1 | 1) {
    const reordered = [...menu.categories]
    const [moved] = reordered.splice(index, 1)
    reordered.splice(index + direction, 0, moved)
    setProblem('')
    try {
      await reorderCategories(reordered.map((c) => c.id))
    } catch {
      setProblem("Couldn't save the new order. Try again.")
      return
    }
    setMenu({ categories: reordered })
    setToast('Category order saved. Customers see the new order.')
  }

  async function saveItemFor(category: MenuCategory, item: MenuItem | null, input: ItemInput) {
    const saved = await saveItem(category.id, item?.id ?? null, input)
    mapCategories((all) =>
      all.map((c) =>
        c.id !== category.id
          ? c
          : { ...c, items: item ? c.items.map((i) => (i.id === item.id ? saved : i)) : [...c.items, saved] },
      ),
    )
    setToast(item ? `${saved.name} saved. Customers see the change now.` : `${saved.name} added. Customers see it now.`)
    closeDialog()
  }

  async function removeItem(category: MenuCategory, item: MenuItem) {
    try {
      await deleteItem(item.id)
    } catch (failure) {
      setProblem(`Couldn't remove ${item.name}. Try again.`)
      closeDialog()
      throw failure
    }
    mapCategories((all) =>
      all.map((c) => (c.id === category.id ? { ...c, items: c.items.filter((i) => i.id !== item.id) } : c)),
    )
    setToast('Item removed. Customers no longer see it.')
    closeDialog()
  }

  const addCategory = () => {
    setProblem('')
    setDialog({ type: 'category', category: null })
  }

  return (
    <div className="menu-wrap">
      <div className="head-row">
        <h1>Menu</h1>
        <button type="button" className="btn btn-primary" onClick={addCategory}>
          Add category
        </button>
      </div>
      <p className="lede">
        Changes go live as soon as you save. No approval needed.{' '}
        <a
          href="#preview"
          onClick={(event) => {
            event.preventDefault()
            onPreview()
          }}
        >
          See what customers see
        </a>
      </p>

      <div aria-live="polite">
        {problem && (
          <div className="alert alert-danger" role="alert">
            {problem}
          </div>
        )}
      </div>

      {status === 'loading' && (
        <div className="stack" role="status" aria-label="Loading your menu">
          <div className="card stack-sm">
            <span className="skeleton" />
            <span className="skeleton skeleton-line" />
          </div>
          <div className="card stack-sm">
            <span className="skeleton" />
            <span className="skeleton skeleton-line" />
          </div>
        </div>
      )}

      {status === 'error' && (
        <>
          <div className="alert alert-danger" role="alert">
            Couldn't load your menu. Check your connection, then try again. Your saved changes are safe.
          </div>
          <button type="button" className="btn btn-secondary" onClick={() => void load()}>
            Try again
          </button>
        </>
      )}

      {status === 'ready' && menu.categories.length === 0 && (
        <div className="empty-state">
          <h2>Your menu is empty</h2>
          <p>
            Start with a category such as Starters or Mains, then add items with prices. Customers see them as soon as
            you save.
          </p>
          <button type="button" className="btn btn-secondary" onClick={addCategory}>
            Add category
          </button>
        </div>
      )}

      {status === 'ready' && menu.categories.length > 0 && (
        <div className="stack">
          {menu.categories.map((category, index) => (
            <section className="card stack-sm" key={category.id} aria-labelledby={`cat-${category.id}`}>
              <div className="cat-head">
                <div className="cat-title">
                  <h2 id={`cat-${category.id}`}>{category.name}</h2>
                  <span className="badge">{plural(category.items.length)}</span>
                </div>
                <div className="cluster">
                  <button
                    type="button"
                    className="btn btn-ghost icon-btn"
                    aria-label={`Move ${category.name} up`}
                    disabled={index === 0}
                    onClick={() => void move(index, -1)}
                  >
                    <span aria-hidden="true">▲</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost icon-btn"
                    aria-label={`Move ${category.name} down`}
                    disabled={index === menu.categories.length - 1}
                    onClick={() => void move(index, 1)}
                  >
                    <span aria-hidden="true">▼</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost icon-btn"
                    aria-label={`Rename ${category.name}`}
                    onClick={() => setDialog({ type: 'category', category })}
                  >
                    <span aria-hidden="true">✎</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost icon-btn"
                    aria-label={`Delete ${category.name}`}
                    onClick={() => askDeleteCategory(category)}
                  >
                    <span aria-hidden="true">✕</span>
                  </button>
                </div>
              </div>
              {category.items.length > 0 ? (
                <ul className="items">
                  {category.items.map((item) => (
                    <li className="item-row" key={item.id}>
                      <div className="item-main">
                        <strong>{item.name}</strong>
                        {item.description && <span className="text-muted">{item.description}</span>}
                        {item.variants.length > 0 && (
                          <ul className="sizes" aria-label={`Sizes for ${item.name}`}>
                            {item.variants.map((variant) => (
                              <li key={variant.id}>
                                <span>{variant.name}</span>
                                <span>{formatMinor(variant.priceMinor)}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <span className="item-price">{formatMinor(item.priceMinor)}</span>
                      <div className="cluster">
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          aria-label={`Edit ${item.name}`}
                          onClick={() => {
                            setProblem('')
                            setDialog({ type: 'item', category, item })
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          aria-label={`Remove ${item.name}`}
                          onClick={() => setDialog({ type: 'delete-item', category, item })}
                        >
                          Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="none">No items in this category yet.</p>
              )}
              <div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setProblem('')
                    setDialog({ type: 'item', category, item: null })
                  }}
                >
                  Add item to {category.name}
                </button>
              </div>
            </section>
          ))}
        </div>
      )}

      {dialog?.type === 'category' && (
        <CategoryModal
          initialName={dialog.category?.name ?? null}
          onSave={(name) => saveCategory(dialog.category, name)}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === 'delete-category' && (
        <ConfirmModal
          title={`Delete ${dialog.category.name}?`}
          text="This empty category will be removed from your menu and from what customers see."
          confirmLabel="Delete category"
          onConfirm={() => removeCategory(dialog.category)}
          onClose={closeDialog}
        />
      )}
      {dialog?.type === 'item' && (
        <ItemDrawer item={dialog.item} onSave={(input) => saveItemFor(dialog.category, dialog.item, input)} onClose={closeDialog} />
      )}
      {dialog?.type === 'delete-item' && (
        <ConfirmModal
          title={`Remove ${dialog.item.name}?`}
          text="It disappears from your menu and from what customers see. This cannot be undone."
          confirmLabel="Remove item"
          onConfirm={() => removeItem(dialog.category, dialog.item)}
          onClose={closeDialog}
        />
      )}

      {toast && (
        <div className="toast is-open" role="status">
          {toast}
        </div>
      )}
    </div>
  )
}
