import { Router } from 'express'
import { db } from '../firebase.js'
import { asyncHandler, HttpError, requireParam } from '../middleware/asyncHandler.js'
import type { Farm, Farmer, StationHealth } from '../types.js'

export const farmsRouter = Router()

const ONLINE_WINDOW_MIN = 30

/** Single-tenant demo: one farmer doc, seeded once. */
farmsRouter.get(
  '/farmer',
  asyncHandler(async (_req, res) => {
    const snap = await db.collection('farmers').limit(1).get()
    const doc = snap.docs[0]
    if (!doc) throw new HttpError(404, 'No farmer seeded – run `npm run seed`')
    res.json({ id: doc.id, ...doc.data() } as Farmer)
  }),
)

farmsRouter.get(
  '/farms',
  asyncHandler(async (_req, res) => {
    const snap = await db.collection('farms').get()
    res.json(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Farm[])
  }),
)

farmsRouter.get(
  '/farms/:farmId/station-health',
  asyncHandler(async (req, res) => {
    const farm = await db.collection('farms').doc(requireParam(req, 'farmId')).get()
    if (!farm.exists) throw new HttpError(404, 'Unknown farm')
    const stationId = farm.get('stationId') as string
    const station = await db.collection('stations').doc(stationId).get()
    if (!station.exists) throw new HttpError(404, 'Farm has no station record')

    const lastSeenAt = station.get('lastSeenAt') as FirebaseFirestore.Timestamp | undefined
    const lastSyncMinutes = lastSeenAt ? Math.max(0, Math.round((Date.now() - lastSeenAt.toMillis()) / 60000)) : Infinity

    const health: StationHealth = {
      batteryPct: (station.get('batteryPct') as number) ?? 0,
      solarCharging: (station.get('solarCharging') as boolean) ?? false,
      lastSyncMinutes: Number.isFinite(lastSyncMinutes) ? lastSyncMinutes : 9999,
      signalBars: ((station.get('signalBars') as number) ?? 0) as StationHealth['signalBars'],
      online: lastSyncMinutes <= ONLINE_WINDOW_MIN,
    }
    res.json(health)
  }),
)
