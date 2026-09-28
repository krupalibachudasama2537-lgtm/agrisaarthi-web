import { Camera, Image as ImageIcon, Loader2, type LucideIcon, MapPin, MessageSquare, Moon, PawPrint, Phone, Siren, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { AsyncView, EmptyState, PageHeader, StatusBadge } from '@/components/dashboard/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { DeterrentAction, WildlifeEvent } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useDashboard } from '@/hooks/useDashboard'
import { useFormatters } from '@/hooks/useFormatters'
import { useGlossary } from '@/hooks/useGlossary'
import { api } from '@/lib/api'
import { simulator } from '@/lib/simulator'
import { cn } from '@/lib/utils'

const ACTION_ICON: Record<DeterrentAction, LucideIcon> = {
  siren: Siren,
  strobe: Zap,
  call: Phone,
  sms: MessageSquare,
  photo: ImageIcon,
}

const ACTION_CLASS: Record<DeterrentAction, string> = {
  siren: 'bg-crit-soft text-crit',
  strobe: 'bg-lime-soft text-olive-deep',
  call: 'bg-brand-soft text-brand',
  sms: 'bg-brand-soft text-brand',
  photo: 'bg-surface-muted text-ink/65',
}

function WildlifeSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  )
}

export default function WildlifePage() {
  const { t } = useTranslation()
  const { farmId } = useDashboard()
  const query = useApi(() => api.getWildlife(farmId), [farmId])
  const { mutate } = query
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    return simulator.subscribe(() => {
      mutate(() => [...simulator.getWildlife(farmId)])
    })
  }, [farmId, mutate])

  const testSiren = async () => {
    setTesting(true)
    try {
      await api.testSiren(farmId)
      toast.success(t('dash.wild.tested'))
    } catch (e) {
      toast.error(t('dash.common.errorTitle'), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setTesting(false)
    }
  }

  return (
    <>
      <PageHeader
        title={t('dash.wild.title')}
        subtitle={t('dash.wild.subtitle')}
        actions={
          <>
            <Badge variant="brand" className="h-8 px-3">
              <Moon />
              {t('dash.wild.armed')}
            </Badge>
            <Button size="sm" shape="rounded" onClick={testSiren} disabled={testing} className="h-8 bg-crit hover:bg-crit/90">
              {testing ? <Loader2 className="animate-spin" /> : <Siren />}
              {testing ? t('dash.wild.testing') : t('dash.wild.testSiren')}
            </Button>
          </>
        }
      />
      <AsyncView query={query} skeleton={<WildlifeSkeleton />}>
        {(events) => <WildlifeContent events={events} />}
      </AsyncView>
    </>
  )
}

function WildlifeContent({ events }: { events: WildlifeEvent[] }) {
  const { t } = useTranslation()
  const { g } = useGlossary()
  const fmt = useFormatters()
  const [now] = useState(() => Date.now())
  const week = events.filter((e) => now - new Date(e.time).getTime() < 7 * 86_400_000)
  const stats = [
    { key: 'statsDetections', value: week.length },
    { key: 'statsDeterred', value: week.filter((e) => e.actions.includes('siren')).length },
    { key: 'statsCalls', value: week.filter((e) => e.actions.includes('call')).length },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h2 className="mb-2 text-sm font-semibold">{t('dash.wild.statsTitle')}</h2>
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <Card key={s.key} className="p-4">
              <p className="text-2xl font-semibold tabular-nums">{s.value}</p>
              <p className="mt-1 text-xs text-ink/60">{t(`dash.wild.${s.key}`)}</p>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('dash.wild.timeline')}</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length ? (
            <ol className="relative space-y-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-surface-line sm:before:left-[9px]">
              {events.map((e) => (
                <li key={e.id} className="relative pl-7 sm:pl-9">
                  <span
                    aria-hidden
                    className={cn(
                      'absolute left-0 top-4 size-[15px] rounded-full border-[3px] border-white shadow sm:size-[19px]',
                      e.severity === 'crit' ? 'bg-crit' : e.severity === 'warn' ? 'bg-warn' : 'bg-ok',
                    )}
                  />
                  <article className="flex flex-col gap-4 rounded-2xl border border-surface-line p-3 sm:flex-row sm:p-4">
                    {/* IR night photo */}
                    <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl bg-[#07140a] sm:w-44">
                      <img
                        src={e.image}
                        alt={`${t(`dash.wild.animal.${e.animal}`)} – IR ${fmt.time(e.time)}`}
                        loading="lazy"
                        className="size-full object-cover opacity-80 contrast-125 grayscale"
                      />
                      <div aria-hidden className="absolute inset-0 bg-[#35ff6b]/20 mix-blend-color" />
                      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(transparent_40%,rgba(0,0,0,0.65))]" />
                      <div aria-hidden className="absolute left-[24%] top-[18%] h-[62%] w-[52%] border border-lime">
                        <span className="absolute -top-4 left-0 whitespace-nowrap bg-lime px-1 font-mono text-3xs font-bold text-ink">
                          {Math.round(e.confidence * 100)}%
                        </span>
                      </div>
                      <span className="absolute bottom-1.5 left-2 font-mono text-2xs text-lime/90">IR · {fmt.time(e.time)}</span>
                      <Camera className="absolute right-2 top-2 size-3.5 text-lime/80" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="flex items-center gap-2 text-base font-semibold">
                            <PawPrint className="size-4 text-ink/60" />
                            {t(`dash.wild.animal.${e.animal}`)}
                            <span className="text-sm font-medium text-ink/60">{t('dash.wild.count', { count: e.count })}</span>
                          </p>
                          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/60">
                            <span>
                              {fmt.dateTime(e.time)} · {fmt.ago(e.time)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="size-3" />
                              {g(e.zone)}
                            </span>
                            <span>{t('dash.wild.confidence', { value: Math.round(e.confidence * 100) })}</span>
                          </p>
                        </div>
                        <StatusBadge status={e.severity} />
                      </div>
                      <p className="mt-4 text-caption font-semibold uppercase tracking-wider text-ink/60">{t('dash.wild.actionsTaken')}</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {e.actions.map((a) => {
                          const Icon = ACTION_ICON[a]
                          return (
                            <li key={a} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold', ACTION_CLASS[a])}>
                              <Icon className="size-3" />
                              {t(`dash.wild.action.${a}`)}
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  </article>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState icon={PawPrint} body={t('dash.wild.empty')} className="py-14" />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
