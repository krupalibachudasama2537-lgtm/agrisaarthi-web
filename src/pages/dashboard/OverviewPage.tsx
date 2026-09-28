import {
  Bell,
  Bug,
  ChevronRight,
  Cloud,
  CloudRain,
  CloudSun,
  Droplets,
  Leaf,
  type LucideIcon,
  PawPrint,
  Sprout,
  Sun,
  TrendingUp,
  Wind,
} from 'lucide-react'
import { useState } from 'react'
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
import { translateParams } from '@/lib/glossary'
import { COLORS } from '@/lib/status'
import { cn } from '@/lib/utils'

const CONDITION_ICON: Record<WeatherCondition, LucideIcon> = {
  sunny: Sun,
  partly: CloudSun,
  cloudy: Cloud,
  rain: CloudRain,
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
  const [metric, setMetric] = useState<ChartMetric>('moisture')

  return (
    <>
      <PageHeader
        title={t('dash.overview.greeting', { name: farmer?.name.split(' ')[0] ?? '' })}
        subtitle={farm ? t('dash.overview.subtitle', { farm: g(farm.name), crop: g(farm.crop), stage: g(farm.cropStage) }) : undefined}
        actions={<Badge variant="outline">{t('dash.common.sample')}</Badge>}
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
                <Card>
                  <CardHeader>
                    <CardTitle>{t('dash.overview.weatherTitle')}</CardTitle>
                    <span className="text-xs text-ink/60">{farm ? g(farm.village) : ''}</span>
                  </CardHeader>
                  <CardContent>
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
  const NowIcon = CONDITION_ICON[weather.now.condition]
  return (
    <div>
      <div className="flex items-center gap-4">
        <span className="grid size-14 place-items-center rounded-2xl bg-[#FFF6E0] text-[#E0A526]">
          <NowIcon className="size-7" />
        </span>
        <div>
          <p className="text-3xl font-semibold leading-none tracking-tight">{weather.now.temp}°</p>
          <p className="mt-1 text-xs text-ink/60">{t(`dash.conditions.${weather.now.condition}`)}</p>
        </div>
        <div className="ml-auto space-y-1 text-right text-caption text-ink/60">
          <p className="flex items-center justify-end gap-1">
            <Droplets className="size-3" />
            {t('dash.overview.humidity', { pct: weather.now.humidity })}
          </p>
          <p className="flex items-center justify-end gap-1">
            <Wind className="size-3" />
            {t('dash.overview.wind', { kmh: weather.now.windKmh })}
          </p>
        </div>
      </div>
      <ul className="mt-5 grid grid-cols-4 gap-2">
        {weather.days.map((d) => {
          const Icon = CONDITION_ICON[d.condition]
          return (
            <li key={d.date} className="rounded-xl bg-surface px-1 py-2.5 text-center">
              <p className="truncate text-caption font-semibold text-ink/60">{fmt.relativeDay(d.date)}</p>
              <Icon className={cn('mx-auto my-1.5 size-5', d.condition === 'rain' ? 'text-sky-600' : 'text-ink/60')} />
              <p className="text-xs font-semibold tabular-nums">
                {d.max}° <span className="font-normal text-ink/60">{d.min}°</span>
              </p>
              <p className={cn('mt-0.5 text-2xs tabular-nums', d.rainChance >= 50 ? 'font-semibold text-sky-700' : 'text-ink/60')}>
                {t('dash.overview.rain', { pct: d.rainChance })}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
