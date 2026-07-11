import type { Category } from './types'

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'buzdolabi', label: 'Buzdolabı' },
  { value: 'dondurucu', label: 'Dondurucu' },
  { value: 'kiler', label: 'Kiler/Dolap' },
  { value: 'temizlik', label: 'Temizlik' },
]

export const UNITS = ['adet', 'kg', 'gram', 'litre', 'paket']

export function categoryLabel(value: Category): string {
  return CATEGORIES.find((c) => c.value === value)?.label ?? value
}
