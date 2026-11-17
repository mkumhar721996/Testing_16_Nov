import type { MenuCategory } from '../api/listingsApi'
import { formatPrice, priceLabel } from '../money'

export function ImageIcon() {
  return (
    <svg
      className="icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21" />
    </svg>
  )
}

export default function MenuSection({ category }: { category: MenuCategory }) {
  const count = category.items.length
  return (
    <section className="card stack-sm">
      <div className="cat-head">
        <h2>{category.name}</h2>
        <span className="badge">{`${count} ${count === 1 ? 'item' : 'items'}`}</span>
      </div>
      <ul className="items">
        {category.items.map((item) => (
          <li key={item.id} className={`item-row${item.available ? '' : ' is-sold-out'}`}>
            <span className="thumb" aria-hidden="true">
              <ImageIcon />
            </span>
            <div className="item-main">
              <strong className="item-name">{item.name}</strong>
              {item.description && <span className="text-muted">{item.description}</span>}
              {item.sizes.length > 0 && (
                <ul className="variants" aria-label={`Sizes for ${item.name}`}>
                  {item.sizes.map((size) => (
                    <li key={size.name} className="variant">
                      <span>{size.name}</span>
                      <span className="item-price">{formatPrice(size.price)}</span>
                    </li>
                  ))}
                </ul>
              )}
              <span className="meta">
                {item.available ? (
                  <span className="badge badge-success">Available</span>
                ) : (
                  <>
                    <span className="badge badge-danger">Sold out</span>
                    <span className="text-muted">Currently unavailable</span>
                  </>
                )}
              </span>
            </div>
            <span className="item-price">{priceLabel(item)}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
