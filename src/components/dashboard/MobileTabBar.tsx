import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { NAV, navPath } from './nav'

/** Bottom tab bar on mobile/tablet: 4 primary pages + "More" sheet with the rest */
export function MobileTabBar() {
  const { t } = useTranslation()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const primary = NAV.filter((n) => n.mobile)
  const secondaryActive = NAV.some((n) => !n.mobile && pathname === navPath(n.to))

  return (
    <>
      <nav
        aria-label={t('nav.dashboard')}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {primary.map(({ to, key, icon: Icon }) => (
            <li key={key}>
              <NavLink
                to={navPath(to)}
                end={to === ''}
                className={({ isActive }) =>
                  cn(
                    'flex h-16 flex-col items-center justify-center gap-1 px-1 text-2xs font-semibold transition-colors',
                    isActive ? 'text-brand' : 'text-ink/60',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span className={cn('grid h-7 w-12 place-items-center rounded-full transition-colors', isActive && 'bg-brand-soft')}>
                      <Icon className="size-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                    </span>
                    <span className="w-full truncate text-center">{t(`dash.nav.${key}`)}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              className={cn(
                'flex h-16 w-full flex-col items-center justify-center gap-1 text-2xs font-semibold',
                secondaryActive ? 'text-brand' : 'text-ink/60',
              )}
            >
              <span className={cn('grid h-7 w-12 place-items-center rounded-full', secondaryActive && 'bg-brand-soft')}>
                <MoreHorizontal className="size-[18px]" />
              </span>
              {t('dash.nav.more')}
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bottom-0 left-0 top-auto w-full max-w-none translate-x-0 translate-y-0 rounded-b-none p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden">
          <DialogTitle className="px-1 text-base">{t('dash.nav.more')}</DialogTitle>
          <DialogDescription className="sr-only">{t('dash.nav.more')}</DialogDescription>
          <ul className="grid grid-cols-3 gap-2">
            {NAV.map(({ to, key, icon: Icon }) => (
              <li key={key}>
                <NavLink
                  to={navPath(to)}
                  end={to === ''}
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'flex h-20 flex-col items-center justify-center gap-1.5 rounded-2xl border px-1 text-center text-caption font-semibold leading-tight',
                      isActive ? 'border-brand/30 bg-brand-soft text-brand' : 'border-surface-line text-ink/70',
                    )
                  }
                >
                  <Icon className="size-5" />
                  {t(`dash.nav.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link to="/" className="flex items-center justify-center gap-2 py-1 text-xs font-medium text-ink/60">
            <ArrowLeft className="size-3.5" />
            {t('dash.nav.backToSite')}
          </Link>
        </DialogContent>
      </Dialog>
    </>
  )
}
