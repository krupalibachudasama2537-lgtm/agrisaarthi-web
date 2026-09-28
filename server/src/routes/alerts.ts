import { Router } from 'express'
import { z } from 'zod'
import { db } from '../firebase.js'
import { asyncHandler, HttpError, requireParam } from '../middleware/asyncHandler.js'
import type { AlertItem, AlertRoute, AlertsData, MessageLog } from '../types.js'

export const alertsRouter = Router()

const stripFarmId = <T extends { farmId?: string }>(v: T): Omit<T, 'farmId'> => {
  const { farmId: _farmId, ...rest } = v
  return rest
}

alertsRouter.get(
  '/farms/:farmId/notifications',
  asyncHandler(async (req, res) => {
    const snap = await db.collection('alerts').where('farmId', '==', requireParam(req, 'farmId')).orderBy('time', 'desc').limit(4).get()
    res.json(snap.docs.map((d) => stripFarmId(d.data() as AlertItem & { farmId: string })) as AlertItem[])
  }),
)

alertsRouter.get(
  '/alerts',
  asyncHandler(async (_req, res) => {
    const [logSnap, routingSnap] = await Promise.all([
      db.collection('messageLog').orderBy('time', 'desc').limit(100).get(),
      db.collection('alertRouting').doc('default').get(),
    ])
    const data: AlertsData = {
      log: logSnap.docs.map((d) => stripFarmId(d.data() as MessageLog & { farmId: string })) as MessageLog[],
      routing: (routingSnap.get('routes') as AlertRoute[] | undefined) ?? [],
    }
    res.json(data)
  }),
)

const routeSchema = z.array(z.object({ type: z.string(), sms: z.boolean(), call: z.boolean() }))

alertsRouter.put(
  '/alerts/routing',
  asyncHandler(async (req, res) => {
    const routes = routeSchema.parse(req.body) as AlertRoute[]
    await db.collection('alertRouting').doc('default').set({ routes })
    res.json(routes)
  }),
)

alertsRouter.post(
  '/alerts/:id/retry',
  asyncHandler(async (req, res) => {
    const ref = db.collection('messageLog').doc(requireParam(req, 'id'))
    const snap = await ref.get()
    if (!snap.exists) throw new HttpError(404, 'Message not found')
    const msg = snap.data() as MessageLog & { farmId: string }
    const updated: MessageLog = { ...msg, status: 'delivered', attempts: msg.attempts + 1 }
    await ref.set({ ...updated, farmId: msg.farmId })
    res.json(updated)
  }),
)
