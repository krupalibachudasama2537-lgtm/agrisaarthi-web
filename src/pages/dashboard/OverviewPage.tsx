import {
  Bell,
  Bug,
  CalendarDays,
  ChevronRight,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  LayoutGrid,
  Leaf,
  List,
  type LucideIcon,
  MapPin,
  PawPrint,
  Sprout,
  Sun,
  TrendingUp,
  Wind,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { TimeSeriesChart } from '@/components/dashboard/charts'
import { KpiCard } from '@/components/dashboard/KpiCard'
import { PumpSwitch } from '@/components/dashboard/PumpSwitch'
import { AsyncView, EmptyState, PageHeader, PageSkeleton, StatusBadge, StatusDot } from '@/components/dashboard/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { RecommendationKind, Weather, WeatherCondition } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useDashboard } from '@/hooks/useDashboard'
import { useFormatters } from '@/hooks/useFormatters'
import { useGlossary } from '@/hooks/useGlossary'
import { ListenButton } from '@/components/dashboard/ListenButton'
import { api } from '@/lib/api'
import { simulator } from '@/lib/simulator'
import { translateParams } from '@/lib/glossary'
import { COLORS } from '@/lib/status'
import { cn } from '@/lib/utils'

const CONDITION_ICON: Record<WeatherCondition, LucideIcon> = {
  sunny: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
}

const CONDITION_THEME: Record<WeatherCondition, { bg: string; text: string; ring: string }> = {
  sunny: {
    bg: 'bg-amber-500/10 dark:bg-amber-400/15',
    text: 'text-amber-500 dark:text-amber-400',
    ring: 'ring-amber-500/20 dark:ring-amber-400/30',
  },
  partly: {
    bg: 'bg-amber-500/10 dark:bg-amber-400/15',
    text: 'text-amber-500 dark:text-amber-400',
    ring: 'ring-amber-400/20 dark:ring-amber-400/30',
  },
  cloudy: {
    bg: 'bg-slate-500/10 dark:bg-slate-400/15',
    text: 'text-slate-600 dark:text-slate-300',
    ring: 'ring-slate-400/20 dark:ring-slate-400/30',
  },
  rain: {
    bg: 'bg-sky-500/15 dark:bg-sky-400/20',
    text: 'text-sky-600 dark:text-sky-400',
    ring: 'ring-sky-500/20 dark:ring-sky-400/30',
  },
}

const REC_ICON: Record<RecommendationKind, LucideIcon> = {
  irrigation: Droplets,
  fertilizer: Sprout,
  pest: Bug,
  disease: Leaf,
  market: TrendingUp,
  wildlife: PawPrint,
  soil: Droplets,
}

type ChartMetric = 'moisture' | 'temperature' | 'humidity'

const CHART_CONFIG: Record<ChartMetric, { color: string; unit: string; threshold?: number }> = {
  moisture: { color: COLORS.brand, unit: '%', threshold: 25 },
  temperature: { color: COLORS.sun, unit: '°C' },
  humidity: { color: COLORS.sky, unit: '%' },
}

export default function OverviewPage() {
  const { t } = useTranslation()
  const { g, gp } = useGlossary()
  const { farmId, farm, farmer } = useDashboard()
  const fmt = useFormatters()
  const query = useApi(() => api.getOverview(farmId), [farmId])
  const { mutate } = query
  const [metric, setMetric] = useState<ChartMetric>('moisture')

  useEffect(() => {
    return simulator.subscribe(() => {
      mutate((prev) => {
        if (!prev) return prev
        const fresh = simulator.getOverview(farmId)
        return {
          ...prev,
          kpis: fresh.kpis,
          series24h: [...fresh.series24h],
          alerts: fresh.alerts,
          pump: fresh.pump,
        }
      })
    })
  }, [farmId, mutate])

  return (
    <>
      <PageHeader
        title={t('dash.overview.greeting', { name: farmer?.name.split(' ')[0] ?? '' })}
        subtitle={farm ? t('dash.overview.subtitle', { farm: g(farm.name), crop: g(farm.crop), stage: g(farm.cropStage) }) : undefined}
        actions={
          <Badge variant="outline" className="gap-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-ok" />
            {t('dash.common.live')}
          </Badge>
        }
      />

      <AsyncView query={query} skeleton={<PageSkeleton kpis={6} />}>
        {(data) => {
          const cfg = CHART_CONFIG[metric]
          return (
            <div className="space-y-4">
              {/* KPIs */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                {data.kpis.map((k) => (
                  <KpiCard
                    key={k.id}
                    kpi={k}
                    trend={k.id === 'battery' ? undefined : data.series24h.map((p) => p[k.id as Exclude<typeof k.id, 'battery'>])}
                  />
                ))}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* 24h chart */}
                <Card className="lg:col-span-2">
                  <CardHeader className="flex-col sm:flex-row">
                    <div>
                      <CardTitle>{t('dash.overview.chartTitle')}</CardTitle>
                      <CardDescription>{t('dash.overview.chartDesc')}</CardDescription>
                    </div>
                    <SegmentedControl
                      label={t('dash.overview.chartTitle')}
                      value={metric}
                      onValueChange={setMetric}
                      options={(Object.keys(CHART_CONFIG) as ChartMetric[]).map((m) => ({ value: m, label: t(`dash.metrics.${m}`) }))}
                    />
                  </CardHeader>
                  <CardContent>
                    {data.series24h.length ? (
                      <TimeSeriesChart
                        data={data.series24h}
                        xKey="t"
                        xFormatter={fmt.time}
                        series={[{ key: metric, name: t(`dash.metrics.${metric}`), color: cfg.color, unit: cfg.unit, area: true }]}
                        references={cfg.threshold ? [{ y: cfg.threshold, label: t('dash.soil.dryTitle') }] : []}
                        height={260}
                      />
                    ) : (
                      <EmptyState body={t('dash.overview.chartEmpty')} />
                    )}
                  </CardContent>
                </Card>

                {/* weather */}
                <Card className="flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>{t('dash.overview.weatherTitle')}</CardTitle>
                        <CardDescription>{farm ? g(farm.village) : ''}</CardDescription>
                      </div>
                      <Badge variant="outline" className="gap-1 font-normal text-xs text-ink/65">
                        <MapPin className="size-3 text-brand" />
                        {farm ? g(farm.village) : 'Gujarat'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 pb-4">
                    <WeatherBlock weather={data.weather} />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {/* recommendations */}
                <Card className="lg:col-span-2">
                  <CardHeader className="flex-wrap">
                    <CardTitle className="flex items-center gap-2">
                      {t('dash.overview.recsTitle')}
                      <Badge variant="brand">{data.recommendations.length}</Badge>
                    </CardTitle>
                    {data.recommendations.length > 0 && (
                      <ListenButton
                        label={t('dash.voice.listenRecs')}
                        build={(ft) =>
                          [ft('dash.voice.recsIntro'), ...data.recommendations.map((r) => ft(`dash.rec.${r.textKey}`, translateParams(ft, r.params)))].join(' ')
                        }
                      />
                    )}
                  </CardHeader>
                  <CardContent className="px-2 pb-2 sm:px-3">
                    {data.recommendations.length ? (
                      <ul className="divide-y divide-surface-line">
                        {data.recommendations.map((r) => {
                          const Icon = REC_ICON[r.kind]
                          return (
                            <li key={r.id}>
                              <Link
                                to={`/dashboard/${r.to}`}
                                className="group flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-surface-muted sm:px-3"
                              >
                                <span
                                  className={cn(
                                    'grid size-10 shrink-0 place-items-center rounded-xl',
                                    r.priority === 'crit' ? 'bg-crit-soft text-crit' : r.priority === 'warn' ? 'bg-warn-soft text-warn' : 'bg-ok-soft text-ok',
                                  )}
                                >
                                  <Icon aria-hidden className="size-[18px]" />
                                </span>
                                <span className="min-w-0 flex-1 text-sm font-medium leading-snug">
                                  {t(`dash.rec.${r.textKey}`, gp(r.params))}
                                  <span className="sr-only sm:hidden"> ({t(`dash.common.status.${r.priority}`)})</span>
                                </span>
                                <StatusBadge status={r.priority} className="hidden sm:inline-flex" />
                                <ChevronRight aria-hidden className="size-4 shrink-0 text-ink/45 transition-transform group-hover:translate-x-0.5" />
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    ) : (
                      <EmptyState icon={Sprout} body={t('dash.overview.recsEmpty')} />
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {/* pump */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('dash.overview.pumpTitle')}</CardTitle>
                      <Link to="/dashboard/irrigation" className="rounded text-xs font-semibold text-brand hover:underline">
                        {t('dash.common.open')}
                        <span className="sr-only"> {t('dash.nav.irrigation')}</span>
                      </Link>
                    </CardHeader>
                    <CardContent>
                      <PumpSwitch pump={data.pump} minutes={25} onChange={(pump) => query.mutate((d) => ({ ...d, pump }))} />
                    </CardContent>
                  </Card>

                  {/* alerts */}
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('dash.overview.alertsTitle')}</CardTitle>
                      <div className="flex items-center gap-2">
                        {data.alerts.length > 0 && (
                          <ListenButton
                            iconOnly
                            label={t('dash.voice.listenAlerts')}
                            build={(ft) =>
                              [ft('dash.voice.alertsIntro'), ...data.alerts.map((a) => `${ft(`dash.alertText.${a.type}`, translateParams(ft, a.params))}.`)].join(' ')
                            }
                          />
                        )}
                        <Link to="/dashboard/alerts" className="rounded text-xs font-semibold text-brand hover:underline">
                          {t('dash.common.open')}
                          <span className="sr-only"> {t('dash.nav.alerts')}</span>
                        </Link>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {data.alerts.length ? (
                        <ul className="space-y-3">
                          {data.alerts.map((a) => (
                            <li key={a.id} className="flex items-start gap-3">
                              <StatusDot status={a.severity} className="mt-1.5 size-2" />
                              <div className="min-w-0 flex-1">
                                <p className="text-body-sm font-medium leading-snug">
                                  <span className="sr-only">{t(`dash.common.status.${a.severity}`)}: </span>
                                  {t(`dash.alertText.${a.type}`, gp(a.params))}
                                </p>
                                <p className="mt-0.5 text-caption text-ink/60">
                                  {fmt.ago(a.time)} · {a.channels.map((c) => t(`dash.channel.${c}`)).join(', ')}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <EmptyState icon={Bell} body={t('dash.overview.alertsEmpty')} className="py-6" />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          )
        }}
      </AsyncView>
    </>
  )
}

function WeatherBlock({ weather }: { weather: Weather }) {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [view, setView] = useState<'list' | 'cards'>('list')
  const NowIcon = CONDITION_ICON[weather.now.condition]
  const theme = CONDITION_THEME[weather.now.condition]

  const weekMin = Math.min(...weather.days.map((d) => d.min))
  const weekMax = Math.max(...weather.days.map((d) => d.max))
  const tempRange = Math.max(1, weekMax - weekMin)

  return (
    <div className="space-y-4">
      {/* Current weather hero */}
      <div className="rounded-2xl border border-surface-line/70 bg-gradient-to-br from-surface to-surface-muted/40 p-3.5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={cn('grid size-12 place-items-center rounded-2xl ring-1 shadow-xs', theme.bg, theme.ring)}>
              <NowIcon className={cn('size-6.5', theme.text)} />
            </span>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold leading-none tracking-tight text-ink">
                  {weather.now.temp}°
                </span>
                {weather.days[0] && (
                  <span className="text-caption font-medium text-ink/50 tabular-nums">
                    {weather.days[0].max}° / {weather.days[0].min}°
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs font-medium text-ink/75 capitalize">
                {t(`dash.conditions.${weather.now.condition}`)}
              </p>
            </div>
          </div>

          <div className="space-y-1 text-right text-caption text-ink/70">
            {weather.now.rainfall !== undefined && (
              <p className="flex items-center justify-end gap-1.5 tabular-nums">
                <CloudRain className="size-3.5 text-sky-500" />
                <span>{t('dash.overview.rainfall', { mm: weather.now.rainfall })}</span>
              </p>
            )}
            <p className="flex items-center justify-end gap-1.5 tabular-nums">
              <Droplets className="size-3.5 text-teal-500" />
              <span>{t('dash.overview.humidity', { pct: weather.now.humidity })}</span>
            </p>
            <p className="flex items-center justify-end gap-1.5 tabular-nums">
              <Wind className="size-3.5 text-slate-400" />
              <span>{t('dash.overview.wind', { kmh: weather.now.windKmh })}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Forecast header & view switch */}
      <div>
        <div className="mb-2 flex items-center justify-between px-0.5">
          <div className="flex items-center gap-1.5 text-2xs font-bold uppercase tracking-wider text-ink/55">
            <CalendarDays className="size-3 text-ink/45" />
            <span>{t('dash.overview.forecast7d')}</span>
          </div>
          <div className="flex items-center gap-0.5 rounded-lg bg-surface-muted p-0.5">
            <button
              type="button"
              onClick={() => setView('list')}
              aria-label={t('dash.common.list')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium transition-all',
                view === 'list' ? 'bg-white font-semibold text-ink shadow-xs dark:bg-surface' : 'text-ink/60 hover:text-ink'
              )}
            >
              <List className="size-3" />
              <span>{t('dash.common.list')}</span>
            </button>
            <button
              type="button"
              onClick={() => setView('cards')}
              aria-label={t('dash.common.cards')}
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-0.5 text-2xs font-medium transition-all',
                view === 'cards' ? 'bg-white font-semibold text-ink shadow-xs dark:bg-surface' : 'text-ink/60 hover:text-ink'
              )}
            >
              <LayoutGrid className="size-3" />
              <span>{t('dash.common.cards')}</span>
            </button>
          </div>
        </div>

        {view === 'list' ? (
          /* Apple-weather style 7-day row list */
          <div className="space-y-0.5 rounded-xl border border-surface-line/60 bg-surface/40 p-1.5">
            {weather.days.map((d, i) => {
              const Icon = CONDITION_ICON[d.condition]
              const dTheme = CONDITION_THEME[d.condition]
              const isToday = i === 0
              const leftPct = ((d.min - weekMin) / tempRange) * 100
              const widthPct = Math.max(12, ((d.max - d.min) / tempRange) * 100)

              return (
                <div
                  key={d.date}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs transition-colors',
                    isToday ? 'bg-brand-soft/30 font-semibold' : 'hover:bg-surface-muted/60'
                  )}
                >
                  {/* Day name - full width, never truncated! */}
                  <span className={cn('w-20 shrink-0 text-caption font-medium', isToday ? 'font-bold text-brand' : 'text-ink/75')}>
                    {fmt.relativeDay(d.date)}
                  </span>

                  {/* Icon */}
                  <span className="flex w-6 shrink-0 justify-center">
                    <Icon className={cn('size-4', dTheme.text)} />
                  </span>

                  {/* Rain chance */}
                  <div className="w-11 shrink-0 text-center">
                    {d.rainChance > 0 ? (
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-2xs font-semibold text-sky-700 bg-sky-50 dark:bg-sky-950/40">
                        <Droplets className="size-2.5 shrink-0" />
                        {d.rainChance}%
                      </span>
                    ) : (
                      <span className="text-2xs text-ink/30">—</span>
                    )}
                  </div>

                  {/* Temperature bar - only the bar itself shrinks, min/max labels never clip */}
                  <div className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1.5">
                    <span className="w-6 shrink-0 text-right text-caption tabular-nums text-ink/50">{d.min}°</span>
                    <div className="relative h-1.5 w-full min-w-[28px] max-w-20 rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-teal-400 via-amber-400 to-rose-400"
                        style={{
                          left: `${leftPct}%`,
                          width: `${Math.min(100 - leftPct, widthPct)}%`,
                        }}
                      />
                    </div>
                    <span className="w-6 shrink-0 text-left text-caption font-semibold tabular-nums text-ink">{d.max}°</span>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Spacious horizontal cards with comfortable width */
          <div className="flex gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar snap-x snap-mandatory">
            {weather.days.map((d) => {
              const Icon = CONDITION_ICON[d.condition]
              const dTheme = CONDITION_THEME[d.condition]
              const isToday = d.date === weather.days[0]?.date

              return (
                <div
                  key={d.date}
                  className={cn(
                    'min-w-[92px] flex-1 snap-start rounded-xl border border-surface-line bg-surface p-2.5 text-center transition-all hover:border-ink/20 hover:shadow-xs',
                    isToday && 'border-brand/40 bg-brand-soft/25'
                  )}
                >
                  <p className={cn('text-caption font-semibold', isToday ? 'text-brand font-bold' : 'text-ink/75')}>
                    {fmt.relativeDay(d.date)}
                  </p>
                  <span className={cn('mx-auto my-1.5 grid size-7 place-items-center rounded-lg', dTheme.bg)}>
                    <Icon className={cn('size-4', dTheme.text)} />
                  </span>
                  <p className="text-xs font-bold tabular-nums text-ink">
                    {d.max}° <span className="font-normal text-ink/50 text-caption">{d.min}°</span>
                  </p>
                  <div className="mt-1">
                    {d.rainChance > 0 ? (
                      <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-2xs font-semibold text-sky-700 bg-sky-50 dark:bg-sky-950/40">
                        <Droplets className="size-2.5" />
                        {d.rainChance}%
                      </span>
                    ) : (
                      <span className="text-2xs text-ink/30">0%</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
