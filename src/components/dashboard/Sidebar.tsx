import { ArrowLeft, BatteryMedium, SunMedium } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { Progress } from '@/components/ui/progress'
import { useDashboard } from '@/hooks/useDashboard'
import { cn } from '@/lib/utils'
import { NAV, NAV_SECTIONS, navPath } from './nav'

/** Desktop left sidebar (hidden below lg – replaced by the bottom tab bar) */
export function Sidebar() {
  const { t } = useTranslation()
  const { station, farm } = useDashboard()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-surface-line bg-white lg:flex">
      <div className="flex h-16 items-center px-5">
        <Link to="/" aria-label={t('nav.home')} className="rounded-lg">
          <Logo />
        </Link>
      </div>

      <nav aria-label={t('nav.dashboard')} className="no-scrollbar flex-1 overflow-y-auto px-3 pb-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section} className="mt-4 first:mt-2">
            <p className="px-3 pb-1.5 text-2xs font-semibold uppercase tracking-[0.12em] text-ink/60">
              {t(`dash.nav.${section}`)}
            </p>
            <ul className="space-y-0.5">
              {NAV.filter((n) => n.section === section).map(({ to, key, icon: Icon }) => (
                <li key={key}>
                  <NavLink
                    to={navPath(to)}
                    end={to === ''}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-3 rounded-xl px-3 py-2 text-body-sm font-medium transition-colors',
                        isActive ? 'bg-brand-soft text-brand' : 'text-ink/60 hover:bg-surface-muted hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && <span className="absolute -left-3 top-2 h-5 w-1 rounded-r-full bg-brand" aria-hidden />}
                        <Icon className="size-[18px] shrink-0" strokeWidth={isActive ? 2.2 : 1.8} />
                        <span className="truncate">{t(`dash.nav.${key}`)}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* station card */}
      <div className="border-t border-surface-line p-3">
        <div className="rounded-2xl bg-surface p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold">{farm?.stationId ?? '—'}</span>
            <span className="inline-flex items-center gap-1 text-ok">
              <SunMedium className="size-3.5" />
              {t('dash.top.charging')}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <BatteryMedium aria-hidden className="size-4 text-ink/60" />
            <Progress value={station?.batteryPct ?? 0} className="h-1.5" aria-label={t('dash.metrics.battery')} />
            <span className="text-xs font-semibold tabular-nums">{station ? `${station.batteryPct}%` : '—'}</span>
          </div>
          <p className="mt-2 text-caption text-ink/60">
            {station ? t('dash.top.lastSync', { min: station.lastSyncMinutes }) : '…'}
          </p>
        </div>
        <Link
          to="/"
          className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-ink/60 transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <ArrowLeft className="size-3.5" />
          {t('dash.nav.backToSite')}
        </Link>
      </div>
    </aside>
  )
}
