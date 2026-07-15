import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'

// iOS Safari partitions storage between the app origin (web.app) and a
// cross-site authDomain (firebaseapp.com), which silently drops the
// signInWithRedirect result and loops back to the login screen. Firebase
// Hosting serves the /__/auth handler on every hosting domain, so on the
// hosted app the page's own hostname is the correct authDomain; the env
// value remains only for localhost dev, where there is no local handler.
const { hostname } = window.location
const authDomain =
  hostname.endsWith('.web.app') || hostname.endsWith('.firebaseapp.com')
    ? hostname
    : import.meta.env.VITE_FIREBASE_AUTH_DOMAIN

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

// Firestore's own persistence handles offline use, so the PWA service worker
// only needs to cache the app shell (see vite.config.ts).
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
