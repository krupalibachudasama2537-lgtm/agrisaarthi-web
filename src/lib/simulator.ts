/**
 * Live station simulator.
 *
 * Generates realistic sensor telemetry every 5 seconds:
 * - Soil moisture slowly drops when pump is OFF, and climbs steadily when pump is ON.
 * - Temperature and humidity follow a continuous diurnal (day-night) cycle.
 * - pH and EC remain stable around baseline with realistic sensor noise.
 * - Solar battery charges during daytime (06:00 - 19:00) and discharges at night.
 * - Supports simulated demo events ("Soil too dry", "Wild animal detected", "Pest outbreak", "Low battery").
 */

import {
  MOCK_ALERTS,
  MOCK_FARMER,
  MOCK_MESSAGE_LOG,
  MOCK_WILDLIFE,
  makeSeries,
  mockIrrigation,
  profile,
  statusFor,
} from '@/data/dashboard'
import type {
  AlertItem,
  IrrigationData,
  IrrigationReason,
  Kpi,
  MessageLog,
  OverviewData,
  PumpRun,
  PumpState,
  Recommendation,
  SeriesPoint,
  SoilData,
  StationHealth,
  Weather,
  WildlifeEvent,
} from '@/data/types'
import {
  evaluateWeatherForIrrigation,
  getLiveWeatherSync,
  isSimulatedRain,
  setSimulatedRain,
} from '@/lib/weather'

type Listener = () => void

const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d

interface FarmSimState {
  farmId: string
  moisture: number
  temperature: number
  humidity: number
  ph: number
  basePh: number
  ec: number
  baseEc: number
  battery: number
  solarCharging: boolean
  pump: PumpState
  series24h: SeriesPoint[]
  history15: SeriesPoint[]
  history30: SeriesPoint[]
  alerts: AlertItem[]
  irrigationHistory: PumpRun[]
}

const listeners = new Set<Listener>()

function getDiurnal(date: Date) {
  const hour = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600
  // Peak temperature at 14:30, lowest at 04:30
  return Math.sin(((hour - 8.5) / 24) * Math.PI * 2)
}

function checkDaytime(date: Date) {
  const hour = date.getHours() + date.getMinutes() / 60
  return hour >= 6 && hour < 19
}

function initFarmState(farmId: string): FarmSimState {
  const p = profile(farmId)
  const now = new Date()
  const d = getDiurnal(now)
  const isDay = checkDaytime(now)
  const series24h = makeSeries(farmId, 49, 30)
  const history15 = makeSeries(farmId, 25, 15)
  const history30 = makeSeries(farmId, 49, 30)
  const baseIrr = mockIrrigation(farmId)

  return {
    farmId,
    moisture: p.moistureNow,
    temperature: round(26 + d * 6 + (Math.random() - 0.5) * 0.4),
    humidity: Math.round(60 - d * 20 + (Math.random() - 0.5) * 2),
    ph: p.ph,
    basePh: p.ph,
    ec: p.ec,
    baseEc: p.ec,
    battery: p.battery,
    solarCharging: isDay,
    pump: { on: false, autoMode: true, since: null, trigger: null },
    series24h,
    history15,
    history30,
    alerts: structuredClone(MOCK_ALERTS),
    irrigationHistory: structuredClone(baseIrr.history),
  }
}

class StationSimulator {
  private farms = new Map<string, FarmSimState>()
  private messageLog: MessageLog[] = structuredClone(MOCK_MESSAGE_LOG)
  private wildlifeEvents: WildlifeEvent[] = structuredClone(MOCK_WILDLIFE)
  private timer: ReturnType<typeof setInterval> | null = null

  constructor() {
    this.getFarmState('farm-main')
    this.getFarmState('farm-river')

    if (typeof window !== 'undefined') {
      this.start()
    }
  }

  private start() {
    if (this.timer) return
    this.timer = setInterval(() => {
      this.tick()
    }, 5000)
  }

