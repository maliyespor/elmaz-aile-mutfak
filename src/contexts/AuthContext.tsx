import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  EmailAuthProvider,
  getRedirectResult,
  linkWithCredential,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithRedirect,
  signOut,
  updatePassword,
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
  signInWithEmail: (email: string, password: string) => Promise<void>
  setPassword: (newPassword: string) => Promise<void>
  signOutUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Firebase reports auth failures as error codes; translate the ones a family
// member can actually act on, and fall back to the raw message otherwise.
function turkishAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? ''
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'E-posta veya şifre hatalı.'
    case 'auth/invalid-email':
      return 'Geçersiz e-posta adresi.'
    case 'auth/weak-password':
      return 'Şifre en az 6 karakter olmalı.'
    case 'auth/too-many-requests':
      return 'Çok fazla deneme yapıldı. Birkaç dakika bekleyip tekrar deneyin.'
    case 'auth/network-request-failed':
      return 'İnternet bağlantısı kurulamadı. Bağlantınızı kontrol edin.'
    case 'auth/operation-not-allowed':
      return 'Şifreli giriş henüz etkinleştirilmemiş. Firebase konsolunda Email/Password sağlayıcısını açın.'
    case 'auth/requires-recent-login':
      return 'Güvenlik için önce çıkış yapıp yeniden giriş yapın, sonra şifreyi tekrar deneyin.'
    case 'auth/email-already-in-use':
    case 'auth/credential-already-in-use':
      return 'Bu e-posta zaten başka bir hesaba bağlı.'
    default:
      return err instanceof Error ? err.message : String(err)
  }
}

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
    // A popup window can get silently closed by the OS when the user leaves
    // the browser to approve a 2-step-verification prompt in another app, so
    // it's unreliable on mobile. A full-page redirect survives that app
    // switch, and now that the app is hosted on the same origin family as
    // Firebase's authDomain, redirect works reliably in every browser.
    await signInWithRedirect(auth, googleProvider)
  }

  // Password sign-in avoids the OAuth redirect entirely, so it is immune to
  // the storage-partitioning problems that kept breaking Google sign-in on
  // iOS. Errors are thrown (in Turkish) for the caller to show inline.
  async function signInWithEmail(email: string, password: string) {
    setError(null)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (err) {
      throw new Error(turkishAuthError(err))
    }
  }

  // Attaches a password to the signed-in account (same UID, so household
  // membership is preserved), or changes it if one is already set.
  async function setPassword(newPassword: string) {
    const current = auth.currentUser
    if (!current?.email) throw new Error('Oturum bulunamadı. Yeniden giriş yapın.')
    try {
      if (current.providerData.some((p) => p.providerId === 'password')) {
        await updatePassword(current, newPassword)
      } else {
        await linkWithCredential(current, EmailAuthProvider.credential(current.email, newPassword))
      }
    } catch (err) {
      throw new Error(turkishAuthError(err))
    }
  }

  async function signOutUser() {
    await signOut(auth)
  }

  return (
    <AuthContext.Provider
      value={{ user, household, loading, error, signIn, signInWithEmail, setPassword, signOutUser }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
