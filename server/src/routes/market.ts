import { Router } from 'express'
import { db } from '../firebase.js'
import { asyncHandler, HttpError, requireParam } from '../middleware/asyncHandler.js'
import type { Farm, GrainLot, MandiRow, MarketData } from '../types.js'

export const marketRouter = Router()

/**
 * Mandi prices + grain lots are seeded reference data (see server/src/seed.ts),
 * not computed from a sensor. Swap the two `.get()` calls below for a call to
 * a real feed (e.g. the government Agmarknet/eNAM API) to go live.
 */
marketRouter.get(
  '/farms/:farmId/market',
  asyncHandler(async (req, res) => {
    const farm = await db.collection('farms').doc(requireParam(req, 'farmId')).get()
    if (!farm.exists) throw new HttpError(404, 'Unknown farm')
    const crop = (farm.data() as Farm).crop

    const [mandiSnap, trendSnap, grainSnap] = await Promise.all([
      db.collection('mandiPrices').where('crop', '==', crop).get(),
      db.collection('marketTrend').where('crop', '==', crop).orderBy('date', 'asc').get(),
      db.collection('grainLots').where('crop', '==', crop).get(),
    ])

    const mandi = mandiSnap.docs.map((d) => d.data() as MandiRow)
    const best = mandi.reduce<MandiRow | null>((acc, row) => (!acc || row.price > acc.price ? row : acc), null)

    const data: MarketData = {
      grains: grainSnap.docs.map((d) => d.data() as GrainLot),
      mandi,
      best: best
        ? { crop: best.crop, mandi: best.mandi, date: new Date().toISOString().slice(0, 10), price: best.price, extraPerQ: 0 }
        : { crop, mandi: '—', date: new Date().toISOString().slice(0, 10), price: 0, extraPerQ: 0 },
      trend: trendSnap.docs.map((d) => {
        const t = d.data() as { date: string; price: number; msp: number }
        return { date: t.date, price: t.price, msp: t.msp }
      }),
    }
    res.json(data)
  }),
)
