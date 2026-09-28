import type { Status } from '@/data/types'

/** Tailwind text colour per status */
export const statusText: Record<Status, string> = {
  ok: 'text-ok',
  warn: 'text-warn',
  crit: 'text-crit',
}

/** Hex colours for charts / SVG (match tailwind tokens ok/warn/crit/brand) */
export const COLORS = {
  brand: '#2F6B3F',
  brandSoft: '#E9F2EB',
  ok: '#13703A',
  warn: '#B86E00',
  crit: '#C4281C',
  /** axis labels: 4.6:1 on white */
  muted: '#6B7268',
  grid: '#EEF0EC',
  ink: '#0B0D0A',
  sky: '#3B82C4',
  sun: '#E0A526',
} as const

export const statusColor: Record<Status, string> = { ok: COLORS.ok, warn: COLORS.warn, crit: COLORS.crit }
