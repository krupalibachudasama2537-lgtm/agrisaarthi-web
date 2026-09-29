import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Logo } from '@/components/Logo'
import { StageCard } from '@/components/StageCard'
import { BADGES } from '@/data/landing'
import { scrollToId } from '@/lib/lenis'

const PRODUCT_LINKS = [
  { id: 'how-it-works', key: 'nav.how' },
  { id: 'hardware', key: 'nav.hardware' },
  { id: 'faq', key: 'nav.faq' },
] as const

export function Footer() {
  const { t } = useTranslation()

  return (
    <StageCard tone="ink" className="pb-2 sm:pb-3 lg:pb-4">
      <footer className="container py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo tone="light" />
            <p className="mt-4 max-w-xs text-sm text-white/55">{t('footer.tagline')}</p>
            <LanguageSwitcher className="mt-6 border-white/10 bg-white/90" />
          </div>

          <nav aria-label={t('footer.product')}>
            <p className="text-eyebrow font-semibold uppercase text-white/60">{t('footer.product')}</p>
            <ul className="mt-4 space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    onClick={(e) => {
                      e.preventDefault()
                      scrollToId(l.id)
                    }}
                    className="text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {t(l.key)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <p className="text-eyebrow font-semibold uppercase text-white/60">{t('footer.project')}</p>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              <li>{t('footer.sih')}</li>
              <li>
                <Link to="/dashboard" className="transition-colors hover:text-white">
                  {t('nav.dashboard')}
                </Link>
              </li>
              <li>
                <a
                  href="#demo"
                  onClick={(e) => {
                    e.preventDefault()
                    scrollToId('demo')
                  }}
                  className="transition-colors hover:text-white"
                >
                  {t('nav.demo')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <ul className="mt-12 flex flex-wrap gap-2">
          {BADGES.map(({ id, icon: Icon }) => (
            <li key={id} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-caption text-white/60">
              <Icon className="size-3.5 text-lime" />
              {t(`badges.${id}`)}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-white/60 sm:flex-row sm:justify-between">
          <p>{t('footer.rights')}</p>
          <p>{t('footer.imagery')}</p>
        </div>
      </footer>
    </StageCard>
  )
}
