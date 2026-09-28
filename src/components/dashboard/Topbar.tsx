import {
  BatteryCharging,
  BatteryLow,
  BatteryMedium,
  Bell,
  Bug,
  ChevronDown,
  CloudRain,
  Droplets,
  Loader2,
  RefreshCw,
  Siren,
  Square,
  Volume2,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { LanguageCode } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useDashboard } from '@/hooks/useDashboard'
import { useFormatters } from '@/hooks/useFormatters'
import { useSpeech } from '@/hooks/useSpeech'
import { useGlossary } from '@/hooks/useGlossary'
import { api } from '@/lib/api'
import { simulator } from '@/lib/simulator'
import { translateParams } from '@/lib/glossary'
import { getVoiceLang } from '@/lib/voice'
import { cn } from '@/lib/utils'
import { ListenButton } from './ListenButton'
import { StatusDot } from './states'

function SimulationBadge({ className }: { className?: string }) {
  const { t } = useTranslation()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand-soft/70 px-2.5 py-1 text-2xs font-semibold text-brand',
        className,
      )}
      title="Live 5s station simulator active"
    >
      <span className="size-1.5 animate-pulse rounded-full bg-brand" />
      {t('dash.top.simMode')}
    </span>
  )
}

function SimulateEventDropdown() {
  const { t } = useTranslation()
  const { farmId } = useDashboard()
  const [open, setOpen] = useState(false)

  const events: {
    id: 'soilDry' | 'animal' | 'pest' | 'batteryLow' | 'rainForecast'
    titleKey: string
    descKey: string
    icon: typeof Droplets
    iconColor: string
    iconBg: string
  }[] = [
    {
      id: 'rainForecast',
      titleKey: 'dash.top.eventRainForecast',
      descKey: 'dash.top.descRainForecast',
      icon: CloudRain,
      iconColor: 'text-sky-600',
      iconBg: 'bg-sky-100',
    },
    {
      id: 'soilDry',
      titleKey: 'dash.top.eventSoilDry',
      descKey: 'dash.top.descSoilDry',
      icon: Droplets,
      iconColor: 'text-warn',
      iconBg: 'bg-warn-soft',
    },
    {
      id: 'animal',
      titleKey: 'dash.top.eventAnimal',
      descKey: 'dash.top.descAnimal',
      icon: Siren,
      iconColor: 'text-crit',
      iconBg: 'bg-crit-soft',
    },
    {
      id: 'pest',
      titleKey: 'dash.top.eventPest',
      descKey: 'dash.top.descPest',
      icon: Bug,
      iconColor: 'text-amber-600',
      iconBg: 'bg-amber-100',
    },
    {
      id: 'batteryLow',
      titleKey: 'dash.top.eventBatteryLow',
      descKey: 'dash.top.descBatteryLow',
      icon: BatteryLow,
      iconColor: 'text-crit',
      iconBg: 'bg-crit-soft',
    },
  ]

  const handleSelect = (type: 'soilDry' | 'animal' | 'pest' | 'batteryLow' | 'rainForecast') => {
    setOpen(false)
    simulator.triggerEvent(type, farmId)

    if (type === 'rainForecast') {
      toast.info(t('dash.top.eventRainForecast'), {
        icon: <CloudRain className="size-4 text-sky-600" />,
        description: t('dash.top.toastRainForecast'),
      })
    } else if (type === 'soilDry') {
      toast.error(t('dash.top.eventSoilDry'), {
        icon: <Droplets className="size-4 text-crit" />,
        description: t('dash.top.toastSoilDry', { value: 18.2 }),
      })
    } else if (type === 'animal') {
      toast.error(t('dash.top.eventAnimal'), {
        icon: <Siren className="size-5 animate-bounce text-crit" />,
        description: (
          <div className="mt-1 flex items-start gap-2.5">
            <div className="relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-lg bg-[#07140a]">
              <img
                src="https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=480&q=60"
                alt="IR Nilgai"
                className="size-full object-cover opacity-85 contrast-125 grayscale"
              />
              <div className="absolute inset-0 bg-[#35ff6b]/20 mix-blend-color" />
              <span className="absolute bottom-0.5 left-1 font-mono text-[8px] text-lime">IR 02:14</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs leading-snug text-ink/80">{t('dash.top.toastAnimal')}</p>
              <Link
                to="/dashboard/wildlife"
                className="mt-1 inline-flex items-center gap-1 text-2xs font-bold text-brand hover:underline"
              >
                {t('dash.wild.title')} →
              </Link>
            </div>
          </div>
        ),
        duration: 6000,
      })
    } else if (type === 'pest') {
      toast.warning(t('dash.top.eventPest'), {
        icon: <Bug className="size-4 text-warn" />,
        description: t('dash.top.toastPest', { pest: 'Pink bollworm' }),
      })
    } else if (type === 'batteryLow') {
      toast.error(t('dash.top.eventBatteryLow'), {
        icon: <BatteryLow className="size-4 text-crit" />,
        description: t('dash.top.toastBatteryLow', { value: 14 }),
      })
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          shape="pill"
          className="h-8 gap-1.5 border-brand/30 bg-brand-soft/40 px-3 text-xs font-semibold text-brand hover:bg-brand-soft hover:text-brand-dark"
        >
          <Zap className="size-3.5 fill-current" />
          <span className="hidden sm:inline">{t('dash.top.simulateEvent')}</span>
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        <div className="px-2.5 py-1.5 text-2xs font-bold uppercase tracking-wider text-ink/50">
          {t('dash.top.simulateEvent')}
        </div>
        <div className="space-y-1">
          {events.map((ev) => {
            const Icon = ev.icon
            return (
              <button
                key={ev.id}
                type="button"
                onClick={() => handleSelect(ev.id)}
                className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-muted"
              >
                <span className={cn('grid size-7 shrink-0 place-items-center rounded-lg', ev.iconBg, ev.iconColor)}>
                  <Icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-semibold leading-tight text-ink">{t(ev.titleKey)}</p>
                  <p className="text-caption text-ink/60">{t(ev.descKey)}</p>
                </div>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function BatteryChip() {
  const { t } = useTranslation()
  const { station } = useDashboard()
  if (!station) return <span className="h-8 w-40 animate-pulse rounded-full bg-ink/5" aria-hidden />
  const low = station.batteryPct < 30
  const Icon = station.solarCharging ? BatteryCharging : low ? BatteryLow : BatteryMedium
  return (
    <span className="inline-flex h-8 items-center gap-2 rounded-full border border-surface-line bg-white px-3 text-xs font-medium text-ink/70">
      <Icon aria-hidden className={cn('size-4', low ? 'text-crit' : 'text-ok')} />
      <span className="sr-only">{station.solarCharging ? t('dash.top.charging') : low ? t('dash.top.lowBattery') : ''} </span>
      <span className="font-semibold tabular-nums text-ink">{station.batteryPct}%</span>
      <span className="hidden h-3 w-px bg-surface-line sm:block" aria-hidden />
      <span className="hidden items-center gap-1 sm:inline-flex">
        <RefreshCw aria-hidden className="size-3 text-ink/60" />
        {t('dash.top.lastSync', { min: station.lastSyncMinutes })}
      </span>
    </span>
  )
}

function FarmSelect() {
  const { t } = useTranslation()
  const { g } = useGlossary()
  const { farms, farmId, setFarmId } = useDashboard()
  return (
    <Select value={farmId} onValueChange={setFarmId}>
      <SelectTrigger aria-label={t('dash.top.farm')} className="h-9 w-[min(56vw,230px)] rounded-full bg-white text-body-sm font-semibold">
        <SelectValue placeholder="…" />
      </SelectTrigger>
      <SelectContent>
        {farms.map((f) => (
          <SelectItem key={f.id} value={f.id}>
            {g(f.name)} · {f.stationId}
            <span className="ml-1 text-ink/60">({t('dash.top.acres', { n: f.acres })})</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Notifications() {
  const { t } = useTranslation()
  const { gp } = useGlossary()
  const { farmId } = useDashboard()
  const fmt = useFormatters()
  const [open, setOpen] = useState(false)
  const { data, mutate } = useApi(() => api.getNotifications(farmId), [farmId])

  useEffect(() => {
    return simulator.subscribe(() => {
      mutate(() => simulator.getNotifications(farmId))
    })
  }, [farmId, mutate])

  const unread = data?.filter((a) => a.severity !== 'ok').length ?? 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" shape="pill" className="relative size-9 border-surface-line bg-white">
          <Bell aria-hidden />
          {/* accessible name lives in sr-only text so it includes the visible count */}
          <span className="sr-only">{t('dash.top.notificationsCount', { count: unread })}</span>
          {unread > 0 && (
            <span aria-hidden className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-crit text-3xs font-bold text-white">
              {unread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0">
        <div className="flex items-center justify-between border-b border-surface-line px-4 py-2.5">
          <h2 className="text-sm font-semibold">{t('dash.top.notifications')}</h2>
          {data && data.length > 0 && (
            <ListenButton
              iconOnly
              label={t('dash.voice.listenAlerts')}
              build={(ft) =>
                [ft('dash.voice.alertsIntro'), ...data.map((a) => `${ft(`dash.alertText.${a.type}`, translateParams(ft, a.params))}.`)].join(' ')
              }
            />
          )}
        </div>
        {data && data.length > 0 ? (
          <ul className="max-h-80 divide-y divide-surface-line overflow-y-auto">
            {data.map((a) => (
              <li key={a.id} className="flex items-start gap-3 px-4 py-3">
                <StatusDot status={a.severity} className="mt-1.5 size-2" />
                <div className="min-w-0 flex-1">
                  <p className="text-body-sm font-medium leading-snug">{t(`dash.alertText.${a.type}`, gp(a.params))}</p>
                  <p className="mt-0.5 text-caption text-ink/60">{fmt.ago(a.time)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-center text-xs text-ink/60">{t('dash.top.noNotifications')}</p>
        )}
        <Link
          to="/dashboard/alerts"
          onClick={() => setOpen(false)}
          className="block border-t border-surface-line px-4 py-3 text-center text-xs font-semibold text-brand hover:bg-surface-muted"
        >
          {t('dash.top.viewAll')}
        </Link>
      </PopoverContent>
    </Popover>
  )
}

/** Reads a short farm summary aloud in the current language */
function PlayVoice() {
  const { t, i18n } = useTranslation()
  const { farmId, farmer } = useDashboard()
  const { speaking, playLocalized, stop } = useSpeech()
  const [busy, setBusy] = useState(false)

  const onClick = async () => {
    if (speaking) return stop()
    setBusy(true)
    try {
      const o = await api.getOverview(farmId)
      const moisture = o.kpis.find((k) => k.id === 'moisture')?.value ?? 0
      const temp = o.kpis.find((k) => k.id === 'temperature')?.value ?? 0
      const rec = o.recommendations[0]
      const lang = getVoiceLang((i18n.resolvedLanguage ?? 'en') as LanguageCode)
      const name = farmer?.name.split(' ')[0] ?? ''
      await playLocalized(lang, (ft) => {
        const advice = rec ? ft(`dash.rec.${rec.textKey}`, translateParams(ft, rec.params)) : ft('dash.voice.allGood')
        return ft('dash.voice.summary', { name, moisture: Math.round(moisture), temp: Math.round(temp), advice })
      })
    } catch (e) {
      toast.error(t('dash.common.errorTitle'), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      variant={speaking ? 'deep' : 'outline'}
      size="sm"
      shape="pill"
      onClick={onClick}
      className={cn('h-9', !speaking && 'border-surface-line bg-white')}
      aria-pressed={speaking}
    >
      {busy ? <Loader2 className="animate-spin" /> : speaking ? <Square /> : <Volume2 />}
      {/* label always present for screen readers; visible from xl */}
      <span className="sr-only xl:not-sr-only">{speaking ? t('dash.top.stopVoice') : t('dash.top.playVoice')}</span>
    </Button>
  )
}

export function Topbar() {
  const { t } = useTranslation()
  const { farmer } = useDashboard()

  return (
    <header className="sticky top-0 z-20 border-b border-surface-line bg-surface/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
        <FarmSelect />
        <div className="hidden md:flex items-center gap-2">
          <BatteryChip />
          <SimulationBadge />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <SimulateEventDropdown />
          <LanguageSwitcher className="hidden border-surface-line bg-white sm:inline-flex" />
          <PlayVoice />
          <Notifications />
          <Link
            to="/dashboard/settings"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-xs font-bold text-white ring-2 ring-white"
            title={farmer?.name}
          >
            <span aria-hidden>{farmer?.initials ?? '··'}</span>
            <span className="sr-only">
              {t('dash.top.profile')}: {farmer?.name}
            </span>
          </Link>
        </div>
      </div>

      {/* compact row for small screens: battery + simulation mode + language */}
      <div className="flex items-center justify-between gap-2 px-4 pb-2.5 sm:px-6 md:hidden">
        <div className="flex items-center gap-2">
          <BatteryChip />
          <SimulationBadge />
        </div>
        <LanguageSwitcher className="border-surface-line bg-white sm:hidden" />
      </div>
    </header>
  )
}
