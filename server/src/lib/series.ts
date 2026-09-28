import { db } from '../firebase.js'
import type { SeriesPoint } from '../types.js'

interface ReadingDoc {
  t: FirebaseFirestore.Timestamp
  moisture: number
  temperature: number
  humidity: number
  ph: number
  ec: number
}

/** Most recent readings for a station, newest first. */
export async function recentReadings(stationId: string, limit: number): Promise<(SeriesPoint & { _t: number })[]> {
  const snap = await db.collection('readings').doc(stationId).collection('log').orderBy('t', 'desc').limit(limit).get()
  return snap.docs.map((d) => {
    const data = d.data() as ReadingDoc
    return {
      t: data.t.toDate().toISOString(),
      _t: data.t.toMillis(),
      moisture: data.moisture,
      temperature: data.temperature,
      humidity: data.humidity,
      ph: data.ph,
      ec: data.ec,
    }
  })
}

/** Downsamples a newest-first reading list to one point roughly every `stepMin` minutes, returned oldest-first. */
export function downsample(points: (SeriesPoint & { _t: number })[], stepMs: number): SeriesPoint[] {
  const out: SeriesPoint[] = []
  let lastT = -Infinity
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i]
    if (!p) continue
    if (p._t - lastT >= stepMs) {
      const { _t, ...rest } = p
      out.push(rest)
      lastT = p._t
    }
  }
  return out
}
