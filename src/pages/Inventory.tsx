import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { subscribeToItems } from '../lib/inventory'
import { setItemBackInStock, setItemOutOfStock } from '../lib/sync'
import { CATEGORIES, categoryLabel } from '../lib/constants'
import { expiryLabel, expiryUrgency, daysUntil } from '../lib/expiry'
import type { Category, InventoryItem } from '../lib/types'

const URGENCY_RANK = { expired: 0, soon: 1, ok: 2, none: 3 } as const

export default function Inventory() {
  const { household, user } = useAuth()
  const navigate = useNavigate()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [filter, setFilter] = useState<Category | 'all'>('all')

  useEffect(() => {
    if (!household) return
    return subscribeToItems(household.id, setItems)
  }, [household])

  const visibleItems = useMemo(() => {
    const filtered = filter === 'all' ? items : items.filter((item) => item.category === filter)
    return [...filtered].sort((a, b) => {
      const rankDiff = URGENCY_RANK[expiryUrgency(a.expiryDate)] - URGENCY_RANK[expiryUrgency(b.expiryDate)]
      if (rankDiff !== 0) return rankDiff
      const daysA = daysUntil(a.expiryDate)
      const daysB = daysUntil(b.expiryDate)
      if (daysA !== null && daysB !== null && daysA !== daysB) return daysA - daysB
      return a.name.localeCompare(b.name, 'tr')
    })
  }, [items, filter])

  async function toggleStock(item: InventoryItem) {
    if (!household || !user) return
    if (item.status === 'stokta') {
      await setItemOutOfStock(household.id, item, user.uid)
    } else {
      await setItemBackInStock(household.id, item, user.uid)
    }
  }

  return (
    <div className="page">
      <h1>Envanter</h1>

      <div className="chip-row">
        <button className={`chip${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>
          Tümü
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            className={`chip${filter === cat.value ? ' active' : ''}`}
            onClick={() => setFilter(cat.value)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {visibleItems.length === 0 && <p className="empty-state">Bu kategoride ürün yok.</p>}

      <ul className="item-list">
        {visibleItems.map((item) => {
          const urgency = expiryUrgency(item.expiryDate)
          return (
            <li key={item.id} className={`item-row urgency-${urgency}`}>
              <button className="item-row-main" onClick={() => navigate(`/envanter/${item.id}`)}>
                <div className="item-row-top">
                  <span className="item-name">{item.name}</span>
                  <span className="item-quantity">
                    {item.quantity} {item.unit}
                  </span>
                </div>
                <div className="item-row-bottom">
                  <span className="item-category">{categoryLabel(item.category)}</span>
                  {item.expiryDate && <span className="item-expiry">{expiryLabel(item.expiryDate)}</span>}
                  {item.status === 'tukendi' && <span className="item-out-of-stock">Tükendi</span>}
                </div>
              </button>
              <button className="stock-toggle" onClick={() => void toggleStock(item)}>
                {item.status === 'stokta' ? 'Tükendi olarak işaretle' : 'Stoğa geri al'}
              </button>
            </li>
          )
        })}
      </ul>

      <button className="fab" onClick={() => navigate('/envanter/yeni')} aria-label="Ürün ekle">
        +
      </button>
    </div>
  )
}
