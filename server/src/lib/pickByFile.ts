/**
 * Same deterministic "same photo → same answer" selection the frontend mock
 * used (agrisaarthi-web/src/lib/api.ts, pickByFile) – picks a list entry from
 * a hash of the uploaded file's name + size. This is the seam to replace with
 * a real inference call: swap the return of this function for a model result
 * and keep everything else in routes/diagnosis.ts unchanged.
 */
export function pickByFile<T>(originalName: string, size: number, list: T[]): T {
  const hash = [...originalName].reduce((a, c) => a + c.charCodeAt(0), size)
  const item = list[hash % list.length]
  if (item === undefined) throw new Error('Reference list is empty')
  return item
}
