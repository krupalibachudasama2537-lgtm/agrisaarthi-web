import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/card'
import type { Kpi } from '@/data/types'
import { statusColor } from '@/lib/status'
import { cn } from '@/lib/utils'
import { Sparkline } from './charts'
import { METRIC_ICON } from './metric-icons'
import { StatusBadge } from './states'


/** Small metric card: label, value + unit, status and change vs 24 h ago */
export function KpiCard({ kpi, trend }: { kpi: Kpi; trend?: number[] }) {
  const { t } = useTranslation()
  const Icon = METRIC_ICON[kpi.id]
  const up = kpi.delta > 0
  const flat = kpi.delta === 0
  const decimals = kpi.id === 'ph' || kpi.id === 'ec' ? 2 : kpi.id === 'humidity' || kpi.id === 'battery' ? 0 : 1

  return (
    <Card className="flex flex-col p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 text-xs font-medium text-ink/60">
          <Icon className="size-4 shrink-0 text-ink/60" />
          <span className="truncate">{t(`dash.metrics.${kpi.id}`)}</span>
        </span>
        {kpi.status !== 'ok' && <StatusBadge status={kpi.status} className="shrink-0" />}
      </div>
      <p className="mt-3 text-2xl font-semibold leading-none tracking-tight tabular-nums">
        {kpi.value.toFixed(decimals)}
        {kpi.unit && <span className="ml-1 text-sm font-medium text-ink/60">{kpi.unit}</span>}
      </p>
      <div className="mt-3 flex items-end justify-between gap-2">
        <span
          className={cn(
            'inline-flex items-center gap-0.5 text-caption font-semibold tabular-nums',
            flat ? 'text-ink/60' : kpi.status === 'ok' ? 'text-ink/60' : kpi.status === 'warn' ? 'text-warn' : 'text-crit',
          )}
          title={t('dash.overview.vs24h')}
        >
          {!flat && (up ? <ArrowUpRight aria-hidden className="size-3.5" /> : <ArrowDownRight aria-hidden className="size-3.5" />)}
          {up ? '+' : ''}
          {kpi.delta}
          {kpi.unit === '%' ? ` ${t('dash.metrics.pts')}` : kpi.unit ? ` ${kpi.unit}` : ''}
        </span>
        {trend && <Sparkline values={trend} color={statusColor[kpi.status]} className="h-7 w-16" />}
      </div>
    </Card>
  )
}
