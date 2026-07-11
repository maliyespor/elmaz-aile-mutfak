import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { addDoc, collection, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'
import type { Household } from '../lib/types'

interface AuthContextValue {
  user: User | null
  household: Household | null
  loading: boolean
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setHousehold(null)
        setLoading(false)
      }
    })
  }, [])

  useEffect(() => {
    if (!user) return

    setLoading(true)
    const householdsRef = collection(db, 'households')
    const membershipQuery = query(householdsRef, where('members', 'array-contains', user.uid))

    let unsubscribeDoc: (() => void) | undefined

    const unsubscribeQuery = onSnapshot(membershipQuery, async (snapshot) => {
      if (unsubscribeDoc) {
        unsubscribeDoc()
        unsubscribeDoc = undefined
      }

      if (!snapshot.empty) {
        const householdRef = snapshot.docs[0].ref
        unsubscribeDoc = onSnapshot(householdRef, (docSnap) => {
          setHousehold({ id: docSnap.id, ...(docSnap.data() as Omit<Household, 'id'>) })
          setLoading(false)
        })
      } else {
        // First-time login: create this person's household automatically.
        // The spouse's UID is added to `members` later via the Firebase console.
        const newHouseholdRef = await addDoc(householdsRef, {
          name: 'Ailem',
          members: [user.uid],
          createdAt: serverTimestamp(),
        })
        unsubscribeDoc = onSnapshot(newHouseholdRef, (docSnap) => {
          setHousehold({ id: docSnap.id, ...(docSnap.data() as Omit<Household, 'id'>) })
          setLoading(false)
        })
      }
    })

    return () => {
      unsubscribeQuery()
      if (unsubscribeDoc) unsubscribeDoc()
    }
  }, [user])

  async function signIn() {
    await signInWithPopup(auth, googleProvider)
  }

  async function signOutUser() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, household, loading, signIn, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
