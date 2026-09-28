/**
 * Single data gateway for the app.
 *
 * Everything returns MOCK data today. To connect the real ESP32 → backend,
 * set VITE_API_URL and replace the body of each function with a fetch call,
 * keeping the same return types from src/data/types.ts.
 *
 * Dashboard endpoints honour a "mock mode" (Settings → Demo data) so the
 * loading / empty / error UI states can be demonstrated without a backend.
 */
import {
  MOCK_ALERTS,
  MOCK_ALERT_ROUTING,
  MOCK_DISEASES,
  MOCK_FARMER,
  MOCK_FARMS,
  MOCK_FERTILIZER,
  MOCK_MESH,
  MOCK_MESSAGE_LOG,
  MOCK_PESTS,
  MOCK_WILDLIFE,
  mockIrrigation,
  mockMarket,
  mockOverview,
  mockPestWatch,
  mockSoil,
  mockStationHealth,
} from '@/data/dashboard'
import { MOCK_HERO, MOCK_STATION } from '@/data/station'
import type {
  AlertItem,
  AlertRoute,
  AlertsData,
  DemoRequest,
  DiseaseDiagnosis,
  Farm,
  Farmer,
  FertilizerData,
  HeroSnapshot,
  IrrigationData,
  MarketData,
  MeshData,
  MessageLog,
  MockMode,
  NpkEntry,
  OverviewData,
  PestDiagnosis,
  PestWatchData,
  PumpState,
  SoilData,
  StationHealth,
  StationSnapshot,
  WildlifeEvent,
} from '@/data/types'

export const API_BASE_URL = import.meta.env.VITE_API_URL as string | undefined

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Simulated network latency so loading states are exercised (landing page) */
const delay = <T,>(value: T, ms = 250) => sleep(ms).then(() => structuredClone(value))

/* ---------- mock mode ---------- */

const MOCK_MODE_KEY = 'agrisaarthi.mockMode'

export function getMockMode(): MockMode {
  try {
    const v = localStorage.getItem(MOCK_MODE_KEY)
    if (v === 'slow' || v === 'empty' || v === 'error') return v
  } catch {
    // storage unavailable
  }
  return 'normal'
}

