import { randomBytes } from 'node:crypto'

/** Short, URL-safe random id (not cryptographically sensitive – just needs to be unique). */
export function shortId(prefix?: string): string {
  const id = randomBytes(9).toString('base64url')
  return prefix ? `${prefix}-${id}` : id
}

/** Generates a fresh, high-entropy device key for an ESP32 station (raw – hash before storing). */
export function generateDeviceKey(): string {
  return randomBytes(32).toString('hex')
}
