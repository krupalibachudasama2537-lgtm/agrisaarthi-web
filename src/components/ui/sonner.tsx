import { Toaster as Sonner } from 'sonner'

/**
 * shadcn/ui Toast (Sonner – the toast component shadcn now ships).
 * Use `toast.success(...)`, `toast.error(...)` from 'sonner' anywhere.
 */
export function Toaster() {
  return (
    <Sonner
      position="top-center"
      offset={16}
      toastOptions={{
        classNames: {
          toast: 'rounded-2xl border border-surface-line bg-white text-ink shadow-lg font-sans text-sm',
          description: 'text-ink/60',
          actionButton: 'bg-brand text-white',
          success: '[&_[data-icon]]:text-ok',
          error: '[&_[data-icon]]:text-crit',
          warning: '[&_[data-icon]]:text-warn',
        },
      }}
    />
  )
}
