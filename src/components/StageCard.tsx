import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type StageTone = 'mist' | 'dark' | 'white' | 'image' | 'ink'

const toneClasses: Record<StageTone, string> = {
  mist: 'bg-mist text-ink',
  white: 'bg-white text-ink',
  dark: 'bg-ink-800 text-white',
  ink: 'bg-ink text-white',
  image: 'bg-ink text-white',
}

interface StageCardProps extends HTMLAttributes<HTMLElement> {
  tone?: StageTone
  /** classes for the rounded inner card */
  innerClassName?: string
  children: ReactNode
}

/**
 * A full-width section rendered as a large rounded "stage" card
 * floating on the sage page background (see ./reference screenshots).
 * Uses overflow-clip (not hidden) so sticky children keep working.
 */
export function StageCard({ tone = 'white', className, innerClassName, children, ...props }: StageCardProps) {
  return (
    <section className={cn('px-2 pt-2 sm:px-3 sm:pt-3 lg:px-4 lg:pt-4', className)} {...props}>
      <div
        data-tone={tone}
        className={cn('relative isolate overflow-clip rounded-stage shadow-stage', toneClasses[tone], innerClassName)}
      >
        {children}
      </div>
    </section>
  )
}
