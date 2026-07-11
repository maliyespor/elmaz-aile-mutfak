import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import { db } from './firebase'
import type { InventoryItem } from './types'

function itemsRef(householdId: string) {
  return collection(db, 'households', householdId, 'items')
}

export function subscribeToItems(householdId: string, cb: (items: InventoryItem[]) => void) {
  const q = query(itemsRef(householdId), orderBy('name'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<InventoryItem, 'id'>) })))
  })
}

export async function getItem(householdId: string, itemId: string): Promise<InventoryItem | null> {
  const snap = await getDoc(doc(db, 'households', householdId, 'items', itemId))
  if (!snap.exists()) return null
  return { id: snap.id, ...(snap.data() as Omit<InventoryItem, 'id'>) }
}

// Stock status is changed via the dedicated toggle (see lib/sync.ts) so the
// linked shopping-list entry always stays consistent with it.
export interface ItemInput {
  name: string
  category: InventoryItem['category']
  quantity: number
  unit: string
  expiryDate: Date | null
}

export async function createItem(householdId: string, uid: string, input: ItemInput) {
  await addDoc(itemsRef(householdId), {
    ...input,
    status: 'stokta',
    createdBy: uid,
    updatedBy: uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateItem(householdId: string, itemId: string, uid: string, input: ItemInput) {
  await updateDoc(doc(db, 'households', householdId, 'items', itemId), {
    ...input,
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteItem(householdId: string, itemId: string) {
  await deleteDoc(doc(db, 'households', householdId, 'items', itemId))
}
