/**
 * Shared data contracts.
 * These mirror what the ESP32 station → backend API is expected to return,
 * so mock data in src/data/*.ts can be swapped for real responses in src/lib/api.ts.
 */

export type LanguageCode = 'en' | 'hi' | 'gu'

export type FeatureId =
  | 'soil'
  | 'chemistry'
  | 'fertilizer'
  | 'crop'
  | 'disease'
  | 'pest'
  | 'irrigation'
  | 'mesh'
  | 'alerts'
  | 'voice'
  | 'animal'
  | 'grain'

/* ---------- Sensor + advisory payloads (one per feature) ---------- */

/** 1 · Live soil readings, sampled every 15–30 min */
export interface SoilReading {
  moisture: number // % volumetric
  temperature: number // °C
  humidity: number // % air RH
  updatedMinutesAgo: number
  dryThreshold: number // % below which the "soil too dry" alert fires
}

/** 2 · pH + EC from probes in a 1:2.5 soil solution; NPK entered manually */
export interface SoilChemistry {
  ph: number
  ec: number // dS/m
  npk: { n: number; p: number; k: number } // kg/ha from Soil Health Card
  npkSource: 'soil-health-card'
}

/** 3 · Fertilizer line item (rule engine, ICAR + state university) */
export interface FertilizerItem {
  name: string
  bagKg: number
  bagsPerAcre: number
  pricePerBag: number // ₹
}

/** 4 · Crop guidance */
export interface CropSuggestion {
  name: string
  profitPerAcre: number // ₹ expected
  suitability: number // 0–100
}

export interface CropGuidance {
  top: CropSuggestion[]
  avoid: string[]
  tip: string
}

/** 5 · Leaf disease detection result */
export interface DiseaseResult {
  crop: string
  disease: string
  confidence: number // 0–1
  treatment: string
  offline: boolean
}

/** 6 · Pest detection result */
export interface PestResult {
  pest: string
  crop: string
  confidence: number
  dose: string
  villageTrend: { week: string; reports: number }[]
}

/** 7 · Irrigation recommendation + pump relay */
export interface IrrigationState {
  pumpOn: boolean
  recommendedMinutes: number
  moisture: number
  soilType: string
  cropStage: string
  rainChance: number // % next 24 h
}

/** 8 · Zigbee mesh */
export interface MeshNode {
  id: string
  x: number // 0–100 layout position
  y: number
  online: boolean
  gateway?: boolean
}

export interface MeshNetwork {
  nodes: MeshNode[]
  links: [string, string][]
}

/** 9 · Alerts across channels */
export type AlertChannel = 'dashboard' | 'sms' | 'call' | 'voice'

export interface AlertMessage {
  id: string
  channel: AlertChannel
  text: string
  time: string
  severity: 'info' | 'warning' | 'critical'
}

/** 10 · Voice output */
export interface VoiceConfig {
  languages: LanguageCode[]
  active: LanguageCode
  outputs: ('speaker' | 'call' | 'dashboard')[]
  sample: string
}

/** 11 · Wild animal alert */
export interface AnimalAlert {
  animal: string
  time: string
  confidence: number
  sirenOn: boolean
  strobeOn: boolean
  notified: ('call' | 'sms' | 'photo')[]
}

/** 12 · Grain moisture + mandi prices */
export interface MandiPrice {
  market: string
  pricePerQuintal: number
  change: number // % vs last week
  distanceKm: number
}

export interface GrainStatus {
  crop: string
  moisture: number
  safeMax: number
  ready: boolean
  bestMarket: string
  bestDay: string
  mandi: MandiPrice[]
}

/** Everything the station reports, keyed by feature */
export interface StationSnapshot {
  soil: SoilReading
  chemistry: SoilChemistry
  fertilizer: FertilizerItem[]
  crop: CropGuidance
  disease: DiseaseResult
  pest: PestResult
  irrigation: IrrigationState
  mesh: MeshNetwork
  alerts: AlertMessage[]
  voice: VoiceConfig
  animal: AnimalAlert
  grain: GrainStatus
}

/* ---------- Landing page content ---------- */

