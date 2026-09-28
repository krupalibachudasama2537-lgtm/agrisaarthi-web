import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SectionEyebrowProps {
  children: ReactNode
  icon?: LucideIcon
  /** light = on light backgrounds, dark = on dark/photo backgrounds */
  tone?: 'light' | 'dark'
  className?: string
}

/**
 * Tiny uppercase label in a corner-bracket frame, e.g. "▣ HOW IT WORKS".
 * Mirrors the "▣ About Us" / "▣ The Problem" labels in the reference.
 */
export function SectionEyebrow({ children, icon: Icon, tone = 'light', className }: SectionEyebrowProps) {
  const corner = tone === 'light' ? 'border-olive' : 'border-lime'
  return (
    <span
      className={cn(
        'relative inline-flex items-center gap-2 px-2.5 py-1.5 text-eyebrow font-semibold uppercase',
        tone === 'light' ? 'text-ink/70' : 'text-white/80',
        className,
      )}
    >
      {/* corner brackets */}
      <span aria-hidden className={cn('absolute left-0 top-0 size-1.5 border-l border-t', corner)} />
      <span aria-hidden className={cn('absolute right-0 top-0 size-1.5 border-r border-t', corner)} />
      <span aria-hidden className={cn('absolute bottom-0 left-0 size-1.5 border-b border-l', corner)} />
      <span aria-hidden className={cn('absolute bottom-0 right-0 size-1.5 border-b border-r', corner)} />

      <span
        aria-hidden
        className={cn(
          'grid size-3.5 place-items-center rounded border',
          tone === 'light' ? 'border-ink/40' : 'border-white/50',
        )}
      >
        {Icon ? (
          <Icon className="size-2.5" strokeWidth={2.5} />
        ) : (
          <span className={cn('size-1.5 rounded-sm', tone === 'light' ? 'bg-ink/60' : 'bg-white/80')} />
        )}
      </span>
      {children}
    </span>
  )
}
