import { db } from '../firebase.js'
import { shortId } from './ids.js'
import type { AlertChannel, AlertItem, AlertRoute, AlertType, MessageLog } from '../types.js'

const DEDUP_WINDOW_MS = 6 * 60 * 60 * 1000 // don't repeat the same alert type for a farm within 6h

/**
 * Raises an alert for a farm if the same type hasn't fired recently, and logs
 * a simulated SMS/call delivery for whichever channels alertRouting enables
 * for this type. Returns the created AlertItem, or null if deduped.
 */
export async function raiseAlert(
  farmId: string,
  type: AlertType,
  severity: AlertItem['severity'],
  params: Record<string, string | number> | undefined,
  phoneForFarm: string,
  lang: 'en' | 'hi' | 'gu',
): Promise<AlertItem | null> {
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString()
  const recent = await db
    .collection('alerts')
    .where('farmId', '==', farmId)
    .where('type', '==', type)
    .where('time', '>', cutoff)
    .limit(1)
    .get()
  if (!recent.empty) return null

  const routingSnap = await db.collection('alertRouting').doc('default').get()
  const routing = (routingSnap.get('routes') as AlertRoute[] | undefined) ?? []
  const route = routing.find((r) => r.type === type)

  const channels: AlertChannel[] = ['dashboard']
  if (route?.sms) channels.push('sms')
  if (route?.call) channels.push('call')

  const alert: AlertItem = { id: shortId('al'), type, severity, time: new Date().toISOString(), channels, params }
  await db
    .collection('alerts')
    .doc(alert.id)
    .set({ ...alert, farmId })

  const batch = db.batch()
  for (const channel of channels) {
    if (channel === 'dashboard') continue
    const msg: MessageLog = {
      id: shortId('msg'),
      time: alert.time,
      channel: channel as 'sms' | 'call',
      type,
      to: phoneForFarm,
      lang,
      status: 'delivered', // simulated – no real SMS/voice gateway is wired up
      attempts: 1,
    }
    batch.set(db.collection('messageLog').doc(msg.id), { ...msg, farmId })
  }
  await batch.commit()

  return alert
}