  public subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  }

  private notify() {
    listeners.forEach((fn) => {
      try {
        fn()
      } catch (err) {
        console.error('[simulator] listener error:', err)
      }
    })
  }

  public getFarmState(farmId: string): FarmSimState {
    let state = this.farms.get(farmId)
    if (!state) {
      state = initFarmState(farmId)
      this.farms.set(farmId, state)
    }
    return state
  }

  /** Advances telemetry by one 5-second tick */
  public tick() {
    const now = new Date()
    const nowIso = now.toISOString()
    const diurnal = getDiurnal(now)
    const isDay = checkDaytime(now)

    this.farms.forEach((farm) => {
      // 1. Temperature & Humidity (continuous day-night diurnal cycle)
      const targetTemp = 27 + diurnal * 6 + (Math.random() - 0.5) * 0.4
      const targetHum = 58 - diurnal * 20 + (Math.random() - 0.5) * 1.5

      farm.temperature = round(farm.temperature * 0.85 + targetTemp * 0.15 + (Math.random() - 0.5) * 0.1, 1)
      farm.humidity = Math.round(farm.humidity * 0.85 + targetHum * 0.15 + (Math.random() - 0.5) * 0.5)

      // 2. pH and EC (stable with minor sensor noise)
      farm.ph = round(farm.basePh + (Math.random() - 0.5) * 0.04, 2)
      farm.ec = round(farm.baseEc + (Math.random() - 0.5) * 0.02, 2)

      // 3. Solar Battery (charges in daylight, slowly discharges at night)
      farm.solarCharging = isDay
      if (isDay) {
        // charges up to 100%
        farm.battery = Math.min(100, round(farm.battery + (farm.battery < 20 ? 0.3 : 0.1), 1))
      } else {
        // discharges slowly down to 15%
        farm.battery = Math.max(15, round(farm.battery - 0.04, 1))
      }

      // 4. Soil moisture dynamics (pump ON => jumps up; pump OFF => slowly drops)
      if (farm.pump.on) {
        // Pump is irrigating: moisture rises steadily
        farm.moisture = Math.min(54, round(farm.moisture + 0.5 + Math.random() * 0.3, 1))
      } else {
        // Normal drying: moisture slowly drops
        farm.moisture = Math.max(14, round(farm.moisture - (0.04 + Math.random() * 0.02), 1))
      }

      // 5. Update latest point in time series
      const livePoint: SeriesPoint = {
        t: nowIso,
        moisture: farm.moisture,
        temperature: farm.temperature,
        humidity: farm.humidity,
        ph: farm.ph,
        ec: farm.ec,
      }

      const updateSeries = (arr: SeriesPoint[]) => {
        if (!arr.length) return
        arr[arr.length - 1] = livePoint
      }

      updateSeries(farm.series24h)
      updateSeries(farm.history15)
      updateSeries(farm.history30)
    })

    this.notify()
  }

  /* ---------- Pump Controls ---------- */

  public getPumpState(farmId: string): PumpState {
    return this.getFarmState(farmId).pump
  }

  public setPump(farmId: string, on: boolean): PumpState {
    const farm = this.getFarmState(farmId)
    const prevOn = farm.pump.on
    const nowIso = new Date().toISOString()

    farm.pump = {
      ...farm.pump,
      on,
      since: on ? nowIso : null,
      trigger: on ? 'manual' : null,
    }

    if (prevOn && !on) {
      // Pump stopped: log run
      const run: PumpRun = {
        id: `run-${Date.now()}`,
        start: farm.pump.since ?? nowIso,
        minutes: Math.max(1, Math.round(5 + Math.random() * 15)),
        litres: Math.round(6000 + Math.random() * 12000),
        trigger: 'manual',
        result: 'completed',
      }
      farm.irrigationHistory.unshift(run)
    }

    this.notify()
    return farm.pump
  }

  public setAutoMode(farmId: string, autoMode: boolean): PumpState {
    const farm = this.getFarmState(farmId)
    farm.pump = { ...farm.pump, autoMode }
    this.notify()
    return farm.pump
  }

  /* ---------- Event Simulation ---------- */

  public triggerEvent(type: 'soilDry' | 'animal' | 'pest' | 'batteryLow' | 'rainForecast', farmId = 'farm-main') {
    const farm = this.getFarmState(farmId)
    const nowIso = new Date().toISOString()

    switch (type) {
      case 'rainForecast': {
        const next = !isSimulatedRain(farmId)
        setSimulatedRain(farmId, next)
        break
      }

      case 'soilDry': {
        farm.moisture = 18.2
        const alertItem: AlertItem = {
          id: `al-${Date.now()}`,
          type: 'soilDry',
          severity: 'crit',
          time: nowIso,
          channels: ['dashboard', 'sms', 'voice'],
          params: { value: 18.2, min: 25 },
        }
        farm.alerts.unshift(alertItem)

        const msg: MessageLog = {
          id: `msg-${Date.now()}`,
          time: nowIso,
          channel: 'sms',
          type: 'soilDry',
          to: MOCK_FARMER.phone,
          lang: 'gu',
          status: 'delivered',
          attempts: 1,
        }
        this.messageLog.unshift(msg)
        break
      }

      case 'animal': {
        const alertItem: AlertItem = {
          id: `al-${Date.now()}`,
          type: 'animal',
          severity: 'crit',
          time: nowIso,
          channels: ['dashboard', 'call', 'sms'],
          params: { animal: 'Nilgai', zone: 'North boundary' },
        }
        farm.alerts.unshift(alertItem)

        const msg: MessageLog = {
          id: `msg-${Date.now()}`,
          time: nowIso,
          channel: 'call',
          type: 'animal',
          to: MOCK_FARMER.phone,
          lang: 'gu',
          status: 'delivered',
          attempts: 1,
        }
        this.messageLog.unshift(msg)

        const wildlife: WildlifeEvent = {
          id: `wild-${Date.now()}`,
          animal: 'nilgai',
          count: 2,
          time: nowIso,
          confidence: 0.94,
          image: 'https://images.unsplash.com/photo-1484406566174-9da000fda645?auto=format&fit=crop&w=480&q=60',
          zone: 'North boundary',
          severity: 'crit',
          actions: ['siren', 'strobe', 'call', 'sms', 'photo'],
        }
        this.wildlifeEvents.unshift(wildlife)
        break
      }

      case 'pest': {
        const alertItem: AlertItem = {
          id: `al-${Date.now()}`,
          type: 'pest',
          severity: 'warn',
          time: nowIso,
          channels: ['dashboard', 'sms'],
          params: { pest: 'Pink bollworm' },
        }
        farm.alerts.unshift(alertItem)

        const msg: MessageLog = {
          id: `msg-${Date.now()}`,
          time: nowIso,
          channel: 'sms',
          type: 'pest',
          to: MOCK_FARMER.phone,
          lang: 'gu',
          status: 'delivered',
          attempts: 1,
        }
        this.messageLog.unshift(msg)
        break
      }

      case 'batteryLow': {
        farm.battery = 14
        farm.solarCharging = false

        const alertItem: AlertItem = {
          id: `al-${Date.now()}`,
          type: 'batteryLow',
          severity: 'crit',
          time: nowIso,
          channels: ['dashboard', 'sms'],
          params: { value: 14 },
        }
        farm.alerts.unshift(alertItem)

        const msg: MessageLog = {
          id: `msg-${Date.now()}`,
          time: nowIso,
          channel: 'sms',
          type: 'batteryLow',
          to: MOCK_FARMER.phone,
          lang: 'gu',
          status: 'delivered',
          attempts: 1,
        }
        this.messageLog.unshift(msg)
        break
      }
    }

    this.notify()
  }

  /* ---------- Data Getters for api.ts ---------- */

  public getStationHealth(farmId: string): StationHealth {
    const farm = this.getFarmState(farmId)
    return {
      batteryPct: Math.round(farm.battery),
      solarCharging: farm.solarCharging,
      lastSyncMinutes: 0,
      signalBars: 4,
      online: true,
    }
  }

  public getNotifications(farmId: string): AlertItem[] {
    const farm = this.getFarmState(farmId)
    return farm.alerts.slice(0, 4)
  }

  public getOverview(farmId: string, weatherOverride?: Weather): OverviewData {
    const farm = this.getFarmState(farmId)
    const series = farm.series24h
    const last = series.at(-1)!
    const first = series[0]
    const weather = weatherOverride ?? getLiveWeatherSync(farmId)
    const wEval = evaluateWeatherForIrrigation(weather)

    const kpi = (id: Kpi['id'], value: number, unit: string, prev: number): Kpi => ({
      id,
      value,
      unit,
      status: statusFor[id](value),
      delta: round(value - prev, id === 'ph' || id === 'ec' ? 2 : 1),
    })

    const irrigationRec: Recommendation = wEval.rainExpectedTomorrow
      ? {
          id: 'r1',
          kind: 'irrigation',
          priority: 'ok',
          textKey: 'skipRain',
          params: { chance: wEval.tomorrowRainChance },
          to: 'irrigation',
        }
      : {
          id: 'r1',
          kind: 'irrigation',
          priority: farm.moisture < 25 ? 'crit' : 'ok',
          textKey: farm.moisture < 25 ? 'irrigate' : 'checked',
          params: { min: 25, time: '06:00' },
          to: 'irrigation',
        }

    return {
      kpis: [
        kpi('moisture', last.moisture, '%', first.moisture),
        kpi('temperature', last.temperature, '°C', first.temperature),
        kpi('humidity', last.humidity, '%', first.humidity),
        kpi('ph', last.ph, '', first.ph),
        kpi('ec', last.ec, 'dS/m', first.ec),
        kpi('battery', Math.round(farm.battery), '%', round(first.moisture + 50)),
      ],
      series24h: series,
      recommendations: [
        irrigationRec,
        { id: 'r2', kind: 'fertilizer', priority: 'warn', textKey: 'topdress', params: { bags: 1.5, name: 'Urea' }, to: 'fertilizer' },
        { id: 'r3', kind: 'pest', priority: 'warn', textKey: 'scout', params: { pest: 'Aphids' }, to: 'pest' },
        { id: 'r4', kind: 'market', priority: 'ok', textKey: 'sell', params: { crop: 'Wheat', mandi: 'Rajkot APMC' }, to: 'market' },
      ],
      alerts: farm.alerts.slice(0, 4),
      weather,
      pump: farm.pump,
    }
  }

  public getSoil(farmId: string): SoilData {
    const farm = this.getFarmState(farmId)
    const last = farm.history15.at(-1)!
    return {
      live: { ...last, updatedAt: last.t },
      dryThreshold: 25,
      history15: farm.history15,
      history30: farm.history30,
      npk:
        farmId === 'farm-main'
          ? { n: 182, p: 21, k: 265, cardNumber: 'GJ/RJT/2025/004512', sampleDate: '2025-11-14' }
          : null,
    }
  }

  public getIrrigation(farmId: string, weatherOverride?: Weather): IrrigationData {
    const farm = this.getFarmState(farmId)
    const weather = weatherOverride ?? getLiveWeatherSync(farmId)
    const wEval = evaluateWeatherForIrrigation(weather)
    const tomorrow6 = new Date(Date.now() + 86400000)
    tomorrow6.setHours(6, 0, 0, 0)

    const weatherReason: IrrigationReason = wEval.rainExpectedTomorrow
      ? {
          id: 'weather',
          params: { chance: wEval.tomorrowRainChance, textKey: 'weatherRain' },
          status: 'ok',
        }
      : {
          id: 'weather',
          params: { days: wEval.dryDaysCount, temp: wEval.currentTemp },
          status: 'warn',
        }

    return {
      plan: {
        minutes: wEval.rainExpectedTomorrow ? 0 : farmId === 'farm-main' ? 25 : 15,
        startAt: tomorrow6.toISOString(),
        litres: wEval.rainExpectedTomorrow ? 0 : farmId === 'farm-main' ? 30000 : 15000,
        reasons: [
          {
            id: 'moisture',
            params: { value: farm.moisture, min: 30, max: 35 },
            status: farm.moisture < 25 ? 'crit' : 'ok',
          },
          weatherReason,
          { id: 'soil', params: { term: 'Medium black' }, status: 'ok' },
          { id: 'stage', params: { term: 'Flowering' }, status: 'warn' },
        ],
        rainExpected: wEval.rainExpectedTomorrow,
        rainChance: wEval.tomorrowRainChance,
      },
      pump: farm.pump,
      powerAvailable: true,
      history: farm.irrigationHistory,
    }
  }

  public getWildlife(_farmId: string): WildlifeEvent[] {
    return this.wildlifeEvents
  }

  public getMessageLog(): MessageLog[] {
    return this.messageLog
  }

  public retryMessage(id: string): MessageLog {
    const msg = this.messageLog.find((m) => m.id === id)
    if (!msg) throw new Error('Message not found')
    msg.status = 'delivered'
    msg.attempts += 1
    this.notify()
    return msg
  }
}

export const simulator = new StationSimulator()
