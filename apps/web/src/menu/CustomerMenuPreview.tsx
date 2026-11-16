import { useEffect, useState } from 'react'
import { getCustomerMenu } from './menuApi'
import { formatMinor } from './money'
import type { Menu } from './types'

interface CustomerMenuPreviewProps {
  restaurantId: string
  onBack: () => void
}

export default function CustomerMenuPreview({ restaurantId, onBack }: CustomerMenuPreviewProps) {
  const [menu, setMenu] = useState<Menu | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    getCustomerMenu(restaurantId)
      .then(setMenu)
      .catch(() => setFailed(true))
  }, [restaurantId])

  return (
    <div className="menu-wrap">
      <p>
        <a
          href="#menu"
          onClick={(event) => {
            event.preventDefault()
            onBack()
          }}
        >
          Back to menu
        </a>
      </p>
      <h1>Customer menu</h1>
      <div className="alert alert-info" role="status">
        Customer view. This is the live menu: every saved edit appears here without admin approval.
      </div>

      {failed && (
        <div className="alert alert-danger" role="alert">
          Couldn't load the customer menu. Check your connection, then try again.
        </div>
      )}

      {!menu && !failed && (
        <div className="stack" role="status" aria-label="Loading the customer menu">
          <div className="card">
            <span className="skeleton" />
          </div>
        </div>
      )}

      {menu && menu.categories.length === 0 && (
        <div className="empty-state">
          <h2>No menu items yet</h2>
          <p>Customers see nothing here until you add an item with a price to a category.</p>
          <button type="button" className="btn btn-secondary" onClick={onBack}>
            Go to menu
          </button>
        </div>
      )}

      {menu && menu.categories.length > 0 && (
        <div className="stack">
          {menu.categories.map((category) => (
            <section className="card" key={category.id} aria-labelledby={`preview-${category.id}`}>
              <h2 id={`preview-${category.id}`}>{category.name}</h2>
              {category.items.map((item) => (
                <div className="preview-item" key={item.id}>
                  <div className="item-main">
                    <strong>{item.name}</strong>
                    {item.description && <span className="text-muted">{item.description}</span>}
                    {item.variants.length > 0 && (
                      <ul className="sizes">
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
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
