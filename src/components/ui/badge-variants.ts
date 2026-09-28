import { cva } from 'class-variance-authority'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-caption font-semibold [&_svg]:size-3 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-brand text-white',
        secondary: 'bg-surface-muted text-ink/70',
        outline: 'border border-surface-line text-ink/70',
        ok: 'bg-ok-soft text-ok',
        warn: 'bg-warn-soft text-warn',
        crit: 'bg-crit-soft text-crit',
        brand: 'bg-brand-soft text-brand',
      },
    },
    defaultVariants: { variant: 'secondary' },
  },
)
