import { AlertTriangle, ChevronRight, ClipboardList, Loader2, Save } from 'lucide-react'
import { type FormEvent, type InputHTMLAttributes, type ReactNode, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { TimeSeriesChart } from '@/components/dashboard/charts'
import { Gauge } from '@/components/dashboard/Gauge'
import { METRIC_ICON } from '@/components/dashboard/metric-icons'
import { AsyncView, EmptyState, PageHeader, StatusBadge } from '@/components/dashboard/states'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { MetricId, NpkEntry, SoilData, Status } from '@/data/types'
import { useApi } from '@/hooks/useApi'
import { useDashboard } from '@/hooks/useDashboard'
import { useFormatters } from '@/hooks/useFormatters'
import { api } from '@/lib/api'
import { COLORS } from '@/lib/status'
import { cn } from '@/lib/utils'

type HistoryMetric = 'moisture' | 'temperature' | 'humidity'
const HISTORY_COLORS: Record<HistoryMetric, string> = { moisture: COLORS.brand, temperature: COLORS.sun, humidity: COLORS.sky }
const UNITS: Record<Exclude<MetricId, 'battery'>, string> = { moisture: '%', temperature: '°C', humidity: '%', ph: '', ec: 'dS/m' }

/* Soil Health Card ratings (kg/ha) */
const NPK_RANGES = {
  n: { min: 0, max: 1000, low: 280, high: 560 },
  p: { min: 0, max: 200, low: 11, high: 25 },
  k: { min: 0, max: 2000, low: 110, high: 280 },
} as const
type Nutrient = keyof typeof NPK_RANGES

const rating = (key: Nutrient, v: number): { key: 'low' | 'medium' | 'high'; status: Status } => {
  const r = NPK_RANGES[key]
  if (v < r.low) return { key: 'low', status: 'warn' }
  if (v > r.high) return { key: 'high', status: 'ok' }
  return { key: 'medium', status: 'ok' }
}

function SoilSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <Card key={i} className="space-y-3 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
          </Card>
        ))}
      </div>
      <Card className="space-y-4 p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-60 w-full" />
      </Card>
    </div>
  )
}

export default function SoilPage() {
  const { t } = useTranslation()
  const { farmId } = useDashboard()
  const query = useApi(() => api.getSoil(farmId), [farmId])

  return (
    <>
      <PageHeader title={t('dash.soil.title')} subtitle={t('dash.soil.subtitle')} />
      <AsyncView query={query} skeleton={<SoilSkeleton />}>
        {(data) => <SoilContent data={data} onNpkSaved={(npk) => query.mutate((d) => ({ ...d, npk }))} />}
      </AsyncView>
    </>
  )
}

