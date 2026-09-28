import { db } from '../firebase.js'
import type { PumpState } from '../types.js'

const DEFAULT_STATE: PumpState = { on: false, autoMode: true, since: null, trigger: null }

export async function getPumpState(farmId: string): Promise<PumpState> {
  const snap = await db.collection('pumpState').doc(farmId).get()
  return snap.exists ? (snap.data() as PumpState) : DEFAULT_STATE
}
