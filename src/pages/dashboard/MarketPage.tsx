import { ArrowDownRight, ArrowUpRight, CalendarCheck, Store, Wheat } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TimeSeriesChart } from '@/components/dashboard/charts'
import { Gauge } from '@/components/dashboard/Gauge'
import { AsyncView, EmptyState, PageHeader, PageSkeleton, StatusBadge } from '@/components/dashboard/states'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { GrainLot, MarketData } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useDashboard } from '@/hooks/useDashboard'
import { useFormatters } from '@/hooks/useFormatters'
import { useGlossary } from '@/hooks/useGlossary'
import { api } from '@/lib/api'
import { COLORS } from '@/lib/status'
import { cn } from '@/lib/utils'

/** days of sun-drying needed to reach the safe moisture limit */
const dryingDays = (g: GrainLot) => Math.max(0, Math.ceil((g.moisture - g.safeMax) / g.dryingPerDay))

export default function MarketPage() {
  const { t } = useTranslation()
  const { farmId } = useDashboard()
  const query = useApi(() => api.getMarket(farmId), [farmId])

  return (
    <>
      <PageHeader title={t('dash.market.title')} subtitle={t('dash.market.subtitle')} />
      <AsyncView query={query} skeleton={<PageSkeleton kpis={3} />}>
        {(data) => <MarketContent data={data} />}
      </AsyncView>
    </>
  )
}

function MarketContent({ data }: { data: MarketData }) {
  const { t } = useTranslation()
  const { g: term } = useGlossary()
  const fmt = useFormatters()
  const crops = [...new Set(data.mandi.map((m) => m.crop))]
  const [crop, setCrop] = useState<string>('all')
  const rows = crop === 'all' ? data.mandi : data.mandi.filter((m) => m.crop === crop)

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* grain lots */}
        {data.grains.length ? (
          data.grains.map((g) => {
            const days = dryingDays(g)
            const ready = days === 0
            return (
              <Card key={g.crop}>
                <CardHeader>
                  <div>
                    <p className="text-caption font-semibold uppercase tracking-wider text-ink/60">{t('dash.market.grainTitle')}</p>
                    <CardTitle className="mt-1 flex items-center gap-2 text-lg">
                      <Wheat className="size-4 text-ink/60" />
                      {term(g.crop)}
                    </CardTitle>
                  </div>
                  <StatusBadge status={ready ? 'ok' : 'warn'} label={ready ? t('dash.market.ready') : t('dash.market.dryMore', { count: days })} />
                </CardHeader>
                <CardContent>
                  <Gauge
                    ariaLabel={`${term(g.crop)} ${t('dash.market.grainTitle')}`}
                    value={g.moisture}
                    min={0}
                    max={20}
                    unit="%"
                    zones={[
                      { to: g.safeMax, color: COLORS.ok },
                      { to: g.safeMax + 2, color: COLORS.warn },
                      { to: 20, color: COLORS.crit },
                    ]}
                    caption={`${t('dash.market.safe', { value: g.safeMax })} · ${t('dash.market.quantity', { value: g.quantityQ })}`}
                  />
                </CardContent>
              </Card>
            )
          })
        ) : (
          <Card className="md:col-span-2">
            <EmptyState icon={Wheat} body={t('dash.market.grainEmpty')} />
          </Card>
        )}

        {/* best time to sell */}
        <Card className="flex flex-col overflow-hidden border-brand bg-brand text-white md:col-span-2 xl:col-span-1">
          <div className="flex-1 p-5 sm:p-6">
            <p className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-white/70">
              <CalendarCheck className="size-4" />
              {t('dash.market.bestTitle')}
            </p>
            <p className="mt-3 text-xl font-semibold leading-snug tracking-tight">
              {t('dash.market.bestBody', { crop: term(data.best.crop), mandi: term(data.best.mandi), day: fmt.relativeDay(data.best.date) })}
            </p>
            <p className="mt-4 text-3xl font-semibold tabular-nums tracking-tight">
              {fmt.inr(data.best.price)}
              <span className="text-sm font-medium text-white/70"> {t('dash.market.perQ')}</span>
            </p>
            <p className="mt-2 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold">{t('dash.market.extra', { value: data.best.extraPerQ })}</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* mandi table */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex-col gap-3 sm:flex-row sm:items-center">
            <CardTitle className="flex items-center gap-2">
              <Store className="size-4 text-ink/60" />
              {t('dash.market.mandiTitle')}
            </CardTitle>
            {crops.length > 0 && (
              <SegmentedControl
                label={t('dash.market.crop')}
                value={crop}
                onValueChange={setCrop}
                options={[{ value: 'all', label: t('dash.market.allCrops') }, ...crops.map((c) => ({ value: c, label: term(c) }))]}
              />
            )}
          </CardHeader>
          <CardContent className="px-2 sm:px-3">
            {rows.length ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>{t('dash.market.crop')}</TableHead>
                    <TableHead>{t('dash.market.mandi')}</TableHead>
                    <TableHead className="text-right">{t('dash.market.price')}</TableHead>
                    <TableHead className="text-right">{t('dash.market.change')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((m) => {
                    const best = m.crop === data.best.crop && m.mandi === data.best.mandi
                    return (
                      <TableRow key={`${m.crop}-${m.mandi}`} className={cn(best && 'bg-brand-soft/60 hover:bg-brand-soft')}>
                        <TableCell className="font-semibold">{term(m.crop)}</TableCell>
                        <TableCell>
                          <p className="whitespace-nowrap">{term(m.mandi)}</p>
                          <p className="text-caption text-ink/60">{t('dash.market.distance', { km: m.distanceKm })}</p>
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">{fmt.inr(m.price)}</TableCell>
                        <TableCell className="text-right">
                          <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold tabular-nums', m.change >= 0 ? 'text-ok' : 'text-crit')}>
                            {m.change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
                            {Math.abs(m.change)}%
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : (
              <EmptyState icon={Store} body={t('dash.market.empty')} />
            )}
          </CardContent>
        </Card>

        {/* price trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dash.market.trendTitle', { crop: term(data.best.crop) })}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.trend.length ? (
              <TimeSeriesChart
                data={data.trend}
                xKey="date"
                xFormatter={fmt.date}
                series={[
                  { key: 'price', name: t('dash.market.price'), color: COLORS.brand, area: true },
                  { key: 'msp', name: t('dash.market.msp'), color: COLORS.muted, dashed: true },
                ]}
                height={250}
              />
            ) : (
              <EmptyState body={t('dash.market.empty')} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
