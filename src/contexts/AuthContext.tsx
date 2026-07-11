import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  type DocumentReference,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { auth, db, googleProvider } from '../lib/firebase'
import type { Household } from '../lib/types'

interface AuthContextValue {
  user: User | null
  household: Household | null
  loading: boolean
  error: string | null
  signIn: () => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Surfaces errors from the signInWithRedirect round trip (blocked storage,
    // unauthorized domain, etc.) that onAuthStateChanged alone won't report.
    getRedirectResult(auth).catch((err) => {
      setError(err instanceof Error ? err.message : String(err))
      setLoading(false)
    })

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
    setError(null)
    const householdsRef = collection(db, 'households')
    const membershipQuery = query(householdsRef, where('members', 'array-contains', user.uid))

    let unsubscribeDoc: (() => void) | undefined

    function watchHousehold(ref: DocumentReference) {
      unsubscribeDoc = onSnapshot(
        ref,
        (docSnap) => {
          setHousehold({ id: docSnap.id, ...(docSnap.data() as Omit<Household, 'id'>) })
          setLoading(false)
        },
        (err) => {
          setError(`Hane bilgisi okunamadı: ${err.message}`)
          setLoading(false)
        },
      )
    }

    const unsubscribeQuery = onSnapshot(
      membershipQuery,
      async (snapshot) => {
        if (unsubscribeDoc) {
          unsubscribeDoc()
          unsubscribeDoc = undefined
        }

        try {
          if (!snapshot.empty) {
            watchHousehold(snapshot.docs[0].ref)
          } else {
            // First-time login: create this person's household automatically.
            // The spouse's UID is added to `members` later via the Firebase console.
            const newHouseholdRef = await addDoc(householdsRef, {
              name: 'Ailem',
              members: [user.uid],
              createdAt: serverTimestamp(),
            })
            watchHousehold(newHouseholdRef)
          }
        } catch (err) {
          setError(`Hane oluşturulamadı: ${err instanceof Error ? err.message : String(err)}`)
          setLoading(false)
        }
      },
      (err) => {
        setError(`Firestore'a erişilemedi: ${err.message}`)
        setLoading(false)
      },
    )

    return () => {
      unsubscribeQuery()
      if (unsubscribeDoc) unsubscribeDoc()
    }
  }, [user])

  async function signIn() {
    setError(null)
    try {
      // Popup is the more reliable flow (works even when the app's origin
      // differs from Firebase's authDomain), so try it first.
      await signInWithPopup(auth, googleProvider)
    } catch (err) {
      const code = err instanceof Object && 'code' in err ? String((err as { code: unknown }).code) : ''
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') {
        // Popup unavailable (blocked, or running as an installed PWA) — fall
        // back to a full-page redirect instead.
        await signInWithRedirect(auth, googleProvider)
      } else if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') {
        setError(err instanceof Error ? err.message : String(err))
      }
    }
  }

  async function signOutUser() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, household, loading, error, signIn, signOutUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
