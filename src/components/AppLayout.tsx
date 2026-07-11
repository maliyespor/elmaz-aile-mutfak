import type { ReactNode } from 'react'
import BottomNav from './BottomNav'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-layout">
      <main className="app-content">{children}</main>
      <BottomNav />
    </div>
  )
}
