interface Zone {
  to: number
  color: string
  label?: string
}

interface GaugeProps {
  value: number
  min: number
  max: number
  /** consecutive zones ending at `to` (first starts at min) */
  zones: Zone[]
  unit?: string
  decimals?: number
  caption?: string
  ariaLabel: string
}

const CX = 100
const CY = 100
const R = 78

const angle = (v: number, min: number, max: number) => Math.PI * (1 - (Math.min(max, Math.max(min, v)) - min) / (max - min))
const point = (a: number, r = R) => [CX + r * Math.cos(a), CY - r * Math.sin(a)] as const

function arc(from: number, to: number, min: number, max: number) {
  const [x1, y1] = point(angle(from, min, max))
  const [x2, y2] = point(angle(to, min, max))
  return `M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`
}

/** Semi-circular gauge with coloured zones and a needle (pH, EC, grain moisture) */
export function Gauge({ value, min, max, zones, unit = '', decimals = 1, caption, ariaLabel }: GaugeProps) {
  const a = angle(value, min, max)
  const [nx, ny] = point(a, R - 16)
  const current = zones.find((z) => value <= z.to) ?? zones[zones.length - 1]

  return (
    <figure className="flex flex-col items-center" role="img" aria-label={`${ariaLabel}: ${value.toFixed(decimals)}${unit}`}>
      <svg viewBox="0 0 200 116" className="w-full max-w-[240px]">
        {zones.map((z, i) => {
          const d = arc(i === 0 ? min : zones[i - 1].to, z.to, min, max)
          return <path key={z.to} d={d} fill="none" stroke={z.color} strokeWidth="12" strokeLinecap="butt" opacity={z === current ? 1 : 0.28} />
        })}
        <line x1={CX} y1={CY} x2={nx} y2={ny} stroke="#0B0D0A" strokeWidth="3" strokeLinecap="round" />
        <circle cx={CX} cy={CY} r="6" fill="#0B0D0A" />
        <text x={CX - R} y={CY + 16} textAnchor="middle" fontSize="10" fill="#9AA39A">
          {min}
        </text>
        <text x={CX + R} y={CY + 16} textAnchor="middle" fontSize="10" fill="#9AA39A">
          {max}
        </text>
      </svg>
      <figcaption className="-mt-1 text-center">
        <span className="text-2xl font-semibold tabular-nums tracking-tight">
          {value.toFixed(decimals)}
          <span className="ml-0.5 text-sm font-medium text-ink/60">{unit}</span>
        </span>
        {current.label && (
          <span className="mt-0.5 block text-xs font-semibold" style={{ color: current.color }}>
            {current.label}
          </span>
        )}
        {caption && <span className="mt-1 block text-caption text-ink/60">{caption}</span>}
      </figcaption>
    </figure>
  )
}
