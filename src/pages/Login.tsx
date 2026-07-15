import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn, signInWithEmail, error, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Email/password sign-in happens on this (unprotected) /giris route, so a
  // successful login updates `user` but leaves the form on screen — nothing
  // navigates into the app. Redirect once authenticated. (Google sign-in was
  // unaffected because its redirect returns to "/" directly.)
  if (user) {
    return <Navigate to="/" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    setBusy(true)
    try {
      await signInWithEmail(email, password)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="centered-screen">
      <h1>Aile Mutfak Programı</h1>
      <p>Buzdolabınızı, kilerinizi ve alışveriş listenizi eşinizle birlikte takip edin.</p>

      <form className="item-form login-form" onSubmit={(e) => void handleSubmit(e)}>
        <label>
          E-posta
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Şifre
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </button>
        {formError && <p className="error-text">{formError}</p>}
      </form>

      <p className="login-divider">veya</p>

      <button className="secondary-button" onClick={() => void signIn()}>
        Google ile Giriş Yap
      </button>
      {error && <p className="error-text">Giriş yapılamadı: {error}</p>}
    </div>
  )
}
