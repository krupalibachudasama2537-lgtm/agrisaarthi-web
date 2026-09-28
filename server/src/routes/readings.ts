import { Router } from 'express'
import { Timestamp } from 'firebase-admin/firestore'
import { z } from 'zod'
import { db } from '../firebase.js'
import { asyncHandler, HttpError, requireParam } from '../middleware/asyncHandler.js'
import { deviceAuth } from '../middleware/deviceAuth.js'
import { raiseAlert } from '../lib/alerts.js'
import { getPumpState } from '../lib/pump.js'
import { downsample, recentReadings } from '../lib/series.js'
import { DRY_THRESHOLD, LOW_BATTERY_THRESHOLD, kpisFrom } from '../lib/thresholds.js'
import type { Farm, Farmer, OverviewCore, PumpCommand, SoilData } from '../types.js'

export const readingsRouter = Router()

const readingSchema = z.object({
  moisture: z.number().min(0).max(100),
  temperature: z.number().min(-10).max(60),
  humidity: z.number().min(0).max(100),
  ph: z.number().min(0).max(14),
  ec: z.number().min(0).max(20),
  batteryPct: z.number().min(0).max(100),
  solarCharging: z.boolean(),
  signalBars: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
})

/** ESP32 → backend, every ~15 min. Device-authenticated. Returns any pending pump command. */
readingsRouter.post(
  '/stations/:stationId/readings',
  deviceAuth(),
  asyncHandler(async (req, res) => {
    const body = readingSchema.parse(req.body)
    const stationId = req.station!.id
    const farmId = req.station!.farmId
    const now = Timestamp.now()

    await db.collection('readings').doc(stationId).collection('log').add({
      t: now,
      moisture: body.moisture,
      temperature: body.temperature,
      humidity: body.humidity,
      ph: body.ph,
      ec: body.ec,
    })

    await db
      .collection('stations')
      .doc(stationId)
      .set({ batteryPct: body.batteryPct, solarCharging: body.solarCharging, signalBars: body.signalBars, lastSeenAt: now, online: true }, { merge: true })

    const farmSnap = await db.collection('farms').doc(farmId).get()
    const farm = farmSnap.data() as Farm | undefined
    const farmerSnap = await db.collection('farmers').limit(1).get()
    const farmer = farmerSnap.docs[0]?.data() as Farmer | undefined
    const phone = farmer?.phone ?? ''

    if (body.moisture < DRY_THRESHOLD) {
      await raiseAlert(farmId, 'soilDry', body.moisture < DRY_THRESHOLD - 8 ? 'crit' : 'warn', { moisture: Math.round(body.moisture) }, phone, 'en')
    }
    if (body.batteryPct < LOW_BATTERY_THRESHOLD) {
      await raiseAlert(farmId, 'batteryLow', 'warn', { pct: Math.round(body.batteryPct) }, phone, 'en')
    }
    if (body.temperature > 38) {
      await raiseAlert(farmId, 'heat', 'warn', { temp: Math.round(body.temperature) }, phone, 'en')
    }
    void farm // farm currently unused beyond existence check; kept for future per-crop threshold tuning

    const cmdSnap = await db.collection('pumpCommands').doc(stationId).get()
    let command: PumpCommand | null = null
    if (cmdSnap.exists && cmdSnap.get('action')) {
      command = { action: cmdSnap.get('action') }
      await cmdSnap.ref.set({ action: null }, { merge: true })
    }

    res.status(201).json({ ok: true, command })
  }),
)

/** Lets a station poll for its next pending command without waiting for its next reading POST. */
readingsRouter.get(
  '/stations/:stationId/commands/pending',
  deviceAuth(),
  asyncHandler(async (req, res) => {
    const cmdSnap = await db.collection('pumpCommands').doc(req.station!.id).get()
    const command: PumpCommand | null = cmdSnap.exists && cmdSnap.get('action') ? { action: cmdSnap.get('action') } : null
    if (command) await cmdSnap.ref.set({ action: null }, { merge: true })
    res.json({ command })
  }),
)

async function loadFarmOrThrow(farmId: string) {
  const snap = await db.collection('farms').doc(farmId).get()
  if (!snap.exists) throw new HttpError(404, 'Unknown farm')
  const { id: _id, ...rest } = snap.data() as Farm
  return { id: snap.id, ...rest }
}

readingsRouter.get(
  '/farms/:farmId/overview',
  asyncHandler(async (req, res) => {
    const farm = await loadFarmOrThrow(requireParam(req, 'farmId'))
    const [readings96, station, pump, alertsSnap] = await Promise.all([
      recentReadings(farm.stationId, 96), // ~24h @ 15min cadence
      db.collection('stations').doc(farm.stationId).get(),
      getPumpState(farm.id),
      db.collection('alerts').where('farmId', '==', farm.id).orderBy('time', 'desc').limit(20).get(),
    ])

    const latest = readings96[0]
    if (!latest) throw new HttpError(404, 'No readings yet for this farm\'s station')
    const dayAgo = readings96[readings96.length - 1]

    const core: OverviewCore = {
      kpis: kpisFrom(latest, dayAgo, (station.get('batteryPct') as number) ?? 0, undefined),
      series24h: downsample(readings96, 0), // every stored point, already ~15min apart
      alerts: alertsSnap.docs.map((d) => {
        const { farmId: _farmId, ...rest } = d.data()
        return rest
      }) as OverviewCore['alerts'],
      pump,
    }
    res.json(core)
  }),
)

readingsRouter.get(
  '/farms/:farmId/soil',
  asyncHandler(async (req, res) => {
    const farm = await loadFarmOrThrow(requireParam(req, 'farmId'))
    const [readings96, npkSnap] = await Promise.all([
      recentReadings(farm.stationId, 96),
      db.collection('npkEntries').doc(farm.id).get(),
    ])
    const latest = readings96[0]
    if (!latest) throw new HttpError(404, 'No readings yet for this farm\'s station')

    const { _t, t, ...liveRest } = latest
    const soil: SoilData = {
      live: { ...liveRest, updatedAt: t },
      dryThreshold: DRY_THRESHOLD,
      history15: downsample(readings96.slice(0, 24), 0), // last ~6h
      history30: downsample(readings96, 30 * 60 * 1000), // last ~24h @ 30min
      npk: npkSnap.exists ? (npkSnap.data() as SoilData['npk']) : null,
    }
    res.json(soil)
  }),
)
