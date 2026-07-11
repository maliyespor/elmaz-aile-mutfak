import type { Timestamp } from 'firebase/firestore'

export type Category = 'buzdolabi' | 'dondurucu' | 'kiler' | 'temizlik'
export type ItemStatus = 'stokta' | 'tukendi'

export interface Household {
  id: string
  name: string
  members: string[]
  createdAt: Timestamp | null
}

export interface InventoryItem {
  id: string
  name: string
  category: Category
  quantity: number
  unit: string
  expiryDate: Timestamp | null
  status: ItemStatus
  createdBy: string
  updatedBy: string
  createdAt: Timestamp | null
  updatedAt: Timestamp | null
}

export interface ShoppingItem {
  id: string
  name: string
  source: 'manual' | 'inventory'
  linkedItemId: string | null
  bought: boolean
  createdBy: string
  createdAt: Timestamp | null
}
