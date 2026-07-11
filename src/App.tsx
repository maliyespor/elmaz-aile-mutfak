import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import Login from './pages/Login'
import Inventory from './pages/Inventory'
import ItemForm from './pages/ItemForm'
import ShoppingList from './pages/ShoppingList'
import Settings from './pages/Settings'

function Protected({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/giris" element={<Login />} />
          <Route
            path="/"
            element={
              <Protected>
                <Inventory />
              </Protected>
            }
          />
          <Route
            path="/envanter/yeni"
            element={
              <Protected>
                <ItemForm />
              </Protected>
            }
          />
          <Route
            path="/envanter/:id"
            element={
              <Protected>
                <ItemForm />
              </Protected>
            }
          />
          <Route
            path="/liste"
            element={
              <Protected>
                <ShoppingList />
              </Protected>
            }
          />
          <Route
            path="/ayarlar"
            element={
              <Protected>
                <Settings />
              </Protected>
            }
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
