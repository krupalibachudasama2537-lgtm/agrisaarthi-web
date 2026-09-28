import { Router } from 'express'
import { z } from 'zod'
import { db } from '../firebase.js'
import { asyncHandler, HttpError, requireParam } from '../middleware/asyncHandler.js'
import { shortId } from '../lib/ids.js'
import { getPumpState } from '../lib/pump.js'
import type { Farm, PumpRun, PumpState } from '../types.js'

export const pumpRouter = Router()

/** Litres/minute assumed for a standard station pump, used only to estimate PumpRun.litres. */
const FLOW_RATE_LPM = 20

async function loadStationId(farmId: string): Promise<string> {
  const farm = await db.collection('farms').doc(farmId).get()
  if (!farm.exists) throw new HttpError(404, 'Unknown farm')
  return (farm.data() as Farm).stationId
}

pumpRouter.post(
  '/farms/:farmId/pump',
  asyncHandler(async (req, res) => {
    const { on } = z.object({ on: z.boolean() }).parse(req.body)
    const farmId = requireParam(req, 'farmId')
    const stationId = await loadStationId(farmId)
    const current = await getPumpState(farmId)

    if (!on && current.on && current.since) {
      const minutes = Math.max(1, Math.round((Date.now() - new Date(current.since).getTime()) / 60000))
      const run: PumpRun = {
        id: shortId('run'),
        start: current.since,
        minutes,
        litres: minutes * FLOW_RATE_LPM,
        trigger: current.trigger ?? 'manual',
        result: 'completed',
      }
      await db.collection('pumpRuns').doc(farmId).collection('log').doc(run.id).set(run)
    }

    const next: PumpState = { ...current, on, since: on ? new Date().toISOString() : null, trigger: on ? 'manual' : null }
    await db.collection('pumpState').doc(farmId).set(next)
    await db.collection('pumpCommands').doc(stationId).set({ action: on ? 'on' : 'off', issuedAt: new Date().toISOString() })

    res.json(next)
  }),
)

pumpRouter.post(
  '/farms/:farmId/pump/auto',
  asyncHandler(async (req, res) => {
    const { autoMode } = z.object({ autoMode: z.boolean() }).parse(req.body)
    const farmId = requireParam(req, 'farmId')
    const current = await getPumpState(farmId)
    const next: PumpState = { ...current, autoMode }
    await db.collection('pumpState').doc(farmId).set(next)
    res.json(next)
  }),
)

pumpRouter.get(
  '/farms/:farmId/irrigation',
  asyncHandler(async (req, res) => {
    const farmId = requireParam(req, 'farmId')
    const stationId = await loadStationId(farmId)
    const [pump, station, runsSnap] = await Promise.all([
      getPumpState(farmId),
      db.collection('stations').doc(stationId).get(),
      db.collection('pumpRuns').doc(farmId).collection('log').orderBy('start', 'desc').limit(20).get(),
    ])
    res.json({
      pump,
      powerAvailable: ((station.get('batteryPct') as number) ?? 0) > 15,
      history: runsSnap.docs.map((d) => d.data()) as PumpRun[],
    })
  }),
)
