export function formatFullName(
  lastName: string | null,
  firstName: string | null,
  middleName: string | null
): string {
  const last = lastName?.trim() ?? ''
  const first = firstName?.trim() ?? ''
  const mid = middleName?.trim() ? `${middleName.trim()[0]}.` : ''
  const firstWithMid = [first, mid].filter(Boolean).join(' ')

  if (!last && !firstWithMid) return '—'
  if (last && firstWithMid) return `${last}, ${firstWithMid}`
  return last || firstWithMid
}

export function formatDate(isoDate: string | null): string {
  if (!isoDate) return '—'
  const [y, m, d] = isoDate.split('-')
  if (!y || !m || !d) return '—'
  return `${m}/${d}/${y}`
}

export function computeAging(entryDate: string | null): number {
  if (!entryDate) return 0
  const entry = new Date(entryDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  entry.setHours(0, 0, 0, 0)
  const diff = Math.floor((today.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24))
  return Math.max(0, diff)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen) + '…'
}

/** Convert empty/whitespace strings to null for optional DB fields */
export function emptyToNull(value: string | null | undefined): string | null {
  if (!value || value.trim() === '') return null
  return value.trim()
}

/** Convert date display value (mm/dd/yyyy) to ISO (YYYY-MM-DD) */
export function displayToIsoDate(display: string): string {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return display
  return `${match[3]}-${match[1]}-${match[2]}`
}

/** Convert ISO date (YYYY-MM-DD) to display value (mm/dd/yyyy) */
export function isoToDisplayDate(iso: string | null): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return ''
  return `${m}/${d}/${y}`
}
