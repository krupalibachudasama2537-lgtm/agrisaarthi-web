import * as React from 'react'
import { cn } from '@/lib/utils'

/** shadcn/ui Input */
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-xl border border-surface-control bg-white px-3 text-sm text-ink transition-colors placeholder:text-ink/45 focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-2 aria-[invalid=true]:border-crit',
        className,
      )}
      {...props}
    />
  ),
)
Input.displayName = 'Input'

export { Input }
