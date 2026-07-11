import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import type { ShoppingItem } from './types'

function shoppingRef(householdId: string) {
  return collection(db, 'households', householdId, 'shoppingItems')
}

export function subscribeToShoppingItems(householdId: string, cb: (items: ShoppingItem[]) => void) {
  const q = query(shoppingRef(householdId), orderBy('createdAt'))
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ShoppingItem, 'id'>) })))
  })
}

export async function addManualShoppingItem(householdId: string, uid: string, name: string) {
  await addDoc(shoppingRef(householdId), {
    name,
    source: 'manual',
    linkedItemId: null,
    bought: false,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
}

export async function removeShoppingItem(householdId: string, shoppingItemId: string) {
  await deleteDoc(doc(db, 'households', householdId, 'shoppingItems', shoppingItemId))
}
