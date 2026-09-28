import type { TFunction } from 'i18next'

/** "Rajkot APMC" → "rajkot_apmc" */
export const glossaryKey = (term: string) =>
  term
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')

/**
 * Translate a data term (crop, place, mandi, farm, pest…) via the shared glossary.
 * Unknown terms fall back to the original text. "AS-01 · Main farm" is handled part by part.
 */
export function translateTerm(t: TFunction, term: string): string {
  return term
    .split(' · ')
    .map((part) => t(`glossary.${glossaryKey(part)}`, { defaultValue: part }))
    .join(' · ')
}

/** Translate every string value in an interpolation params object */
export function translateParams(t: TFunction, params?: Record<string, string | number>) {
  if (!params) return params
  return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, typeof v === 'string' ? translateTerm(t, v) : v]))
}
