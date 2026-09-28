import type * as React from 'react'
import { cn } from '@/lib/utils'

/** shadcn/ui Skeleton */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden className={cn('animate-pulse rounded-lg bg-ink/[0.06]', className)} {...props} />
}