export function setMockMode(mode: MockMode) {
  try {
    localStorage.setItem(MOCK_MODE_KEY, mode)
  } catch {
    // ignore
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

/** Resolve a mock value honouring the current mock mode */
async function mock<T>(value: T, empty?: (v: T) => T, ms = 450): Promise<T> {
  const mode = getMockMode()
  await sleep(mode === 'slow' ? Math.max(ms, 2500) : ms)
  if (mode === 'error') throw new ApiError('Could not reach the station (mock error mode)')
  const copy = structuredClone(value)
  return mode === 'empty' && empty ? empty(copy) : copy
}

/* ---------- in-memory "server" state so changes persist across pages ---------- */

const store = {
  pump: new Map<string, PumpState>(),
  npk: new Map<string, NpkEntry | null>(),
  routing: structuredClone(MOCK_ALERT_ROUTING) as AlertRoute[],
  log: structuredClone(MOCK_MESSAGE_LOG) as MessageLog[],
}

const pumpFor = (farmId: string): PumpState =>
  store.pump.get(farmId) ?? { on: false, autoMode: true, since: null, trigger: null }

/** Pick a stable mock result from a file (same photo → same answer) */
const pickByFile = <T,>(file: File, list: T[]) =>
  list[[...file.name].reduce((a, c) => a + c.charCodeAt(0), file.size) % list.length]

export const api = {
  /* ===== landing ===== */

  /** Live numbers for the hero glass cards */
  getHeroSnapshot(): Promise<HeroSnapshot> {
    return delay(MOCK_HERO)
  },

  /** Latest readings + advice for all 12 features */
  getStationSnapshot(): Promise<StationSnapshot> {
    return delay(MOCK_STATION)
  },

  /** "Book a demo" form */
  requestDemo(payload: DemoRequest): Promise<{ ok: true; reference: string }> {
    const reference = `AS-${payload.phone.slice(-4) || '0000'}-${Date.now().toString().slice(-4)}`
    return delay({ ok: true as const, reference }, 700)
  },

  /* ===== dashboard: shell ===== */

  getFarmer(): Promise<Farmer> {
    return delay(MOCK_FARMER, 150)
  },

  getFarms(): Promise<Farm[]> {
    return delay(MOCK_FARMS, 150)
  },

  getStationHealth(farmId: string): Promise<StationHealth> {
    return delay(mockStationHealth(farmId), 150)
  },

  /** Bell menu – latest unread alerts */
  getNotifications(_farmId: string): Promise<AlertItem[]> {
    return delay(MOCK_ALERTS.slice(0, 4), 200)
  },

  /* ===== overview ===== */

  getOverview(farmId: string): Promise<OverviewData> {
    // GET /farms/:id/overview
    return mock({ ...mockOverview(farmId), pump: pumpFor(farmId) }, (v) => ({ ...v, recommendations: [], alerts: [], series24h: [] }))
  },

  /* ===== soil ===== */

  getSoil(farmId: string): Promise<SoilData> {
    const soil = mockSoil(farmId)
    if (store.npk.has(farmId)) soil.npk = store.npk.get(farmId) ?? null
    return mock(soil, (v) => ({ ...v, history15: [], history30: [], npk: null }))
  },

  /** POST /farms/:id/npk – values typed in from the Soil Health Card */
  saveNpk(farmId: string, entry: NpkEntry): Promise<NpkEntry> {
    store.npk.set(farmId, entry)
    return mock(entry, undefined, 700)
  },

  /* ===== fertilizer & crops ===== */

  getFertilizerPlan(farmId: string): Promise<FertilizerData> {
    const farm = MOCK_FARMS.find((f) => f.id === farmId)
    return mock({ ...MOCK_FERTILIZER, acres: farm?.acres ?? MOCK_FERTILIZER.acres }, (v) => ({ ...v, items: [], topCrops: [], avoid: [] }))
  },

  /* ===== crop doctor / pest watch ===== */

  /** Runs the on-device (offline) leaf model – mocked with a 2 s delay */
  diagnoseLeaf(file: File): Promise<DiseaseDiagnosis> {
    return mock(pickByFile(file, MOCK_DISEASES), undefined, 2000)
  },

  detectPest(file: File): Promise<PestDiagnosis> {
    return mock(pickByFile(file, MOCK_PESTS), undefined, 2000)
  },

  getPestWatch(farmId: string): Promise<PestWatchData> {
    return mock(mockPestWatch(farmId), (v) => ({ ...v, trend: [], recentScans: [] }))
  },

  /* ===== irrigation & pump ===== */

  getIrrigation(farmId: string): Promise<IrrigationData> {
    return mock({ ...mockIrrigation(farmId), pump: pumpFor(farmId) }, (v) => ({ ...v, history: [] }))
  },

  /** POST /farms/:id/pump – relay ON/OFF */
  async setPump(farmId: string, on: boolean): Promise<PumpState> {
    const next: PumpState = { ...pumpFor(farmId), on, since: on ? new Date().toISOString() : null, trigger: on ? 'manual' : null }
    const result = await mock(next, undefined, 900)
    store.pump.set(farmId, result)
    return result
  },

  async setAutoMode(farmId: string, autoMode: boolean): Promise<PumpState> {
    const result = await mock({ ...pumpFor(farmId), autoMode }, undefined, 500)
    store.pump.set(farmId, result)
    return result
  },

  /* ===== wildlife ===== */

  getWildlife(_farmId: string): Promise<WildlifeEvent[]> {
    return mock(MOCK_WILDLIFE, () => [])
  },

  /** Fires the siren + strobe for 5 s */
  testSiren(_farmId: string): Promise<{ ok: true }> {
    return mock({ ok: true as const }, undefined, 1200)
  },

  /* ===== market & grain ===== */

  getMarket(_farmId: string): Promise<MarketData> {
    return mock(mockMarket(), (v) => ({ ...v, grains: [], mandi: [], trend: [] }))
  },

  /* ===== mesh ===== */

  getMesh(): Promise<MeshData> {
    return mock(MOCK_MESH, (v) => ({ ...v, nodes: [], links: [] }))
  },

  /* ===== alerts & SMS ===== */

  getAlerts(): Promise<AlertsData> {
    return mock({ log: store.log, routing: store.routing }, (v) => ({ ...v, log: [] }))
  },

  async saveAlertRouting(routing: AlertRoute[]): Promise<AlertRoute[]> {
    const saved = await mock(routing, undefined, 600)
    store.routing = saved
    return saved
  },

  /** Re-send a failed SMS / call */
  async retryMessage(id: string): Promise<MessageLog> {
    const msg = store.log.find((m) => m.id === id)
    if (!msg) throw new ApiError('Message not found')
    const updated = await mock({ ...msg, status: 'delivered' as const, attempts: msg.attempts + 1 }, undefined, 900)
    store.log = store.log.map((m) => (m.id === id ? updated : m))
    return updated
  },
}

export type Api = typeof api
