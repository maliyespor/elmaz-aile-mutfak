import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore'
import { db } from './firebase'
import type { InventoryItem, ShoppingItem } from './types'

// Deterministic id keeps an inventory item and its auto-generated shopping-list
// entry in sync without needing a query to find/dedupe them.
function linkedShoppingDocId(itemId: string) {
  return `inv-${itemId}`
}

export async function setItemOutOfStock(householdId: string, item: InventoryItem, uid: string) {
  await updateDoc(doc(db, 'households', householdId, 'items', item.id), {
    status: 'tukendi',
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  })
  await setDoc(doc(db, 'households', householdId, 'shoppingItems', linkedShoppingDocId(item.id)), {
    name: item.name,
    source: 'inventory',
    linkedItemId: item.id,
    bought: false,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
}

export async function setItemBackInStock(householdId: string, item: InventoryItem, uid: string) {
  await updateDoc(doc(db, 'households', householdId, 'items', item.id), {
    status: 'stokta',
    updatedBy: uid,
    updatedAt: serverTimestamp(),
  })
  await deleteDoc(doc(db, 'households', householdId, 'shoppingItems', linkedShoppingDocId(item.id)))
}

export async function markShoppingItemBought(
  householdId: string,
  shoppingItem: Pick<ShoppingItem, 'id' | 'source' | 'linkedItemId'>,
  uid: string,
) {
  if (shoppingItem.source === 'inventory' && shoppingItem.linkedItemId) {
    // The linked inventory item may have been deleted while this entry was on
    // the list; updateDoc rejects on a missing doc, which must NOT stop us from
    // clearing the shopping entry (otherwise it gets stuck, unremovable).
    try {
      await updateDoc(doc(db, 'households', householdId, 'items', shoppingItem.linkedItemId), {
        status: 'stokta',
        updatedBy: uid,
        updatedAt: serverTimestamp(),
      })
    } catch {
      // Linked item gone — nothing to put back in stock; fall through to delete.
    }
  }
  await deleteDoc(doc(db, 'households', householdId, 'shoppingItems', shoppingItem.id))
}
