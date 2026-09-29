import { cn } from '@/lib/utils'

/** KhetMitra mark: sprout over a sun arc, plus wordmark */
export function Logo({ className, tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 32 32" aria-hidden className="size-8 shrink-0">
        <rect width="32" height="32" rx="8" fill="#1F4D1F" />
        <path d="M6 22a10 10 0 0 1 20 0" fill="none" stroke="#C6E36B" strokeOpacity=".35" strokeWidth="1.5" />
        <path d="M16 25V15" stroke="#C6E36B" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 16.5c0-4.6 3-7.5 8-7.5 0 5-3 7.5-8 7.5Z" fill="#C6E36B" />
        <path d="M16 19.5c0-3.6-2.5-6-6.5-6 0 4 2.5 6 6.5 6Z" fill="#9CC04A" />
      </svg>
      <span
        className={cn(
          'font-display text-lg font-bold tracking-[-0.03em]',
          tone === 'dark' ? 'text-ink' : 'text-white',
        )}
      >
        Khet<span className={tone === 'dark' ? 'text-olive' : 'text-lime'}>Mitra</span>
      </span>
    </span>
  )
}
