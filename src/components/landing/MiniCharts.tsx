import { useReducedMotion } from 'framer-motion'

/**
 * Tiny dependency-free SVG charts for the hero glass cards.
 * (Recharts is ~115 KB gzipped – far too heavy for two decorative sparklines on the landing page.)
 */

const W = 196
const H = 64

/** Bar chart; the highest bar is solid, the rest tinted. Bars grow in on mount. */
export function MiniBars({ values, label }: { values: number[]; label: string }) {
  const reduce = useReducedMotion()
  const max = Math.max(...values)
  const gap = 8
  const bw = (W - gap * (values.length - 1)) / values.length
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full" role="img" aria-label={label}>
      {values.map((v, i) => {
        const h = (v / 100) * H
        return (
          <rect
            key={i}
            x={i * (bw + gap)}
            y={H - h}
            width={bw}
            height={h}
            rx={4}
            fill={v === max ? '#1F4D1F' : 'rgba(31,77,31,0.28)'}
            style={
              reduce
                ? undefined
                : { transformOrigin: `0 ${H}px`, animation: `bar-rise 1.1s cubic-bezier(0.22,1,0.36,1) ${i * 70}ms both` }
            }
          />
        )
      })}
    </svg>
  )
}

/** Solid area line vs a dashed baseline */
export function MiniArea({ values, baseline, label }: { values: number[]; baseline: number[]; label: string }) {
  const all = [...values, ...baseline]
  const min = Math.min(...all) - 4
  const max = Math.max(...all) + 4
  const x = (i: number) => (i / (values.length - 1)) * W
  const y = (v: number) => H - ((v - min) / (max - min)) * H
  const line = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')
  const path = line(values)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-16 w-full" role="img" aria-label={label}>
      <defs>
        <linearGradient id="miniAreaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5E7A2E" stopOpacity={0.45} />
          <stop offset="100%" stopColor="#5E7A2E" stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={line(baseline)} fill="none" stroke="rgba(11,13,10,0.45)" strokeWidth={1.25} strokeDasharray="3 3" />
      <path d={`${path} L${W} ${H} L0 ${H} Z`} fill="url(#miniAreaFill)" />
      <path d={path} fill="none" stroke="#1F4D1F" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  )
}
