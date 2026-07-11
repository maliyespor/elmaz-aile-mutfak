import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const { signIn } = useAuth()

  return (
    <div className="centered-screen">
      <h1>Aile Mutfak Programı</h1>
      <p>Buzdolabınızı, kilerinizi ve alışveriş listenizi eşinizle birlikte takip edin.</p>
      <button className="primary-button" onClick={() => void signIn()}>
        Google ile Giriş Yap
      </button>
    </div>
  )
}
