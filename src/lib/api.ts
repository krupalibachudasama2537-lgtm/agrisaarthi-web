/**
 * Single data gateway for the app.
 *
 * Methods backed by the real backend (server/, see its README) when
 * VITE_API_URL is set and Settings → Demo data is "Normal": readings-derived
 * data (overview KPIs/series, soil, irrigation pump/history), alerts, pump
 * commands, NPK entries, disease/pest photo diagnosis, and mandi prices.
 *
 * Everything else (weather, wildlife, mesh, fertilizer plan, pest-watch
 * heatmap, landing hero/station snapshot) has no real data source in this
 * project and still returns local MOCK data, same as always.
 *
 * Dashboard endpoints honour a "mock mode" (Settings → Demo data) so the
 * loading / empty / error UI states can be demonstrated without a backend –
 * and, same as before VITE_API_URL existed, running with no backend at all
 * (VITE_API_URL unset) still fully works by falling back to local mock data.
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

/**
 * Whether to use local mock data instead of the real backend: either the
 * demo-mode toggle is forcing a loading/empty/error state, or no backend is
 * configured at all (the app still works standalone, same as before).
 */
const shouldMock = () => getMockMode() !== 'normal' || !API_BASE_URL

/* ---------- real backend fetch helper ---------- */

let warnedNoBackend = false

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  if (!API_BASE_URL) {
    if (!warnedNoBackend) {
      warnedNoBackend = true
      console.info('[api] VITE_API_URL is not set – falling back to local mock data. See agrisaarthi-web/.env.example.')
    }
    throw new ApiError('No backend configured')
  }
  let res: Response
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: init?.body instanceof FormData ? init.headers : { 'Content-Type': 'application/json', ...init?.headers },
    })
  } catch {
    throw new ApiError('Could not reach the backend')
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError((body as { error?: string } | null)?.error ?? `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

const json = (body: unknown): RequestInit => ({ method: 'POST', body: JSON.stringify(body) })

/* ---------- in-memory "server" state for mock mode (slow/empty/error) ---------- */

const store = {
  pump: new Map<string, PumpState>(),
  npk: new Map<string, NpkEntry | null>(),
  routing: structuredClone(MOCK_ALERT_ROUTING) as AlertRoute[],
  log: structuredClone(MOCK_MESSAGE_LOG) as MessageLog[],
}

const pumpFor = (farmId: string): PumpState => store.pump.get(farmId) ?? { on: false, autoMode: true, since: null, trigger: null }

/** Pick a stable mock result from a file (same photo → same answer) */
const pickByFile = <T,>(file: File, list: T[]) => list[[...file.name].reduce((a, c) => a + c.charCodeAt(0), file.size) % list.length]

export const api = {
  /* ===== landing ===== */

  /** Live numbers for the hero glass cards – no real data source, always mock */
  getHeroSnapshot(): Promise<HeroSnapshot> {
    return delay(MOCK_HERO)
  },

  /** Latest readings + advice for all 12 features – no real data source, always mock */
  getStationSnapshot(): Promise<StationSnapshot> {
    return delay(MOCK_STATION)
  },

  /** "Book a demo" form */
  async requestDemo(payload: DemoRequest): Promise<{ ok: true; reference: string }> {
    if (shouldMock()) {
      const reference = `AS-${payload.phone.slice(-4) || '0000'}-${Date.now().toString().slice(-4)}`
      return delay({ ok: true as const, reference }, 700)
    }
    return http('/demo-request', json(payload))
  },

  /* ===== dashboard: shell ===== */

  async getFarmer(): Promise<Farmer> {
    if (shouldMock()) return delay(MOCK_FARMER, 150)
    return http('/farmer')
  },

  async getFarms(): Promise<Farm[]> {
    if (shouldMock()) return delay(MOCK_FARMS, 150)
    return http('/farms')
  },

  async getStationHealth(farmId: string): Promise<StationHealth> {
    if (shouldMock()) return delay(mockStationHealth(farmId), 150)
    return http(`/farms/${farmId}/station-health`)
  },

  /** Bell menu – latest unread alerts */
  async getNotifications(farmId: string): Promise<AlertItem[]> {
    if (shouldMock()) return delay(MOCK_ALERTS.slice(0, 4), 200)
    return http(`/farms/${farmId}/notifications`)
  },

  /* ===== overview ===== */

  async getOverview(farmId: string): Promise<OverviewData> {
    if (shouldMock()) {
      return mock({ ...mockOverview(farmId), pump: pumpFor(farmId) }, (v) => ({ ...v, recommendations: [], alerts: [], series24h: [] }))
    }
    const [core, { recommendations, weather }] = await Promise.all([
      http<Pick<OverviewData, 'kpis' | 'series24h' | 'alerts' | 'pump'>>(`/farms/${farmId}/overview`),
      Promise.resolve(mockOverview(farmId)),
    ])
    return { ...core, recommendations, weather }
  },

  /* ===== soil ===== */

  async getSoil(farmId: string): Promise<SoilData> {
    if (shouldMock()) {
      const soil = mockSoil(farmId)
      if (store.npk.has(farmId)) soil.npk = store.npk.get(farmId) ?? null
      return mock(soil, (v) => ({ ...v, history15: [], history30: [], npk: null }))
    }
    return http(`/farms/${farmId}/soil`)
  },

  /** POST /farms/:id/npk – values typed in from the Soil Health Card */
  async saveNpk(farmId: string, entry: NpkEntry): Promise<NpkEntry> {
    if (shouldMock()) {
      store.npk.set(farmId, entry)
      return mock(entry, undefined, 700)
    }
    return http(`/farms/${farmId}/npk`, json(entry))
  },

  /* ===== fertilizer & crops ===== */

  /** No real advisory data source – always mock */
  getFertilizerPlan(farmId: string): Promise<FertilizerData> {
    const farm = MOCK_FARMS.find((f) => f.id === farmId)
    return mock({ ...MOCK_FERTILIZER, acres: farm?.acres ?? MOCK_FERTILIZER.acres }, (v) => ({ ...v, items: [], topCrops: [], avoid: [] }))
  },

  /* ===== crop doctor / pest watch ===== */

  /** Runs the on-device (offline) leaf model – mocked with a 2 s delay, or a real upload if a backend is configured */
  async diagnoseLeaf(file: File): Promise<DiseaseDiagnosis> {
    if (shouldMock()) return mock(pickByFile(file, MOCK_DISEASES), undefined, 2000)
    const form = new FormData()
    form.append('photo', file)
    return http('/diagnose/leaf', { method: 'POST', body: form })
  },

  async detectPest(file: File): Promise<PestDiagnosis> {
    if (shouldMock()) return mock(pickByFile(file, MOCK_PESTS), undefined, 2000)
    const form = new FormData()
    form.append('photo', file)
    return http('/diagnose/pest', { method: 'POST', body: form })
  },

  /** No real village-level pest reporting data source – always mock */
  getPestWatch(farmId: string): Promise<PestWatchData> {
    return mock(mockPestWatch(farmId), (v) => ({ ...v, trend: [], recentScans: [] }))
  },

  /* ===== irrigation & pump ===== */

  async getIrrigation(farmId: string): Promise<IrrigationData> {
    if (shouldMock()) return mock({ ...mockIrrigation(farmId), pump: pumpFor(farmId) }, (v) => ({ ...v, history: [] }))
    const [core, { plan }] = await Promise.all([
      http<Pick<IrrigationData, 'pump' | 'powerAvailable' | 'history'>>(`/farms/${farmId}/irrigation`),
      Promise.resolve(mockIrrigation(farmId)),
    ])
    return { ...core, plan }
  },

  /** POST /farms/:id/pump – relay ON/OFF */
  async setPump(farmId: string, on: boolean): Promise<PumpState> {
    if (shouldMock()) {
      const next: PumpState = { ...pumpFor(farmId), on, since: on ? new Date().toISOString() : null, trigger: on ? 'manual' : null }
      const result = await mock(next, undefined, 900)
      store.pump.set(farmId, result)
      return result
    }
    return http(`/farms/${farmId}/pump`, json({ on }))
  },

  async setAutoMode(farmId: string, autoMode: boolean): Promise<PumpState> {
    if (shouldMock()) {
      const result = await mock({ ...pumpFor(farmId), autoMode }, undefined, 500)
      store.pump.set(farmId, result)
      return result
    }
    return http(`/farms/${farmId}/pump/auto`, json({ autoMode }))
  },

  /* ===== wildlife ===== */

  /** No real camera-AI detection source – always mock */
  getWildlife(_farmId: string): Promise<WildlifeEvent[]> {
    return mock(MOCK_WILDLIFE, () => [])
  },

  /** Fires the siren + strobe for 5 s – always mock, no station relay for this yet */
  testSiren(_farmId: string): Promise<{ ok: true }> {
    return mock({ ok: true as const }, undefined, 1200)
  },

  /* ===== market & grain ===== */

  async getMarket(farmId: string): Promise<MarketData> {
    if (shouldMock()) return mock(mockMarket(), (v) => ({ ...v, grains: [], mandi: [], trend: [] }))
    return http(`/farms/${farmId}/market`)
  },

  /* ===== mesh ===== */

  /** No real mesh telemetry source – always mock */
  getMesh(): Promise<MeshData> {
    return mock(MOCK_MESH, (v) => ({ ...v, nodes: [], links: [] }))
  },

  /* ===== alerts & SMS ===== */

  async getAlerts(): Promise<AlertsData> {
    if (shouldMock()) return mock({ log: store.log, routing: store.routing }, (v) => ({ ...v, log: [] }))
    return http('/alerts')
  },

  async saveAlertRouting(routing: AlertRoute[]): Promise<AlertRoute[]> {
    if (shouldMock()) {
      const saved = await mock(routing, undefined, 600)
      store.routing = saved
      return saved
    }
    return http('/alerts/routing', { method: 'PUT', body: JSON.stringify(routing) })
  },

  /** Re-send a failed SMS / call */
  async retryMessage(id: string): Promise<MessageLog> {
    if (shouldMock()) {
      const msg = store.log.find((m) => m.id === id)
      if (!msg) throw new ApiError('Message not found')
      const updated = await mock({ ...msg, status: 'delivered' as const, attempts: msg.attempts + 1 }, undefined, 900)
      store.log = store.log.map((m) => (m.id === id ? updated : m))
      return updated
    }
    return http(`/alerts/${id}/retry`, { method: 'POST' })
  },
}

export type Api = typeof api