export interface HeroSnapshot {
  soilHealthScore: number
  soilHealthByZone: { zone: string; score: number }[]
  waterSavedPercent: number
  waterUsage: { week: string; baseline: number; agrisaarthi: number }[]
  liveMoisture: number
}

export interface StatItem {
  id: string
  /** numeric part animated with count-up; omit for text-only stats */
  value?: number
  prefixKey?: string
  suffix?: string
}

export interface StepItem {
  id: 'scan' | 'analysis' | 'action'
  image: string
}

export interface HardwarePart {
  id: string
  /** hotspot position over the station illustration, in % */
  x: number
  y: number
}

export interface TeamMember {
  /** optional until the team fills it in */
  name?: string
  roleKey: string
  initials: string
}

export interface DemoRequest {
  name: string
  phone: string
  village: string
}

/* ================================================================
 * Farmer dashboard (/dashboard/*)
 * ================================================================ */

/** ok = green, warn = amber, crit = red */
export type Status = 'ok' | 'warn' | 'crit'

/** Text that the backend/station sends in all three languages (SMS, voice) */
export type Localized = Record<LanguageCode, string>

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
  /** change vs 24 h ago, same unit */
  delta: number
}

export interface SeriesPoint {
  /** ISO timestamp */
  t: string
  moisture: number
  temperature: number
  humidity: number
  ph: number
  ec: number
}

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
  /** values interpolated into the translated alert text */
  params?: Record<string, string | number>
}

export type RecommendationKind = 'irrigation' | 'fertilizer' | 'pest' | 'disease' | 'market' | 'wildlife' | 'soil'

export interface Recommendation {
  id: string
  kind: RecommendationKind
  priority: Status
  /** i18n key under dash.rec.* */
  textKey: string
  params?: Record<string, string | number>
  /** dashboard route to act on it */
  to: string
}

export type WeatherCondition = 'sunny' | 'partly' | 'cloudy' | 'rain'

export interface WeatherDay {
  date: string
  max: number
  min: number
  rainChance: number
  condition: WeatherCondition
  rainfall?: number
}

export interface Weather {
  now: { temp: number; humidity: number; windKmh: number; condition: WeatherCondition; rainfall?: number }
  days: WeatherDay[]
}

export type PumpTrigger = 'auto' | 'manual' | 'missedCall' | 'sms'

export interface PumpState {
  on: boolean
  autoMode: boolean
  since: string | null
  trigger: PumpTrigger | null
}

export interface OverviewData {
  kpis: Kpi[]
  series24h: SeriesPoint[]
  recommendations: Recommendation[]
  alerts: AlertItem[]
  weather: Weather
  pump: PumpState
}

/* ---- Soil health ---- */

export interface NpkEntry {
  n: number // kg/ha
  p: number // kg/ha
  k: number // kg/ha
  cardNumber: string
  sampleDate: string // yyyy-mm-dd
}

export interface SoilData {
  live: Omit<SeriesPoint, 't'> & { updatedAt: string }
  dryThreshold: number
  history15: SeriesPoint[] // last 6 h @ 15 min
  history30: SeriesPoint[] // last 24 h @ 30 min
  npk: NpkEntry | null
}

/* ---- Fertilizer & crops ---- */

export interface FertilizerPlanItem {
  name: string
  nutrient: string
  bagKg: number
  bagsPerAcre: number
  pricePerBag: number
  timing: 'basal' | 'top30' | 'top45'
}

export interface CropCard {
  id: string
  name: string
  season: 'kharif' | 'rabi' | 'zaid'
  profitPerAcre: number
  costPerAcre: number
  yieldPerAcre: number // quintal
  suitability: number // 0–100
  water: 'low' | 'medium' | 'high'
}

export interface CropAvoid {
  name: string
  reasonKey: string
}

