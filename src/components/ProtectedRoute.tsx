import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, household, loading } = useAuth()

  if (loading) {
    return <div className="centered-screen">Yükleniyor...</div>
  }

  if (!user || !household) {
    return <Navigate to="/giris" replace />
  }

  return <>{children}</>
}
