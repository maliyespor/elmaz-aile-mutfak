import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { addManualShoppingItem, subscribeToShoppingItems } from '../lib/shopping'
import { markShoppingItemBought } from '../lib/sync'
import type { ShoppingItem } from '../lib/types'

export default function ShoppingList() {
  const { household, user } = useAuth()
  const [items, setItems] = useState<ShoppingItem[]>([])
  const [newItemName, setNewItemName] = useState('')

  useEffect(() => {
    if (!household) return
    return subscribeToShoppingItems(household.id, setItems)
  }, [household])

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!household || !user) return
    const name = newItemName.trim()
    if (!name) return
    await addManualShoppingItem(household.id, user.uid, name)
    setNewItemName('')
  }

  async function handleBought(item: ShoppingItem) {
    if (!household || !user) return
    await markShoppingItemBought(household.id, item, user.uid)
  }

  return (
    <div className="page">
      <h1>Alışveriş Listesi</h1>

      {items.length === 0 && <p className="empty-state">Liste boş. Eksik bir şey yok!</p>}

      <ul className="shopping-list">
        {items.map((item) => (
          <li key={item.id} className="shopping-row">
            <label>
              <input type="checkbox" onChange={() => void handleBought(item)} />
              <span className="shopping-name">{item.name}</span>
              {item.source === 'inventory' && <span className="shopping-tag">stoktan</span>}
            </label>
          </li>
        ))}
      </ul>

      <form className="add-shopping-form" onSubmit={(e) => void handleAdd(e)}>
        <input
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          placeholder="Alınacak ürün ekle..."
        />
        <button type="submit" className="primary-button">
          Ekle
        </button>
      </form>
    </div>
  )
}
