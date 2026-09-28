import { Router } from 'express'
import { z } from 'zod'
import { db } from '../firebase.js'
import { asyncHandler, HttpError, requireParam } from '../middleware/asyncHandler.js'
import type { NpkEntry } from '../types.js'

export const npkRouter = Router()

const npkSchema = z.object({
  n: z.number().min(0),
  p: z.number().min(0),
  k: z.number().min(0),
  cardNumber: z.string().min(1),
  sampleDate: z.string().min(1),
})

npkRouter.post(
  '/farms/:farmId/npk',
  asyncHandler(async (req, res) => {
    const farmId = requireParam(req, 'farmId')
    const farm = await db.collection('farms').doc(farmId).get()
    if (!farm.exists) throw new HttpError(404, 'Unknown farm')

    const entry: NpkEntry = npkSchema.parse(req.body)
    await db.collection('npkEntries').doc(farmId).set(entry)
    res.status(201).json(entry)
  }),
)
