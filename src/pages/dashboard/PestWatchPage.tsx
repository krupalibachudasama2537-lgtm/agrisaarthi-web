import { Bug, Info, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TimeSeriesChart } from '@/components/dashboard/charts'
import { AnalysisError, AnalyzingCard, ConfidenceBar, PhotoPreview } from '@/components/dashboard/diagnosis'
import { ListenButton } from '@/components/dashboard/ListenButton'
import { PhotoUpload } from '@/components/dashboard/PhotoUpload'
import { AsyncView, EmptyState, PageHeader, StatusBadge, StatusDot } from '@/components/dashboard/states'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { NearbyFarm, PestWatchData } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useDashboard } from '@/hooks/useDashboard'
import { useDiagnosis } from '@/hooks/useDiagnosis'
import { useFormatters } from '@/hooks/useFormatters'
import { useGlossary } from '@/hooks/useGlossary'
import { api } from '@/lib/api'
import { COLORS } from '@/lib/status'
import { cn } from '@/lib/utils'

const LEVEL_CLASS: Record<NearbyFarm['level'], string> = {
  0: 'bg-surface-muted',
  1: 'bg-[#FDE9B8]',
  2: 'bg-[#F6B35E]',
  3: 'bg-[#E0572F]',
}

export default function PestWatchPage() {
  const { t } = useTranslation()
  const { g, loc, lang } = useGlossary()
  const { farmId } = useDashboard()
  const diag = useDiagnosis(api.detectPest)
  const watch = useApi(() => api.getPestWatch(farmId), [farmId])

  return (
    <>
      <PageHeader title={t('dash.pest.title')} subtitle={t('dash.pest.subtitle')} />

      <div className="grid gap-4 lg:grid-cols-2">
        {diag.preview ? (
          <PhotoPreview src={diag.preview} phase={diag.phase} onReset={diag.reset} />
        ) : (
          <Card className="p-3">
            <PhotoUpload title={t('dash.pest.uploadTitle')} onSelect={diag.start} />
          </Card>
        )}

        <div aria-live="polite">
          {diag.phase === 'idle' && (
            <Card className="h-full">
              <EmptyState icon={Bug} title={t('dash.pest.resultTitle')} body={t('dash.pest.emptyResult')} className="h-full py-16" />
            </Card>
          )}
          {diag.phase === 'analyzing' && <AnalyzingCard />}
          {diag.phase === 'error' && <AnalysisError message={diag.error?.message} onRetry={diag.retry} />}
          {diag.phase === 'done' && diag.result && (
            <Card>
              <CardHeader>
                <div>
                  <p className="text-caption font-semibold uppercase tracking-wider text-ink/60">{t('dash.pest.resultTitle')}</p>
                  <CardTitle className="mt-1 text-xl">{loc(diag.result.pest)}</CardTitle>
                  <p className="mt-1 text-xs text-ink/60">{g(diag.result.crop)}</p>
                </div>
                <StatusBadge status={diag.result.severity} />
              </CardHeader>
              <CardContent className="space-y-5">
                <ConfidenceBar value={diag.result.confidence} />
                <div>
                  <h3 className="text-sm font-semibold">{t('dash.pest.dose')}</h3>
                  <dl className="mt-3 grid grid-cols-3 gap-2">
                    {(
                      [
                        ['product', diag.result.dose.product],
                        ['quantity', loc(diag.result.dose.perAcre)],
                        ['water', loc(diag.result.dose.water)],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k} className={cn('rounded-xl bg-surface p-3', k === 'product' && 'col-span-3 sm:col-span-1')}>
                        <dt className="text-caption text-ink/60">{t(`dash.pest.${k}`)}</dt>
                        <dd className={cn('mt-0.5 font-semibold', k === 'quantity' ? 'text-lg text-brand' : 'text-sm')}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <p className="mt-3 flex items-start gap-2 text-xs text-ink/60">
                    <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                    {loc(diag.result.threshold)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <ListenButton
                    variant="solid"
                    lang={lang}
                    label={t('dash.common.listenIn', { lang: t(`dash.common.langName.${lang}`) })}
                    build={() => diag.result!.voice[lang]}
                  />
                  {lang !== 'gu' && <ListenButton lang="gu" label={t('dash.doctor.listenGu')} build={() => diag.result!.voice.gu} />}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="mt-4">
        <AsyncView
          query={watch}
          skeleton={
            <div className="grid gap-4 lg:grid-cols-3">
              <Skeleton className="h-80 rounded-2xl lg:col-span-2" />
              <Skeleton className="h-80 rounded-2xl" />
            </div>
          }
        >
          {(data) => <PestWatchContent data={data} />}
        </AsyncView>
      </div>
    </>
  )
}

function PestWatchContent({ data }: { data: PestWatchData }) {
  const { t } = useTranslation()
  const { g } = useGlossary()
  const fmt = useFormatters()

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <div>
            <CardTitle>{t('dash.pest.trendTitle')}</CardTitle>
            <CardDescription>{t('dash.pest.trendDesc', { pest: g(data.pest) })}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {data.trend.length ? (
            <TimeSeriesChart
              data={data.trend}
              xKey="date"
              xFormatter={fmt.date}
              series={[
                { key: 'village', name: t('dash.pest.village'), color: COLORS.crit, area: true },
                { key: 'yourFarm', name: t('dash.pest.yourFarm'), color: COLORS.brand },
              ]}
              yDomain={[0, 'auto']}
              height={250}
            />
          ) : (
            <EmptyState icon={Bug} body={t('dash.pest.trendEmpty')} />
          )}
          <div className="mt-2 flex gap-4 text-caption text-ink/60">
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-crit" />
              {t('dash.pest.village')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded bg-brand" />
              {t('dash.pest.yourFarm')}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div>
              <CardTitle>{t('dash.pest.mapTitle')}</CardTitle>
              <CardDescription>{t('dash.pest.mapDesc', { pest: g(data.pest) })}</CardDescription>
            </div>
            <MapPin className="size-4 text-ink/30" />
          </CardHeader>
          <CardContent>
            <div role="img" aria-label={t('dash.pest.mapDesc', { pest: g(data.pest) })} className="grid grid-cols-8 gap-1 rounded-xl bg-[#EEF2EA] p-2">
              {data.farms.map((f) => (
                <span
                  key={f.id}
                  title={t(`dash.pest.level.${f.level}`)}
                  className={cn('relative aspect-square rounded-chip', LEVEL_CLASS[f.level], f.you && 'ring-2 ring-brand ring-offset-1')}
                >
                  {f.you && <span className="absolute inset-0 grid place-items-center text-3xs font-bold text-brand">●</span>}
                </span>
              ))}
            </div>
            <ul className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-ink/60">
              {([0, 1, 2, 3] as const).map((l) => (
                <li key={l} className="flex items-center gap-1.5">
                  <span className={cn('size-2.5 rounded-sm', LEVEL_CLASS[l])} />
                  {t(`dash.pest.level.${l}`)}
                </li>
              ))}
              <li className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm ring-2 ring-brand" />
                {t('dash.pest.you')}
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dash.pest.recentTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentScans.length ? (
              <ul className="space-y-2.5">
                {data.recentScans.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 text-sm">
                    <StatusDot status={s.severity} className="size-2" />
                    <span className="font-medium">{g(s.pest)}</span>
                    <span className="ml-auto text-xs text-ink/60">{fmt.ago(s.time)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState icon={Bug} body={t('dash.pest.recentEmpty')} className="py-4" />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
