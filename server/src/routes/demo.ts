import { Router } from 'express'
import { z } from 'zod'
import { db } from '../firebase.js'
import { asyncHandler } from '../middleware/asyncHandler.js'
import { shortId } from '../lib/ids.js'

export const demoRouter = Router()

const demoSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(6),
  village: z.string().min(1),
})

demoRouter.post(
  '/demo-request',
  asyncHandler(async (req, res) => {
    const payload = demoSchema.parse(req.body)
    const reference = `AS-${payload.phone.slice(-4) || '0000'}-${Date.now().toString().slice(-4)}`
    await db
      .collection('demoRequests')
      .doc(shortId('demo'))
      .set({ ...payload, reference, createdAt: new Date().toISOString() })
    res.status(201).json({ ok: true, reference })
  }),
)