function SoilContent({ data, onNpkSaved }: { data: SoilData; onNpkSaved: (npk: NpkEntry) => void }) {
  const { t } = useTranslation()
  const fmt = useFormatters()
  const [step, setStep] = useState<'15' | '30'>('15')
  const [metric, setMetric] = useState<HistoryMetric>('moisture')
  const dry = data.live.moisture < data.dryThreshold
  const history = step === '15' ? data.history15 : data.history30

  return (
    <div className="space-y-4">
      {dry && (
        <div role="alert" className="flex flex-col gap-3 rounded-2xl border border-crit/20 bg-crit-soft p-4 sm:flex-row sm:items-center">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-crit text-white">
            <AlertTriangle className="size-5" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-crit">{t('dash.soil.dryTitle')}</p>
            <p className="text-body-sm text-ink/70">{t('dash.soil.dryBody', { value: data.live.moisture, threshold: data.dryThreshold })}</p>
          </div>
          <Button asChild size="sm" shape="rounded" className="bg-crit hover:bg-crit/90">
            <Link to="/dashboard/irrigation">
              {t('dash.soil.dryAction')}
              <ChevronRight />
            </Link>
          </Button>
        </div>
      )}

      {/* live readings */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{t('dash.soil.liveTitle')}</h2>
          <span className="inline-flex items-center gap-1.5 text-caption text-ink/60">
            <span className="size-1.5 animate-pulse rounded-full bg-ok" />
            {t('dash.soil.updated', { time: fmt.ago(data.live.updatedAt) })}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {(['moisture', 'temperature', 'humidity', 'ph', 'ec'] as const).map((id) => {
            const Icon = METRIC_ICON[id]
            const warn = id === 'moisture' && dry
            return (
              <Card key={id} className={cn('p-4', warn && 'border-crit/30')}>
                <p className="flex items-center gap-2 text-xs font-medium text-ink/60">
                  <Icon className="size-4 text-ink/60" />
                  {t(`dash.metrics.${id}`)}
                </p>
                <p className={cn('mt-3 text-2xl font-semibold tabular-nums tracking-tight', warn && 'text-crit')}>
                  {data.live[id]}
                  <span className="ml-1 text-sm font-medium text-ink/60">{UNITS[id]}</span>
                </p>
              </Card>
            )
          })}
        </div>
      </div>

      {/* history */}
      <Card>
        <CardHeader className="flex-col gap-3 md:flex-row md:items-center">
          <CardTitle>{t('dash.soil.historyTitle')}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <SegmentedControl
              label={t('dash.soil.historyTitle')}
              value={metric}
              onValueChange={setMetric}
              options={(Object.keys(HISTORY_COLORS) as HistoryMetric[]).map((m) => ({ value: m, label: t(`dash.metrics.${m}`) }))}
            />
            <SegmentedControl
              label={`${t('dash.soil.historyTitle')} – ${t('dash.soil.every15')} / ${t('dash.soil.every30')}`}
              value={step}
              onValueChange={setStep}
              options={[
                { value: '15', label: t('dash.soil.every15') },
                { value: '30', label: t('dash.soil.every30') },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          {history.length ? (
            <TimeSeriesChart
              data={history}
              xKey="t"
              xFormatter={fmt.time}
              series={[{ key: metric, name: t(`dash.metrics.${metric}`), color: HISTORY_COLORS[metric], unit: UNITS[metric], area: true }]}
              references={metric === 'moisture' ? [{ y: data.dryThreshold, label: t('dash.soil.dryTitle') }] : []}
              height={260}
            />
          ) : (
            <EmptyState body={t('dash.soil.historyEmpty')} />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1.4fr]">
        <Card>
          <CardHeader>
            <CardTitle>{t('dash.soil.phTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Gauge
              ariaLabel={t('dash.soil.phTitle')}
              value={data.live.ph}
              min={4}
              max={10}
              decimals={1}
              caption={t('dash.soil.method')}
              zones={[
                { to: 5.5, color: COLORS.crit, label: t('dash.soil.acidic') },
                { to: 6.5, color: COLORS.warn, label: `${t('dash.soil.slight')} ${t('dash.soil.acidic').toLowerCase()}` },
                { to: 7.5, color: COLORS.ok, label: t('dash.soil.neutral') },
                { to: 8.5, color: COLORS.warn, label: `${t('dash.soil.slight')} ${t('dash.soil.alkaline').toLowerCase()}` },
                { to: 10, color: COLORS.crit, label: t('dash.soil.alkaline') },
              ]}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t('dash.soil.ecTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Gauge
              ariaLabel={t('dash.soil.ecTitle')}
              value={data.live.ec}
              min={0}
              max={2}
              decimals={2}
              unit=" dS/m"
              caption={t('dash.soil.method')}
              zones={[
                { to: 0.8, color: COLORS.ok, label: t('dash.soil.normal') },
                { to: 1, color: COLORS.warn, label: t('dash.soil.slight') },
                { to: 2, color: COLORS.crit, label: t('dash.soil.high') },
              ]}
            />
          </CardContent>
        </Card>
        <NpkForm initial={data.npk} onSaved={onNpkSaved} />
      </div>
    </div>
  )
}

/* ---------------- NPK manual entry ---------------- */

type NpkForm = Record<keyof NpkEntry, string>
type NpkErrors = Partial<Record<keyof NpkEntry, string>>

const CARD_RE = /^[A-Z]{2}\/[A-Z]{2,4}\/\d{4}\/\d{3,8}$/i

function NpkForm({ initial, onSaved }: { initial: NpkEntry | null; onSaved: (npk: NpkEntry) => void }) {
  const { t } = useTranslation()
  const { farmId } = useDashboard()
  const [form, setForm] = useState<NpkForm>({
    n: initial ? String(initial.n) : '',
    p: initial ? String(initial.p) : '',
    k: initial ? String(initial.k) : '',
    cardNumber: initial?.cardNumber ?? '',
    sampleDate: initial?.sampleDate ?? '',
  })
  const [errors, setErrors] = useState<NpkErrors>({})
  const [saving, setSaving] = useState(false)

  const validateField = (key: keyof NpkEntry, value: string): string | undefined => {
    if (!value.trim()) return t('dash.soil.errors.required')
    if (key === 'n' || key === 'p' || key === 'k') {
      const n = Number(value)
      if (!Number.isFinite(n)) return t('dash.soil.errors.number')
      const r = NPK_RANGES[key]
      if (n < r.min || n > r.max) return t('dash.soil.errors.range', { min: r.min, max: r.max })
    }
    if (key === 'cardNumber' && !CARD_RE.test(value.trim())) return t('dash.soil.errors.card')
    if (key === 'sampleDate' && new Date(value) > new Date()) return t('dash.soil.errors.future')
    return undefined
  }

  const set = (key: keyof NpkEntry, value: string) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: validateField(key, value) }))
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const next: NpkErrors = {}
    ;(Object.keys(form) as (keyof NpkEntry)[]).forEach((k) => {
      const err = validateField(k, form[k])
      if (err) next[k] = err
    })
    setErrors(next)
    if (Object.keys(next).length) return
    setSaving(true)
    try {
      const saved = await api.saveNpk(farmId, {
        n: Number(form.n),
        p: Number(form.p),
        k: Number(form.k),
        cardNumber: form.cardNumber.trim().toUpperCase(),
        sampleDate: form.sampleDate,
      })
      onSaved(saved)
      toast.success(t('dash.soil.npkSaved'))
    } catch (err) {
      toast.error(t('dash.common.errorTitle'), { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  const field = (key: keyof NpkEntry, label: string, props: InputHTMLAttributes<HTMLInputElement>, suffix?: ReactNode) => (
    <div className="space-y-1.5">
      <Label htmlFor={`npk-${key}`}>{label}</Label>
      <div className="relative">
        <Input
          id={`npk-${key}`}
          value={form[key]}
          onChange={(e) => set(key, e.target.value)}
          onBlur={(e) => setErrors((er) => ({ ...er, [key]: validateField(key, e.target.value) }))}
          aria-invalid={!!errors[key]}
          aria-describedby={errors[key] ? `npk-${key}-err` : undefined}
          {...props}
        />
        {suffix}
      </div>
      {errors[key] && (
        <p id={`npk-${key}-err`} className="text-caption font-medium text-crit">
          {errors[key]}
        </p>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{t('dash.soil.npkTitle')}</CardTitle>
          <CardDescription>{t('dash.soil.npkDesc')}</CardDescription>
        </div>
        <ClipboardList className="size-5 shrink-0 text-ink/30" />
      </CardHeader>
      <CardContent>
        {!initial && (
          <p className="mb-4 rounded-xl bg-warn-soft px-3 py-2 text-xs font-medium text-warn">{t('dash.soil.npkEmpty')}</p>
        )}
        <form onSubmit={onSubmit} noValidate className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {(['n', 'p', 'k'] as const).map((k) => {
              const v = Number(form[k])
              const r = form[k] && !errors[k] && Number.isFinite(v) ? rating(k, v) : null
              return (
                <div key={k}>
                  {field(k, t(`dash.soil.${k}`), { inputMode: 'decimal', placeholder: t('dash.soil.unit'), className: 'pr-2' })}
                  {r && <StatusBadge status={r.status} label={t(`dash.soil.rating.${r.key}`)} className="mt-1.5" />}
                </div>
              )
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {field('cardNumber', t('dash.soil.cardNumber'), { placeholder: 'GJ/RJT/2025/004512', autoCapitalize: 'characters' })}
            {field('sampleDate', t('dash.soil.sampleDate'), { type: 'date', max: new Date().toISOString().slice(0, 10) })}
          </div>
          <div className="flex items-center justify-between gap-3 pt-1">
            <Badge variant="outline">{t('dash.soil.unit')}</Badge>
            <Button type="submit" shape="rounded" className="bg-brand hover:bg-brand-dark" disabled={saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Save />}
              {saving ? t('dash.common.saving') : t('dash.soil.saveNpk')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
