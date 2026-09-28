import type { Kpi, MetricId, SeriesPoint, Status } from '../types.js'

/**
 * Status bands, ported from the frontend's mock generator
 * (agrisaarthi-web/src/data/dashboard.ts, statusFor()) so a real reading
 * produces the same ok/warn/crit thresholds the UI was designed against.
 */
export function statusFor(id: MetricId, v: number): Status {
  switch (id) {
    case 'moisture':
      return v < 20 ? 'crit' : v < 28 ? 'warn' : 'ok'
    case 'temperature':
      return v > 38 ? 'crit' : v > 34 ? 'warn' : 'ok'
    case 'humidity':
      return v < 25 ? 'warn' : 'ok'
    case 'ph':
      return v < 5.5 || v > 8.5 ? 'crit' : v < 6 || v > 7.8 ? 'warn' : 'ok'
    case 'ec':
      return v > 4 ? 'crit' : v > 2 ? 'warn' : 'ok'
    case 'battery':
      return v < 20 ? 'crit' : v < 40 ? 'warn' : 'ok'
  }
}

const UNITS: Record<MetricId, string> = {
  moisture: '%',
  temperature: '°C',
  humidity: '%',
  ph: '',
  ec: 'dS/m',
  battery: '%',
}

/** Builds the KPI row from the latest reading + a 24h-old baseline for delta. */
export function kpisFrom(latest: SeriesPoint, dayAgo: SeriesPoint | undefined, batteryPct: number, batteryDayAgo: number | undefined): Kpi[] {
  const metric = (id: MetricId, value: number, prev: number | undefined): Kpi => ({
    id,
    value,
    unit: UNITS[id],
    status: statusFor(id, value),
    delta: prev === undefined ? 0 : value - prev,
  })
  return [
    metric('moisture', latest.moisture, dayAgo?.moisture),
    metric('temperature', latest.temperature, dayAgo?.temperature),
    metric('humidity', latest.humidity, dayAgo?.humidity),
    metric('ph', latest.ph, dayAgo?.ph),
    metric('ec', latest.ec, dayAgo?.ec),
    metric('battery', batteryPct, batteryDayAgo),
  ]
}

export const DRY_THRESHOLD = 28
export const LOW_BATTERY_THRESHOLD = 20
