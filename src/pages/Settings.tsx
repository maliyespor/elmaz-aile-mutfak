import { useAuth } from '../contexts/AuthContext'

export default function Settings() {
  const { user, household, signOutUser } = useAuth()

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

      <button className="danger-button" onClick={() => void signOutUser()}>
        Çıkış Yap
      </button>
    </div>
  )
}
