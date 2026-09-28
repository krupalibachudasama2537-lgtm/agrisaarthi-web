/**
 * Response shapes for the endpoints this server actually implements.
 * Source of truth is the frontend: agrisaarthi-web/src/data/types.ts.
 * Kept as a plain copy (no shared package) so each side can be deployed
 * independently; if you add a field on one side, mirror it on the other.
 */

export type LanguageCode = 'en' | 'hi' | 'gu'
export type Localized = Record<LanguageCode, string>
export type Status = 'ok' | 'warn' | 'crit'

export interface Farmer {
  id: string
  name: string
  phone: string
  village: string
  district: string
  initials: string
}

export interface Farm {
  id: string
  name: string
  village: string
  acres: number
  stationId: string
  crop: string
  cropStage: string
  soilType: string
}

export interface StationHealth {
  batteryPct: number
  solarCharging: boolean
  lastSyncMinutes: number
  signalBars: 0 | 1 | 2 | 3 | 4
  online: boolean
}

export type MetricId = 'moisture' | 'temperature' | 'humidity' | 'ph' | 'ec' | 'battery'

export interface Kpi {
  id: MetricId
  value: number
  unit: string
  status: Status
  delta: number
}

export interface SeriesPoint {
  t: string
  moisture: number
  temperature: number
  humidity: number
  ph: number
  ec: number
}

export type AlertChannel = 'dashboard' | 'sms' | 'call' | 'voice'

export type AlertType =
  | 'soilDry'
  | 'animal'
  | 'pest'
  | 'disease'
  | 'pumpOn'
  | 'pumpOff'
  | 'powerOn'
  | 'grainReady'
  | 'batteryLow'
  | 'nodeOffline'
  | 'heat'

export interface AlertItem {
  id: string
  type: AlertType
  severity: Status
  time: string
  channels: AlertChannel[]
  params?: Record<string, string | number>
}

export type PumpTrigger = 'auto' | 'manual' | 'missedCall' | 'sms'

export interface PumpState {
  on: boolean
  autoMode: boolean
  since: string | null
  trigger: PumpTrigger | null
}

export interface PumpRun {
  id: string
  start: string
  minutes: number
  litres: number
  trigger: PumpTrigger
  result: 'completed' | 'stoppedEarly' | 'dryRunTrip'
}

export interface NpkEntry {
  n: number
  p: number
  k: number
  cardNumber: string
  sampleDate: string
}

export interface SoilData {
  live: Omit<SeriesPoint, 't'> & { updatedAt: string }
  dryThreshold: number
  history15: SeriesPoint[]
  history30: SeriesPoint[]
  npk: NpkEntry | null
}

/** The subset of OverviewData this server computes; api.ts merges in recommendations/weather locally. */
export interface OverviewCore {
  kpis: Kpi[]
  series24h: SeriesPoint[]
  alerts: AlertItem[]
  pump: PumpState
}

/** The subset of IrrigationData this server computes; api.ts merges in `plan` locally. */
export interface IrrigationCore {
  pump: PumpState
  powerAvailable: boolean
  history: PumpRun[]
}

export interface DiseaseDiagnosis {
  id: string
  crop: string
  disease: Localized
  confidence: number
  severity: Status
  treatment: Record<LanguageCode, string[]>
  voice: Localized
}

export interface PestDiagnosis {
  id: string
  pest: Localized
  crop: string
  confidence: number
  severity: Status
  dose: { product: string; perAcre: Localized; water: Localized }
  threshold: Localized
  voice: Localized
}

export interface MandiRow {
  crop: string
  mandi: string
  distanceKm: number
  price: number
  change: number
}

export interface GrainLot {
  crop: string
  moisture: number
  safeMax: number
  quantityQ: number
  dryingPerDay: number
}

export interface MarketData {
  grains: GrainLot[]
  mandi: MandiRow[]
  best: { crop: string; mandi: string; date: string; price: number; extraPerQ: number }
  trend: { date: string; price: number; msp: number }[]
}

export interface MessageLog {
  id: string
  time: string
  channel: 'sms' | 'call'
  type: AlertType
  to: string
  lang: LanguageCode
  status: 'delivered' | 'failed' | 'pending'
  attempts: number
}

export interface AlertRoute {
  type: AlertType
  sms: boolean
  call: boolean
}

export interface AlertsData {
  log: MessageLog[]
  routing: AlertRoute[]
}

export interface DemoRequest {
  name: string
  phone: string
  village: string
}

/** Raw payload the ESP32 station posts every 15 minutes. */
export interface ReadingPayload {
  moisture: number
  temperature: number
  humidity: number
  ph: number
  ec: number
  batteryPct: number
  solarCharging: boolean
  signalBars: 0 | 1 | 2 | 3 | 4
}

export interface PumpCommand {
  action: 'on' | 'off'
}
