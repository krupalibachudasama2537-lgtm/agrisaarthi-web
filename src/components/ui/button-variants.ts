import { cva } from 'class-variance-authority'

/**
 * shadcn/ui Button, restyled for AgriSaarthi.
 * The "chamfer" shape (one clipped corner) comes from the reference "Book a Demo ›" button.
 */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,color,transform,box-shadow] duration-300 ease-calm disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-inset active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** Olive – primary CTA on photos / dark */
        default: 'bg-olive text-white hover:bg-olive-light focus-visible:ring-lime',
        /** Deep green – primary CTA on white / mist */
        deep: 'bg-olive-deep text-white hover:bg-olive focus-visible:ring-lime',
        /** Lime – high emphasis on near-black */
        lime: 'bg-lime text-ink hover:bg-lime-soft focus-visible:ring-olive-deep',
        /** Glass – secondary on photos / dark */
        glass: 'border border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 focus-visible:ring-lime',
        /** Outline – secondary on light */
        outline: 'border border-ink/25 bg-white/50 text-ink backdrop-blur-md hover:bg-white focus-visible:ring-olive-deep',
        ghost: 'text-current hover:bg-ink/5 focus-visible:ring-olive-deep',
        link: 'text-olive-deep underline-offset-4 hover:underline focus-visible:ring-olive-deep',
      },
      size: {
        sm: 'h-9 px-3.5 text-body-sm',
        default: 'h-11 px-5 text-sm',
        lg: 'h-12 px-6 text-body',
        icon: 'size-10',
      },
      shape: {
        chamfer: 'chamfer rounded-chip',
        rounded: 'rounded-xl',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'chamfer',
    },
  },
)
