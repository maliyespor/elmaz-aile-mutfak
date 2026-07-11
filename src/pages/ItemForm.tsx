import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createItem, deleteItem, getItem, updateItem } from '../lib/inventory'
import { setItemBackInStock, setItemOutOfStock } from '../lib/sync'
import { CATEGORIES, UNITS } from '../lib/constants'
import type { Category, InventoryItem } from '../lib/types'

function toDateInputValue(date: Date | null): string {
  if (!date) return ''
  const offset = date.getTimezoneOffset()
  const local = new Date(date.getTime() - offset * 60000)
  return local.toISOString().slice(0, 10)
}

export default function ItemForm() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const { household, user } = useAuth()
  const navigate = useNavigate()

  const [existingItem, setExistingItem] = useState<InventoryItem | null>(null)
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('buzdolabi')
  const [quantity, setQuantity] = useState(1)
  const [unit, setUnit] = useState(UNITS[0])
  const [expiryDate, setExpiryDate] = useState('')
  const [loading, setLoading] = useState(isEditing)

  useEffect(() => {
    if (!household || !id) return
    getItem(household.id, id).then((item) => {
      if (!item) return
      setExistingItem(item)
      setName(item.name)
      setCategory(item.category)
      setQuantity(item.quantity)
      setUnit(item.unit)
      setExpiryDate(toDateInputValue(item.expiryDate ? item.expiryDate.toDate() : null))
      setLoading(false)
    })
  }, [household, id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!household || !user) return

    const input = {
      name: name.trim(),
      category,
      quantity,
      unit,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
    }
    if (!input.name) return

    if (isEditing && id) {
      await updateItem(household.id, id, user.uid, input)
    } else {
      await createItem(household.id, user.uid, input)
    }
    navigate('/')
  }

  async function handleDelete() {
    if (!household || !id) return
    await deleteItem(household.id, id)
    navigate('/')
  }

  async function handleToggleStock() {
    if (!household || !user || !existingItem) return
    if (existingItem.status === 'stokta') {
      await setItemOutOfStock(household.id, existingItem, user.uid)
      setExistingItem({ ...existingItem, status: 'tukendi' })
    } else {
      await setItemBackInStock(household.id, existingItem, user.uid)
      setExistingItem({ ...existingItem, status: 'stokta' })
    }
  }

  if (loading) {
    return <div className="centered-screen">Yükleniyor...</div>
  }

  return (
    <div className="page">
      <h1>{isEditing ? 'Ürünü Düzenle' : 'Ürün Ekle'}</h1>

      <form className="item-form" onSubmit={(e) => void handleSubmit(e)}>
        <label>
          Ürün adı
          <input value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
        </label>

        <label>
          Kategori
          <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </label>

        <div className="form-row">
          <label>
            Miktar
            <input
              type="number"
              min={0}
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </label>

          <label>
            Birim
            <select value={unit} onChange={(e) => setUnit(e.target.value)}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          Son kullanma tarihi (varsa)
          <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </label>

        {isEditing && existingItem && (
          <button type="button" className="secondary-button" onClick={() => void handleToggleStock()}>
            {existingItem.status === 'stokta' ? 'Tükendi olarak işaretle' : 'Stoğa geri al'}
          </button>
        )}

        <button type="submit" className="primary-button">
          Kaydet
        </button>

        {isEditing && (
          <button type="button" className="danger-button" onClick={() => void handleDelete()}>
            Ürünü Sil
          </button>
        )}
      </form>
    </div>
  )
}
