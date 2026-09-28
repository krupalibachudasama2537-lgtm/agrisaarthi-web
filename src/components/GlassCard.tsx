import { type HTMLMotionProps, m } from 'framer-motion'
import { forwardRef, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface GlassCardProps extends HTMLMotionProps<'div'> {
  /** light = on misty/white backgrounds, dark = on photos or near-black */
  tone?: 'light' | 'dark'
}

/** Frosted glass panel: blurred backdrop, thin white border, soft shadow */
export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(function GlassCard(
  { tone = 'light', className, children, ...props },
  ref,
) {
  return (
    <m.div
      ref={ref}
      className={cn(
        'rounded-card border backdrop-blur-glass backdrop-saturate-150',
        tone === 'light'
          ? 'border-white/70 bg-white/45 text-ink shadow-glass'
          : 'border-white/20 bg-white/10 text-white shadow-[0_10px_40px_-12px_rgba(0,0,0,0.5)]',
        className,
      )}
      {...props}
    >
      {children}
    </m.div>
  )
})

/** Tiny uppercase label used inside glass cards */
export function GlassLabel({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <p className={cn('text-2xs font-semibold uppercase tracking-[0.14em] opacity-60', className)}>{children}</p>
  )
}
