import { useState, type FormEvent } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { user, household, setPassword, signOutUser } = useAuth()
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const hasPassword = user?.providerData.some((p) => p.providerId === 'password') ?? false

  async function handleSetPassword(e: FormEvent) {
    e.preventDefault()
    setMessage(null)
    setPasswordError(null)
    setBusy(true)
    try {
      await setPassword(newPassword)
      setNewPassword('')
      setMessage('Şifre kaydedildi. Artık giriş ekranında e-posta ve şifrenizle girebilirsiniz.')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <h1>Ayarlar</h1>

      <div className="settings-info">
        <p>
          <strong>Hesap:</strong> {user?.displayName ?? user?.email}
        </p>
        <p>
          <strong>Hane:</strong> {household?.name}
        </p>
      </div>

      <h2>Giriş Şifresi</h2>
      <p className="settings-hint">
        Şifre belirlerseniz bu hesaba Google'a gerek kalmadan, giriş ekranındaki e-posta ve şifre
        alanlarıyla girebilirsiniz. Google girişinin sorun çıkardığı telefonlar için birebirdir.
      </p>
      <form className="item-form" onSubmit={(e) => void handleSetPassword(e)}>
        <label>
          {hasPassword ? 'Yeni şifre' : 'Şifre (en az 6 karakter)'}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={busy}>
          {busy ? 'Kaydediliyor…' : hasPassword ? 'Şifreyi Değiştir' : 'Şifre Belirle'}
        </button>
        {message && <p className="success-text">{message}</p>}
        {passwordError && <p className="error-text">{passwordError}</p>}
      </form>

      <button className="danger-button" onClick={() => void signOutUser()}>
        Çıkış Yap
      </button>
    </div>
  )
}