export interface CalculationSteps {
  cropName: string
  source: string
  soilRatings: {
    n: { level: 'low' | 'medium' | 'high'; value?: number; factor: number; percentLabel: string }
    p: { level: 'low' | 'medium' | 'high'; value?: number; factor: number; percentLabel: string }
    k: { level: 'low' | 'medium' | 'high'; value?: number; factor: number; percentLabel: string }
  }
  baseDoseKgHa: { n: number; p: number; k: number }
  adjustedDoseKgHa: { n: number; p: number; k: number }
  perAcreRequirement: { n: number; p: number; k: number }
  dapStep: {
    p2o5NeededKg: number
    dapKgPerAcre: number
    dapBagsPerAcre: number
    nSuppliedKg: number
  }
  ureaStep: {
    totalNNeededKg: number
    nFromDapKg: number
    netNNeededKg: number
    ureaKgPerAcre: number
    ureaBagsPerAcre: number
  }
  mopStep: {
    k2oNeededKg: number
    mopKgPerAcre: number
    mopBagsPerAcre: number
  }
  costStep: {
    dapCost: number
    ureaCost: number
    mopCost: number
    gypsumCost: number
    totalPerAcre: number
  }
}

export interface FertilizerData {
  crop: string
  acres: number
  items: FertilizerPlanItem[]
  topCrops: CropCard[]
  avoid: CropAvoid[]
  tipKeys: string[]
  calculationSteps?: CalculationSteps
}

/* ---- Crop doctor / pest watch ---- */

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
  /** product names stay as printed on the label */
  dose: { product: string; perAcre: Localized; water: Localized }
  threshold: Localized
  voice: Localized
}

export interface NearbyFarm {
  id: string
  /** 0 none · 1 low · 2 medium · 3 high */
  level: 0 | 1 | 2 | 3
  you?: boolean
}

export interface PestWatchData {
  pest: string
  trend: { date: string; village: number; yourFarm: number }[]
  /** 8 × 6 grid of nearby farms, row-major */
  farms: NearbyFarm[]
  recentScans: { id: string; pest: string; time: string; severity: Status }[]
}

/* ---- Irrigation ---- */

export interface IrrigationReason {
  id: 'moisture' | 'weather' | 'soil' | 'stage'
  /** values for the translated reason text (dash.irr.reasonText.<id>) */
  params: Record<string, string | number>
  status: Status
}

export interface PumpRun {
  id: string
  start: string
  minutes: number
  litres: number
  trigger: PumpTrigger
  result: 'completed' | 'stoppedEarly' | 'dryRunTrip'
}

export interface IrrigationData {
  plan: {
    minutes: number
    startAt: string
    litres: number
    reasons: IrrigationReason[]
    rainExpected?: boolean
    rainChance?: number
  }
  pump: PumpState
  powerAvailable: boolean
  history: PumpRun[]
}

/* ---- Wildlife ---- */

export type AnimalKind = 'nilgai' | 'boar' | 'cattle' | 'jackal' | 'leopard' | 'deer'
export type DeterrentAction = 'siren' | 'strobe' | 'call' | 'sms' | 'photo'

export interface WildlifeEvent {
  id: string
  animal: AnimalKind
  count: number
  time: string
  confidence: number
  image: string
  zone: string
  severity: Status
  actions: DeterrentAction[]
}

/* ---- Market & grain ---- */

export interface GrainLot {
  crop: string
  moisture: number
  safeMax: number
  quantityQ: number
  /** % points lost per sunny day of drying */
  dryingPerDay: number
}

export interface MandiRow {
  crop: string
  mandi: string
  distanceKm: number
  price: number // ₹ / quintal
  change: number // % vs last week
}

export interface MarketData {
  grains: GrainLot[]
  mandi: MandiRow[]
  best: { crop: string; mandi: string; date: string; price: number; extraPerQ: number }
  trend: { date: string; price: number; msp: number }[]
}

/* ---- Mesh ---- */

export interface MeshStation {
  id: string
  name: string
  x: number // 0–100
  y: number // 0–100
  gateway?: boolean
  online: boolean
  battery: number
  rssi: number // dBm
  lastSeenMin: number
}

export interface MeshData {
  nodes: MeshStation[]
  links: [string, string][]
}

/* ---- Alerts & SMS ---- */

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

/** Dev switch to demo loading / empty / error UI states */
export type MockMode = 'normal' | 'slow' | 'empty' | 'error'
