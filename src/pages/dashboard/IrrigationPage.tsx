import { CalendarClock, CloudRain, CloudSun, Droplets, Layers, Loader2, type LucideIcon, ShieldCheck, Sprout, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { PumpSwitch } from '@/components/dashboard/PumpSwitch'
import { AsyncView, EmptyState, PageHeader, PageSkeleton, StatusDot } from '@/components/dashboard/states'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { IrrigationData, IrrigationReason, PumpRun } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useDashboard } from '@/hooks/useDashboard'
import { useFormatters } from '@/hooks/useFormatters'
import { useGlossary } from '@/hooks/useGlossary'
import { api } from '@/lib/api'
import { simulator } from '@/lib/simulator'

const REASON_ICON: Record<IrrigationReason['id'], LucideIcon> = {
  moisture: Droplets,
  weather: CloudSun,
  soil: Layers,
  stage: Sprout,
}

const RESULT_VARIANT: Record<PumpRun['result'], 'ok' | 'warn' | 'crit'> = {
  completed: 'ok',
  stoppedEarly: 'warn',
  dryRunTrip: 'crit',
}

export default function IrrigationPage() {
  const { t } = useTranslation()
  const { farmId } = useDashboard()
  const query = useApi(() => api.getIrrigation(farmId), [farmId])
  const { mutate } = query

  useEffect(() => {
    return simulator.subscribe(() => {
      mutate((prev) => {
        if (!prev) return prev
        const fresh = simulator.getIrrigation(farmId)
        return {
          ...prev,
          pump: fresh.pump,
          plan: {
            ...prev.plan,
            reasons: fresh.plan.reasons,
          },
          history: [...fresh.history],
        }
      })
    })
  }, [farmId, mutate])

  return (
    <>
      <PageHeader title={t('dash.irr.title')} subtitle={t('dash.irr.subtitle')} />
      <AsyncView query={query} skeleton={<PageSkeleton kpis={4} />}>
        {(data) => <IrrigationContent data={data} onPump={(pump) => query.mutate((d) => ({ ...d, pump }))} />}
      </AsyncView>
    </>
  )
}

function IrrigationContent({ data, onPump }: { data: IrrigationData; onPump: (p: IrrigationData['pump']) => void }) {
  const { t } = useTranslation()
  const { g } = useGlossary()
  const { farmId } = useDashboard()
  const fmt = useFormatters()
  const [autoBusy, setAutoBusy] = useState(false)

  const toggleAuto = async (autoMode: boolean) => {
    setAutoBusy(true)
    try {
      const next = await api.setAutoMode(farmId, autoMode)
      onPump(next)
      toast.success(autoMode ? t('dash.irr.autoOn') : t('dash.irr.autoOff'))
    } catch (e) {
      toast.error(t('dash.common.errorTitle'), { description: e instanceof Error ? e.message : undefined })
    } finally {
      setAutoBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        {/* recommendation */}
        <Card className="overflow-hidden lg:col-span-3">
          <div className="bg-brand p-5 text-white sm:p-6">
            <p className="flex items-center gap-2 text-caption font-semibold uppercase tracking-wider text-white/70">
              <CalendarClock className="size-4" />
              {t('dash.irr.recTitle')}
            </p>
            <p className="mt-3 text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              {data.plan.rainExpected
                ? t('dash.irr.recTextRain', { chance: data.plan.rainChance ?? 80 })
                : t('dash.irr.recText', { min: data.plan.minutes, time: fmt.time(data.plan.startAt) })}
            </p>
            <p className="mt-2 text-sm text-white/75">
              {data.plan.rainExpected
                ? t('dash.irr.rainSaveWater')
                : t('dash.irr.litres', { litres: fmt.number(data.plan.litres) })}
            </p>
          </div>
          <CardContent className="pt-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-ink/60">{t('dash.irr.why')}</h3>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {data.plan.reasons.map((r) => {
                const Icon = r.id === 'weather' && data.plan.rainExpected ? CloudRain : REASON_ICON[r.id]
                const reasonKey = (r.params as { textKey?: string })?.textKey ?? r.id
                return (
                  <li key={r.id} className="flex items-center gap-3 rounded-xl bg-surface p-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white text-ink/60 shadow-sm">
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-caption text-ink/60">{t(`dash.irr.reasons.${r.id}`)}</p>
                      <p className="truncate text-sm font-semibold">
                        {r.id === 'soil' || r.id === 'stage' ? g(String(r.params.term)) : t(`dash.irr.reasonText.${reasonKey}`, r.params)}
                      </p>
                    </div>
                    <StatusDot status={r.status} className="size-2" />
                    <span className="sr-only">{t(`dash.common.status.${r.status}`)}</span>
                  </li>
                )
              })}
            </ul>
          </CardContent>
        </Card>

        {/* pump */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dash.irr.pumpTitle')}</CardTitle>
            <Badge variant={data.powerAvailable ? 'ok' : 'crit'}>
              <Zap />
              {t('dash.irr.power')}: {data.powerAvailable ? t('dash.irr.powerOn') : t('dash.irr.powerOff')}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-2xl border border-surface-line p-4">
              <PumpSwitch pump={data.pump} minutes={data.plan.minutes} onChange={onPump} size="lg" />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <Label htmlFor="auto-mode" className="text-sm text-ink">
                  {t('dash.irr.auto')}
                </Label>
                <p className="mt-0.5 text-xs text-ink/60">{t('dash.irr.autoDesc')}</p>
              </div>
              <div className="flex items-center gap-2">
                {autoBusy && <Loader2 className="size-4 animate-spin text-ink/60" />}
                <Switch id="auto-mode" checked={data.pump.autoMode} onCheckedChange={toggleAuto} disabled={autoBusy} />
              </div>
            </div>
            <p className="flex items-start gap-2 rounded-xl bg-surface p-3 text-xs text-ink/60">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ok" />
              {t('dash.irr.protection')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* history */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dash.irr.historyTitle')}</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-3">
          {data.history.length ? (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{t('dash.irr.startedAt')}</TableHead>
                  <TableHead className="text-right">{t('dash.irr.duration')}</TableHead>
                  <TableHead className="text-right">{t('dash.irr.water')}</TableHead>
                  <TableHead>{t('dash.irr.trigger')}</TableHead>
                  <TableHead>{t('dash.irr.result')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.history.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="whitespace-nowrap font-medium">{fmt.dateTime(run.start)}</TableCell>
                    <TableCell className="text-right tabular-nums">{t('dash.irr.minutes', { min: run.minutes })}</TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{fmt.number(run.litres)} {t('dash.irr.litreUnit')}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{t(`dash.irr.triggers.${run.trigger}`)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={RESULT_VARIANT[run.result]}>
                        {t(`dash.irr.results.${run.result}`)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <EmptyState icon={Droplets} body={t('dash.irr.historyEmpty')} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
