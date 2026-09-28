import { createHash, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'
import { db } from '../firebase.js'
import { HttpError } from './asyncHandler.js'

export function hashDeviceKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex')
}

/**
 * Authenticates an ESP32 station via the `X-Device-Key` header against the
 * sha256 hash stored on stations/{stationId}. Attaches the loaded station
 * doc to req.station so route handlers don't need a second read.
 */
export function deviceAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stationId = req.params.stationId
      const rawKey = req.header('X-Device-Key')
      if (!stationId) throw new HttpError(400, 'Missing stationId in URL')
      if (!rawKey) throw new HttpError(401, 'Missing X-Device-Key header')

      const snap = await db.collection('stations').doc(stationId).get()
      if (!snap.exists) throw new HttpError(404, 'Unknown station')

      const stored = snap.get('apiKeyHash') as string | undefined
      const provided = hashDeviceKey(rawKey)
      const storedBuf = Buffer.from(stored ?? '', 'hex')
      const providedBuf = Buffer.from(provided, 'hex')
      const match = stored && storedBuf.length === providedBuf.length && timingSafeEqual(storedBuf, providedBuf)
      if (!match) throw new HttpError(401, 'Invalid device key')

      req.station = { id: snap.id, farmId: snap.get('farmId') as string }
      next()
    } catch (err) {
      next(err)
    }
  }
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      station?: { id: string; farmId: string }
    }
  }
}
