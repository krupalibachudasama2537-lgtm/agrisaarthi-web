import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts'
import { COLORS } from '@/lib/status'

export interface ChartSeries {
  key: string
  name: string
  color: string
  unit?: string
  /** draw as filled area instead of a line */
  area?: boolean
  dashed?: boolean
}

interface TimeSeriesChartProps {
  data: object[]
  xKey: string
  series: ChartSeries[]
  height?: number
  xFormatter?: (value: string) => string
  yDomain?: [number | 'auto' | 'dataMin' | 'dataMax', number | 'auto' | 'dataMin' | 'dataMax']
  references?: { y: number; label: string; color?: string }[]
  /** show every nth x tick */
  tickInterval?: number | 'preserveStartEnd'
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  xFormatter,
}: TooltipContentProps<number, string> & { series: ChartSeries[]; xFormatter?: (v: string) => string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[140px] rounded-xl border border-surface-line bg-white px-3 py-2 text-xs shadow-lg">
      <p className="mb-1 font-semibold text-ink/60">{xFormatter ? xFormatter(String(label)) : String(label)}</p>
      {payload.map((p) => {
        const s = series.find((x) => x.key === p.dataKey)
        return (
          <p key={String(p.dataKey)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-ink/60">
              <span className="size-2 rounded-full" style={{ background: s?.color }} />
              {s?.name}
            </span>
            <span className="font-semibold tabular-nums">
              {p.value}
              {s?.unit}
            </span>
          </p>
        )
      })}
    </div>
  )
}

/** Responsive line/area chart used across the dashboard */
export function TimeSeriesChart({
  data,
  xKey,
  series,
  height = 240,
  xFormatter,
  yDomain = ['auto', 'auto'],
  references = [],
  tickInterval = 'preserveStartEnd',
}: TimeSeriesChartProps) {
  // text alternative: "Soil moisture: 22.3–31.2%" for each series
  const summary = series
    .map((s) => {
      const vals = data.map((d) => (d as Record<string, unknown>)[s.key]).filter((v): v is number => typeof v === 'number')
      return vals.length ? `${s.name}: ${Math.min(...vals)}–${Math.max(...vals)}${s.unit ?? ''}` : s.name
    })
    .join('; ')
  return (
    <div style={{ height }} className="w-full" role="img" aria-label={summary}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 600, height }}>
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
          <defs>
            {series
              .filter((s) => s.area)
              .map((s) => (
                <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
          </defs>
          <CartesianGrid vertical={false} stroke={COLORS.grid} />
          <XAxis
            dataKey={xKey}
            tickFormatter={xFormatter}
            tick={{ fontSize: 11, fill: COLORS.muted }}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
            minTickGap={24}
          />
          <YAxis domain={yDomain} tick={{ fontSize: 11, fill: COLORS.muted }} tickLine={false} axisLine={false} width={44} />
          <Tooltip
            cursor={{ stroke: COLORS.muted, strokeDasharray: '3 3' }}
            content={(props) => <ChartTooltip {...(props as TooltipContentProps<number, string>)} series={series} xFormatter={xFormatter} />}
          />
          {references.map((r) => (
            <ReferenceLine
              key={r.label}
              y={r.y}
              stroke={r.color ?? COLORS.crit}
              strokeDasharray="4 4"
              label={{ value: r.label, position: 'insideTopRight', fontSize: 10, fill: r.color ?? COLORS.crit }}
            />
          ))}
          {series.map((s) =>
            s.area ? (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                fill={`url(#fill-${s.key})`}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ) : (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.name}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dashed ? '4 4' : undefined}
                dot={false}
                activeDot={{ r: 4 }}
              />
            ),
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Tiny inline sparkline (no axes) */
export function Sparkline({ values, color = COLORS.brand, className }: { values: number[]; color?: string; className?: string }) {
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${28 - ((v - min) / span) * 24}`).join(' ')
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  )
}
