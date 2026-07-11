import type { Timestamp } from 'firebase/firestore'

export type ExpiryUrgency = 'expired' | 'soon' | 'ok' | 'none'

const SOON_THRESHOLD_DAYS = 3

export function daysUntil(expiryDate: Timestamp | null): number | null {
  if (!expiryDate) return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = expiryDate.toDate()
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86400000)
}

export function expiryUrgency(expiryDate: Timestamp | null): ExpiryUrgency {
  const days = daysUntil(expiryDate)
  if (days === null) return 'none'
  if (days < 0) return 'expired'
  if (days <= SOON_THRESHOLD_DAYS) return 'soon'
  return 'ok'
}

export function formatExpiry(expiryDate: Timestamp | null): string {
  if (!expiryDate) return ''
  return expiryDate.toDate().toLocaleDateString('tr-TR')
}

export function expiryLabel(expiryDate: Timestamp | null): string {
  const days = daysUntil(expiryDate)
  if (days === null) return ''
  if (days < 0) return `${Math.abs(days)} gün önce geçti`
  if (days === 0) return 'Bugün geçiyor'
  if (days === 1) return 'Yarın geçiyor'
  return `${days} gün kaldı`
}
