import { AnimatePresence, m, useMotionValueEvent, useScroll } from 'framer-motion'
import { ChevronRight, LayoutDashboard, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { scrollToId } from '@/lib/lenis'
import { cn } from '@/lib/utils'
import { LanguageSwitcher } from './LanguageSwitcher'
import { Logo } from './Logo'
import { EASE_CALM } from '@/lib/motion'

const LINKS = [
  { id: 'how-it-works', key: 'nav.how' },
  { id: 'hardware', key: 'nav.hardware' },
  { id: 'faq', key: 'nav.faq' },
] as const

/** Floating glass navbar; hides on scroll down, returns on scroll up */
export function Navbar() {
  const { t } = useTranslation()
  const { scrollY } = useScroll()
  const [hidden, setHidden] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useMotionValueEvent(scrollY, 'change', (y) => {
    const prev = scrollY.getPrevious() ?? 0
    setScrolled(y > 24)
    setHidden(y > prev && y > 400 && !open)
  })

  // close the mobile menu on Escape
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const go = (id: string) => {
    setOpen(false)
    scrollToId(id)
  }

  return (
    <m.header
      initial={false}
      animate={{ y: hidden ? -110 : 0 }}
      transition={{ duration: 0.6, ease: EASE_CALM }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8 lg:pt-6"
    >
      <nav
        aria-label={t('nav.main')}
        className={cn(
          'mx-auto flex h-14 max-w-[1320px] items-center justify-between gap-3 rounded-2xl border pl-3 pr-2 transition-[background-color,box-shadow,border-color] duration-500 sm:h-[60px] sm:pl-4',
          scrolled || open
            ? 'border-white/70 bg-white/70 shadow-glass backdrop-blur-xl'
            : 'border-white/40 bg-white/30 backdrop-blur-md',
        )}
      >
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault()
            go('top')
          }}
          className="rounded-lg"
          aria-label={t('nav.home')}
        >
          <Logo />
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={`#${link.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  go(link.id)
                }}
                className="rounded-lg px-3 py-2 text-body-sm font-medium text-ink/70 transition-colors hover:text-ink"
              >
                {t(link.key)}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <LanguageSwitcher className="hidden sm:inline-flex" />
          <Button asChild variant="ghost" size="sm" shape="rounded" className="hidden xl:inline-flex">
            <Link to="/dashboard">
              <LayoutDashboard />
              {t('nav.dashboard')}
            </Link>
          </Button>
          <Button variant="deep" size="sm" className="hidden sm:inline-flex" onClick={() => go('demo')}>
            {t('nav.demo')}
            <ChevronRight />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            shape="rounded"
            className="lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t('nav.close') : t('nav.menu')}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X /> : <Menu />}
          </Button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <m.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE_CALM }}
            className="mx-auto mt-2 max-w-[1320px] rounded-2xl border border-white/70 bg-white/85 p-3 shadow-glass backdrop-blur-xl lg:hidden"
          >
            <ul className="flex flex-col">
              {LINKS.map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      go(link.id)
                    }}
                    className="flex items-center justify-between rounded-xl px-3 py-3 text-body font-medium text-ink hover:bg-ink/5"
                  >
                    {t(link.key)}
                    <ChevronRight className="size-4 opacity-40" />
                  </a>
                </li>
              ))}
              <li>
                <Link
                  to="/dashboard"
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-body font-medium text-ink hover:bg-ink/5"
                >
                  {t('nav.dashboard')}
                  <LayoutDashboard className="size-4 opacity-40" />
                </Link>
              </li>
            </ul>
            <div className="mt-2 flex flex-col gap-2 border-t border-ink/10 pt-3">
              <LanguageSwitcher full className="w-full" />
              <Button variant="deep" className="w-full" onClick={() => go('demo')}>
                {t('nav.demo')}
                <ChevronRight />
              </Button>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </m.header>
  )
}
